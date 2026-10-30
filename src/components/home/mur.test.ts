import { describe, expect, it } from "vitest";
import { piocherMur } from "./useHomeData";

const p = (id: string, vignette_url: string | null = `https://img/${id}.jpg`, type_profil = "podcasteur") => ({ id, vignette_url, type_profil });

describe("mur de pochettes de l'accueil", () => {
  it("montre 5 podcasts avec pochette, jamais un studio ni une fiche sans pochette", () => {
    const list = [p("a"), p("b"), p("c"), p("d"), p("e"), p("f"), p("sans", null), p("studio", "x", "studio")];
    const mur = piocherMur(list);
    expect(mur).toHaveLength(5);
    mur.forEach((m) => expect(["a", "b", "c", "d", "e", "f"]).toContain(m.id));
  });
  it("change selon le tirage, au lieu de garder toujours les mêmes", () => {
    const list = ["a", "b", "c", "d", "e", "f", "g"].map((id) => p(id));
    const tirage1 = piocherMur(list, 5, () => 0).map((m) => m.id);
    const tirage2 = piocherMur(list, 5, () => 0.99).map((m) => m.id);
    expect(tirage1).not.toEqual(tirage2);
  });
});
