// Abonnement compact à L'Onde du Sud (pied de page des pages publiques, section de l'accueil).
// Même formulaire et mêmes règles que /onde ; un·e adhérent·e à jour connecté·e voit un message à la place
// (« Tu reçois déjà… », ou « Tu ne reçois plus… » + « Me réabonner » après une désinscription).
import { FormulaireOnde, MessageMembreOnde } from "@/components/onde/InscriptionOnde";
import { useEtatLecteur } from "@/lib/ondePied";

const AbonnementOnde = () => {
  const { data: lecteur } = useEtatLecteur();
  return lecteur === "membre" || lecteur === "membre_desinscrit" ? <MessageMembreOnde etat={lecteur} /> : <FormulaireOnde ligne />;
};

export default AbonnementOnde;
