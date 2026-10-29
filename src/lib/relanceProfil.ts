// Fiches à compléter : ce qui manque à chaque personne, pour la relance individuelle de l'admin.
export type ProfilACompleter = {
  email: string; nom: string | null; type_profil: string | null; fiche_validee: boolean;
  sans_photo: boolean; podcasts_sans_pochette: string[]; podcasts_sans_rss: string[]; sans_collab: boolean;
  derniere_relance: string | null; nb_relances: number;
};

export const MANQUES = [
  { code: "photo", label: "Photo de profil" },
  { code: "pochette", label: "Pochette du podcast" },
  { code: "rss", label: "Flux d'épisodes (RSS)" },
  { code: "collab", label: "Je cherche / J'apporte" },
] as const;
export type CodeManque = (typeof MANQUES)[number]["code"];

/** Cases cochées d'office : ce qui manque vraiment sur la fiche. */
export const manquesDetectes = (p: ProfilACompleter): CodeManque[] => {
  const m: CodeManque[] = [];
  if (p.sans_photo) m.push("photo");
  if ((p.podcasts_sans_pochette || []).length) m.push("pochette");
  if ((p.podcasts_sans_rss || []).length) m.push("rss");
  if (p.sans_collab) m.push("collab");
  return m;
};

/** Une relance de moins de 24 h bloque une nouvelle relance (le serveur applique la même règle). */
export const relanceRecente = (p: ProfilACompleter, maintenant = Date.now()) =>
  !!p.derniere_relance && maintenant - new Date(p.derniere_relance).getTime() < 24 * 3600_000;
