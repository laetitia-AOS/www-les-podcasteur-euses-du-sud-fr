// Plan du site des événements : chaque événement publié (à venir et archives), lu avec les droits d'un visiteur.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SITE_URL = "https://www.les-podcasteur-euses-du-sud.fr";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Méthode non autorisée", { status: 405 });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("evenements")
    .select("slug, date_debut, date_fin, updated_at, created_at")
    .eq("statut", "publie")
    .not("slug", "is", null)
    .order("date_debut", { ascending: false })
    .limit(5000);
  if (error) return new Response("Plan indisponible", { status: 503 });

  const now = Date.now();
  const urls = (data || []).map((e) => {
    const fin = new Date(e.date_fin || e.date_debut).getTime();
    const lastmod = (e.updated_at || e.created_at || e.date_debut).slice(0, 10);
    const avenir = fin > now;
    return `  <url>
    <loc>${esc(`${SITE_URL}/agenda/${e.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${avenir ? "weekly" : "yearly"}</changefreq>
    <priority>${avenir ? "0.8" : "0.4"}</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  return new Response(req.method === "HEAD" ? null : xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
});
