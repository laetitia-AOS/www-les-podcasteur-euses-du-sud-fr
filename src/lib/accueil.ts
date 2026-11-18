// Accueil des nouvelles personnes et groupes WhatsApp : mêmes règles que les e-mails
// (supabase/functions/_shared/accueil.ts, source unique).
export {
  ATELIERS_RYTHME, CONTACT_ACCUEIL, DEPARTEMENTS_ACCUEIL, ETAPES_PARTICIPER, INSTAGRAM_PDS, LINKEDIN_PDS, PHRASE_SOUTIEN,
  dateAtelier, departementValide, estLienWhatsapp, groupePour, libelleDepartement, messagePresentation, regleGroupes,
  type FichePresentation, type GroupeWhatsapp,
} from "../../supabase/functions/_shared/accueil";

/** Départements hors des six de la Région Sud : pas de recherche de commune, la ville s'écrit à la main. */
export const villeLibre = (code?: string | null) => code === "MC" || code === "autre";
