import { describe, expect, it } from "vitest";
import { COLLAB_CHOIX, COLLAB_CHOIX_APPORTE, apporteLabel, collabLabel } from "./inscription";
import { classerLien, liensFiche } from "./liens";
import { formatName, fullName, titreFiche } from "./pds";
import { avatarFor } from "@/components/MemberAvatar";
import { piocherQuiCherche } from "@/components/home/useHomeData";

describe("« Être invité·e » côté J'apporte", () => {
  it("se lit « Intervenir comme invité·e » seulement côté J'apporte", () => {
    expect(apporteLabel("etre_invite")).toBe("Intervenir comme invité·e");
    expect(collabLabel("etre_invite")).toBe("Être invité·e");
    expect(COLLAB_CHOIX_APPORTE.find((c) => c.value === "etre_invite")?.label).toBe("Intervenir comme invité·e");
    expect(COLLAB_CHOIX_APPORTE.map((c) => c.value)).toEqual(COLLAB_CHOIX.map((c) => c.value));
  });
});

describe("liens des fiches", () => {
  it("range les plateformes d'écoute dans « Écouter sur » et les réseaux dans « Suivre »", () => {
    expect(classerLien("https://open.spotify.com/show/abc")).toMatchObject({ groupe: "ecoute", label: "Spotify" });
    expect(classerLien("https://podcasts.apple.com/fr/podcast/x/id1")).toMatchObject({ groupe: "ecoute", label: "Apple Podcasts" });
    expect(classerLien("https://smartlink.ausha.co/marseille-creative")).toMatchObject({ groupe: "ecoute", label: "Ausha" });
    expect(classerLien("https://www.youtube.com/@x")).toMatchObject({ groupe: "ecoute", label: "YouTube" });
    expect(classerLien("https://feed.ausha.co/abc", { flux: true })).toMatchObject({ groupe: "ecoute", label: "Flux RSS" });
    expect(classerLien("https://www.linkedin.com/in/x")).toMatchObject({ groupe: "suivre", label: "LinkedIn" });
    expect(classerLien("https://instagram.com/x")).toMatchObject({ groupe: "suivre", label: "Instagram" });
    expect(classerLien("https://monsite.fr")).toMatchObject({ groupe: "suivre", label: "Site" });
  });
  it("classe un lien selon son domaine, quelle que soit la case où il a été saisi", () => {
    const l = liensFiche({ ecoute: "https://deezer.com/show/1", site: "https://open.spotify.com/show/2", reseau: "https://instagram.com/x" });
    expect(l.ecoute.map((x) => x.label)).toEqual(["Deezer", "Spotify"]);
    expect(l.suivre.map((x) => x.label)).toEqual(["Instagram"]);
  });
});

describe("noms des membres", () => {
  it("met une majuscule à chaque mot du nom", () => {
    expect(formatName("eddy creuzet")).toBe("Eddy Creuzet");
    expect(fullName("Sabrina", "REITER")).toBe("Sabrina Reiter");
    expect(fullName("CLEMENTINE", "ROUX")).toBe("Clementine Roux");
    expect(formatName("Anne ET Paul DUPONT")).toBe("Anne et Paul Dupont");
  });
  it("affiche le nom de la personne quand la fiche n'a pas de titre de podcast", () => {
    expect(titreFiche({ nom_podcast: "—", prenom: "CLEMENTINE", nom: "ROUX" })).toBe("Clementine Roux");
    expect(titreFiche({ nom_podcast: "Marseille Créative", prenom: "C", nom: "R" })).toBe("Marseille Créative");
  });
});

describe("image d'une personne", () => {
  const base = { prenom: "Léa", nom: "Martin", photo_profil_url: null, nom_podcast: null, created_at: "2026-01-01" };
  it("photo de profil d'abord", () => {
    const p = { ...base, type_profil: "podcasteur", vignette_url: "pochette.jpg", photo_profil_url: "photo.jpg" };
    expect(avatarFor(p, [p])?.url).toBe("photo.jpg");
  });
  it("sinon la pochette de son premier podcast", () => {
    const pro = { ...base, type_profil: "soutien", vignette_url: null };
    const recent = { ...base, type_profil: "podcasteur", vignette_url: "recent.jpg", nom_podcast: "Récent", created_at: "2026-05-01" };
    const ancien = { ...base, type_profil: "podcasteur", vignette_url: "ancien.jpg", nom_podcast: "Ancien", created_at: "2026-02-01" };
    const all = [pro, recent, ancien];
    expect(avatarFor(pro, all)).toEqual({ url: "ancien.jpg", alt: "Pochette du podcast Ancien" });
    expect(avatarFor(recent, all)?.url).toBe("ancien.jpg");
  });
  it("rien (initiales) sans photo ni podcast", () => {
    const p = { ...base, type_profil: "soutien", vignette_url: null };
    expect(avatarFor(p, [p])).toBeNull();
  });
});

describe("Qui cherche quoi", () => {
  const f = (id: string, extra = {}) => ({ id, type_profil: "podcasteur", cherche_choix: ["montage"], apporte_choix: ["voix_off"], visible_sans_adhesion: false, ...extra });
  it("tire trois profils parmi les membres à jour qui ont rempli cherche et apporte", () => {
    const list = [f("a"), f("b"), f("c"), f("d"), f("sursis", { visible_sans_adhesion: true }), f("vide", { apporte_choix: [] }), f("studio", { type_profil: "studio" })];
    const pick = piocherQuiCherche(list);
    expect(pick).toHaveLength(3);
    pick.forEach((p) => expect(["a", "b", "c", "d"]).toContain(p.id));
  });
  it("change selon le tirage, au lieu de prendre toujours les premiers", () => {
    const list = [f("a"), f("b"), f("c"), f("d"), f("e")];
    expect(piocherQuiCherche(list, 3, () => 0).map((p) => p.id)).not.toEqual(["a", "b", "c"]);
  });
});
