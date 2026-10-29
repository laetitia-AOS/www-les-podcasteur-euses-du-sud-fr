import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ATraiter = {
  images: number; fiches: number; propositions: number; paiements: number;
  contacts: number; messages_membres: number; flux: number;
};

const VIDE: ATraiter = { images: 0, fiches: 0, propositions: 0, paiements: 0, contacts: 0, messages_membres: 0, flux: 0 };

/** Compteurs de ce qui attend une action (le serveur ne renvoie rien à qui n'est pas admin). */
export const useATraiter = (actif = true) =>
  useQuery({
    queryKey: ["admin-a-traiter"],
    enabled: actif,
    refetchInterval: 60_000,
    queryFn: async (): Promise<ATraiter> => {
      const { data, error } = await supabase.rpc("admin_a_traiter");
      if (error) throw error;
      return ((data || [])[0] as ATraiter) ?? VIDE;
    },
  });

/** Total par rubrique du menu. */
export const totalRubrique = (t: ATraiter | undefined, rubrique: string) => {
  if (!t) return 0;
  switch (rubrique) {
    case "membres": return t.paiements;
    case "annuaire": return t.images + t.fiches + t.flux;
    case "agenda": return t.propositions;
    case "messages": return t.contacts + t.messages_membres;
    default: return 0;
  }
};
