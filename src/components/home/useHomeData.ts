import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
};

export const useHomeProfiles = () =>
  useQuery({
    queryKey: ["home-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, nom_podcast, prenom, nom, city_name, vignette_url, photo_profil_url, type_profil, department_code, cherche_choix, apporte_choix, lien_ecoute, created_at")
        .eq("valide", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HomeProfile[];
    },
    staleTime: 5 * 60 * 1000,
  });

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
  tarif?: string | null;
  date_fin?: string | null;
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
        .select("id, titre, sous_titre, date_debut, date_fin, lieu, adresse, type, slug, lien_externe, inscription_activee, origine, format, propose_par_nom, tarif")
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

export const EVENT_TYPES = [
  { value: "apero_ecoute", label: "Apéro écoute" },
  { value: "atelier", label: "Atelier-écoute" },
  { value: "live", label: "Live" },
  { value: "ecoute", label: "Écoute" },
  { value: "rencontre", label: "Rencontre" },
  { value: "autre", label: "Autre" },
] as const;

export const EVENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(EVENT_TYPES.map((t) => [t.value, t.label]));

/** « organisé par PDS » ou « proposé par Marie Dupont » */
export const organisateurLabel = (e: Pick<HomeEvent, "origine" | "propose_par_nom">) =>
  isOrganizedByPds(e) ? "organisé par PDS" : e.propose_par_nom ? `proposé par ${e.propose_par_nom}` : "proposé par un membre";

/** Ville tirée de l'adresse, sans code postal ni arrondissement. */
export const cityFromAddress = (adresse?: string | null): string => {
  if (!adresse) return "";
  const m = adresse.match(/\d{5}\s+([^,]+)$/);
  if (m) return m[1].trim();
  if (/marseille/i.test(adresse)) return "Marseille";
  return "";
};
