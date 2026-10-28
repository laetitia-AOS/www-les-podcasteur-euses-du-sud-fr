// Ancienne adresse des épisodes, gardée pour la version du site déjà publiée.
// Elle ne lit plus aucun flux sur Internet : elle renvoie les épisodes enregistrés par `sync-episodes`,
// avec les mêmes règles de visibilité que le site (podcasts visibles de membres à jour).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=900" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Lecture avec les droits d'un visiteur : la base applique elle-même la règle de visibilité
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "8", 10) || 8, 40);

    let q = supabase
      .from("episodes")
      .select("titre, date_publication, duree_secondes, audio_url, image_url, resume, lien, podcast_id, podcasts!inner(slug, nom_podcast, prenom, nom, city_name, vignette_url)")
      .order("date_publication", { ascending: false, nullsFirst: false });
    if (id) {
      if (!UUID.test(id)) return json({ episodes: [] });
      q = q.eq("podcast_id", id).limit(10);
    } else {
      q = q.limit(400);
    }
    const { data, error } = await q;
    if (error) return json({ error: "Impossible de charger les épisodes" }, 500);

    // deno-lint-ignore no-explicit-any
    const eps = (data || []).map((r: any) => ({
      podcastId: r.podcast_id,
      podcastSlug: r.podcasts?.slug ?? null,
      podcastName: r.podcasts?.nom_podcast ?? "",
      author: [r.podcasts?.prenom, r.podcasts?.nom].filter(Boolean).join(" "),
      city: r.podcasts?.city_name ?? null,
      title: r.titre,
      date: r.date_publication,
      duration: r.duree_secondes,
      audioUrl: r.audio_url,
      image: r.podcasts?.vignette_url || r.image_url,
      link: r.lien,
      summary: r.resume,
    }));

    if (id) return json({ episodes: eps });
    const seen = new Set<string>();
    const latest = [];
    const lastDates: Record<string, string | null> = {};
    for (const e of eps) {
      if (seen.has(e.podcastId)) continue;
      seen.add(e.podcastId);
      latest.push(e);
      lastDates[e.podcastId] = e.date;
    }
    return json({ latest: latest.slice(0, limit), lastDates });
  } catch {
    return json({ error: "Impossible de charger les épisodes" }, 500);
  }
});
