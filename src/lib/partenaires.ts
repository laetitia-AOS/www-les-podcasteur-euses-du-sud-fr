// Partenaires de l'association : gérés dans l'administration (/admin/partenaires),
// affichés sur la page /partenaires et dans la colonne « Partenaires » de l'accueil.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Partenaire = {
  id: string;
  nom: string;
  site_url: string | null;
  logo_url: string | null;
  accroche: string | null;
  description: string | null;
  ordre: number;
  publie: boolean;
};

export const PARTENAIRE_COLUMNS = "id, nom, site_url, logo_url, accroche, description, ordre, publie";

/** Limites, identiques à celles vérifiées par le serveur. */
export const LIMITES_PARTENAIRE = { nom: 120, accroche: 90, description: 800 } as const;

/** Formats de logo acceptés (pas de SVG : un fichier SVG peut contenir du code). */
export const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const LOGO_MAX_OCTETS = 2 * 1024 * 1024;

/** Ordre d'affichage : le numéro d'ordre, puis le nom. */
export const trierPartenaires = <T extends Pick<Partenaire, "ordre" | "nom">>(liste: T[]): T[] =>
  [...liste].sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom, "fr"));

/** Lien vers le site : complété en https:// si l'adresse a été saisie sans. Vide si rien n'est renseigné. */
export const lienSite = (url?: string | null): string | null => {
  const s = (url || "").trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

/** Adresse affichée sans « https:// » ni « www. », pour un texte plus lisible. */
export const domaineAffiche = (url?: string | null): string =>
  (url || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

/** Partenaires publiés (le serveur ne renvoie que ceux-là à un·e visiteur·ice). */
export const usePartenaires = () =>
  useQuery({
    queryKey: ["partenaires-publics"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Partenaire[]> => {
      const { data, error } = await supabase
        .from("partenaires")
        .select(PARTENAIRE_COLUMNS)
        .eq("publie", true)
        .order("ordre")
        .order("nom");
      if (error) throw error;
      return trierPartenaires((data || []) as Partenaire[]);
    },
  });
