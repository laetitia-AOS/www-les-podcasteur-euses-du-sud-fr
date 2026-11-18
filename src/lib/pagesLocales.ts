// Pages locales pour le référencement (« podcast marseille », « studio podcast marseille »…).
// Une page n'existe que là où des membres ont réellement des podcasts ou des studios : pas de page vide.
import { PAGES, PAGES_SEO } from "@/lib/seo";
import { cleanCity } from "@/lib/pds";

export type ZoneLocale = {
  /** Villes (sans arrondissement) ou départements couverts. */
  villes?: string[];
  departements?: string[];
};

export type PagePodcastsLocale = ZoneLocale & {
  cle: "podcastMarseille" | "podcastCoteAzur";
  chemin: string;
  /** « à Marseille », « à Nice et sur la Côte d'Azur » */
  lieu: string;
  /** Page studios de la même ville, quand elle existe. */
  studios?: string;
};

export const norm = (s?: string | null) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-'’]/g, " ").replace(/\s+/g, " ").trim();

/** Une fiche (ou un événement, par sa ville) est-elle dans la zone ? */
export const dansZone = (z: ZoneLocale, p: { city_name?: string | null; ville?: string | null; department_code?: string | null }) => {
  const ville = norm(cleanCity(p.city_name || p.ville));
  if (z.villes?.some((v) => norm(v) === ville)) return true;
  return !!p.department_code && !!z.departements?.includes(p.department_code);
};

export const PAGES_PODCASTS_LOCALES: PagePodcastsLocale[] = [
  { cle: "podcastMarseille", chemin: PAGES.podcastMarseille, lieu: "à Marseille", villes: ["Marseille"], studios: PAGES.studiosMarseille },
  { cle: "podcastCoteAzur", chemin: PAGES.podcastCoteAzur, lieu: "à Nice et sur la Côte d'Azur", departements: ["06"] },
];

export const PAGE_STUDIOS_MARSEILLE = {
  cle: "studiosMarseille" as const,
  chemin: PAGES.studiosMarseille,
  lieu: "à Marseille",
  villes: ["Marseille"],
  departement: "13",
};

export const seoDe = (cle: keyof typeof PAGES_SEO) => PAGES_SEO[cle];

/** Liens entre pages locales (pied de page, Écouter, Studios). */
export const LIENS_LOCAUX = [
  { to: PAGES.podcastMarseille, label: "Podcasts à Marseille" },
  { to: PAGES.podcastCoteAzur, label: "Podcasts à Nice et sur la Côte d'Azur" },
  { to: PAGES.studiosMarseille, label: "Studios podcast à Marseille" },
  { to: PAGES.formation, label: "Formation podcast" },
];

/** Un événement sur place est-il dans la zone ? (ville et département lus dans son adresse) */
export const evenementDansZone = (z: ZoneLocale, e: { adresse?: string | null; lieu?: string | null }) => {
  const texte = `${e.adresse || ""} ${e.lieu || ""}`;
  const cp = texte.match(/\b(\d{5})\s+([^,]+?)\s*(?:,|$)/);
  const ville = cp ? cp[2] : /marseille/i.test(texte) ? "Marseille" : "";
  return dansZone(z, { city_name: ville, department_code: cp ? cp[1].slice(0, 2) : null });
};
