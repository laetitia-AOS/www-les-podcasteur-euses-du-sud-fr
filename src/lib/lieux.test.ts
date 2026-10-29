import { describe, it, expect } from "vitest";
import { SERVICES_STUDIO, formatTarif, phraseDevisEnvoye, tarifAffiche } from "./lieux";

describe("studios", () => {
  it("propose exactement les 7 services demandés", () => {
    expect(SERVICES_STUDIO.map((s) => s.label)).toEqual([
      "Location du studio", "Enregistrement audio", "Vidéo-podcast", "Montage", "Réalisation", "Direct", "Studio mobile",
    ]);
  });
  it("affiche le tarif indicatif « à partir de … € / heure »", () => {
    expect(formatTarif(48, "heure", "TTC")).toBe("à partir de 48 € TTC / h");
    expect(formatTarif(300, "demi_journee", "HT")).toBe("à partir de 300 € HT / demi-journée");
    expect(formatTarif(500, "jour", "TTC")).toBe("à partir de 500 € TTC / jour");
    expect(formatTarif(null)).toBeNull();
  });
  it("confirme le nombre de studios contactés", () => {
    expect(phraseDevisEnvoye(4)).toBe("Votre demande est partie vers 4 studios.");
    expect(phraseDevisEnvoye(1)).toBe("Votre demande est partie vers 1 studio.");
  });
});

import { prixDepuisTarif } from "./events";
describe("tarif des événements", () => {
  it("lit le prix pour les moteurs de recherche", () => {
    expect(prixDepuisTarif("5 €")).toBe(5);
    expect(prixDepuisTarif("Adhérent·es : 0 €")).toBe(0);
    expect(prixDepuisTarif("Prix libre")).toBe(0);
    expect(prixDepuisTarif("Sur réservation")).toBeNull();
  });
});

describe("tarif d'un studio", () => {
  it("sans montant : « Sur devis »", () => {
    expect(tarifAffiche({ tarif_heure: null, tarif_unite: null, tarif_taxe: null })).toBe("Sur devis");
    expect(tarifAffiche({ tarif_heure: 48, tarif_unite: "heure", tarif_taxe: "TTC" })).toBe("à partir de 48 € TTC / h");
  });
});
