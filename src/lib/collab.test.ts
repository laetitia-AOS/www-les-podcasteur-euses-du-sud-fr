import { describe, it, expect } from "vitest";
import { COLLAB_CHOIX, phraseApportent } from "./inscription";

describe("choix « Je cherche / J'apporte »", () => {
  it("propose exactement les 12 choix demandés", () => {
    expect(COLLAB_CHOIX.map((c) => c.label)).toEqual([
      "Voix off", "Montage", "Mixage", "Stratégie", "Co-production d'un format", "Être invité·e",
      "Recevoir des invité·es", "Sponsors et partenaires", "Organisation d'événements", "Formation", "Studio", "Autre",
    ]);
  });

  it("phrase de résultat de l'annuaire", () => {
    expect(phraseApportent(3, ["montage"])).toBe("3 profils apportent montage");
    expect(phraseApportent(1, ["voix_off"])).toBe("1 profil apporte voix off");
    expect(phraseApportent(4, ["montage", "mixage"])).toBe("4 profils apportent montage ou mixage");
  });
});
