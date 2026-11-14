// Pied fixe des numéros de L'Onde du Sud, lien de don, liens courts du PDF et réabonnement (adresses fictives).
import { describe, expect, it } from "vitest";
import {
  ADHESION_OUVRE, PIED_ABONNEMENT, PIED_ADHERER, PIED_DON, TITRE_ADHESION_OUVRE, adresseImprimee, cibleLienCourt, etatLecteur, lienCourt, lienDonValide,
} from "@/lib/ondePied";
import * as email from "../../supabase/functions/_shared/onde-email";
import { emailNumero, type ContexteEmail, type NumeroEmail } from "../../supabase/functions/_shared/onde-email";

const numero: NumeroEmail = {
  id: "11111111-1111-1111-1111-111111111111", numero: 1, mois: "2026-12-01", titre: "Le Sud au micro", chapeau: "Un mois de sons.",
  slug: "n1-decembre-2026", couverture_url: null, couverture_alt: null, audio_url: null, blocs: [],
};
const ctx: ContexteEmail = { evenements: [], podcasts: [], membres: {} };
const DON = "https://www.helloasso.com/associations/exemple/formulaires/1";
const abonne = { type: "abonne" as const, lienDesinscription: "https://www.les-podcasteur-euses-du-sud.fr/onde/desinscription?jeton=x" };

describe("pied fixe d'un numéro", () => {
  it("mêmes textes sur le site et dans l'e-mail", () => {
    expect(email.ADHESION_OUVRE).toEqual(ADHESION_OUVRE);
    expect([email.PIED_ABONNEMENT, email.PIED_ADHERER, email.PIED_DON, email.TITRE_ADHESION_OUVRE]).toEqual([PIED_ABONNEMENT, PIED_ADHERER, PIED_DON, TITRE_ADHESION_OUVRE]);
  });

  it("« Ce que l'adhésion t'ouvre » mentionne le partage de ressources sans autopromotion commerciale", () => {
    expect(ADHESION_OUVRE).toContain("Partager des ressources avec le réseau dans L'Onde du Sud (sans autopromotion commerciale)");
  });

  it("e-mail et copie à transférer portent le pied, avec « Recevoir L'Onde chaque mois » et « Adhérer »", () => {
    for (const mode of [abonne, { type: "copie" as const }]) {
      const e = emailNumero(numero, ctx, mode);
      for (const v of [e.html, e.texte]) {
        expect(v).toContain("Ce que l'adhésion t'ouvre");
        expect(v).toContain("Recevoir L'Onde chaque mois");
        expect(v).toContain("Adhérer");
        expect(v).toContain("/adherer");
      }
    }
  });

  it("le bouton don n'apparaît pas tant que le lien est vide", () => {
    for (const lienDon of [undefined, null, "", "http://exemple.invalid/don", "javascript:alert(1)"]) {
      const e = emailNumero(numero, { ...ctx, lienDon }, abonne);
      expect(e.html).not.toContain(PIED_DON);
      expect(e.texte).not.toContain(PIED_DON);
    }
  });

  it("le bouton don apparaît avec son lien une fois le lien rempli, y compris dans la copie", () => {
    for (const mode of [abonne, { type: "copie" as const }]) {
      const e = emailNumero(numero, { ...ctx, lienDon: DON }, mode);
      expect(e.html).toContain(PIED_DON);
      expect(e.html).toContain(DON);
      expect(e.texte).toContain(`${PIED_DON} : ${DON}`);
    }
  });
});

describe("lien de don", () => {
  it("n'accepte qu'une adresse complète en https", () => {
    expect(lienDonValide(DON)).toBe(true);
    expect(lienDonValide("http://exemple.fr/don")).toBe(false);
    expect(lienDonValide("https://")).toBe(false);
    expect(lienDonValide("javascript:alert(1)")).toBe(false);
    expect(lienDonValide(`https://exemple.fr/${"a".repeat(500)}`)).toBe(false);
    expect(email.lienDonValide(DON)).toBe(true);
    expect(email.lienDonValide("http://exemple.fr/don")).toBe(false);
  });
});

describe("liens courts du PDF", () => {
  it("un son du bloc 02 du n°1 → www…/o/1/02 → #b02 de la page du numéro", () => {
    expect(adresseImprimee(lienCourt(1, "02"))).toBe("www.les-podcasteur-euses-du-sud.fr/o/1/02");
    expect(cibleLienCourt("1", "02")).toEqual({ numero: 1, ancre: "b02" });
  });
  it("la version audio du numéro → www…/o/1 → #ecouter", () => {
    expect(adresseImprimee(lienCourt(1))).toBe("www.les-podcasteur-euses-du-sud.fr/o/1");
    expect(cibleLienCourt("1")).toEqual({ numero: 1, ancre: "ecouter" });
  });
  it("refuse les liens mal formés", () => {
    expect(cibleLienCourt("abc")).toBeNull();
    expect(cibleLienCourt("1", "2")).toBeNull();
    expect(cibleLienCourt("1", "<x>")).toBeNull();
  });
});

describe("qui lit : membre, membre désinscrit·e, abonné·e", () => {
  it("un membre à jour désinscrit ne voit plus « Tu reçois déjà… » mais « Me réabonner »", () => {
    expect(etatLecteur({ membre: true, statut: "desinscrit" }, false)).toBe("membre_desinscrit");
  });
  it("un membre à jour (sans ligne, inclus d'office, ou réabonné) reçoit L'Onde", () => {
    expect(etatLecteur({ membre: true, statut: null }, false)).toBe("membre");
    expect(etatLecteur({ membre: true, statut: "adherent" }, false)).toBe("membre");
    expect(etatLecteur({ membre: true, statut: "actif" }, false)).toBe("membre");
  });
  it("le bouton d'abonnement est masqué pour un·e abonné·e actif·ve, pas pour une inscription en attente", () => {
    expect(etatLecteur({ membre: false, statut: "actif" }, false)).toBe("abonne");
    expect(etatLecteur({ membre: false, statut: "en_attente" }, false)).toBe("aucun");
    expect(etatLecteur({ membre: false, statut: "desinscrit" }, false)).toBe("aucun");
  });
  it("sans connexion : abonné·e seulement si l'abonnement a été confirmé depuis cet appareil", () => {
    expect(etatLecteur(null, true)).toBe("abonne");
    expect(etatLecteur(null, false)).toBe("aucun");
  });
});
