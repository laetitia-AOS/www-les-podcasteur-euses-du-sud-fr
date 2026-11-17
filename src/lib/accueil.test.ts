import { describe, expect, it } from "vitest";
import { departementValide, estLienWhatsapp, groupePour, messagePresentation, regleGroupes } from "./accueil";
import { COLLAB_CHOIX } from "./inscription";
import { LIBELLES_COLLAB_ACCUEIL, plagesQr } from "../../supabase/functions/_shared/accueil";

const GROUPES = [
  { nom: "06 podcasts", lien: "https://chat.whatsapp.com/FzMVKkTI5GeAwK0rwvzjq2", departements: ["06", "MC"], par_defaut: false },
  { nom: "Les Podcasteur·euses du Sud", lien: "https://chat.whatsapp.com/CeeentaAoj2GR150Upp7le", departements: ["13", "83", "84", "04", "05", "2A", "2B", "autre"], par_defaut: true },
];

describe("groupe WhatsApp d'un département", () => {
  it("06 et Monaco vont dans « 06 podcasts »", () => {
    expect(groupePour("06", GROUPES)?.nom).toBe("06 podcasts");
    expect(groupePour("MC", GROUPES)?.nom).toBe("06 podcasts");
  });
  it("les autres départements vont dans le groupe par défaut", () => {
    for (const d of ["13", "83", "84", "04", "05", "2A", "2B", "autre"]) expect(groupePour(d, GROUPES)?.nom).toBe("Les Podcasteur·euses du Sud");
  });
  it("un département inconnu va dans le groupe par défaut", () => {
    expect(groupePour(null, GROUPES)?.nom).toBe("Les Podcasteur·euses du Sud");
  });
  it("la règle se lit « 06 ou Monaco → 06 podcasts ; ailleurs → Les Podcasteur·euses du Sud »", () => {
    expect(regleGroupes(GROUPES)).toBe("06 ou Monaco → 06 podcasts ; ailleurs → Les Podcasteur·euses du Sud");
  });
});

describe("valeurs acceptées", () => {
  it("seuls les départements de la liste sont acceptés", () => {
    expect(departementValide("2A")).toBe(true);
    expect(departementValide("MC")).toBe(true);
    expect(departementValide("75")).toBe(false);
  });
  it("seuls les liens https://chat.whatsapp.com/ sont acceptés", () => {
    expect(estLienWhatsapp("https://chat.whatsapp.com/CeeentaAoj2GR150Upp7le")).toBe(true);
    expect(estLienWhatsapp("http://chat.whatsapp.com/CeeentaAoj2GR150Upp7le")).toBe(false);
    expect(estLienWhatsapp("https://chat.whatsapp.com.exemple.fr/abc1234567")).toBe(false);
    expect(estLienWhatsapp("https://wa.me/33600000000")).toBe(false);
  });
});

describe("message de présentation", () => {
  it("garde des crochets pour ce qu'on ne sait pas", () => {
    expect(messagePresentation([])).toBe(
      "Bonjour à toutes et à tous ! Je suis [Prénom], [ce que je fais] à [ville]. Mon projet : [nom du podcast + lien]. Je cherche : […]. Je peux apporter : […]. Ravi·e de vous rejoindre !",
    );
  });
  it("se remplit avec la fiche : prénom, ville, podcast et lien, je cherche / j'apporte", () => {
    const m = messagePresentation([
      { prenom: "alix", type_profil: "podcasteur", nom_podcast: "Sons du quartier", lien_ecoute: "https://exemple.fr/sons", city_name: "Marseille", cherche_choix: ["montage"], apporte_choix: ["etre_invite"] },
    ]);
    expect(m).toContain("Je suis Alix, je fais un podcast à Marseille.");
    expect(m).toContain("Mon projet : Sons du quartier (https://exemple.fr/sons).");
    expect(m).toContain("Je cherche : Montage.");
    expect(m).toContain("Je peux apporter : Intervenir comme invité·e.");
  });
});

describe("cohérence avec le site", () => {
  it("les libellés « Je cherche / J'apporte » des e-mails sont ceux du site", () => {
    for (const c of COLLAB_CHOIX) expect(LIBELLES_COLLAB_ACCUEIL[c.value]).toBe(c.label);
  });
  it("le QR code en tableau garde toutes les cases", () => {
    const m = [[true, true, false], [false, true, true]];
    expect(plagesQr(m).map((r) => r.reduce((n, p) => n + p.n, 0))).toEqual([3, 3]);
  });
});
