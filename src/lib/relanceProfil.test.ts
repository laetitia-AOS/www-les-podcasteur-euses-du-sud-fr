import { describe, expect, it } from "vitest";
import { manquesDetectes, relanceRecente, type ProfilACompleter } from "./relanceProfil";

const p = (o: Partial<ProfilACompleter> = {}): ProfilACompleter => ({
  email: "test@exemple.fr", nom: "Test", type_profil: "podcasteur", fiche_validee: true, sans_photo: false,
  podcasts_sans_pochette: [], podcasts_sans_rss: [], sans_collab: false, derniere_relance: null, nb_relances: 0, ...o,
});

describe("relance fiche à compléter", () => {
  it("coche d'office la photo de profil quand elle manque", () => {
    expect(manquesDetectes(p({ sans_photo: true }))).toEqual(["photo"]);
  });
  it("coche les quatre manques quand rien n'est rempli", () => {
    expect(manquesDetectes(p({ sans_photo: true, podcasts_sans_pochette: ["A"], podcasts_sans_rss: ["A"], sans_collab: true })))
      .toEqual(["photo", "pochette", "rss", "collab"]);
  });
  it("ne coche rien pour une fiche complète", () => {
    expect(manquesDetectes(p())).toEqual([]);
  });
  it("pas de deuxième relance dans les 24 heures", () => {
    const now = new Date("2026-10-29T14:00:00Z").getTime();
    expect(relanceRecente(p({ derniere_relance: "2026-10-29T08:00:00Z" }), now)).toBe(true);
    expect(relanceRecente(p({ derniere_relance: "2026-10-28T13:00:00Z" }), now)).toBe(false);
  });
});
