// Suppression immédiate de toutes les données d'un membre, à sa demande, depuis son espace.
// Seul le compte connecté peut effacer ses propres données (adresse lue dans sa session, jamais dans la requête).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BUCKETS = ["podcast-thumbnails", "studio-galleries", "event-images"];

/** Chemin dans le stockage à partir d'une adresse publique de ce projet. */
const cheminStockage = (u: string, base: string): { bucket: string; path: string } | null => {
  try {
    const url = new URL(u);
    if (url.origin !== new URL(base).origin) return null;
    const m = url.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!m || !BUCKETS.includes(m[1])) return null;
    return { bucket: m[1], path: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token === anon) return json({ error: "Connectez-vous pour supprimer vos données." }, 401);

  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: u, error: authErr } = await userClient.auth.getUser(token);
  const user = u?.user;
  if (authErr || !user?.email) return json({ error: "Session expirée. Reconnectez-vous." }, 401);

  const body = await req.json().catch(() => ({}));
  if (body?.confirmation !== "SUPPRIMER") return json({ error: "Tapez SUPPRIMER pour confirmer." }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: estAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (estAdmin) return json({ error: "Un compte administrateur ne peut pas être supprimé depuis l'espace membre. Écrivez à l'équipe." }, 403);

  const { data: images, error } = await admin.rpc("effacer_donnees_membre", { _email: user.email });
  if (error) {
    console.error("effacer_donnees_membre:", error.message);
    return json({ error: "La suppression n'a pas pu être faite. Réessayez dans un instant." }, 500);
  }

  // Photos : celles des fiches, puis tout le dossier personnel du compte
  const parBucket: Record<string, string[]> = {};
  for (const img of (images as string[] | null) || []) {
    const c = cheminStockage(img, url);
    if (c) (parBucket[c.bucket] ||= []).push(c.path);
  }
  for (const b of BUCKETS) {
    const { data: liste } = await admin.storage.from(b).list(user.id, { limit: 1000 });
    for (const f of liste || []) (parBucket[b] ||= []).push(`${user.id}/${f.name}`);
  }
  for (const [b, paths] of Object.entries(parBucket)) {
    const uniques = [...new Set(paths)];
    for (let i = 0; i < uniques.length; i += 100) {
      const { error: e } = await admin.storage.from(b).remove(uniques.slice(i, i + 100));
      if (e) console.warn("Stockage:", b, e.message);
    }
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("deleteUser:", delErr.message);
    return json({ error: "Vos données sont effacées, mais le compte de connexion n'a pas pu être fermé. Écrivez à l'équipe." }, 500);
  }
  return json({ success: true });
});
