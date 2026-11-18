import { describe, expect, it } from "vitest";
import { PAGES_PODCASTS_LOCALES, PAGE_STUDIOS_MARSEILLE, dansZone, evenementDansZone } from "./pagesLocales";

const marseille = PAGES_PODCASTS_LOCALES.find((p) => p.cle === "podcastMarseille")!;
const coteAzur = PAGES_PODCASTS_LOCALES.find((p) => p.cle === "podcastCoteAzur")!;

describe("pages locales", () => {
  it("Marseille compte les arrondissements, pas les autres villes des Bouches-du-Rhône", () => {
    expect(dansZone(marseille, { city_name: "Marseille 6e Arrondissement", department_code: "13" })).toBe(true);
    expect(dansZone(marseille, { city_name: "Aix-en-Provence", department_code: "13" })).toBe(false);
  });
  it("la Côte d'Azur prend tout le département 06", () => {
    expect(dansZone(coteAzur, { city_name: "Antibes", department_code: "06" })).toBe(true);
    expect(dansZone(coteAzur, { city_name: "Villeneuve-Loubet", department_code: "06" })).toBe(true);
    expect(dansZone(coteAzur, { city_name: "Saint-Raphaël", department_code: "83" })).toBe(false);
  });
  it("les adresses visent les recherches « podcast » et « studio podcast » + ville", () => {
    expect(marseille.chemin).toBe("/podcast-marseille");
    expect(PAGE_STUDIOS_MARSEILLE.chemin).toBe("/studio-podcast-marseille");
  });
});

describe("rendez-vous d'une page locale", () => {
  it("lit la ville et le département dans l'adresse", () => {
    expect(evenementDansZone(marseille, { adresse: "12 rue Sainte, 13001 Marseille" })).toBe(true);
    expect(evenementDansZone(coteAzur, { adresse: "3 place Garibaldi, 06300 Nice" })).toBe(true);
    expect(evenementDansZone(marseille, { adresse: "3 place Garibaldi, 06300 Nice" })).toBe(false);
  });
});
