// L'Onde du Sud, la lettre mensuelle des Podcasteur·euses du Sud : types, règles, mise en forme et chargements.
// Les mêmes règles sont appliquées côté serveur (déclencheur guard_onde_numeros) ; ici, elles guident la saisie.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Episode } from "@/lib/episodes";
import { SITE_NAME, SITE_URL, descriptionSeo } from "@/lib/seo";

export const NOM_ONDE = "L'Onde du Sud";
/** Nom complet de la lettre (H1 des archives, données structurées). */
export const NOM_COMPLET_ONDE = "L'Onde du Sud, la lettre des Podcasteur·euses du Sud";

export type ImageOnde = { url: string; alt?: string };
export type Chiffre = { valeur: string; libelle: string };

type Base = { id: string; rubrique?: string };
export type BlocTexte = Base & { type: "texte"; titre?: string; texte?: string };
export type BlocImages = Base & { type: "images"; images: ImageOnde[] };
export type BlocAudio = Base & { type: "audio"; url?: string; titre?: string; podcast?: string; createur?: string; lien?: string };
export type BlocBouton = Base & { type: "bouton"; libelle?: string; lien?: string };
export type BlocChiffres = Base & { type: "chiffres"; chiffres: Chiffre[] };
/** Événements cochés dans l'agenda : seuls les identifiants sont gardés, le reste est relu à chaque affichage. */
export type BlocEvenements = Base & { type: "evenements"; evenements: string[] };
/** Un podcast de l'annuaire (relu à chaque affichage), la présentation de l'éditeur·ice et un extrait facultatif. */
export type BlocPodcast = Base & { type: "podcast"; podcast_id?: string; texte?: string; url?: string; titre?: string };
/** Rempli par la base : « membres » est la liste arrêtée à la publication (jamais écrite par le navigateur). */
export type BlocNouveauxMembres = Base & { type: "nouveaux_membres"; mois?: string; membres?: string[] };
export type BlocTrimestre = Base & { type: "trimestre"; titre?: string; texte?: string; chiffres: Chiffre[] };
export type Bloc =
  | BlocTexte | BlocImages | BlocAudio | BlocBouton | BlocChiffres
  | BlocEvenements | BlocPodcast | BlocNouveauxMembres | BlocTrimestre;
export type TypeBloc = Bloc["type"];

export type NumeroOnde = {
  id: string;
  numero: number;
  /** Premier jour du mois, « AAAA-MM-01 ». */
  mois: string;
  titre: string;
  chapeau: string;
  slug: string;
  couverture_url: string | null;
  couverture_alt: string | null;
  audio_url: string | null;
  audio_voix: string | null;
  blocs: Bloc[];
  statut: "brouillon" | "publie";
  publie_le: string | null;
  updated_at: string;
  auteur_id?: string | null;
  modifie_par?: string | null;
  created_at?: string;
};

/** Colonnes lisibles par tout le monde (les identifiants des auteur·ices n'en font pas partie). */
export const ONDE_COLUMNS_PUBLIC =
  "id, numero, mois, titre, chapeau, slug, couverture_url, couverture_alt, audio_url, audio_voix, blocs, statut, publie_le, updated_at";
export const ONDE_COLUMNS_EQUIPE = `${ONDE_COLUMNS_PUBLIC}, auteur_id, modifie_par, created_at`;

export const LIMITES_ONDE = {
  titre: 120,
  chapeau: 240,
  alt: 250,
  rubrique: 60,
  titreBloc: 120,
  texte: 5000,
  voix: 80,
  libelleBouton: 60,
  valeur: 20,
  libelleChiffre: 80,
  imagesMax: 6,
  chiffresMin: 2,
  chiffresMax: 4,
  blocsMax: 30,
  evenementsMax: 8,
  presentation: 1500,
  /** Le bloc « Événements de l'agenda » propose d'abord ceux des 60 prochains jours. */
  joursAgenda: 60,
} as const;

export const IMAGE_MAX_OCTETS = 3 * 1024 * 1024;
export const AUDIO_MAX_OCTETS = 20 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const TYPES_BLOCS: ReadonlyArray<{ type: TypeBloc; label: string; aide: string; mention?: string }> = [
  { type: "texte", label: "Texte", aide: "Un titre et un texte, avec gras, italique et liens." },
  { type: "images", label: "Photo ou galerie", aide: "De 1 à 6 photos." },
  { type: "audio", label: "Extrait audio", aide: "Un MP3 qui se lance dans le lecteur du site." },
  { type: "bouton", label: "Bouton", aide: "Un libellé et un lien." },
  { type: "chiffres", label: "Chiffres clés", aide: "De 2 à 4 chiffres, chacun avec son libellé." },
  { type: "evenements", label: "Événements de l'agenda", aide: "Cochez des événements publiés : ils restent à jour tout seuls." },
  { type: "podcast", label: "Podcast à l'écoute", aide: "Un podcast de l'annuaire, votre présentation et un extrait si vous voulez." },
  { type: "nouveaux_membres", label: "Les nouveaux membres du mois", aide: "Rempli tout seul, rien à écrire." },
  { type: "trimestre", label: "Le trimestre du collectif", aide: "Un texte et de 2 à 4 chiffres clés.", mention: "chaque trimestre" },
];

export const libelleType = (t: TypeBloc) => TYPES_BLOCS.find((b) => b.type === t)?.label ?? t;

const nouvelId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `b${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

/** Nouveau bloc. « moisNumero » : mois du numéro, pour proposer le mois précédent aux nouveaux membres. */
export const nouveauBloc = (type: TypeBloc, moisNumero?: string): Bloc => {
  const id = nouvelId();
  switch (type) {
    case "texte": return { id, type, rubrique: "", titre: "", texte: "" };
    case "images": return { id, type, rubrique: "", images: [] };
    case "audio": return { id, type, rubrique: "", url: "", titre: "", podcast: "", createur: "", lien: "" };
    case "bouton": return { id, type, rubrique: "", libelle: "", lien: "" };
    case "chiffres": return { id, type, rubrique: "", chiffres: [{ valeur: "", libelle: "" }, { valeur: "", libelle: "" }] };
    case "evenements": return { id, type, rubrique: "À l'agenda", evenements: [] };
    case "podcast": return { id, type, rubrique: "À l'écoute", podcast_id: "", texte: "", url: "", titre: "" };
    case "nouveaux_membres": return { id, type, rubrique: "Les nouveaux membres du mois", mois: moisPrecedent(moisNumero || moisCourant()) };
    case "trimestre": return { id, type, rubrique: "Le trimestre du collectif", titre: "", texte: "", chiffres: [{ valeur: "", libelle: "" }, { valeur: "", libelle: "" }] };
  }
};

/** Numéro de rubrique affiché au-dessus d'un bloc : 01, 02, 03… */
export const numeroRubrique = (index: number) => String(index + 1).padStart(2, "0");

/** Déplace un élément d'une liste d'un cran (sens -1 : vers le haut, 1 : vers le bas). */
export const deplacer = <T,>(liste: T[], index: number, sens: -1 | 1): T[] => {
  const cible = index + sens;
  if (cible < 0 || cible >= liste.length) return liste;
  const copie = [...liste];
  [copie[index], copie[cible]] = [copie[cible], copie[index]];
  return copie;
};

// ——— Mois et adresses ———

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_ADRESSE = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

const lireMois = (mois: string): { a: number; m: number } | null => {
  const r = /^(\d{4})-(\d{2})/.exec(mois || "");
  if (!r) return null;
  const m = Number(r[2]);
  return m >= 1 && m <= 12 ? { a: Number(r[1]), m } : null;
};

/** « décembre 2026 » */
export const moisAnnee = (mois: string) => {
  const d = lireMois(mois);
  return d ? `${MOIS[d.m - 1]} ${d.a}` : "";
};

/** Adresse d'un numéro, calculée comme le fait le serveur : « n1-decembre-2026 ». */
export const slugOnde = (numero: number, mois: string) => {
  const d = lireMois(mois);
  return d ? `n${numero}-${MOIS_ADRESSE[d.m - 1]}-${d.a}` : "";
};

export const ondeHref = (slug: string) => `/onde/${slug}`;

/** Mois suivant, au format « AAAA-MM-01 ». */
export const moisSuivant = (mois: string) => {
  const d = lireMois(mois);
  if (!d) return moisCourant();
  const m = d.m === 12 ? 1 : d.m + 1;
  const a = d.m === 12 ? d.a + 1 : d.a;
  return `${a}-${String(m).padStart(2, "0")}-01`;
};

/** Mois précédent, au format « AAAA-MM-01 » (décembre 2026 → novembre 2026, janvier → décembre de l'année d'avant). */
export const moisPrecedent = (mois: string) => {
  const d = lireMois(mois);
  if (!d) return moisCourant();
  const m = d.m === 1 ? 12 : d.m - 1;
  const a = d.m === 1 ? d.a - 1 : d.a;
  return `${a}-${String(m).padStart(2, "0")}-01`;
};

export const moisCourant = (maintenant = new Date()) =>
  `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, "0")}-01`;

export const etiquetteNumero = (n: Pick<NumeroOnde, "numero" | "mois">) => `n°${n.numero} · ${moisAnnee(n.mois)}`;

// ——— Référencement ———

const COMPLEMENTS_ONDE = [
  "L'Onde du Sud, la lettre mensuelle des Podcasteur·euses du Sud, à lire et à écouter.",
  "Podcasts, ateliers et vie du réseau à Marseille et en Région Sud.",
];

/** « [Titre] — L'Onde du Sud n°[N], [mois année] | Les Podcasteur·euses du Sud » */
export const titreSeoOnde = (n: Pick<NumeroOnde, "titre" | "numero" | "mois">) =>
  `${n.titre.trim()} — ${NOM_ONDE} n°${n.numero}, ${moisAnnee(n.mois)} | ${SITE_NAME}`;

/** Description tirée du chapeau, complétée puis coupée entre 140 et 160 caractères. */
export const descriptionOnde = (n: Pick<NumeroOnde, "chapeau">) => descriptionSeo([n.chapeau], COMPLEMENTS_ONDE);

export const articleOndeLd = (n: NumeroOnde) => {
  const url = `${SITE_URL}${ondeHref(n.slug)}`;
  const editeur = { "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` } };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: n.titre,
    description: n.chapeau,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: n.publie_le || n.updated_at,
    dateModified: n.updated_at,
    inLanguage: "fr-FR",
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: editeur,
    isPartOf: { "@type": "Periodical", name: NOM_COMPLET_ONDE, url: `${SITE_URL}/onde` },
    ...(n.couverture_url ? { image: [n.couverture_url] } : {}),
    ...(n.audio_url
      ? { audio: { "@type": "AudioObject", contentUrl: n.audio_url, encodingFormat: "audio/mpeg", name: `${NOM_ONDE} n°${n.numero}, version audio` } }
      : {}),
  };
};

// ——— Texte mis en forme : **gras**, *italique*, [lien](https://…) ———

export type Morceau =
  | { t: "texte"; v: string }
  | { t: "gras"; v: string }
  | { t: "italique"; v: string }
  | { t: "lien"; v: string; href: string };

/** Lien accepté : une adresse http(s) ou une page du site (« /agenda »). Tout le reste reste du texte. */
export const lienSur = (href: string) => /^https?:\/\/[^\s<>"]+$/i.test(href) || /^\/(?!\/)[^\s<>"]*$/.test(href);

const MOTIF = /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** Découpe une ligne en morceaux à afficher (jamais de HTML : React affiche du texte). */
export const decouperLigne = (ligne: string): Morceau[] => {
  const out: Morceau[] = [];
  let dernier = 0;
  for (const m of ligne.matchAll(MOTIF)) {
    const i = m.index ?? 0;
    if (i > dernier) out.push({ t: "texte", v: ligne.slice(dernier, i) });
    if (m[1] !== undefined) out.push({ t: "gras", v: m[1] });
    else if (m[2] !== undefined) out.push({ t: "italique", v: m[2] });
    else if (lienSur(m[4])) out.push({ t: "lien", v: m[3], href: m[4] });
    else out.push({ t: "texte", v: m[3] });
    dernier = i + m[0].length;
  }
  if (dernier < ligne.length) out.push({ t: "texte", v: ligne.slice(dernier) });
  return out;
};

/** Paragraphes séparés par une ligne vide ; chaque paragraphe garde ses retours à la ligne. */
export const paragraphes = (texte: string): string[][] =>
  (texte || "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.split("\n"));

// ——— Avant publication : ce qui manque (le serveur refuse aussi) ———

export const manquesPublication = (n: Pick<NumeroOnde, "titre" | "chapeau" | "couverture_url" | "couverture_alt" | "audio_url" | "audio_voix" | "blocs">): string[] => {
  const m: string[] = [];
  if (!n.titre.trim()) m.push("Le titre du numéro.");
  if (!n.chapeau.trim()) m.push("Le chapeau.");
  if (!n.couverture_url) m.push("La photo de couverture.");
  else if (!(n.couverture_alt || "").trim()) m.push("Le texte alternatif de la photo de couverture.");
  if (n.audio_url && !(n.audio_voix || "").trim()) m.push("Le nom de la voix du mois (version audio).");
  if (n.titre.length > LIMITES_ONDE.titre) m.push(`Le titre est trop long (${LIMITES_ONDE.titre} caractères au maximum).`);
  if (n.chapeau.length > LIMITES_ONDE.chapeau) m.push(`Le chapeau est trop long (${LIMITES_ONDE.chapeau} caractères au maximum).`);
  n.blocs.forEach((b, i) => {
    const q = `Bloc ${numeroRubrique(i)} (${libelleType(b.type)})`;
    if (!(b.rubrique || "").trim()) m.push(`${q} : l'étiquette de rubrique.`);
    if (b.type === "texte" && !(b.texte || "").trim()) m.push(`${q} : le texte.`);
    if (b.type === "images") {
      if (!b.images.length) m.push(`${q} : au moins une photo.`);
      if (b.images.length > LIMITES_ONDE.imagesMax) m.push(`${q} : 6 photos au maximum.`);
      if (b.images.some((img) => !(img.alt || "").trim())) m.push(`${q} : le texte alternatif de chaque photo.`);
    }
    if (b.type === "audio") {
      if (!b.url) m.push(`${q} : le fichier MP3.`);
      if (!(b.titre || "").trim()) m.push(`${q} : le titre de l'extrait.`);
    }
    if (b.type === "bouton") {
      if (!(b.libelle || "").trim()) m.push(`${q} : le libellé du bouton.`);
      if (!(b.lien || "").trim()) m.push(`${q} : le lien du bouton.`);
      else if (!lienSur(b.lien.trim())) m.push(`${q} : le lien doit commencer par https://`);
    }
    if (b.type === "evenements" && !b.evenements.length) m.push(`${q} : cochez au moins un événement.`);
    if (b.type === "evenements" && b.evenements.length > LIMITES_ONDE.evenementsMax) m.push(`${q} : 8 événements au maximum.`);
    if (b.type === "podcast") {
      if (!b.podcast_id) m.push(`${q} : choisissez un podcast.`);
      if (!(b.texte || "").trim()) m.push(`${q} : le texte de présentation.`);
      if ((b.texte || "").length > LIMITES_ONDE.presentation) m.push(`${q} : la présentation est trop longue (${LIMITES_ONDE.presentation} caractères au maximum).`);
    }
    if (b.type === "nouveaux_membres" && !b.mois) m.push(`${q} : le mois.`);
    if (b.type === "trimestre" && !(b.texte || "").trim()) m.push(`${q} : le texte.`);
    if (b.type === "chiffres" || b.type === "trimestre") {
      if (b.chiffres.length < LIMITES_ONDE.chiffresMin || b.chiffres.length > LIMITES_ONDE.chiffresMax) m.push(`${q} : de 2 à 4 chiffres.`);
      if (b.chiffres.some((c) => !c.valeur.trim() || !c.libelle.trim())) m.push(`${q} : chaque chiffre avec son libellé.`);
    }
  });
  return m;
};

// ——— Lecteur audio du site ———

/** Version audio du numéro, ou un extrait, prêt pour le lecteur en bas de page. */
export const episodeOnde = (n: NumeroOnde, extrait?: BlocAudio, resoudre: (u: string) => string | undefined = (u) => u): Episode | null => {
  const brut = extrait ? extrait.url : n.audio_url;
  const url = brut ? resoudre(brut) : undefined;
  if (!url) return null;
  const nom = `${NOM_ONDE} n°${n.numero}`;
  return {
    podcastId: "",
    podcastSlug: null,
    podcastName: extrait ? extrait.podcast || nom : nom,
    author: extrait ? extrait.createur || "" : n.audio_voix ? `lu par ${n.audio_voix}` : "",
    city: null,
    title: extrait ? extrait.titre || "Extrait" : n.titre || nom,
    date: n.publie_le,
    duration: null,
    audioUrl: url,
    image: (n.couverture_url && resoudre(n.couverture_url)) || null,
    link: extrait?.lien || null,
    href: n.slug ? ondeHref(n.slug) : undefined,
  };
};

// ——— Chargements ———

export const useNumerosPublies = () =>
  useQuery({
    queryKey: ["onde-publies"],
    queryFn: async (): Promise<NumeroOnde[]> => {
      const { data, error } = await supabase
        .from("onde_numeros")
        .select(ONDE_COLUMNS_PUBLIC)
        .eq("statut", "publie")
        .order("mois", { ascending: false })
        .order("numero", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NumeroOnde[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useNumeroPublie = (slug: string | undefined) =>
  useQuery({
    queryKey: ["onde-numero", slug],
    enabled: !!slug,
    queryFn: async (): Promise<NumeroOnde | null> => {
      const { data, error } = await supabase
        .from("onde_numeros")
        .select(ONDE_COLUMNS_PUBLIC)
        .eq("slug", slug!)
        .eq("statut", "publie")
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as NumeroOnde) ?? null;
    },
  });

// ——— Fichiers ———

/** Chemin d'un fichier dans l'espace « onde », d'après son adresse publique. */
export const cheminFichier = (url: string): string | null => /\/onde-media\/([0-9a-f-]{36}\/[A-Za-z0-9_-]+\.(?:jpg|png|webp|mp3))$/.exec(url)?.[1] ?? null;

/** Tous les fichiers d'un numéro (couverture, audio, photos, extraits). */
export const fichiersNumero = (n: Pick<NumeroOnde, "couverture_url" | "audio_url" | "blocs">): string[] => {
  const out: string[] = [];
  if (n.couverture_url) out.push(n.couverture_url);
  if (n.audio_url) out.push(n.audio_url);
  for (const b of n.blocs) {
    if (b.type === "images") b.images.forEach((i) => i.url && out.push(i.url));
    if ((b.type === "audio" || b.type === "podcast") && b.url) out.push(b.url);
  }
  return out;
};

/**
 * Pour l'équipe (éditeur, aperçu) : les fichiers d'un brouillon ne sont pas publics,
 * on les lit par des liens temporaires d'une heure.
 */
export const useFichiersEquipe = (urls: string[]) => {
  const chemins = [...new Set(urls.map(cheminFichier).filter((c): c is string => !!c))].sort();
  const q = useQuery({
    queryKey: ["onde-fichiers-equipe", chemins],
    enabled: chemins.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("onde").createSignedUrls(chemins, 3600);
      if (error) throw error;
      const table: Record<string, string> = {};
      (data || []).forEach((d) => { if (d.path && d.signedUrl) table[d.path] = d.signedUrl; });
      return table;
    },
  });
  // Tant que le lien temporaire n'est pas prêt, rien n'est demandé (jamais l'adresse publique d'un brouillon)
  return (url: string): string | undefined => {
    const c = cheminFichier(url);
    return c ? q.data?.[c] : url;
  };
};

/** Photo ramenée à 1600 px de large au plus, en JPEG, pour le web. */
export const redimensionnerImage = (file: File, max = 1600): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * r);
      const h = Math.round(img.naturalHeight * r);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(src); reject(new Error("image")); return; }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(src);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("image"))), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error("image")); };
    img.src = src;
  });

/** Envoie une photo (redimensionnée) ou un MP3 ; le serveur vérifie le rôle, le type réel et le poids. */
export const envoyerFichierOnde = async (numeroId: string, file: File, sorte: "image" | "audio"): Promise<string> => {
  let contenu: Blob = file;
  if (sorte === "image") {
    if (!IMAGE_TYPES.includes(file.type)) throw new Error("Photo au format JPG, PNG ou WebP.");
    contenu = await redimensionnerImage(file).catch(() => { throw new Error("Cette photo n'a pas pu être lue."); });
    if (contenu.size > IMAGE_MAX_OCTETS) throw new Error("Photo trop lourde, même réduite : 3 Mo au maximum.");
  } else {
    if (file.type && file.type !== "audio/mpeg" && file.type !== "audio/mp3") throw new Error("Fichier au format MP3 seulement.");
    if (file.size > AUDIO_MAX_OCTETS) throw new Error("Fichier MP3 trop lourd : 20 Mo au maximum.");
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Votre session a expiré : reconnectez-vous.");
  const form = new FormData();
  form.append("numero_id", numeroId);
  form.append("sorte", sorte);
  form.append("file", contenu, sorte === "image" ? "photo.jpg" : "audio.mp3");
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onde-fichier`, {
    method: "POST",
    headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}` },
    body: form,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || !json.url) throw new Error(json.error || "Le fichier n'a pas pu être envoyé. Réessayez.");
  return json.url as string;
};

// ——— Abonné·es (lot 3) ———
// Inscription, confirmation et désinscription passent par des fonctions serveur (onde_inscrire, onde_confirmer,
// onde_desinscrire, onde_reinscrire) : la liste n'est jamais lisible depuis le navigateur, sauf par les admins.

export const ONDE_CONFIRMER = "/onde/confirmer";
export const ONDE_DESINSCRIPTION = "/onde/desinscription";

/** Textes des cases de consentement (le serveur enregistre les mêmes, avec la date). */
export const CONSENTEMENT_ONDE = "J'accepte de recevoir L'Onde du Sud par e-mail. Je peux me désinscrire à tout moment.";
export const CONSENTEMENT_ONDE_EVENEMENT = "Je veux aussi recevoir L'Onde du Sud, la lettre mensuelle";

export type SourceAbonne = "onde" | "evenement" | "adhesion";
export type StatutAbonne = "en_attente" | "actif" | "desinscrit";

export const LIBELLE_STATUT_ABONNE: Record<StatutAbonne, string> = {
  en_attente: "En attente de confirmation",
  actif: "Actif",
  desinscrit: "Désinscrit·e",
};
export const LIBELLE_SOURCE_ABONNE: Record<SourceAbonne, string> = {
  onde: "Formulaire L'Onde",
  evenement: "Inscription à un événement",
  adhesion: "Adhésion",
};

const RE_JETON = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Un jeton de lien de confirmation ou de désinscription a toujours ce format. */
export const jetonValide = (j?: string | null): j is string => !!j && RE_JETON.test(j.trim());

/** Liens envoyés par e-mail (lot 4). */
export const lienConfirmationOnde = (jeton: string) => `${SITE_URL}${ONDE_CONFIRMER}?jeton=${encodeURIComponent(jeton)}`;
export const lienDesinscriptionOnde = (jeton: string) => `${SITE_URL}${ONDE_DESINSCRIPTION}?jeton=${encodeURIComponent(jeton)}`;

/** Inscription : même réponse que l'adresse soit nouvelle ou déjà abonnée. */
export const inscrireOnde = (prenom: string | null, email: string, source: "onde" | "evenement") =>
  supabase.rpc("onde_inscrire", { _prenom: prenom ?? "", _email: email.trim(), _consentement: true, _source: source });
