// Petites règles de l'espace membre (statut d'adhésion, dates relatives, lien vers la fiche publique).
import { TYPES_PROFIL } from "@/lib/inscription";

/**
 * Adhésion à l'année civile : valable jusqu'au 31 décembre de l'année couverte, quelle que soit la date de paiement.
 * Profil encore visible en janvier (tolérance), masqué le 1er février. La règle fait foi en base ; ces fonctions servent à l'affichage.
 */
const parisYM = (now: Date) => {
  const parts = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "numeric" }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { annee: get("year"), mois: get("month") };
};

/** Année en cours (heure de Paris). */
export const anneeEnCours = (now: Date = new Date()) => parisYM(now).annee;

/** Année que couvre un paiement fait aujourd'hui : l'année en cours, ou la suivante si elle est déjà payée. */
export const anneePourPaiement = (anneeCouverte: number | null | undefined, now: Date = new Date()) => {
  const y = anneeEnCours(now);
  return anneeCouverte != null && anneeCouverte >= y ? anneeCouverte + 1 : y;
};

/** Le renouvellement pour l'année suivante est proposé à partir du 1er décembre. */
export const periodeRenouvellement = (now: Date = new Date()) => parisYM(now).mois === 12;

/** « Valable jusqu'au 31 décembre 2026 ». */
export const libelleValidite = (annee: number) => `Valable jusqu'au 31 décembre ${annee}`;

export const formatLongDate = (d: Date | string | null | undefined): string => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

/** « aujourd'hui », « il y a 3 j », « il y a 2 mois ». */
export const ilYA = (iso: string, now: Date = new Date()): string => {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days < 31) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(days / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
};

/** Libellé du rôle, en écriture inclusive et sans majuscule à chaque mot. */
export const roleLabel = (type: string | null | undefined): string =>
  TYPES_PROFIL.find((t) => t.value === type)?.label || "Membre";

/** Adresse de la fiche publique selon le type de profil. */
export const publicProfilePath = (type: string, slug: string | null): string | null => {
  if (!slug) return null;
  if (type === "studio") return `/studios/${slug}`;
  if (type === "structure_eco") return `/structures/${slug}`;
  if (type === "soutien") return null;
  return `/podcasteur/${slug}`;
};

/** État d'adhésion renvoyé par le serveur (année civile, tolérance en janvier). */
export type EtatServeur = "a_jour" | "tolerance" | "terminee" | "verification" | "aucune";

/** Lien « Renouveler » : la page Adhérer s'ouvre sur l'étape paiement, avec la formule et l'année couverte. */
export const lienRenouveler = (formule: string | null | undefined, annee?: number | null) => {
  const q = new URLSearchParams({ etape: "adhesion" });
  if (formule === "studio" || formule === "personne") q.set("formule", formule);
  if (annee) q.set("pour", String(annee));
  return `/adherer?${q.toString()}`;
};
