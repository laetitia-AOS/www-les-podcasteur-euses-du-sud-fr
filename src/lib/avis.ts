// Avis laissés sous la fiche d'un podcast : lecture, envoi et signalement.
// La vérification sérieuse est en base (déclencheur `guard_avis`) ; celle d'ici sert
// uniquement à afficher les messages avant l'envoi.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Avis {
  id: string;
  nom: string;
  note: number;
  commentaire: string;
  created_at: string;
  membre: boolean;
}

export interface AvisSaisie {
  nom: string;
  email: string;
  note: number;
  commentaire: string;
}

export type AvisErreurs = Partial<Record<keyof AvisSaisie, string>>;

export const AVIS_MIN = 10;
export const AVIS_MAX = 600;

/** Motifs de signalement : liste fermée, aucun texte libre. */
export const MOTIFS_SIGNALEMENT = [
  { code: "spam", label: "Spam ou publicité" },
  { code: "offensant", label: "Message offensant" },
  { code: "hors sujet", label: "Hors sujet" },
  { code: "pas mon podcast", label: "Ce n'est pas mon podcast" },
];

/** Vérifie une saisie d'avis et renvoie les messages d'erreur, vide si tout est bon. */
export const verifierAvis = (v: AvisSaisie): AvisErreurs => {
  const errs: AvisErreurs = {};
  const nom = v.nom.trim();
  const email = v.email.trim();
  const commentaire = v.commentaire.trim();

  if (nom.length < 2) errs.nom = "Indiquez votre nom.";
  else if (nom.length > 100) errs.nom = "100 caractères maximum.";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errs.email = "Adresse e-mail invalide.";

  if (!Number.isInteger(v.note) || v.note < 1 || v.note > 5) errs.note = "Choisissez une note de 1 à 5 étoiles.";

  if (commentaire.length < AVIS_MIN) errs.commentaire = `Votre commentaire doit faire au moins ${AVIS_MIN} caractères.`;
  else if (commentaire.length > AVIS_MAX) errs.commentaire = `${AVIS_MAX} caractères maximum.`;

  return errs;
};

const appeler = async (corps: Record<string, unknown>) => {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/avis-podcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify(corps),
  });
  const rep = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(rep.error || "Votre avis n'a pas pu être envoyé. Réessayez dans un instant.");
  return rep as { ok?: boolean };
};

/** Envoie un avis : il est publié immédiatement, sous réserve de vérification par l'équipe. */
export const envoyerAvis = (podcastId: string, v: AvisSaisie, website = "") =>
  appeler({ podcast_id: podcastId, nom: v.nom.trim(), email: v.email.trim(), note: v.note, commentaire: v.commentaire.trim(), website });

/** Signale un avis à l'équipe, avec un motif pris dans la liste fermée. */
export const signalerAvis = (avisId: string, motif: string) => appeler({ action: "signaler", avis_id: avisId, motif });

/** Avis publiés d'une fiche, du plus récent au plus ancien. */
export const useAvis = (podcastId?: string) =>
  useQuery({
    queryKey: ["avis", podcastId],
    enabled: !!podcastId,
    queryFn: async (): Promise<Avis[]> => {
      const { data, error } = await supabase
        .from("avis")
        .select("id, nom, note, commentaire, created_at, membre")
        .eq("podcast_id", podcastId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Avis[];
    },
  });

/** Moyenne sur 5, arrondie au dixième, et nombre d'avis. */
export const resumeAvis = (avis: Avis[]): { moyenne: number; nb: number } => {
  const nb = avis.length;
  if (!nb) return { moyenne: 0, nb: 0 };
  const moyenne = avis.reduce((s, a) => s + a.note, 0) / nb;
  return { moyenne: Math.round(moyenne * 10) / 10, nb };
};

/** Rafraîchit la liste des avis d'une fiche après un envoi. */
export const utiliserRafraichissementAvis = () => {
  const client = useQueryClient();
  return (podcastId: string) => client.invalidateQueries({ queryKey: ["avis", podcastId] });
};
