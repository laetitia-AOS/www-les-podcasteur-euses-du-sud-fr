// Demande de devis : groupée (le serveur choisit les studios) ou adressée à un seul studio.
// Les destinataires la lisent dans leur boîte « Demandes reçues » ; l'adresse des studios n'est jamais renvoyée.
// La base vérifie et nettoie chaque champ et limite à 3 demandes par jour et par adresse.
import { createClient } from "npm:@supabase/supabase-js@2";
import { envoyer, jourDuJour, tropDeNotifs } from "../_shared/notifications.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SERVICES = ["location", "enregistrement_audio", "video_podcast", "montage", "realisation", "direct", "studio_mobile"];
const DEPARTEMENTS = ["04", "05", "06", "13", "83", "84"];
const DEP_NOMS: Record<string, string> = { "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes", "06": "Alpes-Maritimes", "13": "Bouches-du-Rhône", "83": "Var", "84": "Vaucluse" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LABELS: Record<string, string> = {
  location: "location du studio", enregistrement_audio: "enregistrement audio", video_podcast: "vidéo-podcast",
  montage: "montage", realisation: "réalisation", direct: "direct", studio_mobile: "studio mobile",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const str = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max + 1);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const b = await req.json().catch(() => ({}));
    if (b?.website) return json({ ok: true, count: 0 }); // champ piège anti-robots
    const nom = str(b?.nom, 100);
    const email = str(b?.email, 255).toLowerCase();
    const format = str(b?.format, 80);
    const periode = str(b?.periode, 80);
    const departement = str(b?.departement, 3);
    const description = str(b?.description, 2000);
    const besoins = Array.isArray(b?.besoins) ? [...new Set(b.besoins.map(String))].filter((x) => SERVICES.includes(x as string)) as string[] : [];
    const studioVise = UUID.test(String(b?.studio_id || "")) ? String(b.studio_id) : null;

    if (nom.length < 2 || nom.length > 100) return json({ error: "Indiquez votre nom." }, 400);
    if (!/^[^\s@()<>,;]+@[^\s@()<>,;]+\.[^\s@()<>,;]{2,}$/.test(email) || email.length > 255) return json({ error: "Adresse e-mail invalide." }, 400);
    if (description.length < 20 || description.length > 2000) return json({ error: "Décrivez votre projet en 20 à 2 000 caractères." }, 400);
    if (format.length > 80 || periode.length > 80) return json({ error: "Format ou période trop long." }, 400);
    if (!studioVise && !DEPARTEMENTS.includes(departement)) return json({ error: "Choisissez un département." }, 400);
    if (departement && !DEPARTEMENTS.includes(departement)) return json({ error: "Département invalide." }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Studios destinataires, choisis ici et jamais par la page
    const { data: rows } = await admin
      .from("podcasts")
      .select("id, email, department_code, consent_contact, valide, type_profil, fiches_lieux(services)")
      .eq("type_profil", "studio")
      .eq("valide", true)
      .eq("consent_contact", true);
    // deno-lint-ignore no-explicit-any
    const studios = (rows || []) as any[];
    let recipients: string[] = [];
    if (studioVise) {
      recipients = studios.filter((s) => s.id === studioVise).map((s) => s.id);
      if (!recipients.length) return json({ error: "Ce studio ne peut pas recevoir de demande pour le moment." }, 400);
    } else {
      for (const s of studios) {
        const services: string[] = (Array.isArray(s.fiches_lieux) ? s.fiches_lieux[0]?.services : s.fiches_lieux?.services) || [];
        // Un studio mobile se déplace : il reçoit aussi les demandes des autres départements de la région
        const zone = s.department_code === departement || services.includes("studio_mobile");
        if (!zone || !besoins.every((x) => services.includes(x))) continue;
        const { data: aJour } = await admin.rpc("membre_a_jour", { _email: s.email });
        if (aJour) recipients.push(s.id);
      }
      if (!recipients.length) {
        return json({ ok: true, count: 0, message: "Aucun studio membre ne propose tous ces besoins dans ce département. Enlevez un besoin ou choisissez un autre département." });
      }
    }

    const { data: demande, error: dErr } = await admin
      .from("demandes_devis")
      .insert({ nom, email, format: format || null, periode: periode || null, departement: departement || null, besoins, description, studio_vise: studioVise, nb_studios: recipients.length })
      .select("id")
      .single();
    if (dErr || !demande) {
      if (dErr?.code === "P0001") return json({ error: dErr.message }, dErr.hint === "rate_limit" ? 429 : 400);
      return json({ error: "La demande n'a pas pu être enregistrée." }, 500);
    }

    const lignes = [
      "Demande de devis",
      format && `Format : ${format}`,
      periode && `Période : ${periode}`,
      departement && `Département : ${departement}`,
      besoins.length && `Besoins : ${besoins.map((x) => LABELS[x]).join(", ")}`,
      "",
      description,
    ].filter((x) => x !== false && x !== null && x !== undefined && x !== 0).join("\n");

    const { data: inseres, error: cErr } = await admin.from("contact_requests").insert(
      recipients.map((id) => ({ recipient_id: id, sender_name: nom, sender_email: email, message: lignes.slice(0, 5000), type: "devis", devis_id: demande.id })),
    ).select("id, recipient_id");
    if (cErr) {
      await admin.from("demandes_devis").delete().eq("id", demande.id);
      return json({ error: "La demande n'a pas pu être transmise." }, 500);
    }
    // Chaque studio est prévenu par e-mail (un e-mail par studio)
    let emailed = 0;
    for (const row of inseres || []) {
      const st = studios.find((x) => x.id === row.recipient_id);
      if (!st || await tropDeNotifs(admin, st.id)) continue;
      const { data: f } = await admin.from("podcasts").select("nom_podcast").eq("id", st.id).maybeSingle();
      const ok = await envoyer("devis-recu", st.email, {
        // Seulement des informations issues de listes fixes : le texte libre se lit dans l'espace membre
        studio: f?.nom_podcast, besoins: besoins.map((x) => LABELS[x]).join(", "),
        departement: departement ? (DEP_NOMS[departement] ? `${DEP_NOMS[departement]} (${departement})` : departement) : undefined, date: jourDuJour(),
      }, `devis-recu-${row.id}`);
      if (ok) emailed++;
    }
    return json({ ok: true, count: recipients.length, emailed: emailed > 0 });
  } catch (e) {
    console.error("demande-devis:", e instanceof Error ? e.message : "unknown");
    return json({ error: "Une erreur est survenue. Réessayez dans un instant." }, 500);
  }
});
