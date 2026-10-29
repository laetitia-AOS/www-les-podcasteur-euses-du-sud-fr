// Liens d'une fiche : « Écouter sur » (plateformes d'écoute, flux RSS) ou « Suivre » (site, réseaux).

export type LienClasse = { groupe: "ecoute" | "suivre"; label: string; href: string };

const hote = (url: string): string => {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

// Domaine → nom de la plateforme d'écoute
const ECOUTE: [RegExp, string][] = [
  [/(^|\.)spotify\.(com|link)$|^spoti\.fi$/, "Spotify"],
  [/(^|\.)podcasts\.apple\.com$|(^|\.)itunes\.apple\.com$/, "Apple Podcasts"],
  [/(^|\.)deezer\.(com|page\.link)$|^deezer\.page\.link$/, "Deezer"],
  [/(^|\.)ausha\.co$/, "Ausha"],
  [/(^|\.)acast\.com$|(^|\.)shows\.acast\.com$/, "Acast"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)soundcloud\.com$/, "SoundCloud"],
  [/(^|\.)audmns\.com$|(^|\.)audiomeans\.fr$/, "Audiomeans"],
  [/(^|\.)podcastics\.com$/, "Podcastics"],
  [/(^|\.)podcloud\.fr$/, "podCloud"],
  [/(^|\.)music\.amazon\.[a-z.]+$/, "Amazon Music"],
  [/(^|\.)audible\.[a-z.]+$/, "Audible"],
  [/(^|\.)castbox\.fm$/, "Castbox"],
  [/(^|\.)podbean\.com$/, "Podbean"],
  [/(^|\.)radiofrance\.fr$/, "Radio France"],
  [/(^|\.)anchor\.fm$|(^|\.)podcasters\.spotify\.com$|(^|\.)creators\.spotify\.com$/, "Spotify"],
  [/(^|\.)(buzzsprout|captivate|simplecast|transistor|podigee|smartpodcast)\.[a-z.]+$/, "Lien d'écoute"],
];

// Domaine → nom du réseau à suivre
const SUIVRE: [RegExp, string][] = [
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$|^fb\.me$/, "Facebook"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(x|twitter)\.com$/, "X"],
  [/(^|\.)threads\.net$/, "Threads"],
  [/(^|\.)bsky\.app$/, "Bluesky"],
  [/(^|\.)linktr\.ee$/, "Tous les liens"],
];

const estFlux = (url: string) => /\.(xml|rss)(\?|$)|\/(rss|feed)(\/|\?|$)/i.test(url);

/** Range un lien dans « Écouter sur » ou « Suivre », avec le nom à afficher. */
export const classerLien = (url: string, opts: { flux?: boolean } = {}): LienClasse => {
  const h = hote(url);
  if (opts.flux || estFlux(url)) return { groupe: "ecoute", label: "Flux RSS", href: url };
  for (const [re, label] of ECOUTE) if (re.test(h)) return { groupe: "ecoute", label, href: url };
  for (const [re, label] of SUIVRE) if (re.test(h)) return { groupe: "suivre", label, href: url };
  return { groupe: "suivre", label: "Site", href: url };
};

/**
 * Liens d'une fiche, répartis en deux lignes. Chaque lien est classé selon son domaine,
 * quelle que soit la case où il a été saisi. Les doublons sont retirés.
 */
export const liensFiche = (urls: { ecoute?: string | null; site?: string | null; reseau?: string | null; flux?: string | null }) => {
  const vus = new Set<string>();
  const out: LienClasse[] = [];
  const ajouter = (url: string | null | undefined, flux = false) => {
    const u = (url || "").trim();
    if (!u || vus.has(u)) return;
    vus.add(u);
    out.push(classerLien(u, { flux }));
  };
  ajouter(urls.ecoute);
  ajouter(urls.site);
  ajouter(urls.reseau);
  ajouter(urls.flux, true);
  // Deux liens du même nom dans une ligne : on numérote (« Site », « Site 2 »)
  const compte = new Map<string, number>();
  for (const l of out) {
    const k = `${l.groupe}:${l.label}`;
    const n = (compte.get(k) || 0) + 1;
    compte.set(k, n);
    if (n > 1) l.label = `${l.label} ${n}`;
  }
  return { ecoute: out.filter((l) => l.groupe === "ecoute"), suivre: out.filter((l) => l.groupe === "suivre") };
};
