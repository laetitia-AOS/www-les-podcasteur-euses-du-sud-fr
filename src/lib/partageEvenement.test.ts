import { describe, expect, it } from "vitest";
import { textePartage, type InfoPartage } from "./partageEvenement";

const e: InfoPartage = {
  titre: "Atelier-écoute", type: "Atelier", dateLong: "Lundi 9 novembre 2026", horaires: "de 17h30 à 20h30",
  lieu: "CultureShock", adresse: "105 rue de Lodi, Marseille", ville: "Marseille", tarif: null,
  url: "https://www.les-podcasteur-euses-du-sud.fr/agenda/atelier-ecoute-cultureshock-2026-11-09", jeViens: true,
};

describe("texte de partage d'un événement", () => {
  it("donne la date, l'heure, le lieu, l'entrée et le lien public de la page", () => {
    const t = textePartage(e);
    expect(t).toContain("Quand : Lundi 9 novembre 2026, de 17h30 à 20h30");
    expect(t).toContain("Où : CultureShock, 105 rue de Lodi, Marseille");
    expect(t).toContain("Entrée : libre");
    expect(t).toContain("« Je viens » : https://www.les-podcasteur-euses-du-sud.fr/agenda/atelier-ecoute-cultureshock-2026-11-09");
  });
  it("n'utilise jamais l'adresse technique du serveur", () => {
    expect(textePartage(e)).not.toMatch(/supabase|functions\/v1/);
  });
  it("affiche le tarif quand il y en a un", () => {
    expect(textePartage({ ...e, tarif: "5 €" })).toContain("Entrée : 5 €");
  });
});

describe("titre de partage", () => {
  it("ne répète pas le type quand le titre le contient déjà", () => {
    expect(textePartage(e).split("\n")[0]).toBe("Atelier-écoute");
    expect(textePartage({ ...e, titre: "Soirée Fiction" }).split("\n")[0]).toBe("Atelier : Soirée Fiction");
  });
});
