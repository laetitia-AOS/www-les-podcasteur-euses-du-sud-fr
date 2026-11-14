// L'Onde du Sud : dépôt d'un fichier (photo ou MP3) dans l'espace privé « onde ».
// Réservé aux admins et aux éditeur·ices. Contrôles : type réel lu dans le contenu (JPG, PNG, WebP, MP3),
// images 3 Mo maximum (déjà redimensionnées pour le web par l'éditeur), MP3 20 Mo maximum.
// Le fichier est rangé dans le dossier du numéro ; il n'est lisible publiquement (fonction « onde-media »)
// qu'une fois le numéro publié.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const IMAGE_MAX = 3 * 1024 * 1024;
const AUDIO_MAX = 20 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Type = { sorte: "image" | "audio"; mime: string; ext: string };

/** Type réel du fichier d'après ses premiers octets (le nom ou le type annoncé ne suffisent pas). */
const detecter = (b: Uint8Array): Type | null => {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { sorte: "image", mime: "image/jpeg", ext: "jpg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return { sorte: "image", mime: "image/png", ext: "png" };
  }
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") {
    return { sorte: "image", mime: "image/webp", ext: "webp" };
  }
  // MP3 : étiquette ID3 en tête, ou directement une trame MPEG audio (couche III)
  if (b.length > 10 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) return { sorte: "audio", mime: "audio/mpeg", ext: "mp3" };
  if (b.length > 4 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) === 0x02) return { sorte: "audio", mime: "audio/mpeg", ext: "mp3" };
  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    // Le contenu est toujours lu en entier avant de répondre (sinon l'envoi reste bloqué côté navigateur)
    const taille = Number(req.headers.get("Content-Length") || 0);
    if (taille > AUDIO_MAX + 1024 * 1024) {
      await req.body?.cancel();
      return json({ error: "Fichier trop lourd : 20 Mo au maximum." }, 413);
    }
    const form = await req.formData().catch(() => null);
    if (!form) return json({ error: "Envoi invalide." }, 400);
    // Qui envoie : session obligatoire, rôle admin ou éditeur·ice lu en base
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = token ? await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token) : { data: { user: null } };
    if (!u?.user) return json({ error: "Connectez-vous pour envoyer un fichier." }, 401);
    const { data: roles, error: rolesError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .in("role", ["admin", "editeur"]);
    if (rolesError) return json({ error: "Envoi impossible pour le moment." }, 500);
    if (!roles?.length) return json({ error: "Seul·es les admins et les éditeur·ices de L'Onde peuvent envoyer des fichiers." }, 403);

    const numeroId = String(form.get("numero_id") || "");
    const attendu = String(form.get("sorte") || "");
    const file = form.get("file");
    if (!UUID.test(numeroId)) return json({ error: "Numéro inconnu." }, 400);
    if (attendu !== "image" && attendu !== "audio") return json({ error: "Type de fichier inconnu." }, 400);
    if (!(file instanceof File) || file.size === 0) return json({ error: "Aucun fichier reçu." }, 400);
    const max = attendu === "image" ? IMAGE_MAX : AUDIO_MAX;
    const trop = attendu === "image" ? "Photo trop lourde : 3 Mo au maximum." : "Fichier MP3 trop lourd : 20 Mo au maximum.";
    if (file.size > max) return json({ error: trop }, 400);

    const { data: numero } = await admin.from("onde_numeros").select("id").eq("id", numeroId).maybeSingle();
    if (!numero) return json({ error: "Numéro inconnu." }, 404);

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length > max) return json({ error: trop }, 400);
    const type = detecter(bytes);
    if (!type || type.sorte !== attendu) {
      return json({ error: attendu === "image" ? "Seules les photos JPG, PNG ou WebP sont acceptées." : "Seuls les fichiers MP3 sont acceptés." }, 400);
    }

    const chemin = `${numeroId}/${crypto.randomUUID()}.${type.ext}`;
    const { error } = await admin.storage.from("onde").upload(chemin, bytes, { contentType: type.mime, upsert: false, cacheControl: "3600" });
    if (error) return json({ error: "Le fichier n'a pas pu être enregistré. Réessayez." }, 500);

    return json({ url: `${url}/functions/v1/onde-media/${chemin}` });
  } catch (_e) {
    return json({ error: "Envoi impossible pour le moment." }, 500);
  }
});
