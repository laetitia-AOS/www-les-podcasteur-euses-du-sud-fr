// Référencement : adresse du site, adresses des fiches, titres et descriptions des pages.
// Toutes les pages passent par ces fonctions pour que les règles restent les mêmes partout.

export const SITE_URL = "https://www.les-podcasteur-euses-du-sud.fr";
export const SITE_NAME = "Les Podcasteur·euses du Sud";
/** Image de partage par défaut (logo sur fond bleu, 1200 × 630). */
export const DEFAULT_SHARE_IMAGE = `${SITE_URL}/og-image.jpg`;

/** Adresses des pages principales. */
export const PAGES = {
  ecouter: "/ecouter",
  annuaire: "/annuaire",
  studios: "/studios",
  agenda: "/agenda",
  adherer: "/adherer",
} as const;

type FicheLien = { id: string; slug?: string | null; type_profil?: string | null; nom_podcast?: string | null };

/**
 * Adresse publique d'une fiche selon son type :
 * podcast → /ecouter/…, studio → /studios/…, structure → /structures/…, autres profils → /annuaire/….
 */
export const ficheHref = (p: FicheLien): string => {
  const id = p.slug || p.id;
  if (p.type_profil === "studio") return `/studios/${id}`;
  if (p.type_profil === "structure_eco") return `/structures/${id}`;
  if (p.type_profil === "podcasteur" && (p.nom_podcast || "").trim()) return `/ecouter/${id}`;
  return `/annuaire/${id}`;
};

/** Adresse de la fiche d'un podcast quand on n'a que son identifiant (épisodes, lecteur). */
export const podcastHref = (slugOrId: string) => `/ecouter/${slugOrId}`;

/** Balise de titre : le nom du site suit, séparé par un tiret (sauf sur l'accueil). */
export const titreSeo = (titre: string) => `${titre.trim()} — ${SITE_NAME}`;

export const DESCRIPTION_MIN = 140;
export const DESCRIPTION_MAX = 160;

const COMPLEMENTS = [
  "Fiche publiée sur le site des Podcasteur·euses du Sud, le réseau podcast de Marseille et de Région Sud.",
  "Écoute, annuaire, studios et agenda des rendez-vous podcast en Provence-Alpes-Côte d'Azur.",
];

const phrase = (s: string) => {
  const c = s.replace(/\s+/g, " ").trim();
  if (!c) return "";
  return /[.!?…]$/.test(c) ? c : `${c}.`;
};

/**
 * Description de 140 à 160 caractères : les phrases sont ajoutées dans l'ordre (mettre le lieu en premier),
 * complétées si besoin, puis coupées proprement à 160 caractères.
 */
export const descriptionSeo = (parts: Array<string | null | undefined>, complements: string[] = COMPLEMENTS): string => {
  let out = "";
  for (const p of [...parts, ...complements]) {
    const ph = phrase(p || "");
    if (!ph) continue;
    out = out ? `${out} ${ph}` : ph;
    if (out.length >= DESCRIPTION_MIN) break;
  }
  if (out.length <= DESCRIPTION_MAX) return out;
  const cut = out.slice(0, DESCRIPTION_MAX - 1);
  const i = cut.lastIndexOf(" ");
  const base = (i >= DESCRIPTION_MIN ? cut.slice(0, i) : cut).replace(/[\s,;:–—-]+$/, "").replace(/\.$/, "");
  return `${base}…`;
};

/** Fil d'Ariane en données structurées. */
export const breadcrumbLd = (items: Array<{ name: string; path: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: `${SITE_URL}${it.path}`,
  })),
});

/** Questions fréquentes en données structurées. */
export const faqLd = (faq: Array<{ q: string; a: string }>) =>
  faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }
    : null;

/** Titres et descriptions des pages générales (uniques, 140 à 160 caractères). */
export const PAGES_SEO = {
  accueil: {
    title: "Les Podcasteur·euses du Sud — podcasts, créateur·ices et studios en Région Sud",
    description:
      "Écoutez les podcasts fabriqués à Marseille et en Région Sud, trouvez qui les fait, un studio où enregistrer et les prochains apéros écoute près de chez vous.",
  },
  ecouter: {
    title: titreSeo("Écouter les podcasts de Marseille et de Région Sud"),
    description:
      "Les podcasts de Marseille et de Région Sud à écouter ici : derniers épisodes, recherche par thème ou département, et un lecteur qui suit votre navigation.",
  },
  annuaire: {
    title: titreSeo("Annuaire des podcasteur·euses et pros de l'audio en Région Sud"),
    description:
      "Podcasteur·euses, monteur·euses, voix off et pros de l'audio à Marseille et en Région Sud. Dites ce que vous cherchez, l'annuaire montre qui l'apporte.",
  },
  studios: {
    title: titreSeo("Studios podcast et agences en Région Sud"),
    description:
      "Studios d'enregistrement, plateaux vidéo et agences podcast à Marseille et en Région Sud. Comparez services et tarifs, puis demandez un devis en une fois.",
  },
  agenda: {
    title: titreSeo("Agenda des événements podcast en Région Sud"),
    description:
      "Apéros écoute, ateliers, lives et rencontres podcast à Marseille, en Région Sud et en ligne. Ajoutez-les à votre agenda, ou proposez votre événement.",
  },
  adherer: {
    title: titreSeo("Adhérer aux Podcasteur·euses du Sud"),
    description:
      "Créez votre fiche dans l'annuaire podcast de Région Sud, puis adhérez pour être visible : 20 € par an pour une personne, 100 € pour un studio ou une agence.",
  },
  contact: {
    title: titreSeo("Nous écrire"),
    description:
      "Écrire à l'association Les Podcasteur·euses du Sud, à Marseille : une question sur l'adhésion, un partenariat, la presse ou un projet podcast en Région Sud.",
  },
  proposer: {
    title: titreSeo("Proposer un événement podcast"),
    description:
      "Proposez votre événement podcast en Région Sud : apéro écoute, atelier, live ou rencontre. Envoyé par un·e membre à jour, il est relu sous 48 à 72 heures.",
  },
  ajouterPodcast: {
    title: titreSeo("Ajouter un podcast à ma fiche"),
    description:
      "Ajoutez un ou plusieurs podcasts à votre fiche dans l'annuaire des Podcasteur·euses du Sud, à Marseille et en Région Sud : pochette, lien d'écoute et flux.",
  },
  mentions: {
    title: titreSeo("Mentions légales"),
    description:
      "Mentions légales du site des Podcasteur·euses du Sud, association loi 1901 à Marseille : éditeur, direction de la publication, hébergeurs du site et de la base.",
  },
  confidentialite: {
    title: titreSeo("Politique de confidentialité"),
    description:
      "Comment l'association Les Podcasteur·euses du Sud, à Marseille, collecte, utilise, conserve et protège vos données personnelles, et comment exercer vos droits.",
  },
  cgu: {
    title: titreSeo("Conditions d'utilisation"),
    description:
      "Conditions d'utilisation du site des Podcasteur·euses du Sud, à Marseille : soumission des podcasts, mise en relation entre membres, propositions d'événements.",
  },
  cookies: {
    title: titreSeo("Politique de cookies"),
    description:
      "Les cookies du site des Podcasteur·euses du Sud, réseau podcast de Marseille et de Région Sud : seulement ceux nécessaires au site, sans pistage publicitaire.",
  },
} as const;
