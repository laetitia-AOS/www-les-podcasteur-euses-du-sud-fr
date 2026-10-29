import { describe, expect, it } from "vitest";
import { destinatairesRelance, messageRelance } from "./RelanceCollective";
import type { MembreAdmin } from "./AdminMembres";

const m = (email: string, etat: string, annee: number | null, sursis = false) =>
  ({ email, nom: email, type_profil: "podcasteur", formule: "personne", etat, annee, montant: 20, date_paiement: null, adhesion_id: null, nb_fiches: 1, fiche_validee: true, fiche_visible: true, sursis }) as MembreAdmin;

const membres = [m("a@x.fr", "a_jour", 2026), m("b@x.fr", "a_jour", 2027), m("c@x.fr", "tolerance", 2026), m("d@x.fr", "sans_adhesion", null, true)];

describe("relances collectives", () => {
  it("1er et 20 décembre : membres de l'année pas encore renouvelés", () => {
    expect(destinatairesRelance("1dec", membres, 2026).map((x) => x.email)).toEqual(["a@x.fr"]);
    expect(messageRelance("1dec", 2026).sujet).toBe("Renouvelez votre adhésion pour 2027");
  });
  it("15 janvier : membres de l'année passée qui n'ont pas renouvelé", () => {
    expect(destinatairesRelance("15jan", membres, 2027).map((x) => x.email)).toEqual(["a@x.fr", "c@x.fr"]);
    expect(messageRelance("15jan", 2027).corps).toContain("pour=2027");
  });
  it("le lien mène au paiement de l'année suivante en décembre", () => {
    expect(messageRelance("20dec", 2026).corps).toContain("/rejoindre-association?etape=adhesion&pour=2027");
  });
  it("fiches en attente d'adhésion", () => {
    expect(destinatairesRelance("sursis", membres, 2026).map((x) => x.email)).toEqual(["d@x.fr"]);
  });
});
