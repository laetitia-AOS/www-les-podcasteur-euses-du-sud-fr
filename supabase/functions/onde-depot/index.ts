// L'Onde du Sud, lot 5 : dépôt d'un·e adhérent·e (un son, une écoute, un projet, des coulisses, un appel).
// Seul chemin d'écriture des membres dans « onde_depots ». Contrôles :
// - session obligatoire, adresse lue dans la session (jamais dans la requête) ;
// - adhésion à jour (membre_a_jour, même règle que le reste du site) pour déposer ou modifier ; retirer reste toujours possible ;
// - un dépôt publié dans un numéro ne se modifie plus et ne se retire plus ;
// - MP3 20 Mo et photo 3 Mo au maximum, type réel lu dans le contenu ;
// - textes nettoyés, cases obligatoires et limite de 10 dépôts par mois vérifiées par la base (guard_onde_depots).
// Les fichiers vont dans l'espace privé « onde », dossier depots/<dépôt> : ils ne sont lisibles publiquement
// (fonction « onde-media ») qu'une fois le dépôt publié dans un numéro.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { detecterFichier } from "../_shared/onde-fichiers.ts";

const AUDIO_MAX = 20 * 1024 * 1024;
const IMAGE_MAX = 3 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TYPES = ["son", "ecoute", "projet", "coulisses", "appel"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Chemin dans l'espace « onde » d'après l'adresse servie par « onde-media ». */
const cheminDepot = (u: string | null | undefined, id: string) => {
  const m = /\/onde-media\/(depots\/[0-9a-f-]{36}\/[A-Za-z0-9_-]+\.(?:jpg|png|webp|mp3))$/.exec(u || "");
  return m && m[1].startsWith(`depots/${id}/`) ? m[1] : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    // Le contenu est toujours lu en entier avant de répondre (sinon l'envoi reste bloqué côté navigateur)
    const taille = Number(req.headers.get("Content-Length") || 0);
    if (taille > AUDIO_MAX + IMAGE_MAX + 1024 * 1024) {
      await req.body?.cancel();
      return json({ error: "Envoi trop lourd : MP3 de 20 Mo et photo de 3 Mo au maximum." }, 413);
    }
    const multipart = (req.headers.get("Content-Type") || "").includes("multipart/form-data");
    const form = multipart ? await req.formData().catch(() => null) : null;
    const corps = multipart ? null : await req.json().catch(() => null);
    if (!form && !corps) return json({ error: "Envoi invalide." }, 400);

    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token || token === anon) return json({ error: "Connectez-vous à votre espace membre pour déposer." }, 401);
    const { data: u } = await createClient(url, anon).auth.getUser(token);
    const email = (u?.user?.email || "").trim().toLowerCase();
    if (!email) return json({ error: "Connectez-vous à votre espace membre pour déposer." }, 401);

    const depotId = String((form ? form.get("depot_id") : corps?.depot_id) || "");
    let ancien: { id: string; email: string; audio_url: string | null; photo_url: string | null } | null = null;
    if (depotId) {
      if (!UUID.test(depotId)) return json({ error: "Dépôt introuvable." }, 404);
      const { data } = await admin.from("onde_depots").select("id, email, audio_url, photo_url").eq("id", depotId).maybeSingle();
      if (!data || data.email !== email) return json({ error: "Dépôt introuvable." }, 404);
      const { data: publie } = await admin.rpc("onde_depot_publie", { _id: depotId });
      if (Array.isArray(publie) && publie.length) return json({ error: "Ce dépôt est déjà publié dans L'Onde du Sud : il ne peut plus être modifié ni retiré." }, 409);
      ancien = data;
    }

    // ——— Retirer un dépôt (toujours possible tant qu'il n'est pas publié) ———
    if (!form) {
      if (corps?.action !== "retirer" || !ancien) return json({ error: "Action inconnue." }, 400);
      const { data: fichiers } = await admin.storage.from("onde").list(`depots/${ancien.id}`, { limit: 100 });
      if (fichiers?.length) await admin.storage.from("onde").remove(fichiers.map((f) => `depots/${ancien!.id}/${f.name}`));
      const { error } = await admin.from("onde_depots").delete().eq("id", ancien.id);
      if (error) return json({ error: "Le dépôt n'a pas pu être retiré. Réessayez." }, 500);
      return json({ ok: true });
    }

    // ——— Déposer ou modifier : adhésion à jour ———
    const { data: aJour, error: errAdh } = await admin.rpc("membre_a_jour", { _email: email });
    if (errAdh) return json({ error: "Dépôt impossible pour le moment. Réessayez." }, 500);
    if (!aJour) return json({ error: "Le dépôt pour L'Onde du Sud est réservé aux adhérent·es à jour.", code: "non_membre" }, 403);

    const type = String(form.get("type") || "");
    if (!TYPES.includes(type)) return json({ error: "Choisissez ce que vous déposez." }, 400);
    const son = String(form.get("son") || "");
    if (son !== "fichier" && son !== "lien") return json({ error: "Ajoutez le son : un fichier MP3 ou un lien d'écoute." }, 400);

    const id = ancien?.id || crypto.randomUUID();
    const envoyes: string[] = [];
    const deposer = async (f: FormDataEntryValue | null, sorte: "audio" | "image"): Promise<string | null | Response> => {
      if (!(f instanceof File) || f.size === 0) return null;
      const max = sorte === "audio" ? AUDIO_MAX : IMAGE_MAX;
      const trop = sorte === "audio" ? "Fichier MP3 trop lourd : 20 Mo au maximum." : "Photo trop lourde : 3 Mo au maximum.";
      if (f.size > max) return json({ error: trop }, 400);
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (bytes.length > max) return json({ error: trop }, 400);
      const t = detecterFichier(bytes);
      if (!t || t.sorte !== sorte) return json({ error: sorte === "audio" ? "Seuls les fichiers MP3 sont acceptés." : "Photo au format JPG, PNG ou WebP seulement." }, 400);
      const chemin = `depots/${id}/${crypto.randomUUID()}.${t.ext}`;
      const { error } = await admin.storage.from("onde").upload(chemin, bytes, { contentType: t.mime, upsert: false, cacheControl: "3600" });
      if (error) return json({ error: "Le fichier n'a pas pu être enregistré. Réessayez." }, 500);
      envoyes.push(chemin);
      return `${url}/functions/v1/onde-media/${chemin}`;
    };
    const annuler = async () => { if (envoyes.length) await admin.storage.from("onde").remove(envoyes); };

    const nouvelAudio = son === "fichier" ? await deposer(form.get("audio"), "audio") : null;
    if (nouvelAudio instanceof Response) { await annuler(); return nouvelAudio; }
    const nouvellePhoto = await deposer(form.get("photo"), "image");
    if (nouvellePhoto instanceof Response) { await annuler(); return nouvellePhoto; }

    const audio_url = son === "lien" ? null : (nouvelAudio || ancien?.audio_url || null);
    const photo_url = nouvellePhoto || (form.get("retirer_photo") === "1" ? null : ancien?.photo_url || null);
    const ligne = {
      type,
      titre: String(form.get("titre") || ""),
      texte: String(form.get("texte") || ""),
      audio_url,
      lien_ecoute: son === "lien" ? String(form.get("lien") || "") : null,
      photo_url,
      droits: form.get("droits") === "1",
      accord_publication: form.get("accord") === "1",
    };
    const { error } = ancien
      ? await admin.from("onde_depots").update(ligne).eq("id", id)
      : await admin.from("onde_depots").insert({ id, email, ...ligne });
    if (error) {
      await annuler();
      const lisible = error.code === "P0001" || error.code === "42501";
      if (!lisible) console.error("onde-depot", error.code, error.message);
      return json({ error: lisible ? error.message : "Le dépôt n'a pas pu être enregistré. Réessayez.", code: error.hint === "rate_limit" ? "limite" : undefined }, lisible ? 400 : 500);
    }

    // Fichiers remplacés ou retirés : effacés après l'enregistrement réussi
    if (ancien) {
      const aRetirer = [ancien.audio_url !== audio_url ? cheminDepot(ancien.audio_url, id) : null, ancien.photo_url !== photo_url ? cheminDepot(ancien.photo_url, id) : null]
        .filter((c): c is string => !!c);
      if (aRetirer.length) await admin.storage.from("onde").remove(aRetirer);
    }
    return json({ ok: true, id });
  } catch (_e) {
    return json({ error: "Dépôt impossible pour le moment. Réessayez." }, 500);
  }
});
