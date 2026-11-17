import { describe, expect, it } from "vitest";
import {
  altCouverture, articleOndeLd, decouperLigne, deplacer, descriptionOnde, lienHttps, manquesPublication, moisSuivant, nouveauBloc,
  numeroRubrique, numerosAffiches, positionNouveauBloc, slugOnde, titreSeoOnde, type Bloc, type NumeroOnde,
} from "./onde";

const base: NumeroOnde = {
  id: "00000000-0000-0000-0000-000000000001",
  numero: 1,
  mois: "2026-12-01",
  titre: "Le Sud a des voix",
  chapeau: "Un atelier-écoute à CultureShock, trois podcasts d'ici et les chiffres du trimestre.",
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

describe("L'Onde du Sud", () => {
  it("adresse d'un numéro : /onde/n1-decembre-2026", () => {
    expect(slugOnde(1, "2026-12-01")).toBe("n1-decembre-2026");
    expect(slugOnde(12, "2027-08-01")).toBe("n12-aout-2027");
  });

  it("balise titre : « [Titre] — L'Onde du Sud n°[N], [mois année] | Les Podcasteur·euses du Sud »", () => {
    expect(titreSeoOnde(base)).toBe("Le Sud a des voix — L'Onde du Sud n°1, décembre 2026 | Les Podcasteur·euses du Sud");
  });

  it("méta-description tirée du chapeau, entre 140 et 160 caractères, finie par le numéro et le mois", () => {
    const d = descriptionOnde(base);
    expect(d.startsWith(base.chapeau)).toBe(true);
    expect(d.endsWith("L'Onde du Sud n°1, décembre 2026.")).toBe(true);
    expect(d.length).toBeGreaterThanOrEqual(140);
    expect(d.length).toBeLessThanOrEqual(160);
  });

  it("deux numéros au même chapeau (même très long) ont des descriptions différentes", () => {
    const long = { ...base, chapeau: "Un mois de création sonore dans le Sud : ateliers d'écoute, nouveaux podcasts, coulisses de fabrication, rencontres et toutes les dates de l'agenda du réseau." };
    const a = descriptionOnde(long);
    const b = descriptionOnde({ ...long, numero: 2, mois: "2027-01-01" });
    expect(a).not.toBe(b);
    for (const d of [a, b]) { expect(d.length).toBeGreaterThanOrEqual(140); expect(d.length).toBeLessThanOrEqual(160); }
  });

  it("données structurées Article : auteur = l'association, image = couverture", () => {
    const ld = articleOndeLd({ ...base, statut: "publie", publie_le: "2026-12-01T08:00:00Z" });
    expect(ld["@type"]).toBe("Article");
    expect(ld.author).toEqual(expect.objectContaining({ "@type": "Organization", name: "Les Podcasteur·euses du Sud" }));
    expect(ld.image).toEqual([base.couverture_url]);
    expect(ld.datePublished).toBe("2026-12-01T08:00:00Z");
  });

  it("rubriques numérotées automatiquement 01, 02, 03", () => {
    expect([0, 1, 2, 9].map(numeroRubrique)).toEqual(["01", "02", "03", "10"]);
  });

  it("deux flèches : un bloc monte ou descend d'un cran, jamais hors de la liste", () => {
    expect(deplacer(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(deplacer(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(deplacer(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
  });

  it("texte : gras, italique et liens seulement ; le HTML reste du texte, un lien javascript: n'est pas un lien", () => {
    expect(decouperLigne("Un **gras**, un *italique* et [un lien](https://exemple.fr).")).toEqual([
      { t: "texte", v: "Un " }, { t: "gras", v: "gras" }, { t: "texte", v: ", un " }, { t: "italique", v: "italique" },
      { t: "texte", v: " et " }, { t: "lien", v: "un lien", href: "https://exemple.fr" }, { t: "texte", v: "." },
    ]);
    expect(decouperLigne("<b>x</b>")).toEqual([{ t: "texte", v: "<b>x</b>" }]);
    expect(decouperLigne("[piège](javascript:alert(1))").some((m) => m.t === "lien")).toBe(false);
    expect(decouperLigne("[agenda](/agenda)")).toEqual([{ t: "lien", v: "agenda", href: "/agenda" }]);
  });

  it("publication : couverture, titre, chapeau et texte alternatif de la couverture obligatoires", () => {
    expect(manquesPublication(base)).toEqual([]);
    expect(manquesPublication({ ...base, couverture_alt: "" })).toContain("Le texte alternatif de la photo de couverture.");
    expect(manquesPublication({ ...base, titre: "" })).toContain("Le titre du numéro.");
  });

  it("publication : chaque photo d'une galerie a son texte alternatif, de 1 à 6 photos", () => {
    const img = { url: base.couverture_url!, alt: "Une salle rouge" };
    const bloc = (images: { url: string; alt: string }[]) => ({ ...nouveauBloc("images"), rubrique: "En images", images }) as NumeroOnde["blocs"][number];
    expect(manquesPublication({ ...base, blocs: [bloc([img])] })).toEqual([]);
    expect(manquesPublication({ ...base, blocs: [bloc([{ ...img, alt: "" }])] }).join()).toMatch(/texte alternatif/);
    expect(manquesPublication({ ...base, blocs: [bloc([])] }).join()).toMatch(/au moins une photo/);
    expect(manquesPublication({ ...base, blocs: [bloc(Array(7).fill(img))] }).join()).toMatch(/6 photos au maximum/);
  });

  it("chiffres clés : de 2 à 4 couples chiffre + libellé", () => {
    const c = { valeur: "40", libelle: "membres" };
    const bloc = (chiffres: { valeur: string; libelle: string }[]) => ({ ...nouveauBloc("chiffres"), rubrique: "Le trimestre", chiffres }) as NumeroOnde["blocs"][number];
    expect(manquesPublication({ ...base, blocs: [bloc([c, c])] })).toEqual([]);
    expect(manquesPublication({ ...base, blocs: [bloc([c])] }).join()).toMatch(/de 2 à 4/);
    expect(manquesPublication({ ...base, blocs: [bloc([c, c, c, c, c])] }).join()).toMatch(/de 2 à 4/);
  });

  it("nouveau numéro : le mois suivant le dernier numéro", () => {
    expect(moisSuivant("2026-12-01")).toBe("2027-01-01");
    expect(moisSuivant("2027-01-01")).toBe("2027-02-01");
  });
});

import { jetonValide, lienConfirmationOnde, lienDesinscriptionOnde } from "./onde";

describe("abonné·es de L'Onde : liens par jeton", () => {
  it("n'accepte que des jetons au bon format", () => {
    expect(jetonValide("3f2b8c1e-9d4a-4c7b-8e21-5a6f0b9c2d13")).toBe(true);
    expect(jetonValide("abc")).toBe(false);
    expect(jetonValide("")).toBe(false);
    expect(jetonValide(null)).toBe(false);
  });
  it("construit les liens de confirmation et de désinscription sur l'adresse www du site", () => {
    const j = "3f2b8c1e-9d4a-4c7b-8e21-5a6f0b9c2d13";
    expect(lienConfirmationOnde(j)).toBe(`https://www.les-podcasteur-euses-du-sud.fr/onde/confirmer?jeton=${j}`);
    expect(lienDesinscriptionOnde(j)).toBe(`https://www.les-podcasteur-euses-du-sud.fr/onde/desinscription?jeton=${j}`);
  });
});

describe("« Ce qui bouge » et « À l'écoute »", () => {
  const evts = nouveauBloc("evenements");
  const texte = nouveauBloc("texte");
  it("« Ce qui bouge » se place juste après « Les prochains ateliers »", () => {
    const ateliers = { ...evts, rubrique: "Les prochains ateliers" };
    expect(positionNouveauBloc([texte, ateliers, texte], "ce_qui_bouge")).toBe(2);
    // sans cette étiquette : après le premier bloc « Événements de l'agenda »
    expect(positionNouveauBloc([texte, evts, texte, texte], "ce_qui_bouge")).toBe(2);
    expect(positionNouveauBloc([texte, texte], "ce_qui_bouge")).toBe(2);
    // les autres blocs vont toujours à la fin
    expect(positionNouveauBloc([texte, ateliers, texte], "texte")).toBe(3);
  });

  it("« À l'écoute » ne porte pas de numéro, les autres blocs se suivent sans trou", () => {
    const blocs = [texte, nouveauBloc("podcast"), nouveauBloc("ce_qui_bouge"), texte] as Bloc[];
    expect(numerosAffiches(blocs)).toEqual(["01", null, "02", "03"]);
  });

  it("titre et texte obligatoires ; 1 200 caractères au plus ; liens en https seulement", () => {
    const b = { ...nouveauBloc("ce_qui_bouge"), titre: "", texte: "" } as Bloc;
    const m = manquesPublication({ ...base, blocs: [b] });
    expect(m).toEqual(expect.arrayContaining(["Bloc 01 (Ce qui bouge) : le titre.", "Bloc 01 (Ce qui bouge) : le texte."]));
    const trop = { ...b, titre: "T", texte: "a".repeat(1201), source_lien: "http://exemple.invalid" } as Bloc;
    const m2 = manquesPublication({ ...base, blocs: [trop] });
    expect(m2.some((x) => x.includes("1200 caractères"))).toBe(true);
    expect(m2.some((x) => x.includes("source doit commencer par https://"))).toBe(true);
    const plusLoin = { ...nouveauBloc("podcast"), podcast_id: "p", texte: "Présentation", plus_loin_lien: "/agenda" } as Bloc;
    expect(manquesPublication({ ...base, blocs: [plusLoin] }).some((x) => x.includes("« Pour aller plus loin » doit commencer par https://"))).toBe(true);
    expect(lienHttps("https://www.cbnews.fr/article")).toBe(true);
    for (const l of ["http://exemple.invalid", "javascript:alert(1)", "/agenda", "https://exemple.invalid/a b", 'https://x.fr/"><script>']) expect(lienHttps(l)).toBe(false);
  });

  it("texte alternatif de la couverture générée", () => {
    expect(altCouverture(base)).toBe("Couverture de L'Onde du Sud n°1, décembre 2026");
  });
});
