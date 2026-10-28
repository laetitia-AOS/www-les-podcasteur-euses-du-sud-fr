// Données et petites fonctions partagées par l'inscription (page Adhérer) et l'ajout d'un podcast.
import { supabase } from "@/integrations/supabase/client";
import { formatName } from "@/lib/pds";
import type { CityResult } from "@/components/CityAutocomplete";

export const DEPARTEMENTS = [
  { code: "04", label: "04 — Alpes-de-Haute-Provence" },
  { code: "05", label: "05 — Hautes-Alpes" },
  { code: "06", label: "06 — Alpes-Maritimes" },
  { code: "13", label: "13 — Bouches-du-Rhône" },
  { code: "83", label: "83 — Var" },
  { code: "84", label: "84 — Vaucluse" },
];

export const THEMATIQUES = [
  "Conversations & société",
  "Business & parcours de vie",
  "Culture, création & récits",
  "Sport & dépassement",
  "Santé, mental & équilibre",
  "Transmission & éducation",
  "Tech, médias & nouveaux usages",
  "Territoires, initiatives & regards",
  "Autre",
];

export const TYPES_PODCAST = [
  "Indépendant",
  "Média",
  "Marque / Entreprise",
  "Éducatif / Académique",
  "Narratif / Créatif",
  "Expert / Personal brand",
];

export const SERVICES = [
  "Studio / enregistrement",
  "Montage / mixage",
  "Réalisation / production",
  "Sound design / composition",
  "Voix off",
  "Vidéo / teasers / motion",
  "Identité sonore / branding",
  "Copywriting / éditorial",
  "Diffusion / marketing / RP",
  "Stratégie / monétisation",
  "Formation / coaching",
  "Régie pub / partenariats",
  "Autre",
];

/** Choix « Je cherche » / « J'apporte » (codes vérifiés côté serveur). */
export const COLLAB_CHOIX = [
  { value: "voix_off", label: "Voix off" },
  { value: "montage", label: "Montage" },
  { value: "mixage", label: "Mixage" },
  { value: "strategie", label: "Stratégie" },
  { value: "coproduction", label: "Co-production d'un format" },
  { value: "etre_invite", label: "Être invité·e" },
  { value: "recevoir_invites", label: "Recevoir des invité·es" },
  { value: "sponsors", label: "Sponsors et partenaires" },
  { value: "evenements", label: "Organisation d'événements" },
  { value: "formation", label: "Formation" },
  { value: "studio", label: "Studio" },
  { value: "autre", label: "Autre" },
] as const;
export const PRECISION_MAX = 120;

export const collabLabel = (code: string) => COLLAB_CHOIX.find((c) => c.value === code)?.label ?? code;

/** Liste lisible : « montage », « montage ou mixage », « voix off, montage ou mixage ». */
export const listeChoix = (codes: string[]) => {
  const labels = codes.map((c) => collabLabel(c).toLowerCase().replace(/^être/, "être"));
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} ou ${labels[labels.length - 1]}`;
};

/** Phrase de résultat de l'annuaire : « 3 profils apportent montage ou mixage ». */
export const phraseApportent = (n: number, codes: string[]) =>
  `${n} profil${n > 1 ? "s" : ""} apporte${n > 1 ? "nt" : ""} ${listeChoix(codes)}`;

/** Anciennes listes (archives en base, encore utilisées par le formulaire des structures). */
export const CHERCHE_OPTIONS = [
  "Un·e podcasteur·euse pour co-production",
  "Un·e monteur·euse / ingénieur son",
  "Un·e studio d'enregistrement",
  "Un·e voix off",
  "Un·e expert·e en stratégie podcast",
  "Un·e graphiste / motion designer",
  "Des invité·es pour mon podcast",
  "Un·e partenaire pour un événement",
  "Des sponsors / partenaires commerciaux",
  "Un·e coach ou mentor·e",
];

export const APPORTE_OPTIONS = [
  "Participer à un podcast en tant qu'invité·e",
  "Proposer mes compétences techniques (son, montage)",
  "Mettre à disposition un studio",
  "Faire de la voix off",
  "Partager mon expertise stratégique",
  "Créer des visuels / motion",
  "Co-produire un format",
  "Organiser ou co-organiser un événement",
  "Proposer un partenariat commercial",
  "Mentorer un·e podcasteur·euse débutant·e",
];

export const FORMATS_COLLAB = ["En présentiel (Marseille / région)", "À distance", "Présentiel et à distance", "À définir"];

export const DISPONIBILITES = [
  "Disponible pour missions freelance",
  "Disponible pour collaborations bénévoles",
  "Disponible pour missions freelance et collaborations bénévoles",
  "Non disponible actuellement",
  "Me contacter pour en discuter",
];

export type TypeProfil = "podcasteur" | "pro_podcast" | "studio" | "soutien" | "structure_eco";

export const TYPES_PROFIL: { value: TypeProfil; label: string; hint: string }[] = [
  { value: "podcasteur", label: "Podcasteur·euse", hint: "J'ai un ou plusieurs podcasts" },
  { value: "pro_podcast", label: "Acteur·ice de l'écosystème", hint: "Je propose des compétences" },
  { value: "studio", label: "Studio ou agence", hint: "Lieu d'enregistrement, production" },
  { value: "structure_eco", label: "Structure", hint: "Radio, festival, incubateur, institution" },
  { value: "soutien", label: "Curieux·se, soutien", hint: "Je veux suivre et contribuer" },
];

/** Tarifs annuels de l'adhésion (personne / studio ou agence) et prix minimum pour une personne. */
export const TARIFS = { personne: 20, studio: 100, minimumPersonne: 1 };

export const HELLOASSO_WIDGET =
  "https://www.helloasso.com/associations/les-podcasteur-euses-du-sud/adhesions/adherer-a-l-association/widget?redirectUrl=https://www.les-podcasteur-euses-du-sud.fr/bienvenue";

/** Lien d'écoute utilisé pour les fiches sans podcast (la colonne est obligatoire). */
export const LIEN_SANS_PODCAST = "https://les-podcasteur-euses-du-sud.fr";

export const isHttpsUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/** Recadre une image au centre, au format carré (règle du site pour les photos et les pochettes). */
export const cropToSquare = (file: File): Promise<File> =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
      canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name, { type: file.type }) : file), file.type, 0.92);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });

/** Vérifie le fichier choisi : renvoie un message d'erreur ou null. */
export const checkImage = (file: File): string | null => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Choisissez une image JPG, PNG ou WebP.";
  if (file.size > 5 * 1024 * 1024) return "L'image doit faire moins de 5 Mo.";
  return null;
};

export type ImageBucket = "podcast-thumbnails" | "studio-galleries" | "event-images";

/**
 * Envoie des images et renvoie leurs adresses publiques, dans le même ordre.
 * - Personne connectée : envoi direct dans son propre dossier (règle appliquée côté serveur).
 * - Visiteur·ice : passage obligatoire par la fonction de contrôle (JPG/PNG/WebP, 5 Mo, 3 envois par heure
 *   et par adresse) ; l'image reste invisible sur le site tant qu'un·e admin ne l'a pas validée.
 */
export const uploadImages = async (files: File[], email: string, bucket: ImageBucket = "podcast-thumbnails"): Promise<string[]> => {
  if (!files.length) return [];
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    const urls: string[] = [];
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file, { contentType: file.type });
      if (error) throw error;
      urls.push(supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl);
    }
    return urls;
  }
  const body = new FormData();
  body.append("email", email.trim());
  body.append("bucket", bucket);
  files.forEach((f) => body.append("files", f, f.name));
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/envoi-image`, {
    method: "POST",
    headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as { urls?: string[]; error?: string };
  if (!res.ok || !data.urls) throw Object.assign(new Error(data.error || "Envoi impossible"), { code: "P0001" });
  return data.urls;
};

/** Une seule image (voir `uploadImages`). */
export const uploadImage = async (file: File, email = "", bucket: ImageBucket = "podcast-thumbnails"): Promise<string> =>
  (await uploadImages([file], email, bucket))[0];

/** Message à afficher après un refus du serveur : son explication si elle est prévue pour le public. */
export const messageServeur = (error: { code?: string; message?: string } | null | undefined, fallback: string): string =>
  error?.code === "P0001" && error.message ? error.message : fallback;

/** Fiche annuaire saisie à l'étape 1 (avant l'envoi en base pour les podcasteur·euses). */
export type ProfilData = {
  typeProfil: TypeProfil;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  bio750: string;
  lienLinkedin: string;
  lienPrincipal: string;
  metierPrincipal: string;
  services: string[];
  disponibilite: string;
  departementCode: string;
  city: CityResult | null;
  cherche: string[];
  apporte: string[];
  cherchePrecision: string;
  apportePrecision: string;
  formatCollaboration: string;
  consentContact: boolean;
  consentMiseEnRelation: boolean;
  photoUrl: string;
};

/** Colonnes communes à toutes les lignes d'une même personne (fiche annuaire). */
export const profilColumns = (p: ProfilData) => {
  const dept = DEPARTEMENTS.find((d) => d.code === p.departementCode);
  return {
    prenom: formatName(p.prenom),
    nom: formatName(p.nom),
    email: p.email.trim(),
    telephone: p.telephone.trim() || null,
    type_profil: p.typeProfil,
    bio_750: p.bio750.trim() || null,
    lien_principal: p.lienPrincipal.trim() || null,
    lien_linkedin: p.lienLinkedin.trim() || null,
    department_code: p.departementCode || null,
    department_label: dept?.label || null,
    city_name: p.city?.city_name || null,
    city_insee_code: p.city?.city_insee_code || null,
    city_postcode: p.city?.city_postcode || null,
    ville: p.city ? `${p.city.city_name}, ${dept?.label || p.departementCode}` : null,
    cherche_choix: p.cherche,
    apporte_choix: p.apporte,
    cherche_precision: p.cherchePrecision.trim() || null,
    apporte_precision: p.apportePrecision.trim() || null,
    format_collaboration: p.formatCollaboration || null,
    consent_contact: p.consentContact,
    consent_mise_en_relation: p.consentMiseEnRelation,
    photo_profil_url: p.photoUrl || null,
    structure: null,
  };
};
