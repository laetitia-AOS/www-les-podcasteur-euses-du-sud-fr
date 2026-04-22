// Edge Function : sert un HTML avec meta OG personnalisées pour le partage social.
// Les crawlers (LinkedIn/FB/X/WhatsApp) lisent le HTML statique ; les humains sont redirigés vers la SPA.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.les-podcasteur-euses-du-sud.fr";
const DEFAULT_OG = `${SITE_URL}/og-image.jpg`;

// Optimise l'URL d'image pour les crawlers sociaux :
// - Si l'image est dans le bucket Supabase Storage, on utilise la Storage Image Transformation
//   (redimensionnement + compression WebP côté serveur, mis en cache CDN automatiquement).
//   Cela garantit < 5 Mo et un format optimal sans dépendance ni traitement dans l'edge function.
// - Sinon, on retourne l'URL telle quelle.
const optimizeOgImage = (rawUrl: string): string => {
  try {
    const u = new URL(rawUrl);
    // Pattern: /storage/v1/object/public/<bucket>/<path>
    const publicMatch = u.pathname.match(/^\/storage\/v1\/object\/public\/(.+)$/);
    if (publicMatch && u.hostname.endsWith("supabase.co")) {
      // Bascule vers l'endpoint /render/image/public qui supporte les transformations
      u.pathname = `/storage/v1/render/image/public/${publicMatch[1]}`;
      u.searchParams.set("width", "1200");
      u.searchParams.set("height", "630");
      u.searchParams.set("resize", "cover");
      u.searchParams.set("quality", "75");
      // format=origin par défaut ; on laisse Supabase négocier (WebP si supporté)
      return u.toString();
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // path format: /og-evenement/<slug>
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1];

    if (!slug || slug === "og-evenement") {
      return new Response("Missing slug", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { data: evt } = await supabase
      .from("evenements")
      .select("titre, sous_titre, description, date_debut, lieu, image_url, slug")
      .eq("slug", slug)
      .eq("publie", true)
      .maybeSingle();

    const publicFunctionBase = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/og-evenement`;
    const requestUrl = `${publicFunctionBase}/${encodeURIComponent(slug)}${url.search}`;
    const targetUrl = `${SITE_URL}/evenement-podcast/${slug}`;

    // Crawlers : serve a minimal HTML with OG tags
    const title = evt
      ? `${evt.titre} — Les Podcasteur·euses du Sud`
      : "Événement — Les Podcasteur·euses du Sud";

    const description = evt
      ? (evt.sous_titre || evt.description?.slice(0, 200) || `Rejoignez-nous le ${new Date(evt.date_debut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}${evt.lieu ? ` à ${evt.lieu}` : ""}.`)
      : "Événement podcast en Région Sud.";

    const rawImage = evt?.image_url || DEFAULT_OG;
    const image = optimizeOgImage(rawImage);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${requestUrl}" />
<meta name="robots" content="noindex, nofollow" />

<meta property="og:type" content="event" />
<meta property="og:url" content="${requestUrl}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Les Podcasteur·euses du Sud" />
<meta property="og:locale" content="fr_FR" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${image}" />
<script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body>
<p>Redirection… <a href="${targetUrl}">${escapeHtml(title)}</a></p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("og-evenement error", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
