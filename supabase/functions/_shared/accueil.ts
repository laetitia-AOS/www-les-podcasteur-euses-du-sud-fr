// Accueil des nouvelles personnes : règles communes au site et aux e-mails (aucune dépendance).
// Utilisé côté navigateur (src/lib/accueil.ts) et côté serveur (e-mails de bienvenue, relance, invitation).

export const SITE_ACCUEIL = "https://www.les-podcasteur-euses-du-sud.fr";
export const CONTACT_ACCUEIL = "podcastsdusud@gmail.com";
export const INSTAGRAM_PDS = "https://www.instagram.com/les_podcasteur.euses_du_sud/";
export const LINKEDIN_PDS = "https://www.linkedin.com/company/les-podcasteur-euses-du-sud/";

/** Départements proposés (liste fermée, la base refuse toute autre valeur). */
export const DEPARTEMENTS_ACCUEIL = [
  { code: "04", label: "04 — Alpes-de-Haute-Provence" },
  { code: "05", label: "05 — Hautes-Alpes" },
  { code: "06", label: "06 — Alpes-Maritimes" },
  { code: "13", label: "13 — Bouches-du-Rhône" },
  { code: "83", label: "83 — Var" },
  { code: "84", label: "84 — Vaucluse" },
  { code: "2A", label: "2A — Corse-du-Sud" },
  { code: "2B", label: "2B — Haute-Corse" },
  { code: "MC", label: "Monaco" },
  { code: "autre", label: "Autre département" },
] as const;

export const CODES_ACCUEIL: string[] = DEPARTEMENTS_ACCUEIL.map((d) => d.code);
export const departementValide = (c: unknown): c is string => typeof c === "string" && CODES_ACCUEIL.includes(c);
export const libelleDepartement = (c?: string | null) => DEPARTEMENTS_ACCUEIL.find((d) => d.code === c)?.label ?? "";

/** Seuls les liens d'invitation WhatsApp sont acceptés (même règle que la base). */
export const estLienWhatsapp = (url: unknown): boolean =>
  typeof url === "string" && /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}$/.test(url.trim().replace(/[?#].*$/, ""));

export type GroupeWhatsapp = { nom: string; lien: string; departements?: string[]; par_defaut?: boolean };

/** Groupe d'un département ; département inconnu ou non couvert : le groupe par défaut. */
export const groupePour = <G extends GroupeWhatsapp>(dep: string | null | undefined, groupes: G[]): G | null =>
  (dep ? groupes.find((g) => (g.departements || []).includes(dep)) : undefined) ?? groupes.find((g) => g.par_defaut) ?? null;

/** « 06 ou Monaco → 06 podcasts ; ailleurs → Les Podcasteur·euses du Sud » (calculé d'après les groupes réglés). */
export const regleGroupes = (groupes: GroupeWhatsapp[]): string => {
  const noms = (deps: string[]) => deps.map((d) => (d === "MC" ? "Monaco" : d === "autre" ? "autre département" : d));
  const parties = groupes.filter((g) => !g.par_defaut && (g.departements || []).length)
    .map((g) => `${noms(g.departements || []).join(" ou ")} → ${g.nom}`);
  const defaut = groupes.find((g) => g.par_defaut);
  if (defaut) parties.push(`${parties.length ? "ailleurs" : "partout"} → ${defaut.nom}`);
  return parties.join(" ; ");
};

/** Phrase sobre sur la cotisation (sous le bouton de paiement et dans l'e-mail de bienvenue) : un soutien, pas un achat. */
export const PHRASE_SOUTIEN =
  "Ta cotisation soutient le projet associatif des Podcasteur·euses du Sud. Les outils mis à disposition des membres (site, annuaire, lettre…) le sont sans engagement de durée ; ton adhésion reste valable quoi qu'il arrive.";

export const ATELIERS_RYTHME =
  "un atelier d'écoute le 9 de chaque mois, de 18h30 à 21h30 (le 6 quand le 9 tombe un week-end), ouvert à toutes et tous";

export const ETAPES_PARTICIPER = [
  "Complète ta fiche",
  "Rejoins le groupe WhatsApp de ton département",
  "Présente-toi dans le groupe",
  "Viens au prochain atelier d'écoute",
] as const;

// Libellés « Je cherche / J'apporte » (mêmes codes que COLLAB_CHOIX, src/lib/inscription.ts)
const COLLAB: Record<string, string> = {
  voix_off: "Voix off", montage: "Montage", mixage: "Mixage", strategie: "Stratégie",
  coproduction: "Co-production d'un format", etre_invite: "Être invité·e", recevoir_invites: "Recevoir des invité·es",
  sponsors: "Sponsors et partenaires", evenements: "Organisation d'événements", formation: "Formation", studio: "Studio", autre: "Autre",
};
const APPORTE: Record<string, string> = { etre_invite: "Intervenir comme invité·e" };
export const LIBELLES_COLLAB_ACCUEIL = COLLAB;

const liste = (codes: string[] | null | undefined, precision: string | null | undefined, cote: "cherche" | "apporte") => {
  const l = (codes || []).filter((c) => c !== "autre")
    .map((c) => (cote === "apporte" ? APPORTE[c] ?? COLLAB[c] : COLLAB[c]) ?? "")
    .filter(Boolean).map((s, i) => (i === 0 ? s : s.charAt(0).toLowerCase() + s.slice(1)));
  const p = (precision || "").trim();
  if (p) l.push(p);
  return l.join(", ");
};

export type FichePresentation = {
  prenom?: string | null;
  type_profil?: string | null;
  metier_principal?: string | null;
  city_name?: string | null;
  ville?: string | null;
  nom_podcast?: string | null;
  lien_ecoute?: string | null;
  cherche_choix?: string[] | null;
  apporte_choix?: string[] | null;
  cherche_precision?: string | null;
  apporte_precision?: string | null;
};

const SANS_PODCAST = /^https?:\/\/(www\.)?les-podcasteur-euses-du-sud\.fr\/?$/i;
const vraiPodcast = (f: FichePresentation) =>
  f.type_profil === "podcasteur" && !!(f.nom_podcast || "").trim() && !/^[—–\-.\s]+$/.test(f.nom_podcast || "");

const majuscule = (s: string) =>
  s.trim().toLocaleLowerCase("fr-FR").replace(/(^|[\s\-'’])(\p{L})/gu, (_m, sep: string, l: string) => sep + l.toLocaleUpperCase("fr-FR"));

/**
 * Message de présentation prêt à copier dans le groupe, rempli avec ce qu'on sait de la personne ;
 * ce qu'on ne sait pas reste entre crochets, à compléter.
 */
export const messagePresentation = (fiches: FichePresentation[], prenomSecours?: string | null): string => {
  const profil = fiches.find((f) => f.type_profil !== "podcasteur") || fiches[0] || {};
  const podcast = fiches.find(vraiPodcast);
  const prenomBrut = (fiches.find((f) => (f.prenom || "").trim())?.prenom || prenomSecours || "").trim().split(/\s+/)[0] || "";
  const prenom = prenomBrut ? majuscule(prenomBrut) : "[Prénom]";
  const metier = (profil.metier_principal || "").trim();
  const quoi = metier ? metier.charAt(0).toLowerCase() + metier.slice(1) : podcast ? "je fais un podcast" : "[ce que je fais]";
  const villeBrute = (fiches.find((f) => (f.city_name || f.ville || "").trim()) || {}) as FichePresentation;
  const ville = (villeBrute.city_name || villeBrute.ville || "").trim() || "[ville]";
  const lien = podcast && /^https:\/\//i.test(podcast.lien_ecoute || "") && !SANS_PODCAST.test(podcast.lien_ecoute || "") ? podcast.lien_ecoute : "";
  const projet = podcast ? `${podcast.nom_podcast!.trim()}${lien ? ` (${lien})` : ""}` : "[nom du podcast + lien]";
  const source = fiches.find((f) => (f.cherche_choix || []).length || (f.apporte_choix || []).length || f.cherche_precision || f.apporte_precision) || profil;
  const cherche = liste(source.cherche_choix, source.cherche_precision, "cherche") || "[…]";
  const apporte = liste(source.apporte_choix, source.apporte_precision, "apporte") || "[…]";
  return `Bonjour à toutes et à tous ! Je suis ${prenom}, ${quoi} à ${ville}. Mon projet : ${projet}. Je cherche : ${cherche}. Je peux apporter : ${apporte}. Ravi·e de vous rejoindre !`;
};

/** Prochain atelier : « mercredi 9 décembre, 18h30 » (heure de Paris). */
export const dateAtelier = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const jour = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", "h");
  return `${jour}, ${heure}`;
};

/** Rangées d'un QR code en plages de même couleur (pour l'e-mail : un tableau, sans image). */
export const plagesQr = (m: boolean[][]): { noir: boolean; n: number }[][] =>
  m.map((rangee) => {
    const out: { noir: boolean; n: number }[] = [];
    for (const v of rangee) {
      const last = out[out.length - 1];
      if (last && last.noir === v) last.n++;
      else out.push({ noir: v, n: 1 });
    }
    return out;
  });
