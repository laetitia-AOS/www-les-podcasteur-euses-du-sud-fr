// Abonnement compact à L'Onde du Sud (pied de page des pages publiques, section de l'accueil).
// Même formulaire et mêmes règles que /onde ; un·e adhérent·e à jour connecté·e voit un message à la place.
import { FormulaireOnde, DejaMembreOnde } from "@/components/onde/InscriptionOnde";
import { useMembreOnde } from "@/lib/onde";

const AbonnementOnde = () => {
  const { data: membre } = useMembreOnde();
  return membre ? <DejaMembreOnde /> : <FormulaireOnde ligne />;
};

export default AbonnementOnde;
