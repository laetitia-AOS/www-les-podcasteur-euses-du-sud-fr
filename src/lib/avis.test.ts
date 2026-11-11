import { describe, it, expect } from "vitest";
import { AVIS_MAX, AVIS_MIN, MOTIFS_SIGNALEMENT, resumeAvis, verifierAvis, type Avis } from "./avis";

const OK = { nom: "Sabrina Reiter", email: "sabrina@exemple.fr", note: 5, commentaire: "J'ai écouté d'une traite, c'est très bien fait." };

describe("avis laissés sous une fiche de podcast", () => {
  it("accepte une saisie complète et correcte", () => {
    expect(verifierAvis(OK)).toEqual({});
  });

  it("refuse une note hors de 1 à 5 étoiles", () => {
    const message = "Choisissez une note de 1 à 5 étoiles.";
    expect(verifierAvis({ ...OK, note: 0 }).note).toBe(message);
    expect(verifierAvis({ ...OK, note: 6 }).note).toBe(message);
    expect(verifierAvis({ ...OK, note: 4.5 }).note).toBe(message);
    expect(verifierAvis({ ...OK, note: 1 }).note).toBeUndefined();
    expect(verifierAvis({ ...OK, note: 5 }).note).toBeUndefined();
  });

  it("demande entre 10 et 600 caractères de commentaire", () => {
    expect(AVIS_MIN).toBe(10);
    expect(AVIS_MAX).toBe(600);
    expect(verifierAvis({ ...OK, commentaire: "Bien !" }).commentaire).toBe("Votre commentaire doit faire au moins 10 caractères.");
    expect(verifierAvis({ ...OK, commentaire: "a".repeat(AVIS_MAX + 1) }).commentaire).toBe("600 caractères maximum.");
    expect(verifierAvis({ ...OK, commentaire: "a".repeat(AVIS_MAX) }).commentaire).toBeUndefined();
  });

  it("vérifie le nom et l'adresse e-mail", () => {
    expect(verifierAvis({ ...OK, email: "pas un email" }).email).toBe("Adresse e-mail invalide.");
    expect(verifierAvis({ ...OK, email: "sabrina@exemple" }).email).toBe("Adresse e-mail invalide.");
    expect(verifierAvis({ ...OK, nom: "   " }).nom).toBe("Indiquez votre nom.");
    expect(verifierAvis({ ...OK, nom: "x" }).nom).toBe("Indiquez votre nom.");
    expect(verifierAvis({ ...OK, nom: "n".repeat(101) }).nom).toBe("100 caractères maximum.");
  });

  it("calcule la moyenne au dixième et le nombre d'avis", () => {
    const a = (note: number) => ({ note } as Avis);
    expect(resumeAvis([])).toEqual({ moyenne: 0, nb: 0 });
    expect(resumeAvis([a(5), a(4), a(3)])).toEqual({ moyenne: 4, nb: 3 });
    expect(resumeAvis([a(4), a(5)])).toEqual({ moyenne: 4.5, nb: 2 });
    expect(resumeAvis([a(4), a(4), a(5)])).toEqual({ moyenne: 4.3, nb: 3 });
  });

  it("propose exactement les 4 motifs de signalement", () => {
    expect(MOTIFS_SIGNALEMENT.map((m) => m.code)).toEqual(["spam", "offensant", "hors sujet", "pas mon podcast"]);
  });
});
