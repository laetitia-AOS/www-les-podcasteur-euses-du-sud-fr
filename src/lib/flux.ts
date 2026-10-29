/** État de lecture d'un flux, tel que renvoyé par `mes_flux` (limité au membre connecté). */
export type EtatFlux = {
  podcast_id: string;
  statut: string;
  message: string | null;
  nb_episodes: number;
  derniere_lecture: string;
  source: string | null;
  confirmation: string;
};

export type MessageFlux = { ton: "ok" | "attente" | "alerte"; titre: string; texte: string };

const episodes = (n: number) => `${n} épisode${n > 1 ? "s" : ""}`;

/**
 * Message affiché dans « Mes podcasts » selon l'état du flux :
 * flux saisi par le membre (confirmé d'office), flux trouvé automatiquement (à confirmer par l'équipe), ou aucun flux.
 */
export const messageFlux = (etat: EtatFlux | undefined, fluxSaisi: string | null | undefined): MessageFlux => {
  const saisi = !!fluxSaisi?.trim();
  const lu = etat?.source === "flux saisi";

  if (saisi && !lu) {
    return { ton: "attente", titre: "Flux enregistré", texte: "Il sera lu à la prochaine mise à jour (toutes les 6 heures). Vos épisodes s'afficheront ensuite sur votre fiche." };
  }
  if (saisi && etat) {
    return etat.statut === "ok"
      ? { ton: "ok", titre: "Flux saisi", texte: `Flux lu : ${episodes(etat.nb_episodes)} affiché${etat.nb_episodes > 1 ? "s" : ""} sur votre fiche.` }
      : { ton: "alerte", titre: "Flux saisi", texte: etat.message || "Votre flux n'a pas pu être lu." };
  }
  if (!etat || etat.statut === "introuvable" || !etat.source) {
    return { ton: "alerte", titre: "Aucun flux", texte: "Aucun flux RSS n'est relié à ce podcast. Ajoutez le lien du flux ci-dessus pour afficher vos épisodes sur le site." };
  }
  if (etat.confirmation === "refuse") {
    return { ton: "alerte", titre: "Flux trouvé automatiquement, écarté", texte: "Le flux trouvé ne correspond pas à votre podcast. Ajoutez le lien de votre flux ci-dessus." };
  }
  if (etat.confirmation === "confirme") {
    return etat.statut === "ok"
      ? { ton: "ok", titre: "Flux trouvé automatiquement, confirmé", texte: `L'équipe a confirmé ce flux : ${episodes(etat.nb_episodes)} affiché${etat.nb_episodes > 1 ? "s" : ""} sur votre fiche.` }
      : { ton: "alerte", titre: "Flux trouvé automatiquement, confirmé", texte: etat.message || "Le flux n'a pas pu être lu." };
  }
  return {
    ton: "attente",
    titre: "Flux trouvé automatiquement, à confirmer",
    texte: "Nous avons trouvé un flux à partir de votre lien d'écoute. Ses épisodes s'afficheront sur le site après vérification par l'équipe. Pour aller plus vite, ajoutez vous-même le lien de votre flux ci-dessus.",
  };
};
