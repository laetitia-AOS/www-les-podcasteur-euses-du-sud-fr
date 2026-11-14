// Agenda → L'Onde du Sud (admin → Agenda, admins seulement, vérifié par la base) :
// case « Ajouter au prochain numéro de L'Onde du Sud » et badge « Dans L'Onde n°X ».
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CASE_ONDE = "Ajouter au prochain numéro de L'Onde du Sud";
export const MESSAGE_SANS_BROUILLON = "Aucun numéro en préparation : crée d'abord un brouillon dans L'Onde du Sud";
export const MAX_EVENEMENTS_BLOC = 8;

export type EtatAgendaOnde = {
  prochain: { id: string; numero: number; mois: string } | null;
  liens: { evenement_id: string; numero: number; statut: string }[];
};

export const useEtatAgendaOnde = (actif: boolean) =>
  useQuery({
    queryKey: ["onde-agenda-etat"],
    enabled: actif,
    queryFn: async (): Promise<EtatAgendaOnde> => {
      const { data, error } = await supabase.rpc("onde_agenda_etat");
      if (error) throw error;
      const d = (data || {}) as Partial<EtatAgendaOnde>;
      return { prochain: d.prochain ?? null, liens: Array.isArray(d.liens) ? d.liens : [] };
    },
  });

/** Numéros (triés) qui contiennent l'événement, pour le badge « Dans L'Onde n°X ». */
export const numerosEvenement = (etat: EtatAgendaOnde | undefined, id: string) =>
  [...new Set((etat?.liens || []).filter((l) => l.evenement_id === id).map((l) => l.numero))].sort((a, b) => a - b);

/** Vrai si l'événement est déjà dans un numéro en préparation (case cochée à l'ouverture). */
export const dansUnBrouillon = (etat: EtatAgendaOnde | undefined, id: string) =>
  (etat?.liens || []).some((l) => l.evenement_id === id && l.statut === "brouillon");

/** Numéros en préparation qui contiennent l'événement. */
export const numerosBrouillon = (etat: EtatAgendaOnde | undefined, id: string) =>
  [...new Set((etat?.liens || []).filter((l) => l.evenement_id === id && l.statut === "brouillon").map((l) => l.numero))].sort((a, b) => a - b);

export const badgeOnde = (numeros: number[]) => (numeros.length ? `Dans L'Onde n°${numeros.join(", n°")}` : "");

export type ReponseBascule = { code: string; numero?: number; numeros?: number[]; bloc_cree?: boolean };

/** Message affiché après l'enregistrement : « ok » vert, « erreur » rouge. */
export const messageBascule = (r: ReponseBascule): { ton: "ok" | "erreur"; texte: string } => {
  switch (r.code) {
    case "ajoute":
      return { ton: "ok", texte: `Ajouté à L'Onde n°${r.numero}${r.bloc_cree ? " (bloc « À l'agenda » créé)" : ""}.` };
    case "deja":
      return { ton: "ok", texte: `Déjà dans L'Onde n°${r.numero}.` };
    case "aucun_brouillon":
      return { ton: "erreur", texte: MESSAGE_SANS_BROUILLON };
    case "plein":
      return { ton: "erreur", texte: `Le bloc « À l'agenda » du n°${r.numero} contient déjà ${MAX_EVENEMENTS_BLOC} événements : retires-en un dans L'Onde du Sud avant d'en ajouter un autre.` };
    case "trop_de_blocs":
      return { ton: "erreur", texte: `Le n°${r.numero} a déjà le nombre maximal de blocs : ajoute l'événement à la main dans un bloc « À l'agenda » existant.` };
    case "retire":
      return { ton: "ok", texte: `Retiré de L'Onde n°${(r.numeros || []).join(", n°")}.` };
    case "absent":
      return { ton: "ok", texte: "L'événement n'était dans aucun numéro en préparation." };
    default:
      return { ton: "erreur", texte: "L'événement est enregistré, mais L'Onde du Sud n'a pas pu être mise à jour." };
  }
};

export const basculerOnde = async (evenementId: string, ajouter: boolean): Promise<ReponseBascule> => {
  const { data, error } = await supabase.rpc("onde_agenda_basculer", { _evenement_id: evenementId, _ajouter: ajouter });
  if (error) throw error;
  return (data || { code: "inconnu" }) as ReponseBascule;
};
