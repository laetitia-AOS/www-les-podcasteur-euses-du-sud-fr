// Données et petites fonctions partagées par l'inscription (page Adhérer) et l'ajout d'un podcast.
import { supabase } from "@/integrations/supabase/client";
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
  if (!file.type.startsWith("image/")) return "Choisissez une image (JPG, PNG ou WebP).";
  if (file.size > 5 * 1024 * 1024) return "L'image doit faire moins de 5 Mo.";
  return null;
};

/** Envoie une image dans le dossier des photos et pochettes, renvoie son adresse publique. */
export const uploadImage = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("podcast-thumbnails").upload(fileName, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("podcast-thumbnails").getPublicUrl(fileName).data.publicUrl;
};

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
  formatCollaboration: string;
  consentContact: boolean;
  consentMiseEnRelation: boolean;
  photoUrl: string;
};

/** Colonnes communes à toutes les lignes d'une même personne (fiche annuaire). */
export const profilColumns = (p: ProfilData) => {
  const dept = DEPARTEMENTS.find((d) => d.code === p.departementCode);
  return {
    prenom: p.prenom.trim(),
    nom: p.nom.trim(),
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
    cherche_collaboration: p.cherche.length ? p.cherche : null,
    peut_apporter: p.apporte.length ? p.apporte : null,
    format_collaboration: p.formatCollaboration || null,
    consent_contact: p.consentContact,
    consent_mise_en_relation: p.consentMiseEnRelation,
    photo_profil_url: p.photoUrl || null,
    structure: null,
  };
};
