// L'Onde du Sud, lot 5 : les dépôts des membres (un son, une écoute, un projet, des coulisses, un appel).
// Écriture par la fonction serveur « onde-depot » (adhérent·es à jour, fichiers vérifiés) ; lectures par des fonctions
// de la base limitées à l'adresse connectée (mes_depots_onde) ou à l'équipe de L'Onde (onde_depots_equipe).
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fullName } from "@/lib/pds";
import { ficheHref } from "@/lib/seo";
import { IMAGE_MAX_OCTETS, AUDIO_MAX_OCTETS, IMAGE_TYPES, moisAnnee, ondeHref, redimensionnerImage } from "@/lib/onde";

/** Page « Déposer pour L'Onde » : espace membre pour un·e adhérent·e à jour, page d'adhésion sinon. */
export const ONDE_DEPOSER = "/onde/deposer";
/** Section de l'espace membre. */
export const ANCRE_DEPOT = "onde";

export type TypeDepot = "son" | "ecoute" | "projet" | "coulisses" | "appel";
export type StatutDepot = "nouveau" | "retenu" | "plus_tard" | "pas_retenu";

/** Ce que l'on dépose, avec l'étiquette de rubrique proposée dans le numéro (même liste que la base : onde_etiquette_depot). */
export const TYPES_DEPOT: ReadonlyArray<{ id: TypeDepot; label: string; court: string; etiquette: string }> = [
  { id: "son", label: "Un son ou un extrait", court: "Son ou extrait", etiquette: "À l'écoute" },
  { id: "ecoute", label: "Une écoute que je recommande", court: "Écoute recommandée", etiquette: "Une écoute recommandée" },
  { id: "projet", label: "Un projet en cours", court: "Projet en cours", etiquette: "En fabrication" },
  { id: "coulisses", label: "Les coulisses d'une fabrication (une prise de son, un micro, un montage, un silence)", court: "Coulisses", etiquette: "Les coulisses" },
  { id: "appel", label: "Un appel ou un événement", court: "Appel ou événement", etiquette: "Dans notre agenda" },
];
export const libelleTypeDepot = (t: string) => TYPES_DEPOT.find((x) => x.id === t)?.court ?? t;
export const etiquetteDepot = (t: string) => TYPES_DEPOT.find((x) => x.id === t)?.etiquette ?? "Déposé par un·e membre";

export const STATUTS_DEPOT: ReadonlyArray<{ id: StatutDepot; label: string; membre: string }> = [
  { id: "nouveau", label: "Nouveau", membre: "Reçu" },
  { id: "retenu", label: "Retenu", membre: "Retenu" },
  { id: "plus_tard", label: "Gardé pour plus tard", membre: "Gardé pour plus tard" },
  { id: "pas_retenu", label: "Pas retenu", membre: "Pas retenu" },
];
export const libelleStatutDepot = (s: string) => STATUTS_DEPOT.find((x) => x.id === s)?.label ?? s;

export const LIMITES_DEPOT = { titre: 120, texte: 500, parMois: 10 } as const;

/** Cases obligatoires, non cochées par défaut (même texte enregistré avec la date par le serveur). */
export const CASE_DROITS = "Je suis l'auteur·ice de ce son ou j'ai les droits pour le diffuser";
export const CASE_ACCORD = "J'accepte que ce dépôt soit publié dans L'Onde du Sud, avec mon nom et un lien vers ma page";

/** « Ce mois-ci, 3 dépôts. » (même phrase dans l'e-mail : supabase/functions/_shared/onde-email.ts) */
export const phraseDepots = (n: number) =>
  n <= 0 ? "Ce mois-ci, pas encore de dépôt." : `Ce mois-ci, ${n} dépôt${n > 1 ? "s" : ""}.`;
export const texteEncartDepot = (n: number) =>
  `L'Onde du Sud est faite avec les sons de ses membres. ${phraseDepots(n)} Dépose le tien avant le 25 pour le prochain numéro.`;
/** Compteur de l'admin de L'Onde. */
export const compteurAdminDepots = (n: number) =>
  n <= 0 ? "Pas encore de nouveau dépôt ce mois-ci" : `${n} nouveau${n > 1 ? "x" : ""} dépôt${n > 1 ? "s" : ""} ce mois-ci`;

export type MonDepot = {
  id: string;
  type: TypeDepot;
  titre: string;
  texte: string;
  audio_url: string | null;
  lien_ecoute: string | null;
  photo_url: string | null;
  statut: StatutDepot;
  created_at: string;
  updated_at: string;
  publie_mois: string | null;
  publie_slug: string | null;
};

/** Statut vu par le membre : « Publié dans L'Onde de novembre 2026 » une fois le numéro en ligne. */
export const statutMembre = (d: Pick<MonDepot, "statut" | "publie_mois">) =>
  d.publie_mois ? `Publié dans L'Onde de ${moisAnnee(d.publie_mois)}` : STATUTS_DEPOT.find((x) => x.id === d.statut)?.membre ?? d.statut;
export const lienPublication = (d: Pick<MonDepot, "publie_slug">) => (d.publie_slug ? ondeHref(d.publie_slug) : null);

export type DepotEquipe = Omit<MonDepot, "publie_mois" | "publie_slug"> & {
  prenom: string | null;
  nom: string | null;
  fiche_id: string | null;
  fiche_slug: string | null;
  fiche_type: string | null;
  fiche_nom_podcast: string | null;
  fiche_visible: boolean;
  numero_id: string | null;
  numero: number | null;
  numero_mois: string | null;
  numero_statut: "brouillon" | "publie" | null;
  publie: boolean;
};

export type CreditDepot = { depot_id: string; prenom: string | null; nom: string | null; fiche_id: string | null; slug: string | null; type_profil: string | null; nom_podcast: string | null };
/** « Déposé par » : nom et lien vers la page (seulement si la fiche est visible sur le site). */
export const creditDepot = (c?: CreditDepot | null): { nom: string; href: string | null } | null => {
  if (!c) return null;
  const nom = fullName(c.prenom, c.nom);
  if (!nom) return null;
  return { nom, href: c.fiche_id ? ficheHref({ id: c.fiche_id, slug: c.slug, type_profil: c.type_profil, nom_podcast: c.nom_podcast }) : null };
};

// ——— Chargements ———

export const useDepotsCeMois = () =>
  useQuery({
    queryKey: ["onde-depots-ce-mois"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("onde_depots_ce_mois");
      if (error) throw error;
      return (data as number | null) ?? 0;
    },
  });

/** « Déposé par » des blocs d'un numéro (publié : tout le monde ; brouillon : l'équipe seulement). */
export const useCreditsDepots = (numeroId: string | undefined, actif: boolean) =>
  useQuery({
    queryKey: ["onde-credits-depots", numeroId],
    enabled: !!numeroId && actif,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("onde_credits_depots", { _numero_id: numeroId! });
      if (error) throw error;
      const t: Record<string, CreditDepot> = {};
      ((data || []) as CreditDepot[]).forEach((c) => { t[c.depot_id] = c; });
      return t;
    },
  });

// ——— Envoi au serveur ———

export type ChampsDepot = {
  depotId?: string;
  type: TypeDepot | "";
  titre: string;
  texte: string;
  son: "fichier" | "lien";
  audio: File | null;
  lien: string;
  photo: File | null;
  retirerPhoto: boolean;
  droits: boolean;
  accord: boolean;
  /** Le dépôt modifié a déjà un MP3 (rien à renvoyer s'il n'est pas remplacé). */
  aDejaUnMp3?: boolean;
};

/** Ce qui manque avant l'envoi (le serveur vérifie aussi, et refuse de la même façon). */
export const erreursDepot = (c: ChampsDepot): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!c.type) e.type = "Choisissez ce que vous déposez.";
  if (!c.titre.trim()) e.titre = "Donnez un titre.";
  else if (c.titre.trim().length > LIMITES_DEPOT.titre) e.titre = `${LIMITES_DEPOT.titre} caractères au maximum.`;
  if (!c.texte.trim()) e.texte = "Écrivez quelques lignes.";
  else if (c.texte.trim().length > LIMITES_DEPOT.texte) e.texte = `${LIMITES_DEPOT.texte} caractères au maximum.`;
  if (c.son === "fichier") {
    if (!c.audio && !c.aDejaUnMp3) e.son = "Ajoutez le fichier MP3, ou choisissez « Un lien d'écoute ».";
    else if (c.audio && c.audio.type && c.audio.type !== "audio/mpeg" && c.audio.type !== "audio/mp3") e.son = "Fichier au format MP3 seulement.";
    else if (c.audio && c.audio.size > AUDIO_MAX_OCTETS) e.son = "Fichier MP3 trop lourd : 20 Mo au maximum.";
  } else if (!/^https?:\/\/[^\s<>"]+$/i.test(c.lien.trim())) e.son = "Collez un lien d'écoute qui commence par https://";
  if (c.photo && !IMAGE_TYPES.includes(c.photo.type)) e.photo = "Photo au format JPG, PNG ou WebP.";
  if (!c.droits) e.droits = "Cochez cette case pour déposer.";
  if (!c.accord) e.accord = "Cochez cette case pour déposer.";
  return e;
};

const appel = async (corps: FormData | string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Votre session a expiré : reconnectez-vous.");
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onde-depot`, {
    method: "POST",
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      ...(typeof corps === "string" ? { "Content-Type": "application/json" } : {}),
    },
    body: corps,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || !json.ok) throw new Error(json.error || "Le dépôt n'a pas pu être enregistré. Réessayez.");
  return json as { ok: true; id?: string };
};

export const envoyerDepot = async (c: ChampsDepot) => {
  const f = new FormData();
  if (c.depotId) f.append("depot_id", c.depotId);
  f.append("type", c.type);
  f.append("titre", c.titre.trim());
  f.append("texte", c.texte.trim());
  f.append("son", c.son);
  if (c.son === "fichier" && c.audio) f.append("audio", c.audio, "son.mp3");
  if (c.son === "lien") f.append("lien", c.lien.trim());
  if (c.photo) {
    const reduite = await redimensionnerImage(c.photo).catch(() => { throw new Error("Cette photo n'a pas pu être lue."); });
    if (reduite.size > IMAGE_MAX_OCTETS) throw new Error("Photo trop lourde, même réduite : 3 Mo au maximum.");
    f.append("photo", reduite, "photo.jpg");
  } else if (c.retirerPhoto) f.append("retirer_photo", "1");
  if (c.droits) f.append("droits", "1");
  if (c.accord) f.append("accord", "1");
  return appel(f);
};

export const retirerDepot = (depotId: string) => appel(JSON.stringify({ action: "retirer", depot_id: depotId }));
