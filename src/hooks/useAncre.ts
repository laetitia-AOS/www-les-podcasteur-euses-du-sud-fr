import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Descend jusqu'à l'ancre de l'adresse (#recevoir, #b02…) une fois le contenu affiché :
 * le navigateur ne la trouve pas tout seul quand la page se charge après coup.
 */
export const useAncre = (pret: boolean) => {
  const { hash } = useLocation();
  useEffect(() => {
    if (!pret || !hash || hash.length < 2) return;
    const id = decodeURIComponent(hash.slice(1));
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: doux ? "smooth" : "auto", block: "start" });
    }, 150);
    return () => window.clearTimeout(t);
  }, [pret, hash]);
};
