import { describe, expect, it } from "vitest";
import { PAGES_SEO, SITE_NAME, descriptionSeo, ficheHref, titreSeo } from "./seo";

describe("adresses des fiches", () => {
  it("un podcast est sous /ecouter", () => {
    expect(ficheHref({ id: "1", slug: "vitamine-sud", type_profil: "podcasteur", nom_podcast: "Vitamine Sud" })).toBe("/ecouter/vitamine-sud");
  });
  it("un·e pro de l'audio est sous /annuaire", () => {
    expect(ficheHref({ id: "1", slug: "alix-martin", type_profil: "pro_podcast", nom_podcast: null })).toBe("/annuaire/alix-martin");
  });
  it("un studio est sous /studios", () => {
    expect(ficheHref({ id: "1", slug: "studio-x", type_profil: "studio" })).toBe("/studios/studio-x");
  });
  it("une structure est sous /structures", () => {
    expect(ficheHref({ id: "1", slug: "radio-y", type_profil: "structure_eco" })).toBe("/structures/radio-y");
  });
});

describe("titres et descriptions", () => {
  it("le nom du site suit le titre, séparé par un tiret", () => {
    expect(titreSeo("Agenda")).toBe(`Agenda — ${SITE_NAME}`);
  });
  it("le titre de l'accueil ne se termine pas par le nom du site", () => {
    expect(PAGES_SEO.accueil.title.endsWith(`— ${SITE_NAME}`)).toBe(false);
  });
  it("chaque page générale a une description de 140 à 160 caractères", () => {
    for (const [page, { description }] of Object.entries(PAGES_SEO)) {
      expect({ page, ok: description.length >= 140 && description.length <= 160 }).toEqual({ page, ok: true });
    }
  });
  it("titres et descriptions sont tous différents", () => {
    const pages = Object.values(PAGES_SEO);
    expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);
  });
  it("une description trop courte est complétée jusqu'à 140 caractères au moins", () => {
    const d = descriptionSeo(["Vitamine Sud, podcast d'Alix Martin à Marseille."]);
    expect(d.length).toBeGreaterThanOrEqual(140);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.startsWith("Vitamine Sud, podcast d'Alix Martin à Marseille.")).toBe(true);
  });
  it("une description trop longue est coupée à 160 caractères au plus", () => {
    const d = descriptionSeo(["Studio X, studio podcast à Nice.", "a".repeat(30) + " " + "mot ".repeat(80)]);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.length).toBeGreaterThanOrEqual(140);
  });
});
