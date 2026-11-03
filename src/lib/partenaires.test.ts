import { describe, expect, it } from "vitest";
import { domaineAffiche, lienSite, trierPartenaires } from "./partenaires";

describe("partenaires", () => {
  it("rend le nom cliquable seulement si un site est renseigné", () => {
    expect(lienSite(null)).toBeNull();
    expect(lienSite("  ")).toBeNull();
    expect(lienSite("maritima.fr")).toBe("https://maritima.fr");
    expect(lienSite("https://maritima.fr/")).toBe("https://maritima.fr/");
  });

  it("affiche les partenaires dans l'ordre choisi en admin, puis par nom", () => {
    const tries = trierPartenaires([
      { nom: "PodOuest", ordre: 3 },
      { nom: "Maritima", ordre: 1 },
      { nom: "CultureShock", ordre: 1 },
    ]);
    expect(tries.map((p) => p.nom)).toEqual(["CultureShock", "Maritima", "PodOuest"]);
  });

  it("affiche l'adresse du site sans https ni www", () => {
    expect(domaineAffiche("https://www.maritima.fr/")).toBe("maritima.fr");
  });
});
