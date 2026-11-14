// L'Onde du Sud : pied fixe de chaque numéro (page, aperçu, PDF et e-mail), lien de don, liens courts du PDF
// et état d'abonnement de la personne qui lit (membre, membre désinscrit·e, abonné·e).
// Le pied de l'e-mail reprend les mêmes textes : supabase/functions/_shared/onde-email.ts (vérifié par un test).
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/seo";

/** Boutons du pied fixe. */
export const PIED_ABONNEMENT = "Recevoir L'Onde chaque mois";
export const PIED_ADHERER = "Adhérer";
export const PIED_DON = "Soutenir L'Onde par un don";
export const TITRE_ADHESION_OUVRE = "Ce que l'adhésion t'ouvre";
/** Ce que l'adhésion ouvre, dit au « tu » (même liste dans l'e-mail). */
export const ADHESION_OUVRE: readonly string[] = [
  "Ta fiche visible dans l'annuaire et ton podcast dans « Écouter »",
  "Tes épisodes dans le lecteur du site",
  "Les messages des autres membres et « Je cherche / J'apporte »",
  "Proposer des événements à l'agenda",
  "Déposer tes sons pour L'Onde du Sud",
  "Partager des ressources avec le réseau dans L'Onde du Sud (sans autopromotion commerciale)",
];

// ——— Lien de don (réglage unique, modifiable par les admins et éditeur·ices) ———

/** Même règle que la base (onde_regler_lien_don) : adresse complète en https. */
export const lienDonValide = (l: string) =>
  l.length <= 500 && /^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]{1,5})?([/?#][^\s<>"'`\\]*)?$/i.test(l);

export const useLienDon = () =>
  useQuery({
    queryKey: ["onde-lien-don"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.rpc("onde_lien_don");
      if (error) throw error;
      const l = typeof data === "string" ? data.trim() : "";
      return l && lienDonValide(l) ? l : null;
    },
  });

export const reglerLienDon = async (lien: string) => {
  const { data, error } = await supabase.rpc("onde_regler_lien_don", { _lien: lien.trim() });
  if (error) throw error;
  return (data as string | null) ?? null;
};

// ——— Liens courts du PDF : www.les-podcasteur-euses-du-sud.fr/o/1/02 ———

/** Ancre d'un bloc sur la page du numéro : #b02. La version audio du numéro : #ecouter. */
export const ancreBloc = (rubrique: string) => `b${rubrique}`;
export const ANCRE_ECOUTER = "ecouter";
/** Lien court vers un son du numéro (bloc « 02 »), ou vers la version audio du numéro (sans bloc). */
export const lienCourt = (numero: number, rubrique?: string) => `${SITE_URL}/o/${numero}${rubrique ? `/${rubrique}` : ""}`;
/** Adresse imprimée, sans « https:// ». */
export const adresseImprimee = (url: string) => url.replace(/^https?:\/\//, "");
/** Lien court → adresse de la page du numéro et ancre (null si le lien n'a pas la bonne forme). */
export const cibleLienCourt = (numero?: string, bloc?: string): { numero: number; ancre: string } | null => {
  if (!numero || !/^\d{1,4}$/.test(numero)) return null;
  if (bloc !== undefined && !/^\d{2}$/.test(bloc)) return null;
  return { numero: Number(numero), ancre: bloc ? ancreBloc(bloc) : ANCRE_ECOUTER };
};

// ——— Qui lit : membre, membre désinscrit·e, abonné·e, ou personne de connu ———

/**
 * membre : adhérent·e à jour connecté·e, qui reçoit L'Onde d'office ;
 * membre_desinscrit : adhérent·e à jour connecté·e qui s'est désinscrit·e ;
 * abonne : abonné·e actif·ve (connecté·e, ou abonnement confirmé depuis cet appareil) ; aucun : le reste.
 */
export type EtatLecteur = "membre" | "membre_desinscrit" | "abonne" | "aucun";

const CLE_APPAREIL = "onde-abonne";
/** Retenu sur l'appareil après une confirmation ou une réinscription, oublié après une désinscription. Rien d'autre n'est gardé. */
export const retenirAbonnement = (actif: boolean) => {
  try {
    if (actif) localStorage.setItem(CLE_APPAREIL, "1");
    else localStorage.removeItem(CLE_APPAREIL);
  } catch { /* stockage indisponible : rien à retenir */ }
};
const abonneSurCetAppareil = () => {
  try { return localStorage.getItem(CLE_APPAREIL) === "1"; } catch { return false; }
};

/** Traduit la réponse de mon_abonnement_onde (testé dans ondePied.test.ts). */
export const etatLecteur = (r: { membre?: boolean; statut?: string | null } | null, appareil: boolean): EtatLecteur => {
  if (!r) return appareil ? "abonne" : "aucun";
  if (r.membre) return r.statut === "desinscrit" ? "membre_desinscrit" : "membre";
  if (r.statut === "actif") return "abonne";
  return "aucun";
};

export const useEtatLecteur = () => {
  const qc = useQueryClient();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "SIGNED_IN" || evt === "SIGNED_OUT") qc.invalidateQueries({ queryKey: ["onde-membre"] });
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return useQuery({
    queryKey: ["onde-membre"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<EtatLecteur> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return etatLecteur(null, abonneSurCetAppareil());
      const { data, error } = await supabase.rpc("mon_abonnement_onde");
      if (error) return "aucun";
      return etatLecteur(data as { membre?: boolean; statut?: string | null }, false);
    },
  });
};

/** « Me réabonner » : adhérent·e à jour connecté·e (adresse lue dans la session par le serveur). */
export const reabonnerMembre = async () => {
  const { error } = await supabase.rpc("onde_me_reabonner");
  if (error) throw error;
};
