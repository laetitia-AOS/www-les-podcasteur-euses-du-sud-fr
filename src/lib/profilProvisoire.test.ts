import { describe, expect, it } from "vitest";
import { aUnPodcast } from "./pds";
import { chiffresAccueil, piocherMur } from "@/components/home/useHomeData";

// Un·e podcasteur·euse qui s'arrête après l'étape « profil » garde une fiche « — » :
// elle compte comme personne, jamais comme podcast.
describe("profil enregistré sans podcast", () => {
  it("une fiche « — » n'est pas un podcast", () => {
    expect(aUnPodcast({ type_profil: "podcasteur", nom_podcast: "—" })).toBe(false);
  });

  it("une fiche avec un vrai nom de podcast en est un", () => {
    expect(aUnPodcast({ type_profil: "podcasteur", nom_podcast: "Le Sud a des voix" })).toBe(true);
  });

  it("l'accueil compte la personne mais pas de podcast", () => {
    const c = chiffresAccueil([
      { type_profil: "podcasteur", nom_podcast: "—" },
      { type_profil: "podcasteur", nom_podcast: "Podcast A" },
    ] as never);
    expect(c.personnes).toBe(2);
    expect(c.podcasts).toBe(1);
  });

  it("le mur de pochettes ignore une fiche « — »", () => {
    const mur = piocherMur([
      { type_profil: "podcasteur", nom_podcast: "—", vignette_url: "https://x/photo.jpg" },
    ]);
    expect(mur).toHaveLength(0);
  });
});
