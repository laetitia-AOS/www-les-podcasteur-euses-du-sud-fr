import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { pageACompter, provenanceDe } from "./stats";

describe("comptage des visites", () => {
  it("ne compte jamais les pages privées (administration, espace membre)", () => {
    expect(pageACompter("/admin")).toBeNull();
    expect(pageACompter("/admin/membres")).toBeNull();
    expect(pageACompter("/espace-membre")).toBeNull();
    expect(pageACompter("/mon-podcast")).toBeNull();
    expect(pageACompter("/reset-password")).toBeNull();
  });

  it("compte les pages publiques sans paramètres ni barre finale", () => {
    expect(pageACompter("/")).toBe("/");
    expect(pageACompter("/Agenda/Atelier-Ecoute/?utm_source=x")).toBe("/agenda/atelier-ecoute");
    expect(pageACompter("/annuaire#filtres")).toBe("/annuaire");
  });

  it("range la provenance par grande famille, jamais l'adresse exacte", () => {
    const site = "www.les-podcasteur-euses-du-sud.fr";
    expect(provenanceDe("https://www.google.fr/search?q=podcast+marseille", site)).toBe("google");
    expect(provenanceDe("https://www.linkedin.com/feed/", site)).toBe("linkedin");
    expect(provenanceDe("https://l.instagram.com/", site)).toBe("instagram");
    expect(provenanceDe("https://www.bing.com/", site)).toBe("bing");
    expect(provenanceDe("", site)).toBe("direct");
    expect(provenanceDe("https://www.les-podcasteur-euses-du-sud.fr/annuaire", site)).toBe("direct");
    expect(provenanceDe("https://un-blog.fr/article", site)).toBe("autre-site");
  });
});
