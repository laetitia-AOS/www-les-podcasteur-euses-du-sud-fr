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
  type_profil: string;
  department_code: string | null;
  cherche_collaboration: string[] | null;
  peut_apporter: string[] | null;
  lien_ecoute: string | null;
  created_at: string;
};

export const useHomeProfiles = () =>
  useQuery({
    queryKey: ["home-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, nom_podcast, prenom, nom, city_name, vignette_url, type_profil, department_code, cherche_collaboration, peut_apporter, lien_ecoute, created_at")
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
};

export const useUpcomingEvents = () =>
  useQuery({
    queryKey: ["home-upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("id, titre, sous_titre, date_debut, lieu, adresse, type, slug, lien_externe, inscription_activee")
        .eq("publie", true)
        .gte("date_debut", new Date().toISOString())
        .order("date_debut", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data || []) as HomeEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const isOnline = (e: Pick<HomeEvent, "lieu" | "adresse">) =>
  /en ligne|visio|zoom|google meet|teams|discord|twitch|youtube/i.test(`${e.lieu || ""} ${e.adresse || ""}`);

/** Rencontres et ateliers sont organisés par l'association ; les autres types sont proposés par les membres ou partenaires. */
export const isOrganizedByPds = (e: Pick<HomeEvent, "type">) => e.type === "rencontre" || e.type === "atelier";

export const EVENT_TYPE_LABELS: Record<string, string> = {
  rencontre: "Rencontre",
  atelier: "Atelier",
  evenement: "Événement",
  partenaire: "Événement partenaire",
};

/** Ville tirée de l'adresse, sans code postal ni arrondissement. */
export const cityFromAddress = (adresse?: string | null): string => {
  if (!adresse) return "";
  const m = adresse.match(/\d{5}\s+([^,]+)$/);
  if (m) return m[1].trim();
  if (/marseille/i.test(adresse)) return "Marseille";
  return "";
};
