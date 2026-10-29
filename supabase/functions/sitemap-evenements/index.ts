// Plan du site complet : pages générales, événements publiés (à venir et archives) et fiches visibles, lus avec les droits d'un visiteur.
// Les adresses suivent celles du site (src/lib/seo.ts) : /ecouter/… podcast, /annuaire/… pro, /studios/… studio, /structures/… structure.
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
  const today = new Date().toISOString().slice(0, 10);
  const PAGES: [string, string, string][] = [
    ["/", "daily", "1.0"],
    ["/ecouter", "daily", "0.9"],
    ["/annuaire", "weekly", "0.9"],
    ["/studios", "weekly", "0.9"],
    ["/agenda", "daily", "0.9"],
    ["/adherer", "monthly", "0.8"],
    ["/proposer-evenement-podcast", "monthly", "0.5"],
    ["/referencer-mon-podcast", "monthly", "0.5"],
    ["/contact", "yearly", "0.4"],
    ["/mentions-legales", "yearly", "0.2"],
    ["/politique-de-confidentialite", "yearly", "0.2"],
    ["/conditions-utilisation", "yearly", "0.2"],
    ["/politique-cookies", "yearly", "0.2"],
  ];
  const urls = PAGES.map(([path, freq, prio]) => `  <url>
    <loc>${esc(`${SITE_URL}${path}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`);
  for (const e of data || []) {
    const fin = new Date(e.date_fin || e.date_debut).getTime();
    const lastmod = (e.updated_at || e.created_at || e.date_debut).slice(0, 10);
    const avenir = fin > now;
    urls.push(`  <url>
    <loc>${esc(`${SITE_URL}/agenda/${e.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${avenir ? "weekly" : "yearly"}</changefreq>
    <priority>${avenir ? "0.8" : "0.4"}</priority>
  </url>`);
  }

  // Fiches publiques de l'annuaire (la lecture visiteur ne renvoie que les fiches visibles)
  const { data: fiches } = await supabase
    .from("podcasts")
    .select("slug, type_profil, nom_podcast, created_at")
    .not("slug", "is", null)
    .limit(5000);
  const chemin = (t: string | null, nomPodcast: string | null) =>
    t === "studio" ? "/studios/" : t === "structure_eco" ? "/structures/" : t === "podcasteur" && nomPodcast?.trim() ? "/ecouter/" : "/annuaire/";
  for (const f of fiches || []) {
    if (f.type_profil === "soutien") continue;
    urls.push(`  <url>
    <loc>${esc(`${SITE_URL}${chemin(f.type_profil, f.nom_podcast)}${f.slug}`)}</loc>
    <lastmod>${String(f.created_at).slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  return new Response(req.method === "HEAD" ? null : xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
});
