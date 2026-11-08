import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { compterVisite } from "@/lib/stats";

/** Compte chaque page publique ouverte, pour le rapport de la semaine (aucun cookie, rien d'affiché). */
const SuiviVisites = () => {
  const { pathname } = useLocation();
  useEffect(() => { compterVisite(pathname); }, [pathname]);
  return null;
};

export default SuiviVisites;
