// Edge Function : récupère les derniers épisodes des podcasts validés à partir de leur flux RSS.
// Le flux est pris dans `flux_rss` s'il est renseigné ; sinon il est retrouvé automatiquement
// (lien Apple Podcasts, lien Ausha, ou recherche Apple Podcasts sur le nom exact du podcast).
// Aucune donnée n'est écrite en base : tout est calculé à la volée et mis en cache en mémoire.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { XMLParser } from "npm:fast-xml-parser@4.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Episode = {
  podcastId: string;
  podcastSlug: string | null;
  podcastName: string;
  author: string;
  city: string | null;
  title: string;
  date: string | null;
  duration: number | null;
  audioUrl: string;
  image: string | null;
  link: string | null;
  summary: string | null;
};

type PodcastRow = {
  id: string;
  slug: string | null;
  nom_podcast: string;
  prenom: string | null;
  nom: string | null;
  city_name: string | null;
  lien_ecoute: string | null;
  flux_rss: string | null;
  vignette_url: string | null;
};

const CACHE_TTL = 60 * 60 * 1000;
let cache: { at: number; data: Record<string, Episode[]> } | null = null;
const feedCache = new Map<string, string | null>();

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const fetchText = async (url: string, ms = 7000): Promise<string | null> => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PodcasteursDuSud/1.0)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, " ").trim();

const resolveFeed = async (p: PodcastRow): Promise<string | null> => {
  if (p.flux_rss && /^https?:\/\//.test(p.flux_rss.trim())) return p.flux_rss.trim();
  if (feedCache.has(p.id)) return feedCache.get(p.id) ?? null;

  let feed: string | null = null;
  const link = p.lien_ecoute || "";

  const appleId = link.match(/podcasts\.apple\.com\/.*id(\d+)/)?.[1];
  if (appleId) {
    const txt = await fetchText(`https://itunes.apple.com/lookup?id=${appleId}`);
    try { feed = txt ? JSON.parse(txt).results?.[0]?.feedUrl ?? null : null; } catch { /* ignore */ }
  }

  if (!feed && /ausha\.co/.test(link)) {
    const html = await fetchText(link);
    feed = html?.match(/https:\/\/feed\.ausha\.co\/[A-Za-z0-9]+/)?.[0] ?? null;
  }

  if (!feed && p.nom_podcast) {
    const txt = await fetchText(
      `https://itunes.apple.com/search?term=${encodeURIComponent(p.nom_podcast)}&media=podcast&country=fr&limit=10`,
    );
    try {
      const results = txt ? JSON.parse(txt).results ?? [] : [];
      const target = normalize(p.nom_podcast);
      const match = results.find((r: { collectionName?: string }) => r.collectionName && normalize(r.collectionName) === target);
      feed = match?.feedUrl ?? null;
    } catch { /* ignore */ }
  }

  feedCache.set(p.id, feed);
  return feed;
};

const parseDuration = (raw: unknown): number | null => {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(":").map((x) => parseInt(x, 10));
  if (parts.some(isNaN)) return null;
  return parts.reduce((acc, v) => acc * 60 + v, 0);
};

const text = (v: unknown): string => {
  if (v === undefined || v === null) return "";
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)["#text"]);
  return String(v);
};

const summarize = (raw: string): string | null => {
  const t = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  return t.length > 180 ? t.slice(0, 177).replace(/\s+\S*$/, "") + "…" : t;
};

const parseFeed = (xml: string, p: PodcastRow, max: number): Episode[] => {
  try {
    const doc = parser.parse(xml);
    const channel = doc?.rss?.channel;
    if (!channel) return [];
    const channelImage = channel["itunes:image"]?.["@_href"] || channel.image?.url || null;
    const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
    const author = [p.prenom, p.nom].filter(Boolean).join(" ");
    return items
      .filter((it: Record<string, unknown>) => (it.enclosure as Record<string, string> | undefined)?.["@_url"])
      .slice(0, max)
      .map((it: Record<string, unknown>) => {
        const pub = text(it.pubDate);
        const d = pub ? new Date(pub) : null;
        return {
          podcastId: p.id,
          podcastSlug: p.slug,
          podcastName: p.nom_podcast,
          author,
          city: p.city_name,
          title: text(it.title).trim(),
          date: d && !isNaN(d.getTime()) ? d.toISOString() : null,
          duration: parseDuration(it["itunes:duration"]),
          audioUrl: (it.enclosure as Record<string, string>)["@_url"],
          image: p.vignette_url || (it["itunes:image"] as Record<string, string> | undefined)?.["@_href"] || channelImage,
          link: text(it.link) || null,
          summary: summarize(text(it["itunes:summary"]) || text(it.description)),
        } as Episode;
      });
  } catch {
    return [];
  }
};

const loadAll = async (): Promise<Record<string, Episode[]>> => {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data } = await supabase
    .from("podcasts")
    .select("id, slug, nom_podcast, prenom, nom, city_name, lien_ecoute, flux_rss, vignette_url")
    .eq("valide", true)
    .eq("type_profil", "podcasteur");

  const rows = (data || []) as PodcastRow[];
  const out: Record<string, Episode[]> = {};
  await Promise.all(
    rows.map(async (p) => {
      const feed = await resolveFeed(p);
      if (!feed) return;
      const xml = await fetchText(feed, 9000);
      if (!xml) return;
      const eps = parseFeed(xml, p, 6);
      if (eps.length) out[p.id] = eps;
    }),
  );
  cache = { at: Date.now(), data: out };
  return out;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "8", 10) || 8, 40);
    const all = await loadAll();

    let body: unknown;
    if (id) {
      body = { episodes: all[id] || [] };
    } else {
      const latestPerPodcast = Object.values(all)
        .map((eps) => eps[0])
        .filter(Boolean)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const lastDates: Record<string, string | null> = {};
      for (const [pid, eps] of Object.entries(all)) lastDates[pid] = eps[0]?.date ?? null;
      body = { latest: latestPerPodcast.slice(0, limit), lastDates };
    }

    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=900" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Impossible de charger les épisodes", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
