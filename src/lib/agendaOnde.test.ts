// Agenda × L'Onde du Sud × Instagram : règles demandées par l'association.
import { describe, expect, it } from "vitest";
import { CASE_ONDE, MESSAGE_SANS_BROUILLON, badgeOnde, dansUnBrouillon, messageBascule, numerosBrouillon, numerosEvenement, type EtatAgendaOnde } from "./agendaOnde";
import { LEGENDE_MAX, hashtagsInsta, instagramValide, legendeInsta, normaliserInstagram, phraseInsta, rappelCollaborateur, TAILLES_INSTA, type InfoInsta } from "./partageEvenement";
import { CASE_DROITS, CASE_DROITS_RESSOURCE, caseDroits } from "./ondeDepots";
import { TITRE_INVITES } from "./onde";
import { TITRE_INVITES as TITRE_INVITES_EMAIL, emailNumero, type NumeroEmail } from "../../supabase/functions/_shared/onde-email";
import { invitesEvenement } from "../../supabase/functions/_shared/invites";

const etat: EtatAgendaOnde = {
  prochain: { id: "n2", numero: 2, mois: "2027-01-01" },
  liens: [
    { evenement_id: "e1", numero: 1, statut: "publie" },
    { evenement_id: "e1", numero: 2, statut: "brouillon" },
    { evenement_id: "e2", numero: 1, statut: "publie" },
  ],
};

describe("case « Ajouter au prochain numéro de L'Onde du Sud »", () => {
  it("porte le libellé demandé", () => {
    expect(CASE_ONDE).toBe("Ajouter au prochain numéro de L'Onde du Sud");
  });
  it("sans brouillon, affiche le message demandé", () => {
    expect(messageBascule({ code: "aucun_brouillon" })).toEqual({ ton: "erreur", texte: "Aucun numéro en préparation : crée d'abord un brouillon dans L'Onde du Sud" });
    expect(MESSAGE_SANS_BROUILLON).toBe("Aucun numéro en préparation : crée d'abord un brouillon dans L'Onde du Sud");
  });
  it("au-delà de 8 événements, le message est clair", () => {
    const m = messageBascule({ code: "plein", numero: 2 });
    expect(m.ton).toBe("erreur");
    expect(m.texte).toContain("8 événements");
  });
  it("est cochée seulement si l'événement est dans un numéro en préparation (pas un numéro publié)", () => {
    expect(dansUnBrouillon(etat, "e1")).toBe(true);
    expect(dansUnBrouillon(etat, "e2")).toBe(false);
    expect(numerosBrouillon(etat, "e1")).toEqual([2]);
  });
});

describe("badge « Dans L'Onde n°X »", () => {
  it("donne les numéros qui contiennent l'événement", () => {
    expect(badgeOnde(numerosEvenement(etat, "e1"))).toBe("Dans L'Onde n°1, n°2");
    expect(badgeOnde(numerosEvenement(etat, "e2"))).toBe("Dans L'Onde n°1");
    expect(badgeOnde(numerosEvenement(etat, "e3"))).toBe("");
  });
});

describe("Instagram de l'organisateur", () => {
  it("accepte @compte et le remet en forme", () => {
    expect(normaliserInstagram("  LaFriche ")).toBe("@lafriche");
    expect(normaliserInstagram("https://www.instagram.com/la.friche_/")).toBe("@la.friche_");
    expect(instagramValide("@la.friche_")).toBe(true);
  });
  it("refuse un format qui n'est pas un compte Instagram", () => {
    expect(instagramValide("@la friche")).toBe(false);
    expect(instagramValide("@a..b")).toBe(false);
    expect(instagramValide("@.abc")).toBe(false);
    expect(instagramValide("@abc.")).toBe(false);
    expect(instagramValide("@" + "a".repeat(31))).toBe(false);
  });
});

const info: InfoInsta = {
  titre: "Soirée fiction sonore", type: "Écoute", typeCode: "ecoute", dateLong: "Samedi 12 décembre 2026", horaires: "de 19h00 à 22h00",
  lieu: "La Friche", adresse: "41 rue Jobin, Marseille", ville: "Marseille", sousTitre: "Trois fictions sonores écoutées dans le noir",
  url: "https://www.les-podcasteur-euses-du-sud.fr/agenda/soiree-fiction", image: null,
};

describe("post Insta", () => {
  it("visuels aux formats 4:5 (1080 × 1350) et 9:16 (1080 × 1920)", () => {
    expect(TAILLES_INSTA.post).toEqual([1080, 1350]);
    expect(TAILLES_INSTA.story).toEqual([1080, 1920]);
  });
  it("la légende contient le lien de la fiche agenda, la date, le lieu et l'@ de l'organisateur", () => {
    const l = legendeInsta(info, "@lafriche");
    expect(l).toContain("Toutes les infos : https://www.les-podcasteur-euses-du-sud.fr/agenda/soiree-fiction");
    expect(l).toContain("Samedi 12 décembre 2026");
    expect(l).toContain("La Friche");
    expect(l).toContain("@lafriche");
    expect(l).toContain("Trois fictions sonores écoutées dans le noir.");
  });
  it("4 à 6 hashtags, dont #creationsonore, #podcast et la ville", () => {
    const h = hashtagsInsta(info);
    expect(h.length).toBeGreaterThanOrEqual(4);
    expect(h.length).toBeLessThanOrEqual(6);
    expect(h).toEqual(expect.arrayContaining(["#creationsonore", "#podcast", "#marseille"]));
    expect(hashtagsInsta({ typeCode: "autre" }).length).toBeGreaterThanOrEqual(4);
  });
  it("ne dépasse jamais 2 200 caractères et garde le lien", () => {
    const l = legendeInsta({ ...info, sousTitre: "", description: "x".repeat(5000) }, "@lafriche");
    expect(l.length).toBeLessThanOrEqual(LEGENDE_MAX);
    expect(l).toContain(info.url);
  });
  it("sans sous-titre, prend la première phrase de la description", () => {
    expect(phraseInsta({ sousTitre: "", description: "On écoute des fictions ensemble. Puis on discute." })).toBe("On écoute des fictions ensemble.");
  });
  it("rappelle d'inviter l'organisateur en collaborateur", () => {
    expect(rappelCollaborateur("@lafriche")).toBe("Au moment de publier sur Instagram, invite @lafriche en collaborateur.");
  });
});

describe("case de droits d'un dépôt", () => {
  it("ressource : « J'ai le droit de partager cette ressource » ; autres types : texte d'origine", () => {
    expect(caseDroits("ressource")).toBe("J'ai le droit de partager cette ressource");
    expect(CASE_DROITS_RESSOURCE).toBe("J'ai le droit de partager cette ressource");
    for (const t of ["son", "ecoute", "projet", "coulisses", "appel"]) expect(caseDroits(t)).toBe(CASE_DROITS);
    expect(CASE_DROITS).toBe("Je suis l'auteur·ice de ce son ou j'ai les droits pour le diffuser");
  });
});

describe("« Ce qu'on écoutera ensemble »", () => {
  const invites = [
    { nom_podcast: "Voix du Port", host: "camille durand", vignette_url: "", lien_ecoute: "" },
    { nom_podcast: "Hors annuaire", host: "Léa Martin", vignette_url: "https://exemple.invalid/v.jpg", lien_ecoute: "https://exemple.invalid/ecoute" },
    { nom_podcast: "", host: "", vignette_url: "", lien_ecoute: "" },
  ];
  const fiches = [{ id: "p1", slug: "voix-du-port", nom_podcast: "Voix du port", prenom: "Camille", nom: "Durand", type_profil: "podcasteur", vignette_url: "https://exemple.invalid/pochette.jpg" }];

  it("numérote les invités, relie la fiche quand elle existe et reprend sa pochette", () => {
    const l = invitesEvenement(invites, fiches);
    expect(l.map((p) => p.rang)).toEqual([1, 2]);
    expect(l[0].fiche?.id).toBe("p1");
    expect(l[0].vignette).toBe("https://exemple.invalid/pochette.jpg");
    expect(l[1].fiche).toBeNull();
    expect(l[1].vignette).toBe("https://exemple.invalid/v.jpg");
  });
  it("même titre sur le site et dans l'e-mail", () => {
    expect(TITRE_INVITES).toBe("Ce qu'on écoutera ensemble");
    expect(TITRE_INVITES_EMAIL).toBe(TITRE_INVITES);
  });
  it("l'e-mail montre les invités sous l'événement, avec vignette et lien de fiche", () => {
    const n: NumeroEmail = {
      id: "n", numero: 3, mois: "2026-12-01", titre: "Essai", chapeau: "Chapeau", slug: "n3", couverture_url: null, couverture_alt: null, audio_url: null,
      blocs: [{ id: "b", type: "evenements", rubrique: "À l'agenda", evenements: ["e1"] }],
    };
    const m = emailNumero(n, { evenements: [{ id: "e1", titre: "Soirée", date_debut: "2026-12-12T18:00:00Z", podcasts_invites: invites }], podcasts: [], membres: {}, fiches }, { type: "copie" });
    expect(m.html).toContain("Ce qu'on écoutera ensemble");
    expect(m.html).toContain("https://exemple.invalid/pochette.jpg");
    expect(m.html).toContain("/ecouter/voix-du-port");
    expect(m.texte).toContain("Ce qu'on écoutera ensemble : 1. Voix du Port (Camille Durand)");
    expect(m.texte).toContain("2. Hors annuaire (Léa Martin) https://exemple.invalid/ecoute");
  });
});
