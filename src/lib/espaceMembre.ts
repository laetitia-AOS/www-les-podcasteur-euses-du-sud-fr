// Petites règles de l'espace membre (statut d'adhésion, dates relatives, lien vers la fiche publique).
import { TYPES_PROFIL } from "@/lib/inscription";

/** Les adhésions antérieures à cette date sont considérées comme expirées (règle de transition 2026). */
export const DEBUT_VALIDITE = new Date("2026-01-01T00:00:00Z");

export type EtatAdhesion = "a_jour" | "expiree" | "aucune";

/**
 * Adhésion valable un an à partir de la date de paiement (année glissante),
 * à condition d'avoir été réglée à partir du 1er janvier 2026.
 */
export const statutAdhesion = (
  dateAdhesion: string | null | undefined,
  now: Date = new Date(),
): { etat: EtatAdhesion; echeance: Date | null } => {
  if (!dateAdhesion) return { etat: "aucune", echeance: null };
  const d = new Date(dateAdhesion);
  if (isNaN(d.getTime())) return { etat: "aucune", echeance: null };
  const echeance = new Date(d);
  echeance.setFullYear(echeance.getFullYear() + 1);
  if (d < DEBUT_VALIDITE) return { etat: "expiree", echeance };
  return { etat: now < echeance ? "a_jour" : "expiree", echeance };
};

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
  if (type === "studio") return `/annuaire-podcasts/studios/${slug}`;
  if (type === "structure_eco") return `/annuaire-podcasts/structures/${slug}`;
  if (type === "soutien") return null;
  return `/podcasteur/${slug}`;
};

/** État d'adhésion renvoyé par le serveur (échéance = 1 an après confirmation du paiement). */
export type EtatServeur = "a_jour" | "bientot" | "terminee" | "verification" | "aucune";

/** Nombre de jours avant l'échéance (négatif si elle est passée). */
export const joursRestants = (echeance: string | Date | null | undefined, now: Date = new Date()): number | null => {
  if (!echeance) return null;
  const d = typeof echeance === "string" ? new Date(echeance) : echeance;
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
};

/** Lien « Renouveler » : la page Adhérer s'ouvre sur l'étape paiement avec la bonne formule. */
export const lienRenouveler = (formule: string | null | undefined) =>
  `/rejoindre-association?etape=adhesion${formule === "studio" || formule === "personne" ? `&formule=${formule}` : ""}`;
