// « Ce qu'on écoutera ensemble » : podcasts invités d'un événement, relus dans l'agenda à chaque affichage.
// Module sans dépendance : utilisé par le site (bloc « À l'agenda » de L'Onde, page, aperçu, PDF) et par l'e-mail (Deno).
// Le lien va vers la fiche de l'annuaire quand le podcast (ou son créateur·ice) y a une fiche visible.

export type InviteBrut = { nom_podcast?: string | null; host?: string | null; vignette_url?: string | null; lien_ecoute?: string | null };
/** Fiche visible de l'annuaire (la lecture publique ne renvoie que celles-là). */
export type FicheInvite = {
  id: string;
  slug?: string | null;
  nom_podcast?: string | null;
  prenom?: string | null;
  nom?: string | null;
  type_profil?: string | null;
  vignette_url?: string | null;
  photo_profil_url?: string | null;
};
export type InviteAffiche = {
  /** 1, 2, 3… */
  rang: number;
  podcast: string;
  /** Nom saisi dans l'agenda (à mettre en forme par l'appelant), sinon celui de la fiche. */
  createur: string;
  vignette: string | null;
  fiche: FicheInvite | null;
  /** Lien d'écoute saisi dans l'agenda (https), utilisé seulement sans fiche. */
  lienEcoute: string | null;
};

export const MAX_INVITES = 8;

const norm = (s?: string | null) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const vide = (s?: string | null) => !s || /^[—–\-.\s]*$/.test(s);
const https = (u?: string | null) => (u && /^https:\/\/[^\s<>"']+$/i.test(u.trim()) ? u.trim() : null);

/** Lit le champ « Podcasts invités » de l'agenda (JSON libre) et ne garde que les lignes remplies. */
export const lireInvites = (v: unknown): InviteBrut[] =>
  (Array.isArray(v) ? v : [])
    .filter((x): x is InviteBrut => !!x && typeof x === "object")
    .filter((x) => !vide(x.nom_podcast) || !vide(x.host))
    .slice(0, MAX_INVITES);

/** Podcasts invités numérotés, avec vignette et fiche de l'annuaire quand elle existe. */
export const invitesEvenement = (v: unknown, fiches: FicheInvite[] = []): InviteAffiche[] =>
  lireInvites(v).map((p, i) => {
    const nomP = norm(p.nom_podcast);
    const nomH = norm(p.host);
    const parPodcast = nomP ? fiches.find((f) => f.type_profil === "podcasteur" && !vide(f.nom_podcast) && norm(f.nom_podcast) === nomP) : undefined;
    const parHote = nomH ? fiches.find((f) => norm(`${f.prenom || ""} ${f.nom || ""}`) === nomH) : undefined;
    const fiche = parPodcast || parHote || null;
    const createur = (p.host || "").trim() || (fiche ? `${fiche.prenom || ""} ${fiche.nom || ""}`.trim() : "");
    const vignette = https(p.vignette_url) || https(parPodcast?.vignette_url) || https(parHote?.photo_profil_url) || https(parHote?.vignette_url) || null;
    return {
      rang: i + 1,
      podcast: !vide(p.nom_podcast) ? p.nom_podcast!.trim() : "",
      createur,
      vignette,
      fiche,
      lienEcoute: fiche ? null : https(p.lien_ecoute),
    };
  });
