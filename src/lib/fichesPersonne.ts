// Fiches d'une même personne (profil, podcasts, studio ou structure) : la même adresse e-mail les relie.
type FicheMinimale = { id: string; email: string | null };

const norm = (e: string | null | undefined) => (e || "").trim().toLowerCase();

/**
 * Retirer une fiche de l'annuaire retire aussi toutes les autres fiches de la même personne,
 * pour qu'aucun podcast ni studio ne reste visible seul. Activer une fiche reste fiche par fiche.
 */
export const fichesARetirer = <T extends FicheMinimale>(toutes: T[], fiche: T): string[] => {
  const e = norm(fiche.email);
  if (!e) return [fiche.id];
  return [fiche.id, ...toutes.filter((f) => f.id !== fiche.id && norm(f.email) === e).map((f) => f.id)];
};
