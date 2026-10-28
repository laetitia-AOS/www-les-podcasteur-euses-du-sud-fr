import { describe, it, expect } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("export tableur", () => {
  it("neutralise une formule saisie dans un formulaire", () => {
    expect(csvCell('=HYPERLINK("http://x","clic")')).toBe(`"'=HYPERLINK(""http://x"",""clic"")"`);
    expect(csvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
    expect(csvCell("-2+3")).toBe(`"'-2+3"`);
  });

  it("laisse un texte ordinaire intact", () => {
    expect(csvCell("Marie Dupont")).toBe(`"Marie Dupont"`);
    expect(toCsv([["a", null], [1, "b"]])).toBe(`"a",""\n"1","b"`);
  });
});
