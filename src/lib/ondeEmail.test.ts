// Règles de l'e-mail de L'Onde du Sud (lot 4), sur un numéro fictif.
import { describe, expect, it } from "vitest";
import {
  LIEN_INSCRIPTION, ONDE_EXPEDITEUR, ONDE_REPONSE, PHRASE_ABONNE, PHRASE_STOP,
  emailConfirmation, emailNumero, libelleEcoute, resumeBloc, type ContexteEmail, type NumeroEmail,
} from "../../supabase/functions/_shared/onde-email";

const numero: NumeroEmail = {
  id: "11111111-1111-1111-1111-111111111111",
  numero: 1,
  mois: "2026-12-01",
  titre: "Le Sud au micro",
  chapeau: "Un mois d'ateliers et de nouvelles voix.",
  slug: "n1-decembre-2026",
  couverture_url: "https://exemple.invalid/couverture.jpg",
  couverture_alt: "Trois personnes au micro",
  audio_url: "https://exemple.invalid/numero.mp3",
  audio_duree: 725,
  blocs: [
    { id: "b1", type: "texte", rubrique: "L'atelier", titre: "Écouter ensemble", texte: "**Le 9 décembre**, on se retrouve pour un *atelier-écoute* à la [Friche](https://exemple.invalid). Venez avec vos extraits préférés, on écoute et on en parle ensemble jusqu'à tard dans la soirée, autour d'un verre." },
    { id: "b2", type: "texte", rubrique: "En bref", texte: "Texte long qui ne doit pas apparaître.", resume: "Résumé choisi par l'équipe." },
    { id: "b3", type: "chiffres", rubrique: "En chiffres", chiffres: [{ valeur: "44", libelle: "membres" }, { valeur: "12", libelle: "podcasts" }] },
    { id: "b4", type: "nouveaux_membres", rubrique: "Bienvenue" },
    { id: "b5", type: "evenements", rubrique: "À l'agenda", evenements: ["e1"] },
  ],
};
const ctx: ContexteEmail = {
  evenements: [{ id: "e1", titre: "Atelier-écoute", date_debut: "2026-12-09T17:30:00Z", lieu: "Marseille", slug: "atelier-ecoute" }],
  podcasts: [],
  membres: { b4: [{ id: "p1", prenom: "camille", nom: "durand", photo_url: "https://exemple.invalid/p.jpg", nom_podcast: "Voix du Port", slug: "voix-du-port", type_profil: "podcasteur" }] },
};
const lien = "https://www.les-podcasteur-euses-du-sud.fr/onde/desinscription?jeton=22222222-2222-2222-2222-222222222222";

describe("e-mail d'un numéro", () => {
  const abonne = emailNumero(numero, ctx, { type: "abonne", lienDesinscription: lien });

  it("porte le lien de désinscription personnel et la phrase du pied, en HTML comme en texte", () => {
    expect(abonne.html).toContain(lien);
    expect(abonne.texte).toContain(lien);
    expect(abonne.html).toContain(PHRASE_ABONNE);
    expect(abonne.texte).toContain(PHRASE_ABONNE);
  });

  it("affiche la durée de la version audio en minutes", () => {
    expect(libelleEcoute(numero)).toBe("Écouter ce numéro (12 min)");
    expect(libelleEcoute({ audio_url: null, audio_duree: null })).toBe("Lire ce numéro");
    expect(abonne.html).toContain("Écouter ce numéro (12 min)");
    expect(abonne.html).toContain("Lire et écouter le numéro complet");
  });

  it("reprend le résumé saisi, sinon le début du texte sans mise en forme", () => {
    expect(resumeBloc(numero.blocs[1])).toBe("Résumé choisi par l'équipe.");
    const auto = resumeBloc(numero.blocs[0]);
    expect(auto.startsWith("Le 9 décembre, on se retrouve pour un atelier-écoute à la Friche.")).toBe(true);
    expect(auto.length).toBeLessThanOrEqual(221);
    expect(abonne.html).not.toContain("Texte long qui ne doit pas apparaître");
  });

  it("numérote les blocs et montre membres, événements et chiffres", () => {
    expect(abonne.texte).toContain("01 — L'ATELIER");
    expect(abonne.texte).toContain("Camille Durand (Voix du Port)");
    expect(abonne.texte).toContain("Atelier-écoute — Marseille");
    expect(abonne.texte).toContain("44 membres · 12 podcasts");
  });

  it("reste compatible avec les messageries : 600 px, images avec texte alternatif, aucun audio", () => {
    expect(abonne.html).toContain('width="600"');
    expect(abonne.html).toContain('alt="Trois personnes au micro"');
    expect(abonne.html).toContain('alt="Camille Durand"');
    expect(abonne.html).not.toMatch(/<audio|<script/i);
  });

  it("échappe le texte saisi", () => {
    const e = emailNumero({ ...numero, titre: "<script>alert(1)</script>" }, ctx, { type: "abonne", lienDesinscription: lien });
    expect(e.html).not.toContain("<script>alert");
    expect(e.html).toContain("&lt;script&gt;");
  });
});

describe("copie « [À transférer] »", () => {
  const copie = emailNumero(numero, ctx, { type: "copie" });

  it("a l'objet préfixé", () => {
    expect(copie.objet).toBe("[À transférer] Le Sud au micro — L'Onde du Sud n°1");
  });

  it("n'a aucun lien de désinscription personnel, mais l'inscription et « Réponds STOP »", () => {
    for (const v of [copie.html, copie.texte]) {
      expect(v).not.toContain("desinscription");
      expect(v).not.toContain("Se désinscrire");
      expect(v).toContain("Recevoir L'Onde du Sud chaque mois");
      expect(v).toContain(PHRASE_STOP);
    }
    expect(copie.html).toContain(LIEN_INSCRIPTION.split("#")[0]);
  });
});

describe("e-mail de confirmation", () => {
  it("contient le lien de confirmation et ne recopie rien de ce qui a été saisi", () => {
    const l = "https://www.les-podcasteur-euses-du-sud.fr/onde/confirmer?jeton=33333333-3333-3333-3333-333333333333";
    const e = emailConfirmation(l);
    expect(e.html).toContain(l);
    expect(e.texte).toContain(l);
    expect(e.objet).toBe("Confirme ton inscription à L'Onde du Sud");
  });
});

it("expéditeur et adresse de réponse", () => {
  expect(ONDE_EXPEDITEUR).toBe("L'Onde du Sud <onde@les-podcasteur-euses-du-sud.fr>");
  expect(ONDE_REPONSE).toBe("podcastsdusud@gmail.com");
});
