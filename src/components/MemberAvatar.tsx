import { formatName, fullName } from "@/lib/pds";

type Props = {
  prenom?: string | null;
  nom?: string | null;
  /** Photo de profil uniquement : ne jamais passer une pochette de podcast. */
  photoUrl?: string | null;
  className?: string;
};

/**
 * Pastille ronde d'un membre : sa photo de profil si elle existe, sinon ses initiales.
 * La pochette d'un podcast n'est jamais utilisée ici.
 */
const MemberAvatar = ({ prenom, nom, photoUrl, className = "w-14 h-14 sm:w-16 sm:h-16" }: Props) => {
  if (photoUrl) {
    return <img src={photoUrl} alt={fullName(prenom, nom) ? `Photo de ${fullName(prenom, nom)}` : "Photo de profil"} className={`${className} rounded-full object-cover shrink-0`} loading="lazy" />;
  }
  const initials = `${formatName(prenom).charAt(0)}${formatName(nom).charAt(0)}`.toUpperCase() || "·";
  return (
    <span aria-hidden className={`${className} rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 select-none`}>
      {initials}
    </span>
  );
};

type WithPhoto = { type_profil: string; prenom: string | null; nom: string | null; vignette_url: string | null; photo_profil_url?: string | null };

/**
 * Photo de profil d'une personne :
 * 1. la case « photo de profil » si elle est remplie ;
 * 2. pour une fiche non podcast, sa photo (vignette) ;
 * 3. pour une fiche podcast, la photo d'une autre fiche de la même personne (même prénom et nom).
 */
export const profilePhotoFor = <T extends WithPhoto>(p: T, all: T[]): string | null => {
  if (p.photo_profil_url) return p.photo_profil_url;
  if (p.type_profil !== "podcasteur") return p.vignette_url;
  const key = `${formatName(p.prenom)} ${formatName(p.nom)}`.trim();
  if (!key) return null;
  const same = all.filter((o) => o !== p && `${formatName(o.prenom)} ${formatName(o.nom)}`.trim() === key);
  const withPhoto = same.find((o) => o.photo_profil_url);
  if (withPhoto) return withPhoto.photo_profil_url!;
  const other = same.find((o) => o.type_profil !== "podcasteur" && o.type_profil !== "structure_eco" && o.type_profil !== "studio" && o.vignette_url);
  return other?.vignette_url || null;
};

export default MemberAvatar;
