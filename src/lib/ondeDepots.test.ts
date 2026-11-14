// Règles des dépôts des membres pour L'Onde du Sud (lot 5), sur des données fictives.
import { describe, expect, it } from "vitest";
import {
  CASE_ACCORD, CASE_DROITS, TYPES_DEPOT, compteurAdminDepots, creditDepot, erreursDepot, etiquetteDepot, phraseDepots,
  statutMembre, texteEncartDepot, type ChampsDepot,
} from "./ondeDepots";
import { cheminFichier, fichiersNumero, manquesPublication, TYPES_BLOCS, type NumeroOnde } from "./onde";
import {
  LIEN_DEPOSER, emailDeposant, emailNumero, phraseDepots as phraseEmail, type ContexteEmail, type NumeroEmail,
} from "../../supabase/functions/_shared/onde-email";

const DEPOT = "44444444-4444-4444-4444-444444444444";
const media = (f: string) => `https://exemple.supabase.co/functions/v1/onde-media/depots/${DEPOT}/${f}`;

const champs: ChampsDepot = {
  type: "son", titre: "Le port à l'aube", texte: "Un micro posé sur le quai.", son: "lien", audio: null,
  lien: "https://exemple.invalid/ecoute", photo: null, retirerPhoto: false, droits: true, accord: true,
};

describe("formulaire de dépôt", () => {
  it("propose les cinq choix, chacun avec son étiquette de rubrique", () => {
    expect(TYPES_DEPOT.map((t) => t.id)).toEqual(["son", "ecoute", "projet", "coulisses", "appel"]);
    expect(etiquetteDepot("son")).toBe("À l'écoute");
    expect(etiquetteDepot("coulisses")).toBe("Les coulisses");
    expect(etiquetteDepot("appel")).toBe("Dans notre agenda");
  });

  it("les deux cases sont obligatoires", () => {
    expect(erreursDepot(champs)).toEqual({});
    expect(erreursDepot({ ...champs, droits: false }).droits).toBeTruthy();
    expect(erreursDepot({ ...champs, accord: false }).accord).toBeTruthy();
    expect(CASE_DROITS).toBe("Je suis l'auteur·ice de ce son ou j'ai les droits pour le diffuser");
    expect(CASE_ACCORD).toBe("J'accepte que ce dépôt soit publié dans L'Onde du Sud, avec mon nom et un lien vers ma page");
  });

  it("texte limité à 500 caractères, son obligatoire (MP3 de 20 Mo ou lien)", () => {
    expect(erreursDepot({ ...champs, texte: "a".repeat(501) }).texte).toBeTruthy();
    expect(erreursDepot({ ...champs, texte: "a".repeat(500) }).texte).toBeUndefined();
    expect(erreursDepot({ ...champs, lien: "" }).son).toBeTruthy();
    expect(erreursDepot({ ...champs, son: "fichier" }).son).toBeTruthy();
    const gros = { type: "audio/mpeg", size: 20 * 1024 * 1024 + 1 } as File;
    expect(erreursDepot({ ...champs, son: "fichier", audio: gros }).son).toContain("20 Mo");
  });

  it("statut vu par le membre : « Publié dans L'Onde de [mois] » une fois le numéro en ligne", () => {
    expect(statutMembre({ statut: "retenu", publie_mois: "2026-12-01" })).toBe("Publié dans L'Onde de décembre 2026");
    expect(statutMembre({ statut: "nouveau", publie_mois: null })).toBe("Reçu");
  });
});

describe("compteur et encart", () => {
  it("affichent le même nombre de dépôts du mois", () => {
    expect(phraseDepots(3)).toBe("Ce mois-ci, 3 dépôts.");
    expect(phraseDepots(1)).toBe("Ce mois-ci, 1 dépôt.");
    expect(compteurAdminDepots(3)).toBe("3 nouveaux dépôts ce mois-ci");
    expect(texteEncartDepot(3)).toBe("L'Onde du Sud est faite avec les sons de ses membres. Ce mois-ci, 3 dépôts. Dépose le tien avant le 25 pour le prochain numéro.");
    for (const n of [0, 1, 7]) expect(phraseEmail(n)).toBe(phraseDepots(n));
  });
});

describe("bloc « dépôt » dans un numéro", () => {
  const numero: NumeroOnde = {
    id: "11111111-1111-1111-1111-111111111111", numero: 2, mois: "2026-12-01", titre: "T", chapeau: "C", slug: "n2-decembre-2026",
    couverture_url: null, couverture_alt: null, audio_url: null, audio_voix: null, statut: "brouillon", publie_le: null, updated_at: "2026-11-14T10:00:00Z",
    blocs: [{ id: "b1", type: "depot", depot_id: DEPOT, rubrique: "À l'écoute", titre: "", url: media("son.mp3"), photo: { url: media("photo.jpg"), alt: "" } }],
  };

  it("n'est pas dans « Ajouter un bloc » : il se crée depuis « Dépôts du mois »", () => {
    expect(TYPES_BLOCS.find((t) => t.type === "depot")?.horsAjout).toBe(true);
  });

  it("demande titre et texte alternatif de la photo avant publication", () => {
    const m = manquesPublication(numero);
    expect(m.some((x) => x.includes("le titre"))).toBe(true);
    expect(m.some((x) => x.includes("texte alternatif de la photo"))).toBe(true);
  });

  it("ses fichiers sont lus par des liens temporaires tant que le numéro n'est pas publié", () => {
    expect(cheminFichier(media("son.mp3"))).toBe(`depots/${DEPOT}/son.mp3`);
    expect(fichiersNumero(numero)).toEqual([media("son.mp3"), media("photo.jpg")]);
  });

  it("« Déposé par » : lien vers la page seulement si la fiche est visible", () => {
    expect(creditDepot({ depot_id: DEPOT, prenom: "camille", nom: "durand", fiche_id: "p1", slug: "camille-durand", type_profil: "pro_podcast", nom_podcast: null }))
      .toEqual({ nom: "Camille Durand", href: "/annuaire/camille-durand" });
    expect(creditDepot({ depot_id: DEPOT, prenom: "camille", nom: "durand", fiche_id: null, slug: null, type_profil: null, nom_podcast: null })?.href).toBeNull();
  });
});

describe("e-mail du numéro et retour au déposant", () => {
  const n: NumeroEmail = {
    id: "11111111-1111-1111-1111-111111111111", numero: 2, mois: "2026-12-01", titre: "Le Sud au micro", chapeau: "Chapeau.",
    slug: "n2-decembre-2026", couverture_url: null, couverture_alt: null, audio_url: null,
    blocs: [{ id: "b1", type: "depot", depot_id: DEPOT, rubrique: "Les coulisses", titre: "Un silence", texte: "Enregistré à 5 h." }],
  };
  const ctx: ContexteEmail = { evenements: [], podcasts: [], membres: {}, depotsCeMois: 4, deposants: { [DEPOT]: { nom: "Camille Durand", href: "/annuaire/camille-durand" } } };
  const e = emailNumero(n, ctx, { type: "abonne", lienDesinscription: "https://exemple.invalid/d" });

  it("montre « Déposé par [Prénom Nom] » avec le lien vers sa page", () => {
    expect(e.texte).toContain("Déposé par Camille Durand");
    expect(e.html).toContain("Déposé par <a href=\"https://www.les-podcasteur-euses-du-sud.fr/annuaire/camille-durand?utm_source=onde-du-sud");
  });

  it("porte l'encart avec le nombre de dépôts du mois et le bouton « Déposer pour L'Onde »", () => {
    expect(e.texte).toContain("Ce mois-ci, 4 dépôts. Dépose le tien avant le 25 pour le prochain numéro.");
    expect(e.html).toContain("Déposer pour L'Onde");
    expect(e.html).toContain(`${LIEN_DEPOSER}?utm_source=onde-du-sud`);
  });

  it("le déposant reçoit « Ton son « [titre] » est dans L'Onde du Sud de [mois] » avec le lien du numéro", () => {
    const m = emailDeposant(n, { titre: "Un silence", type: "son" });
    expect(m.objet).toBe("Ton son « Un silence » est dans L'Onde du Sud de décembre 2026");
    expect(m.texte).toContain("https://www.les-podcasteur-euses-du-sud.fr/onde/n2-decembre-2026");
    expect(m.html).not.toMatch(/<script/i);
  });
});
