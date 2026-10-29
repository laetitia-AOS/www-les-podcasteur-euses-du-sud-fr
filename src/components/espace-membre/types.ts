export interface FicheMembre {
  id: string;
  slug: string | null;
  nom_podcast: string;
  lien_ecoute: string;
  flux_rss: string | null;
  description: string;
  thematique: string | null;
  vignette_url: string | null;
  photo_profil_url: string | null;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  email: string;
  ville: string | null;
  type_podcast: string | null;
  type_profil: string;
  bio_750: string | null;
  lien_principal: string | null;
  lien_linkedin: string | null;
  metier_principal: string | null;
  services_3: string[] | null;
  disponibilite: string | null;
  valide: boolean;
  niveau_avancement: string | null;
  frequence_publication: string | null;
  monetise: string | null;
  department_code: string | null;
  department_label: string | null;
  city_name: string | null;
  city_insee_code: string | null;
  city_postcode: string | null;
  cherche_choix: string[] | null;
  apporte_choix: string[] | null;
  cherche_precision: string | null;
  apporte_precision: string | null;
}

export const FICHE_COLUMNS =
  "id, slug, nom_podcast, lien_ecoute, flux_rss, description, thematique, vignette_url, photo_profil_url, prenom, nom, telephone, email, ville, type_podcast, type_profil, bio_750, lien_principal, lien_linkedin, metier_principal, services_3, disponibilite, valide, niveau_avancement, frequence_publication, monetise, department_code, department_label, city_name, city_insee_code, city_postcode, cherche_choix, apporte_choix, cherche_precision, apporte_precision, visible_sans_adhesion";

export const cardCls = "bg-surface border border-filet p-5 sm:p-7";
export const sectionTitle = "title-section text-[28px] sm:text-[34px]";
