import { describe, expect, it } from "vitest";
import { liensLieu, trierEvenementsLieu } from "./lieux";

describe("liens d'un studio ou d'une structure", () => {
  it("n'affiche un même lien qu'une fois et ne répète jamais « Site »", () => {
    const l = liensLieu("https://www.parla-studio.fr", [
      { label: "LinkedIn", url: "https://www.linkedin.com/company/parla-studio/" },
      { label: "Instagram", url: "https://www.instagram.com/parlastudiomarseille/" },
      { label: "Site", url: "https://www.agencesonore.fr" },
      { label: "Site", url: "https://parla-studio.fr/" },
    ], ["https://www.linkedin.com/company/parla-studio"]);
    expect(l.map((x) => x.label)).toEqual(["Site", "LinkedIn", "Instagram", "agencesonore.fr"]);
    expect(l.filter((x) => x.label === "Site")).toHaveLength(1);
  });
});

describe("« À l'agenda » d'un lieu", () => {
  it("met les événements à venir d'abord, puis les passés", () => {
    const now = Date.parse("2026-10-29T12:00:00Z");
    const e = (id: string, d: string) => ({ id, titre: id, slug: id, date_debut: d, date_fin: null, lieu: null });
    const { aVenir, passes } = trierEvenementsLieu([e("juin", "2026-06-20T07:00:00Z"), e("dec", "2026-12-01T18:00:00Z"), e("nov", "2026-11-09T17:30:00Z"), e("mai", "2026-05-06T17:00:00Z")], now);
    expect(aVenir.map((x) => x.id)).toEqual(["nov", "dec"]);
    expect(passes.map((x) => x.id)).toEqual(["juin", "mai"]);
  });
});
