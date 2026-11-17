// Couverture de L'Onde générée depuis la version audio du numéro : règles demandées par l'association.
import { describe, expect, it } from "vitest";
import { nouveauBloc, type Bloc } from "./onde";
import {
  ADRESSE_ONDE, BARRES_COUVERTURE, TAILLES_COUVERTURE, lienAudioAccepte, mentionNumero, niveauxTranches, nomFichierCouverture, titresDansCeNumero,
} from "./ondeCouverture";

describe("couverture de L'Onde", () => {
  it("46 barres, hauteur proportionnelle au niveau sonore de chaque tranche", () => {
    // 46 tranches : silence, puis niveau 0,5, puis niveau 1
    const son = new Float32Array(46 * 100);
    for (let i = 0; i < son.length; i++) {
      const tranche = Math.floor(i / 100);
      son[i] = tranche < 10 ? 0 : tranche < 20 ? 0.5 * (i % 2 ? 1 : -1) : i % 2 ? 1 : -1;
    }
    const n = niveauxTranches([son]);
    expect(BARRES_COUVERTURE).toBe(46);
    expect(n).toHaveLength(46);
    expect(n[0]).toBe(0);
    expect(n[15]).toBeCloseTo(0.5, 5);
    expect(n[45]).toBeCloseTo(1, 5);
  });

  it("deux formats : 1080 × 1350 et 1200 × 630", () => {
    expect(TAILLES_COUVERTURE.portrait).toEqual([1080, 1350]);
    expect(TAILLES_COUVERTURE.partage).toEqual([1200, 630]);
    expect(nomFichierCouverture({ slug: "n1-decembre-2026", numero: 1 }, "partage")).toBe("onde-n1-decembre-2026-couverture-1200x630.png");
  });

  it("« N°X · MOIS ANNÉE » et l'adresse du site", () => {
    expect(mentionNumero({ numero: 1, mois: "2026-12-01" })).toBe("N°1 · DÉCEMBRE 2026");
    expect(ADRESSE_ONDE).toBe("les-podcasteur-euses-du-sud.fr/onde");
  });

  it("« Dans ce numéro » : les titres des 4 premiers blocs", () => {
    const blocs = [
      { ...nouveauBloc("texte"), titre: "Écouter ensemble" },
      { ...nouveauBloc("podcast"), podcast_id: "p1" },
      { ...nouveauBloc("ce_qui_bouge"), titre: "La voix de synthèse" },
      nouveauBloc("evenements"),
      { ...nouveauBloc("texte"), titre: "Cinquième, non repris" },
    ] as Bloc[];
    expect(titresDansCeNumero(blocs, { p1: "Voix du Port" })).toEqual(["Écouter ensemble", "Voix du Port", "La voix de synthèse", "À l'agenda"]);
  });

  it("le son lu ne peut venir que de l'espace privé de L'Onde, jamais d'une adresse extérieure", () => {
    const base = "https://projet.supabase.co";
    expect(lienAudioAccepte(`${base}/storage/v1/object/sign/onde/abc/audio.mp3?token=x`, base)).toBe(true);
    expect(lienAudioAccepte("https://exemple.invalid/son.mp3", base)).toBe(false);
    expect(lienAudioAccepte(`${base}/storage/v1/object/public/event-images/a.png`, base)).toBe(false);
    expect(lienAudioAccepte(`https://projet.supabase.co.exemple.invalid/storage/v1/object/sign/onde/a.mp3`, base)).toBe(false);
  });
});
