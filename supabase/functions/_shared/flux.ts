// Lecture sûre des flux RSS, partagée par `verifier-flux` et `sync-episodes`.
import { XMLParser } from "npm:fast-xml-parser@4.4.1";

export const MAX_FEED_BYTES = 5 * 1024 * 1024;
const UA = "Mozilla/5.0 (compatible; PodcasteursDuSud/1.0; +https://www.les-podcasteur-euses-du-sud.fr)";

/** Refuse les adresses internes : seules des adresses publiques en https sont lues. */
export const isSafePublicUrl = (raw: string): boolean => {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  if (u.port && u.port !== "443") return false;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".")) return false;
  if (/^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return false; // adresse IP
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp)$/.test(h)) return false;
  if (h.endsWith(".supabase.co") || h.endsWith(".supabase.in")) return false;
  return true;
};

const isPrivateIp = (ip: string): boolean =>
  /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip) ||
  /^(::1|fc|fd|fe80)/i.test(ip);

const resolvesPublic = async (host: string): Promise<boolean> => {
  try {
    // deno-lint-ignore no-explicit-any
    const resolve = (Deno as any).resolveDns as ((h: string, t: string) => Promise<string[]>) | undefined;
    if (!resolve) return true;
    const v4 = await resolve(host, "A").catch(() => [] as string[]);
    const v6 = await resolve(host, "AAAA").catch(() => [] as string[]);
    return ![...v4, ...v6].some(isPrivateIp);
  } catch {
    return true;
  }
};

export type FetchResult = { ok: true; text: string } | { ok: false; reason: string };

/** Télécharge une adresse publique : 8 s maximum, 5 Mo maximum, redirections vérifiées une à une. */
export const safeFetchText = async (url: string, ms = 8000, maxBytes = MAX_FEED_BYTES): Promise<FetchResult> => {
  let current = url;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    for (let hop = 0; hop < 5; hop++) {
      if (!isSafePublicUrl(current)) return { ok: false, reason: "adresse" };
      if (!(await resolvesPublic(new URL(current).hostname))) return { ok: false, reason: "adresse" };
      const res = await fetch(current, {
        signal: ctrl.signal,
        redirect: "manual",
        headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, application/json, text/html;q=0.5, */*;q=0.1" },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        await res.body?.cancel();
        if (!loc) return { ok: false, reason: "http" };
        current = new URL(loc, current).toString();
        continue;
      }
      if (!res.ok) { await res.body?.cancel(); return { ok: false, reason: `http ${res.status}` }; }
      const len = Number(res.headers.get("content-length") || 0);
      if (len > maxBytes) { await res.body?.cancel(); return { ok: false, reason: "taille" }; }
      const reader = res.body?.getReader();
      if (!reader) return { ok: false, reason: "vide" };
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > maxBytes) { await reader.cancel(); return { ok: false, reason: "taille" }; }
        chunks.push(value);
      }
      const buf = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { buf.set(c, off); off += c.length; }
      return { ok: true, text: new TextDecoder().decode(buf) };
    }
    return { ok: false, reason: "redirections" };
  } catch (e) {
    return { ok: false, reason: e instanceof DOMException && e.name === "AbortError" ? "delai" : "reseau" };
  } finally {
    clearTimeout(timer);
  }
};

export const raisonLisible = (reason: string): string => {
  if (reason === "adresse") return "Cette adresse n'est pas acceptée : utilisez le lien public https:// de votre flux.";
  if (reason === "taille") return "Le flux est trop lourd (plus de 5 Mo).";
  if (reason === "delai") return "Le flux ne répond pas (plus de 8 secondes d'attente).";
  if (reason.startsWith("http")) return "Le flux ne répond pas : vérifiez le lien.";
  return "Le flux est injoignable : vérifiez le lien.";
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

export type ParsedEpisode = {
  guid: string;
  titre: string;
  date_publication: string | null;
  duree_secondes: number | null;
  audio_url: string;
  image_url: string | null;
  resume: string | null;
  lien: string | null;
};

const text = (v: unknown): string => {
  if (v === undefined || v === null) return "";
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)["#text"]);
  if (typeof v === "object") return "";
  return String(v);
};

const parseDuration = (raw: unknown): number | null => {
  const s = text(raw).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(":").map((x) => parseInt(x, 10));
  if (parts.some(isNaN) || parts.length > 3) return null;
  return parts.reduce((acc, v) => acc * 60 + v, 0);
};

/** Texte seul, sans balises, 280 caractères maximum. */
export const summarize = (raw: string, max = 280): string | null => {
  const t = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&apos;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/&lt;|&gt;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max - 3).replace(/\s+\S*$/, "") + "…" : t;
};

const https = (u: string | null | undefined): string | null => {
  if (!u) return null;
  const s = String(u).trim().replace(/^http:\/\//i, "https://");
  return /^https:\/\/[^\s<>"]+$/i.test(s) && s.length <= 1000 ? s : null;
};

/** Lit un flux RSS. Renvoie null si ce n'est pas un flux RSS. */
export const parseFeed = (xml: string, max = 10): { episodes: ParsedEpisode[]; total: number; titre: string | null; auteur: string | null } | null => {
  let doc;
  try { doc = parser.parse(xml); } catch { return null; }
  const channel = doc?.rss?.channel;
  if (!channel || typeof channel !== "object") return null;
  const channelImage = https(channel["itunes:image"]?.["@_href"] || channel.image?.url);
  const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  const withAudio = items
    .map((it: Record<string, unknown>) => {
      const enc = it.enclosure as Record<string, string> | Record<string, string>[] | undefined;
      const first = Array.isArray(enc) ? enc[0] : enc;
      const audio = https(first?.["@_url"]);
      if (!audio) return null;
      const pub = text(it.pubDate);
      const d = pub ? new Date(pub) : null;
      const titre = (summarize(text(it.title), 300) || "Épisode").slice(0, 300);
      return {
        guid: (text(it.guid) || audio).slice(0, 500),
        titre,
        date_publication: d && !isNaN(d.getTime()) ? d.toISOString() : null,
        duree_secondes: parseDuration(it["itunes:duration"]),
        audio_url: audio,
        image_url: https((it["itunes:image"] as Record<string, string> | undefined)?.["@_href"]) || channelImage,
        resume: summarize(text(it["itunes:summary"]) || text(it.description)),
        lien: https(text(it.link)),
      } as ParsedEpisode;
    })
    .filter(Boolean) as ParsedEpisode[];
  withAudio.sort((a, b) => (b.date_publication || "").localeCompare(a.date_publication || ""));
  // Doublons éventuels dans le flux
  const seen = new Set<string>();
  const unique = withAudio.filter((e) => (seen.has(e.guid) ? false : (seen.add(e.guid), true)));
  // Nom et auteur du flux : servent à l'admin pour confirmer un flux trouvé automatiquement
  const titre = (summarize(text(channel.title), 200) || "").slice(0, 200) || null;
  const auteur = (summarize(text(channel["itunes:author"]) || text(channel.managingEditor) || text(channel["itunes:owner"]?.["itunes:name"]), 200) || "").slice(0, 200) || null;
  return { episodes: unique.slice(0, max), total: unique.length, titre, auteur };
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Flux d'un podcast : le flux saisi s'il existe ; sinon recherche automatique
 * (lien Apple Podcasts, page Ausha, ou recherche Apple sur le nom exact).
 */
export const resolveFeed = async (p: { flux_rss: string | null; lien_ecoute: string | null; nom_podcast: string }) => {
  if (p.flux_rss?.trim()) return { url: p.flux_rss.trim(), source: "flux saisi" };
  const link = p.lien_ecoute || "";
  const appleId = link.match(/podcasts\.apple\.com\/.*id(\d+)/)?.[1];
  if (appleId) {
    const r = await safeFetchText(`https://itunes.apple.com/lookup?id=${appleId}`, 6000, 500_000);
    try {
      const feed = r.ok ? JSON.parse(r.text).results?.[0]?.feedUrl : null;
      if (feed) return { url: String(feed), source: "Apple Podcasts" };
    } catch { /* ignore */ }
  }
  if (/^https:\/\/([a-z0-9-]+\.)?ausha\.co\//i.test(link)) {
    const r = await safeFetchText(link, 6000, 2_000_000);
    const feed = r.ok ? r.text.match(/https:\/\/feed\.ausha\.co\/[A-Za-z0-9]+/)?.[0] : null;
    if (feed) return { url: feed, source: "Ausha" };
  }
  if (p.nom_podcast && p.nom_podcast.length >= 3) {
    const r = await safeFetchText(
      `https://itunes.apple.com/search?term=${encodeURIComponent(p.nom_podcast)}&media=podcast&country=fr&limit=10`,
      6000,
      1_000_000,
    );
    try {
      const results = r.ok ? JSON.parse(r.text).results ?? [] : [];
      const target = normalize(p.nom_podcast);
      const match = results.find((x: { collectionName?: string }) => x.collectionName && normalize(x.collectionName) === target);
      if (match?.feedUrl) return { url: String(match.feedUrl), source: "recherche Apple" };
    } catch { /* ignore */ }
  }
  return null;
};
