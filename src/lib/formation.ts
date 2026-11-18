// Page « Formation podcast » : les formations de l'association (annonce 2027) et les membres
// qui ont coché « Formation » dans « J'apporte ». Une personne n'apparaît qu'une fois,
// même si elle a plusieurs fiches (une par podcast). L'ordre est tiré au hasard à chaque
// ouverture de la page : personne n'est classé·e avant les autres.
import { aUnPodcast, cleanCity, formatName, melanger, titreFiche } from "@/lib/pds";
import { ficheHref } from "@/lib/seo";

export const CODE_FORMATION = "formation";

export type FicheFormation = {
  id: string;
  slug: string | null;
  prenom: string | null;
  nom: string | null;
  structure?: string | null;
  type_profil: string;
  nom_podcast: string | null;
  metier_principal: string | null;
  city_name: string | null;
  vignette_url: string | null;
  photo_profil_url?: string | null;
  apporte_choix: string[] | null;
  created_at: string;
};

export type Formateur = {
  cle: string;
  /** Fiche à ouvrir : le profil de la personne s'il existe, sinon son premier podcast. */
  fiche: FicheFormation;
  nom: string;
  role: string;
  ville: string;
  podcasts: string[];
};

const LIEUX = ["studio", "structure_eco"];
const ROLE: Record<string, string> = {
  podcasteur: "Podcasteur·euse",
  pro_podcast: "Pro de l'audio",
  soutien: "Soutien",
  studio: "Studio",
  structure_eco: "Structure",
};

const clePersonne = (f: FicheFormation) =>
  LIEUX.includes(f.type_profil) ? `lieu:${f.id}` : `${formatName(f.prenom)} ${formatName(f.nom)}`.toLowerCase().trim() || f.id;

export function formateurs(fiches: FicheFormation[], rand: () => number = Math.random): Formateur[] {
  const groupes = new Map<string, FicheFormation[]>();
  for (const f of fiches) {
    if (!f.apporte_choix?.includes(CODE_FORMATION)) continue;
    const k = clePersonne(f);
    groupes.set(k, [...(groupes.get(k) || []), f]);
  }
  const liste = [...groupes.entries()].map(([cle, fs]) => {
    const parDate = [...fs].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const profil = parDate.find((f) => !aUnPodcast(f)) || parDate[0];
    const pro = parDate.find((f) => f.type_profil === "pro_podcast" && f.metier_principal);
    const lieu = LIEUX.includes(profil.type_profil);
    return {
      cle,
      fiche: profil,
      nom: lieu ? titreFiche(profil) : titreFiche({ prenom: profil.prenom, nom: profil.nom, structure: profil.structure }),
      role: pro?.metier_principal || ROLE[profil.type_profil] || "Membre",
      ville: cleanCity(parDate.find((f) => f.city_name)?.city_name),
      podcasts: parDate.filter(aUnPodcast).map((f) => (f.nom_podcast || "").trim()),
    };
  });
  return melanger(liste, rand);
}

export const hrefFormateur = (f: Formateur) => ficheHref(f.fiche);
