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

describe("lot 4 : titres et dates sur plusieurs jours", () => {
  it("titre en casse normale, sans point d'exclamation ni émoji", async () => {
    const { readableTitle } = await import("./events");
    expect(readableTitle("LA CLAQUE PODCAST PARTY !")).toBe("La claque podcast party");
    expect(readableTitle("Apéro-écoute d'avril !")).toBe("Apéro écoute d'avril");
    expect(readableTitle("🎧 Apéro/Ecoute")).toBe("Apéro écoute");
  });
  it("émojis retirés à l'enregistrement, accents gardés", async () => {
    const { sansEmojis } = await import("./events");
    expect(sansEmojis("Soirée écoute 🎙️✨ à Marseille")).toBe("Soirée écoute à Marseille");
  });
  it("19 et 20 juin affichés « 19–20.06 » et « Du 19 au 20 juin 2026 »", async () => {
    const { jourCourt, dateLongue } = await import("./events");
    expect(jourCourt("2026-06-19T07:00:00Z", "2026-06-20T19:00:00Z")).toBe("19–20.06");
    expect(jourCourt("2026-11-09T17:30:00Z", "2026-11-09T20:30:00Z")).toBe("09.11");
    // Soirée qui finit à minuit : un seul jour
    expect(jourCourt("2026-06-19T07:00:00Z", "2026-06-19T22:00:00Z")).toBe("19.06");
    expect(dateLongue("2026-06-19T07:00:00Z", "2026-06-20T19:00:00Z")).toBe("Du 19 au 20 juin 2026");
  });
});
