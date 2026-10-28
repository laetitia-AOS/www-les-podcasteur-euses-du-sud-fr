// Envoi d'images par un·e visiteur·ice non connecté·e (inscription, studio, structure, événement proposé).
// Contrôles : JPG, PNG ou WebP réels (lecture du contenu), 5 Mo maximum, 3 envois par heure et par adresse.
// Les images vont dans un dossier privé et ne s'affichent sur le site qu'après validation par un·e admin.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 7; // logo + 6 photos de galerie
const MAX_LOTS_PAR_HEURE = 3;
const BUCKETS = ["podcast-thumbnails", "studio-galleries", "event-images"];
const PENDING_BUCKET = "images-en-attente";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Type réel de l'image d'après ses premiers octets (le nom ou le type annoncé ne suffisent pas). */
const detectType = (b: Uint8Array): { mime: string; ext: string } | null => {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return { mime: "image/png", ext: "png" };
  }
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const form = await req.formData().catch(() => null);
    if (!form) return json({ error: "Envoi invalide." }, 400);

    const email = String(form.get("email") || "").trim().toLowerCase();
    const bucket = String(form.get("bucket") || "");
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (!/^[^\s@()<>,;]+@[^\s@()<>,;]+\.[^\s@()<>,;]{2,}$/.test(email) || email.length > 255) {
      return json({ error: "Indiquez d'abord une adresse e-mail valide." }, 400);
    }
    if (!BUCKETS.includes(bucket)) return json({ error: "Destination invalide." }, 400);
    if (!files.length) return json({ error: "Aucune image reçue." }, 400);
    if (files.length > MAX_FILES) return json({ error: `${MAX_FILES} images au maximum par envoi.` }, 400);

    // Lecture et contrôle de chaque fichier avant tout enregistrement
    const checked: { bytes: Uint8Array; mime: string; ext: string }[] = [];
    for (const f of files) {
      if (f.size === 0 || f.size > MAX_BYTES) return json({ error: "Chaque image doit faire 5 Mo au maximum." }, 400);
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (bytes.length > MAX_BYTES) return json({ error: "Chaque image doit faire 5 Mo au maximum." }, 400);
      const type = detectType(bytes);
      if (!type) return json({ error: "Seules les images JPG, PNG ou WebP sont acceptées." }, 400);
      checked.push({ bytes, ...type });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 3 envois par heure et par adresse (un envoi peut contenir plusieurs images)
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent, error: countError } = await admin
      .from("images_en_attente")
      .select("lot")
      .eq("email", email)
      .gte("created_at", since);
    if (countError) return json({ error: "Envoi impossible pour le moment." }, 500);
    if (new Set((recent || []).map((r) => r.lot)).size >= MAX_LOTS_PAR_HEURE) {
      return json({ error: "Vous avez fait 3 envois d'images dans l'heure avec cette adresse. Réessayez un peu plus tard." }, 429);
    }

    const lot = crypto.randomUUID();
    const base = Deno.env.get("SUPABASE_URL")!;
    const urls: string[] = [];
    const rows = [];
    for (const c of checked) {
      const chemin = `v/${crypto.randomUUID()}.${c.ext}`;
      const { error } = await admin.storage
        .from(PENDING_BUCKET)
        .upload(`${bucket}/${chemin}`, c.bytes, { contentType: c.mime, upsert: false });
      if (error) {
        console.error("Pending upload failed:", error.message);
        return json({ error: "L'image n'a pas pu être enregistrée. Réessayez." }, 500);
      }
      rows.push({ lot, email, bucket_cible: bucket, chemin, type_mime: c.mime, taille: c.bytes.length });
      // Adresse définitive : elle ne répond qu'une fois l'image validée par un·e admin
      urls.push(`${base}/storage/v1/object/public/${bucket}/${chemin}`);
    }
    const { error: insertError } = await admin.from("images_en_attente").insert(rows);
    if (insertError) {
      console.error("Pending insert failed:", insertError.message);
      return json({ error: "L'image n'a pas pu être enregistrée. Réessayez." }, 500);
    }
    return json({ ok: true, urls, en_attente: true });
  } catch (e) {
    console.error("envoi-image error:", e instanceof Error ? e.message : "unknown");
    return json({ error: "Une erreur est survenue. Réessayez dans un instant." }, 500);
  }
});
