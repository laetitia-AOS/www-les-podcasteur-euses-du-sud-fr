import { describe, expect, it } from "vitest";
import { formateurs, type FicheFormation } from "./formation";

const fiche = (o: Partial<FicheFormation>): FicheFormation => ({
  id: Math.random().toString(36).slice(2),
  slug: null, prenom: "Camille", nom: "Fictif", type_profil: "podcasteur", nom_podcast: "Podcast A",
  metier_principal: null, city_name: "Marseille 6e Arrondissement", vignette_url: null,
  apporte_choix: ["formation"], created_at: "2026-01-01", ...o,
});

describe("membres qui forment au podcast", () => {
  it("seules les fiches qui ont coché « Formation » apparaissent", () => {
    const liste = formateurs([fiche({}), fiche({ prenom: "Alex", apporte_choix: ["studio"] })]);
    expect(liste.map((f) => f.nom)).toEqual(["Camille Fictif"]);
  });

  it("une personne avec plusieurs podcasts n'apparaît qu'une fois, avec son profil et tous ses podcasts", () => {
    const liste = formateurs([
      fiche({ nom_podcast: "Podcast B", created_at: "2026-03-01" }),
      fiche({ type_profil: "pro_podcast", nom_podcast: "—", metier_principal: "Réalisation / production", slug: "camille-fictif", created_at: "2026-02-01" }),
      fiche({ nom_podcast: "Podcast A", created_at: "2026-01-01" }),
    ]);
    expect(liste).toHaveLength(1);
    expect(liste[0].fiche.slug).toBe("camille-fictif");
    expect(liste[0].role).toBe("Réalisation / production");
    expect(liste[0].podcasts).toEqual(["Podcast A", "Podcast B"]);
    expect(liste[0].ville).toBe("Marseille");
  });

  it("les membres sont mélangés à chaque tirage, jamais classés de A à Z, et personne n'est perdu", () => {
    const prenoms = ["Zoe", "Adam", "Marine", "Bastien", "Lila", "Karim"];
    const fiches = prenoms.map((prenom) => fiche({ prenom }));
    const t1 = formateurs(fiches, () => 0).map((f) => f.nom);
    const t2 = formateurs(fiches, () => 0.99).map((f) => f.nom);
    const alpha = [...t1].sort((a, b) => a.localeCompare(b, "fr"));
    expect(t1).not.toEqual(alpha);
    expect(t2).not.toEqual(alpha);
    expect(t2).not.toEqual(t1);
    // Un tirage « maison » comme un tirage par défaut gardent tous les membres, une fois chacun.
    expect([...t1].sort()).toEqual(alpha);
    expect(formateurs(fiches).map((f) => f.nom).sort()).toEqual(alpha);
  });
});
