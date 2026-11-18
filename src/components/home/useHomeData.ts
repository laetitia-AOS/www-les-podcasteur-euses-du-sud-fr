import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatName, melanger } from "@/lib/pds";

export type HomeProfile = {
  id: string;
  slug: string | null;
  nom_podcast: string;
  prenom: string | null;
  nom: string | null;
  city_name: string | null;
  vignette_url: string | null;
  photo_profil_url?: string | null;
  type_profil: string;
  department_code: string | null;
  cherche_choix: string[] | null;
  apporte_choix: string[] | null;
  lien_ecoute: string | null;
  created_at: string;
  visible_sans_adhesion?: boolean | null;
};

export const useHomeProfiles = () =>
  useQuery({
    queryKey: ["home-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts_publics")
        .select("id, slug, nom_podcast, prenom, nom, city_name, vignette_url, photo_profil_url, type_profil, department_code, cherche_choix, apporte_choix, lien_ecoute, created_at, visible_sans_adhesion")
        .eq("valide", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HomeProfile[];
    },
    staleTime: 5 * 60 * 1000,
  });

/** Territoire de l'association : les 6 départements de la Région Sud (chiffre fixe). */
export const DEPARTEMENTS_PDS = 6;

/**
 * Chiffres de l'accueil, calculés sur les fiches visibles :
 * personnes = podcasteur·euses + acteur·ices de l'écosystème + soutiens ; podcasts ; studios.
 */
export const chiffresAccueil = (profiles: Pick<HomeProfile, "type_profil">[]) => ({
  personnes: profiles.filter((p) => ["podcasteur", "pro_podcast", "soutien"].includes(p.type_profil)).length,
  podcasts: profiles.filter((p) => p.type_profil === "podcasteur" && (p as { nom_podcast?: string }).nom_podcast !== "—").length,
  studios: profiles.filter((p) => p.type_profil === "studio").length,
});

/**
 * Mur de pochettes de l'accueil : n podcasts ayant une pochette, tirés au hasard à chaque visite,
 * pour que tous les membres y passent à tour de rôle (aucun podcast fixé en tête).
 */
export const piocherMur = <T extends Pick<HomeProfile, "type_profil" | "vignette_url"> & { nom_podcast?: string | null }>(
  profiles: T[], n = 5, rand = Math.random,
): T[] => {
  const melange = profiles.filter((p) => p.type_profil === "podcasteur" && p.nom_podcast !== "—" && !!p.vignette_url);
  return melanger(melange, rand).slice(0, n);
};

/**
 * « Qui cherche quoi » : personnes (ni studio ni structure) qui ont rempli « Je cherche » et « J'apporte »,
 * membres à jour (une fiche visible grâce à un sursis est écartée), mélangées au hasard.
 * Une même personne a souvent plusieurs fiches (une par podcast) : on n'en garde qu'une,
 * de préférence une fiche avec un vrai podcast, pour ne pas l'afficher plusieurs fois.
 */
export const piocherQuiCherche = <T extends Pick<HomeProfile, "type_profil" | "cherche_choix" | "apporte_choix" | "visible_sans_adhesion" | "prenom" | "nom" | "nom_podcast">>(
  profiles: T[], n = 3, rand = Math.random,
): T[] => {
  const pool = profiles.filter(
    (p) => ["podcasteur", "pro_podcast", "soutien"].includes(p.type_profil)
      && (p.cherche_choix?.length || 0) > 0 && (p.apporte_choix?.length || 0) > 0
      && !p.visible_sans_adhesion,
  );
  const parPersonne = new Map<string, T>();
  for (const p of pool) {
    const cle = `${(p.prenom || "").trim().toLowerCase()}|${(p.nom || "").trim().toLowerCase()}`;
    const actuel = parPersonne.get(cle);
    if (!actuel || (actuel.nom_podcast === "—" && p.nom_podcast !== "—")) parPersonne.set(cle, p);
  }
  const melange = [...parPersonne.values()];
  return melanger(melange, rand).slice(0, n);
};

export type HomeEvent = {
  id: string;
  titre: string;
  sous_titre: string | null;
  date_debut: string;
  lieu: string | null;
  adresse: string | null;
  type: string;
  slug: string | null;
  lien_externe: string | null;
  inscription_activee: boolean;
  origine?: string | null;
  format?: string | null;
  propose_par_nom?: string | null;
  organisateur_exterieur?: boolean | null;
  tarif?: string | null;
  date_fin?: string | null;
  image_url?: string | null;
};

/** Événements à venir : pas encore terminés (date de fin, sinon date de début). Les autres passent en archives. */
export const aVenirFilter = () => {
  const now = new Date().toISOString();
  return `date_fin.gte.${now},and(date_fin.is.null,date_debut.gte.${now})`;
};
export const passeFilter = () => {
  const now = new Date().toISOString();
  return `date_fin.lt.${now},and(date_fin.is.null,date_debut.lt.${now})`;
};

export const useUpcomingEvents = () =>
  useQuery({
    queryKey: ["home-upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("id, titre, sous_titre, date_debut, date_fin, lieu, adresse, type, slug, lien_externe, inscription_activee, origine, format, propose_par_nom, organisateur_exterieur, tarif")
        .eq("statut", "publie")
        .or(aVenirFilter())
        .order("date_debut", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data || []) as HomeEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const isOnline = (e: Pick<HomeEvent, "lieu" | "adresse" | "format">) =>
  e.format ? e.format === "en_ligne" : /en ligne|visio|zoom|google meet|teams|discord|twitch|youtube/i.test(`${e.lieu || ""} ${e.adresse || ""}`);

/** Organisé par l'association, ou proposé par un membre (champ « origine »). */
export const isOrganizedByPds = (e: Pick<HomeEvent, "origine">) => (e.origine ?? "pds") === "pds";

/**
 * Événement venu de la veille hebdomadaire : ajouté par la connexion serveur, sans compte membre.
 * Ce n'est pas l'association qui l'organise et on n'a pas le nom de la structure : rien n'est affiché à ce sujet.
 */
export const estEvenementVeille = (e: Pick<HomeEvent, "origine" | "propose_par_nom">) =>
  isOrganizedByPds(e) && !!e.propose_par_nom?.trim();

/** Aucun organisateur affiché : événement venu de la veille, ou case « Ce n'est pas PDS qui organise » cochée. */
export const sansOrganisateur = (e: Pick<HomeEvent, "origine" | "propose_par_nom" | "organisateur_exterieur">) =>
  estEvenementVeille(e) || !!e.organisateur_exterieur;

/** Vrai rendez-vous de l'association (ni veille, ni case « Ce n'est pas PDS qui organise ») : mis en avant dans l'agenda. */
export const estRendezVousPds = (e: Pick<HomeEvent, "origine" | "propose_par_nom" | "organisateur_exterieur">) =>
  isOrganizedByPds(e) && !sansOrganisateur(e);

// le code interne « apero_ecoute » (figé en base) désigne le rendez-vous mensuel, désormais appelé « Atelier-écoute »
export const EVENT_TYPES = [
  { value: "apero_ecoute", label: "Atelier-écoute" },
  { value: "atelier", label: "Atelier" },
  { value: "live", label: "Live" },
  { value: "ecoute", label: "Écoute" },
  { value: "rencontre", label: "Rencontre" },
  { value: "autre", label: "Autre" },
] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.label]));

/** « organisé par PDS », « proposé par Marie Dupont », ou '' quand on ne sait pas qui organise. */
export const organisateurLabel = (e: Pick<HomeEvent, "origine" | "propose_par_nom" | "organisateur_exterieur">) =>
  sansOrganisateur(e) ? ""
    : isOrganizedByPds(e) ? "organisé par PDS"
    : e.propose_par_nom ? `proposé par ${formatName(e.propose_par_nom)}` : "proposé par un membre";

/** Ville tirée de l'adresse, sans code postal ni arrondissement. */
export const cityFromAddress = (adresse?: string | null): string => {
  if (!adresse) return "";
  const m = adresse.match(/\d{5}\s+([^,]+)$/);
  if (m) return m[1].trim();
  if (/marseille/i.test(adresse)) return "Marseille";
  return "";
};
