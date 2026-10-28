import { formatName } from "@/lib/pds";

type Props = {
  prenom?: string | null;
  nom?: string | null;
  /** Photo de profil uniquement : ne jamais passer une pochette de podcast. */
  photoUrl?: string | null;
  className?: string;
};

/**
 * Pastille ronde d'un membre : sa photo de profil si elle existe, sinon ses initiales.
 * Les podcasteur·euses n'ont envoyé qu'une pochette de podcast : elle n'est pas utilisée ici.
 */
const MemberAvatar = ({ prenom, nom, photoUrl, className = "w-14 h-14 sm:w-16 sm:h-16" }: Props) => {
  if (photoUrl) {
    return <img src={photoUrl} alt="" className={`${className} rounded-full object-cover shrink-0`} loading="lazy" />;
  }
  const initials = `${formatName(prenom).charAt(0)}${formatName(nom).charAt(0)}`.toUpperCase() || "·";
  return (
    <span aria-hidden className={`${className} rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 select-none`}>
      {initials}
    </span>
  );
};

/** Retrouve la photo de profil d'une personne : la sienne si ce n'est pas une fiche podcast, sinon celle de sa fiche annuaire (même prénom et nom). */
export const profilePhotoFor = <T extends { type_profil: string; prenom: string | null; nom: string | null; vignette_url: string | null }>(
  p: T,
  all: T[],
): string | null => {
  if (p.type_profil !== "podcasteur") return p.vignette_url;
  const key = `${formatName(p.prenom)} ${formatName(p.nom)}`.trim();
  if (!key) return null;
  const other = all.find(
    (o) => o.type_profil !== "podcasteur" && o.type_profil !== "structure_eco" && o.type_profil !== "studio" && o.vignette_url && `${formatName(o.prenom)} ${formatName(o.nom)}`.trim() === key,
  );
  return other?.vignette_url || null;
};

export default MemberAvatar;
