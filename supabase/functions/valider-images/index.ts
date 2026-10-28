// Validation ou refus, par un·e admin, des images envoyées sans connexion.
// Valider = copier l'image du dossier privé vers son adresse publique définitive.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PENDING_BUCKET = "images-en-attente";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(auth.slice(7));
  if (claimsError || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: claims.claims.sub, _role: "admin" });
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action === "refuser" ? "refuser" : "valider";
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String).filter((i: string) => UUID.test(i)).slice(0, 100) : [];
    const podcastId = UUID.test(String(body?.podcast_id || "")) ? String(body.podcast_id) : null;
    const evenementId = UUID.test(String(body?.evenement_id || "")) ? String(body.evenement_id) : null;

    // Images à traiter : par identifiant, ou toutes celles utilisées par une fiche / un événement
    let query = admin.from("images_en_attente").select("id, bucket_cible, chemin").eq("statut", "en_attente").limit(500);
    if (ids.length) query = query.in("id", ids);
    const { data: pending, error } = await query;
    if (error) return json({ error: "Lecture impossible" }, 500);

    let targets = pending || [];
    if (!ids.length) {
      let text = "";
      if (podcastId) {
        const { data } = await admin.from("podcasts").select("vignette_url, photo_profil_url, studio_data").eq("id", podcastId).maybeSingle();
        text = JSON.stringify(data || {});
      } else if (evenementId) {
        const { data } = await admin.from("evenements").select("image_url, podcasts_invites").eq("id", evenementId).maybeSingle();
        text = JSON.stringify(data || {});
      } else {
        return json({ error: "Rien à traiter" }, 400);
      }
      targets = targets.filter((t) => text.includes(`/${t.bucket_cible}/${t.chemin}`));
    }

    let done = 0;
    for (const t of targets) {
      const source = `${t.bucket_cible}/${t.chemin}`;
      if (action === "valider") {
        const { data: file, error: dlError } = await admin.storage.from(PENDING_BUCKET).download(source);
        if (dlError || !file) continue;
        const { error: upError } = await admin.storage.from(t.bucket_cible).upload(t.chemin, file, { contentType: file.type, upsert: true });
        if (upError) continue;
      }
      await admin.storage.from(PENDING_BUCKET).remove([source]);
      await admin.from("images_en_attente")
        .update({ statut: action === "valider" ? "validee" : "refusee", traite_at: new Date().toISOString() })
        .eq("id", t.id);
      done++;
    }
    return json({ ok: true, traitees: done });
  } catch (e) {
    console.error("valider-images error:", e instanceof Error ? e.message : "unknown");
    return json({ error: "Erreur serveur" }, 500);
  }
});
