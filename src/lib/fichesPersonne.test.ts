import { describe, expect, it } from "vitest";
import { fichesARetirer } from "./fichesPersonne";

const fiches = [
  { id: "profil", email: "alix@exemple.fr" },
  { id: "podcast1", email: "Alix@Exemple.fr " },
  { id: "studio", email: "alix@exemple.fr" },
  { id: "autre", email: "sam@exemple.fr" },
];

describe("retirer une fiche de l'annuaire", () => {
  it("retire aussi les podcasts et le studio de la même personne", () => {
    expect(fichesARetirer(fiches, fiches[0]).sort()).toEqual(["podcast1", "profil", "studio"]);
  });
  it("ne touche pas aux fiches d'une autre personne", () => {
    expect(fichesARetirer(fiches, fiches[3])).toEqual(["autre"]);
  });
});
