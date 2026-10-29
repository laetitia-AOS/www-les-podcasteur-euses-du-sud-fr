import { describe, expect, it } from "vitest";
import { anneeEnCours, anneePourPaiement, libelleValidite, lienRenouveler, periodeRenouvellement } from "./espaceMembre";

describe("adhésion à l'année civile", () => {
  it("un paiement couvre l'année en cours, quelle que soit la date", () => {
    expect(anneePourPaiement(null, new Date("2026-03-05T12:00:00Z"))).toBe(2026);
    expect(anneePourPaiement(null, new Date("2026-12-15T12:00:00Z"))).toBe(2026);
  });
  it("un membre déjà à jour qui paie en décembre renouvelle pour l'année suivante", () => {
    expect(anneePourPaiement(2026, new Date("2026-12-02T12:00:00Z"))).toBe(2027);
  });
  it("en janvier, un membre de l'année précédente renouvelle pour l'année en cours", () => {
    expect(anneePourPaiement(2026, new Date("2027-01-10T12:00:00Z"))).toBe(2027);
  });
  it("l'année se calcule à l'heure de Paris (31 décembre 23 h 30 à Paris = encore l'année en cours)", () => {
    expect(anneeEnCours(new Date("2026-12-31T22:30:00Z"))).toBe(2026);
    expect(anneeEnCours(new Date("2026-12-31T23:30:00Z"))).toBe(2027);
  });
  it("le renouvellement est proposé à partir du 1er décembre", () => {
    expect(periodeRenouvellement(new Date("2026-11-30T12:00:00Z"))).toBe(false);
    expect(periodeRenouvellement(new Date("2026-12-01T12:00:00Z"))).toBe(true);
  });
  it("affiche la fin de validité au 31 décembre", () => {
    expect(libelleValidite(2026)).toBe("Valable jusqu'au 31 décembre 2026");
  });
  it("le lien Renouveler garde la formule et l'année couverte", () => {
    expect(lienRenouveler("studio", 2027)).toBe("/rejoindre-association?etape=adhesion&formule=studio&pour=2027");
    expect(lienRenouveler(null)).toBe("/rejoindre-association?etape=adhesion");
  });
});
