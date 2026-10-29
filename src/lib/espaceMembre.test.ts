import { describe, expect, it } from "vitest";
import { statutAdhesion } from "./espaceMembre";

const now = new Date("2026-10-28T12:00:00Z");

describe("statut d'adhésion dans l'espace membre", () => {
  it("une adhésion payée en mars 2026 est à jour jusqu'en mars 2027", () => {
    const s = statutAdhesion("2026-03-05T13:43:21Z", now);
    expect(s.etat).toBe("a_jour");
    expect(s.echeance?.toISOString().slice(0, 10)).toBe("2027-03-05");
  });

  it("une adhésion payée avant le 1er janvier 2026 est expirée, même de moins d'un an", () => {
    expect(statutAdhesion("2025-12-10T11:07:06Z", now).etat).toBe("expiree");
  });

  it("une adhésion de 2026 devient expirée un an après le paiement", () => {
    expect(statutAdhesion("2026-02-11T16:06:42Z", new Date("2027-02-12T00:00:00Z")).etat).toBe("expiree");
  });

  it("sans adhésion enregistrée, le statut est « aucune »", () => {
    expect(statutAdhesion(null, now).etat).toBe("aucune");
  });
});

import { joursRestants, lienRenouveler } from "./espaceMembre";
describe("échéance de l'adhésion", () => {
  it("compte les jours restants avant l'échéance", () => {
    expect(joursRestants("2026-11-27T12:00:00Z", now)).toBe(30);
    expect(joursRestants("2026-11-04T12:00:00Z", now)).toBe(7);
    expect(joursRestants("2026-10-20T12:00:00Z", now)).toBeLessThan(0);
  });
  it("le lien Renouveler garde la formule payée", () => {
    expect(lienRenouveler("studio")).toBe("/rejoindre-association?etape=adhesion&formule=studio");
    expect(lienRenouveler(null)).toBe("/rejoindre-association?etape=adhesion");
  });
});
