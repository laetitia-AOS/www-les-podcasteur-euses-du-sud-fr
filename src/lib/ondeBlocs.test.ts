import { describe, expect, it } from "vitest";
import { manquesPublication, moisPrecedent, nouveauBloc, periodeAdhesions, TYPES_BLOCS, type Bloc, type NumeroOnde } from "./onde";
import { dansLesJours, filtrerPodcasts, ligneBilan, ligneSansFiche, origineEvenement } from "./ondeBlocs";

const base: NumeroOnde = {
  id: "00000000-0000-0000-0000-000000000001",
  numero: 1,
  mois: "2026-12-01",
  titre: "Le Sud a des voix",
  chapeau: "Un atelier-écoute, trois podcasts d'ici et les chiffres du trimestre.",
  slug: "n1-decembre-2026",
  couverture_url: "https://x.supabase.co/functions/v1/onde-media/00000000-0000-0000-0000-000000000001/a.jpg",
  couverture_alt: "Trois membres au micro",
  audio_url: null,
  audio_voix: null,
  blocs: [],
  statut: "brouillon",
  publie_le: null,
  updated_at: "2026-11-14T10:00:00Z",
};
const avec = (b: Bloc) => manquesPublication({ ...base, blocs: [b] });

describe("L'Onde du Sud — blocs automatiques", () => {
  it("les quatre nouveaux blocs sont dans la liste « Ajouter un bloc », le trimestre avec la mention « chaque trimestre »", () => {
    const types = TYPES_BLOCS.map((t) => t.type);
    expect(types).toEqual(expect.arrayContaining(["evenements", "podcast", "nouveaux_membres", "trimestre"]));
    expect(TYPES_BLOCS.find((t) => t.type === "trimestre")?.mention).toBe("chaque trimestre");
  });

  it("événements : proposés par défaut sur les 60 prochains jours", () => {
    const maintenant = new Date("2026-11-14T10:00:00Z");
    expect(dansLesJours({ date_debut: "2027-01-12T18:00:00Z" }, undefined, maintenant)).toBe(true);
    expect(dansLesJours({ date_debut: "2027-01-14T18:00:00Z" }, undefined, maintenant)).toBe(false);
  });

  it("événements : « Organisé par PDS » ou « Proposé par [membre] »", () => {
    expect(origineEvenement({ origine: "pds", propose_par_nom: null })).toBe("Organisé par PDS");
    expect(origineEvenement({ origine: "membre", propose_par_nom: "marie dupont" })).toBe("Proposé par Marie Dupont");
  });

  it("événements : au moins un coché pour publier, 8 au maximum", () => {
    const b = nouveauBloc("evenements") as Extract<Bloc, { type: "evenements" }>;
    expect(avec(b).join()).toMatch(/au moins un événement/);
    expect(avec({ ...b, evenements: ["a"] })).toEqual([]);
    expect(avec({ ...b, evenements: Array.from({ length: 9 }, (_, i) => `e${i}`) }).join()).toMatch(/8 événements au maximum/);
  });

  it("podcast à l'écoute : un podcast choisi et un texte de présentation pour publier, extrait facultatif", () => {
    const b = nouveauBloc("podcast") as Extract<Bloc, { type: "podcast" }>;
    const m = avec(b).join();
    expect(m).toMatch(/choisissez un podcast/);
    expect(m).toMatch(/texte de présentation/);
    expect(avec({ ...b, podcast_id: "p1", texte: "À écouter au casque." })).toEqual([]);
  });

  it("podcast à l'écoute : recherche sans accents ni majuscules, sur le podcast, la personne ou la ville", () => {
    const liste = [
      { nom_podcast: "Où est Pivoine ?", prenom: "Léa", nom: "Martin", city_name: "Marseille" },
      { nom_podcast: "Radio Calanques", prenom: "Paul", nom: "Durand", city_name: "Aix-en-Provence" },
    ];
    expect(filtrerPodcasts(liste, "pivoine").map((p) => p.prenom)).toEqual(["Léa"]);
    expect(filtrerPodcasts(liste, "LEA marseille").map((p) => p.prenom)).toEqual(["Léa"]);
    expect(filtrerPodcasts(liste, "aix").map((p) => p.prenom)).toEqual(["Paul"]);
    expect(filtrerPodcasts(liste, "")).toHaveLength(2);
  });

  it("nouveaux membres : par défaut le mois qui précède celui du numéro", () => {
    expect(moisPrecedent("2026-12-01")).toBe("2026-11-01");
    expect(moisPrecedent("2027-01-01")).toBe("2026-12-01");
    expect((nouveauBloc("nouveaux_membres", "2027-01-01") as Extract<Bloc, { type: "nouveaux_membres" }>).mois).toBe("2026-12-01");
  });

  it("nouveaux membres : numéro de décembre 2026 → adhésions du 25 octobre au 24 novembre 2026", () => {
    const bloc = nouveauBloc("nouveaux_membres", "2026-12-01") as Extract<Bloc, { type: "nouveaux_membres" }>;
    expect(periodeAdhesions(bloc.mois!)).toEqual({ debut: "2026-10-25", fin: "2026-11-24", texte: "Adhésions du 25 octobre au 24 novembre" });
  });

  it("nouveaux membres : numéro de janvier 2027 → adhésions du 25 novembre au 24 décembre 2026", () => {
    const bloc = nouveauBloc("nouveaux_membres", "2027-01-01") as Extract<Bloc, { type: "nouveaux_membres" }>;
    expect(periodeAdhesions(bloc.mois!)).toMatchObject({ debut: "2026-11-25", fin: "2026-12-24" });
  });

  it("nouveaux membres : numéro de février 2027 → adhésions du 25 décembre 2026 au 24 janvier 2027", () => {
    expect(periodeAdhesions("2027-01-01")).toMatchObject({ debut: "2026-12-25", fin: "2027-01-24" });
  });

  it("nouveaux membres : nombre d'adhésions écartées faute de fiche, sans nom", () => {
    expect(ligneSansFiche(2)).toBe("2 nouvelles adhésions sans fiche, non citées");
    expect(ligneSansFiche(1)).toBe("1 nouvelle adhésion sans fiche, non citée");
    expect(ligneBilan({ nouveaux: 3, affiches: ["a"] })).toBe("3 nouvelles adhésions sur la période, 1 membre cité·e");
  });

  it("le trimestre du collectif : étiquette fixée, un texte et de 2 à 4 chiffres", () => {
    const b = nouveauBloc("trimestre") as Extract<Bloc, { type: "trimestre" }>;
    expect(b.rubrique).toBe("Le trimestre du collectif");
    const c = { valeur: "12", libelle: "ateliers" };
    expect(avec({ ...b, texte: "Trois mois de rencontres.", chiffres: [c, c] })).toEqual([]);
    expect(avec({ ...b, texte: "", chiffres: [c, c] }).join()).toMatch(/le texte/);
    expect(avec({ ...b, texte: "Bilan", chiffres: [c] }).join()).toMatch(/de 2 à 4/);
    expect(avec({ ...b, texte: "Bilan", chiffres: [c, c, c, c, c] }).join()).toMatch(/de 2 à 4/);
  });
});
