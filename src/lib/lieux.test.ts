import { describe, it, expect } from "vitest";
import { SERVICES_STUDIO, formatTarif, phraseDevisEnvoye } from "./lieux";

describe("studios", () => {
  it("propose exactement les 7 services demandés", () => {
    expect(SERVICES_STUDIO.map((s) => s.label)).toEqual([
      "Location du studio", "Enregistrement audio", "Vidéo-podcast", "Montage", "Réalisation", "Direct", "Studio mobile",
    ]);
  });
  it("affiche le tarif indicatif « à partir de … € / heure »", () => {
    expect(formatTarif(45)).toBe("à partir de 45 € / heure");
    expect(formatTarif(null)).toBeNull();
  });
  it("confirme le nombre de studios contactés", () => {
    expect(phraseDevisEnvoye(4)).toBe("Votre demande est partie vers 4 studios.");
    expect(phraseDevisEnvoye(1)).toBe("Votre demande est partie vers 1 studio.");
  });
});
