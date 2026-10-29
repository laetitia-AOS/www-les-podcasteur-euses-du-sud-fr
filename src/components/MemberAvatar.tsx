import { formatName, fullName } from "@/lib/pds";

type Props = {
  prenom?: string | null;
  nom?: string | null;
  /** Image choisie par `avatarFor` : photo de profil, ou à défaut pochette du premier podcast. */
  photoUrl?: string | null;
  /** Texte de remplacement de l'image (par défaut « Photo de … »). */
  alt?: string;
  className?: string;
};

/**
 * Pastille ronde d'un membre : l'image reçue (photo ou pochette), sinon ses initiales.
 */
const MemberAvatar = ({ prenom, nom, photoUrl, alt, className = "w-14 h-14 sm:w-16 sm:h-16" }: Props) => {
  if (photoUrl) {
    const name = fullName(prenom, nom);
    return <img src={photoUrl} alt={alt || (name ? `Photo de ${name}` : "Photo de profil")} className={`${className} rounded-full object-cover shrink-0`} loading="lazy" />;
  }
  const initials = `${formatName(prenom).charAt(0)}${formatName(nom).charAt(0)}`.toUpperCase() || "·";
  return (
    <span aria-hidden className={`${className} rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 select-none`}>
      {initials}
    </span>
  );
};

type WithPhoto = {
  type_profil: string;
  prenom: string | null;
  nom: string | null;
  vignette_url: string | null;
  photo_profil_url?: string | null;
  nom_podcast?: string | null;
  created_at?: string | null;
};

export type Avatar = { url: string; alt: string } | null;

const cle = (p: WithPhoto) => `${formatName(p.prenom)} ${formatName(p.nom)}`.trim();
const LIEUX = ["studio", "structure_eco"];

/**
 * Image d'une personne, dans cet ordre :
 * 1. sa photo de profil (sur cette fiche ou une autre fiche de la même personne : même prénom et nom) ;
 * 2. pour une fiche non podcast, la photo enregistrée sur la fiche (anciennes fiches) ;
 * 3. la pochette de son premier podcast (le plus ancien) ;
 * 4. rien : les initiales s'affichent.
 */
export const avatarFor = <T extends WithPhoto>(p: T, all: T[]): Avatar => {
  const name = fullName(p.prenom, p.nom);
  const photoAlt = name ? `Photo de ${name}` : "Photo de profil";
  if (p.photo_profil_url) return { url: p.photo_profil_url, alt: photoAlt };
  const key = cle(p);
  const same = key ? all.filter((o) => o !== p && !LIEUX.includes(o.type_profil) && cle(o) === key) : [];
  const withPhoto = same.find((o) => o.photo_profil_url);
  if (withPhoto) return { url: withPhoto.photo_profil_url!, alt: photoAlt };
  if (p.type_profil !== "podcasteur" && p.vignette_url) return { url: p.vignette_url, alt: photoAlt };
  const autrePhoto = same.find((o) => o.type_profil !== "podcasteur" && o.vignette_url);
  if (autrePhoto) return { url: autrePhoto.vignette_url!, alt: photoAlt };
  const podcasts = [p, ...same]
    .filter((o) => o.type_profil === "podcasteur" && o.vignette_url)
    .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
  const premier = podcasts[0];
  if (premier) return { url: premier.vignette_url!, alt: premier.nom_podcast ? `Pochette du podcast ${premier.nom_podcast}` : "Pochette du podcast" };
  return null;
};

/** Adresse de l'image seule (compatibilité). */
export const profilePhotoFor = <T extends WithPhoto>(p: T, all: T[]): string | null => avatarFor(p, all)?.url ?? null;

export default MemberAvatar;
