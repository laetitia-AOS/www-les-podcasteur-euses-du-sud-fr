import { describe, expect, it } from "vitest";
import { heureParis, horairesParis, isoParis } from "./events";
import { DEPARTEMENTS_PDS, EVENT_TYPE_LABELS, chiffresAccueil } from "@/components/home/useHomeData";

// Atelier-écoute du 9 novembre 2026 : enregistré en heure universelle (17h30–20h30)
const DEBUT = "2026-11-09T17:30:00+00:00";
const FIN = "2026-11-09T20:30:00+00:00";

describe("horaires des événements, à l'heure de Paris", () => {
  it("affiche 18h30–21h30 pour l'atelier du 9 novembre", () => {
    expect(heureParis(DEBUT)).toBe("18h30");
    expect(horairesParis(DEBUT, FIN)).toBe("18h30–21h30");
  });
  it("donne aux données structurées l'heure de Paris avec son décalage", () => {
    expect(isoParis(DEBUT)).toBe("2026-11-09T18:30:00+01:00");
    expect(isoParis("2026-07-09T16:30:00Z")).toBe("2026-07-09T18:30:00+02:00");
  });
  it("affiche le type « Atelier-écoute »", () => {
    expect(EVENT_TYPE_LABELS.apero_ecoute).toBe("Atelier-écoute");
    expect(EVENT_TYPE_LABELS.atelier).toBe("Atelier");
  });
});

describe("chiffres de l'accueil", () => {
  it("compte personnes = podcasteur·euses + acteur·ices + soutiens, podcasts et studios", () => {
    const fiches = [
      ...Array(29).fill({ type_profil: "podcasteur" }),
      ...Array(6).fill({ type_profil: "pro_podcast" }),
      ...Array(2).fill({ type_profil: "soutien" }),
      ...Array(2).fill({ type_profil: "studio" }),
      ...Array(2).fill({ type_profil: "structure_eco" }),
    ];
    expect(chiffresAccueil(fiches)).toEqual({ personnes: 37, podcasts: 29, studios: 2 });
  });
  it("garde 6 départements, le territoire de l'association", () => {
    expect(DEPARTEMENTS_PDS).toBe(6);
  });
});
