// L'Onde du Sud : données des blocs automatiques (agenda, annuaire, nouveaux membres).
// Rien n'est recopié dans le numéro : les blocs relisent l'agenda et l'annuaire à chaque affichage.
// Les nouveaux membres sont calculés par la base, qui ne renvoie que nom, photo, podcast, ville et adresse de fiche.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { aVenirFilter, isOrganizedByPds, type HomeEvent } from "@/components/home/useHomeData";
import { aUnPodcast, formatName } from "@/lib/pds";
import { LIMITES_ONDE } from "@/lib/onde";

export const EVENEMENT_COLONNES =
  "id, titre, sous_titre, date_debut, date_fin, lieu, adresse, type, slug, lien_externe, inscription_activee, origine, format, propose_par_nom, tarif";

/** « Organisé par PDS » ou « Proposé par Marie Dupont ». */
export const origineEvenement = (e: Pick<HomeEvent, "origine" | "propose_par_nom">) =>
  isOrganizedByPds(e) ? "Organisé par PDS" : e.propose_par_nom ? `Proposé par ${formatName(e.propose_par_nom)}` : "Proposé par un membre";

/** Vrai si l'événement commence dans les « jours » prochains jours. */
export const dansLesJours = (e: Pick<HomeEvent, "date_debut">, jours: number = LIMITES_ONDE.joursAgenda, maintenant = new Date()) =>
  new Date(e.date_debut).getTime() <= maintenant.getTime() + jours * 24 * 3600_000;

/** Événements publiés à venir (pour cocher dans l'éditeur). */
export const useEvenementsAVenir = () =>
  useQuery({
    queryKey: ["onde-agenda-a-venir"],
    queryFn: async (): Promise<HomeEvent[]> => {
      const { data, error } = await supabase
        .from("evenements")
        .select(EVENEMENT_COLONNES)
        .eq("statut", "publie")
        .or(aVenirFilter())
        .order("date_debut", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data || []) as HomeEvent[];
    },
  });

/** Événements cochés dans un bloc, relus dans l'agenda : seuls ceux encore publiés reviennent. */
export const useEvenementsChoisis = (ids: string[]) => {
  const liste = [...new Set(ids)].sort();
  return useQuery({
    queryKey: ["onde-agenda-choisis", liste],
    enabled: liste.length > 0,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<HomeEvent[]> => {
      const { data, error } = await supabase
        .from("evenements")
        .select(EVENEMENT_COLONNES)
        .in("id", liste)
        .eq("statut", "publie")
        .order("date_debut", { ascending: true });
      if (error) throw error;
      return (data || []) as HomeEvent[];
    },
  });
};

export type PodcastOnde = {
  id: string;
  slug: string | null;
  nom_podcast: string | null;
  prenom: string | null;
  nom: string | null;
  city_name: string | null;
  vignette_url: string | null;
  type_profil: string;
};
const PODCAST_COLONNES = "id, slug, nom_podcast, prenom, nom, city_name, vignette_url, type_profil";

/** Podcasts des fiches validées de l'annuaire (pour choisir dans l'éditeur). */
export const usePodcastsAnnuaire = () =>
  useQuery({
    queryKey: ["onde-podcasts-annuaire"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PodcastOnde[]> => {
      const { data, error } = await supabase
        .from("podcasts")
        .select(PODCAST_COLONNES)
        .eq("valide", true)
        .eq("type_profil", "podcasteur")
        .order("nom_podcast", { ascending: true });
      if (error) throw error;
      return ((data || []) as PodcastOnde[]).filter(aUnPodcast);
    },
  });

/** Un podcast relu dans l'annuaire (rien si sa fiche n'est plus visible). */
export const usePodcastChoisi = (id?: string) =>
  useQuery({
    queryKey: ["onde-podcast", id],
    enabled: !!id,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<PodcastOnde | null> => {
      const { data, error } = await supabase.from("podcasts").select(PODCAST_COLONNES).eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as PodcastOnde) ?? null;
    },
  });

const sansAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");

/** Recherche par nom du podcast, nom du créateur·ice ou ville, sans tenir compte des accents ni des majuscules. */
export const filtrerPodcasts = <T extends Pick<PodcastOnde, "nom_podcast" | "prenom" | "nom" | "city_name">>(liste: T[], recherche: string): T[] => {
  const mots = sansAccents(recherche).split(/\s+/).filter(Boolean);
  if (!mots.length) return liste;
  return liste.filter((p) => {
    const texte = sansAccents([p.nom_podcast, p.prenom, p.nom, p.city_name].filter(Boolean).join(" "));
    return mots.every((m) => texte.includes(m));
  });
};

/** Carte d'un nouveau membre, telle que la base la renvoie (aucune donnée d'adhésion). */
export type CarteMembre = {
  id: string;
  prenom: string | null;
  nom: string | null;
  photo_url: string | null;
  nom_podcast: string | null;
  ville: string | null;
  slug: string | null;
  type_profil: string;
};

export const useNouveauxMembres = (numeroId: string, blocId: string) =>
  useQuery({
    queryKey: ["onde-nouveaux-membres", numeroId, blocId],
    enabled: !!numeroId && !!blocId,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<CarteMembre[]> => {
      const { data, error } = await supabase.rpc("onde_nouveaux_membres", { _numero_id: numeroId, _bloc_id: blocId });
      if (error) throw error;
      return (data || []) as CarteMembre[];
    },
  });

/** Ligne de suivi pour l'équipe : nombres et noms seulement. */
export type BilanMembres = {
  nouveaux: number;
  affiches: string[];
  en_attente: string[];
  reportes: number;
  deja: number;
  fige: boolean;
};

export const useBilanMembres = (numeroId: string, blocId: string, mois?: string) =>
  useQuery({
    queryKey: ["onde-bilan", numeroId, blocId, mois],
    enabled: !!numeroId && !!mois,
    queryFn: async (): Promise<BilanMembres | null> => {
      const { data, error } = await supabase.rpc("onde_nouveaux_membres_bilan", { _numero_id: numeroId, _bloc_id: blocId, _mois: mois! });
      if (error) throw error;
      return (data as unknown as BilanMembres) ?? null;
    },
  });

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

/** « 3 nouveaux membres ce mois-ci, 1 affiché·e, 2 en attente d'une fiche complète » */
export const ligneBilan = (b: Pick<BilanMembres, "nouveaux" | "affiches" | "en_attente">) =>
  `${pluriel(b.nouveaux, "nouveau membre", "nouveaux membres")} ce mois-ci, ${pluriel(b.affiches.length, "affiché·e", "affiché·es")}, ${b.en_attente.length} en attente d'une fiche complète`;
