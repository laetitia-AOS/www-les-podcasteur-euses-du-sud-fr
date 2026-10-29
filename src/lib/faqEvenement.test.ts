import { describe, expect, it } from "vitest";
import { faqPourEvenement } from "./faqEvenement";

describe("questions fréquentes d'un événement", () => {
  it("affiche celles écrites par l'équipe pour l'événement", () => {
    const f = faqPourEvenement({ faq: [{ q: "Parking ?", r: "Oui, rue de Lodi." }, { q: "Vide", r: "" }] }, true);
    expect(f).toEqual([{ q: "Parking ?", r: "Oui, rue de Lodi." }]);
  });
  it("sinon les réponses habituelles pour un événement de l'association", () => {
    expect(faqPourEvenement({ faq: null }, true)).toHaveLength(4);
    expect(faqPourEvenement({ faq: null }, false)).toHaveLength(0);
  });
});
