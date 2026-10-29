import { describe, expect, it } from "vitest";
import { membresDeLaVue, type MembreAdmin } from "./AdminMembres";

const m = (email: string, etat: string, nb_fiches: number) =>
  ({ email, nom: email, type_profil: "podcasteur", formule: "personne", etat, annee: null, montant: 20, date_paiement: null, adhesion_id: null, nb_fiches, fiche_validee: true, fiche_visible: true, sursis: false }) as MembreAdmin;

const tous = [
  m("ajour@x.fr", "a_jour", 1), m("ajour-sans-fiche@x.fr", "a_jour", 0), m("verif@x.fr", "verification", 1),
  m("ancien@x.fr", "terminee", 1), m("ancien-sans-fiche@x.fr", "terminee", 0), m("jamais@x.fr", "sans_adhesion", 1),
];
const emails = (v: Parameters<typeof membresDeLaVue>[1]) => membresDeLaVue(tous, v).map((x) => x.email);

describe("onglets de la rubrique Membres", () => {
  it("membres de l'année : seulement ceux qui ont une fiche", () => {
    expect(emails("annee")).toEqual(["ajour@x.fr", "verif@x.fr"]);
  });
  it("anciens membres : adhésion terminée, avec ou sans fiche", () => {
    expect(emails("anciens")).toEqual(["ancien@x.fr", "ancien-sans-fiche@x.fr"]);
  });
  it("fiches sans adhésion : fiche mais aucun paiement", () => {
    expect(emails("sans")).toEqual(["jamais@x.fr"]);
  });
});
