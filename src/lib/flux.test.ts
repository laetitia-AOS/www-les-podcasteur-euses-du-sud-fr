import { describe, expect, it } from "vitest";
import { messageFlux, type EtatFlux } from "./flux";

const base: EtatFlux = { podcast_id: "p", statut: "ok", message: null, nb_episodes: 10, derniere_lecture: "2026-10-29T12:00:00Z", source: "Ausha", confirmation: "a_confirmer" };

describe("état du flux dans Mes podcasts", () => {
  it("un flux deviné est « à confirmer » tant que l'équipe ne l'a pas validé", () => {
    expect(messageFlux(base, null).titre).toBe("Flux trouvé automatiquement, à confirmer");
  });
  it("un flux deviné confirmé affiche ses épisodes", () => {
    expect(messageFlux({ ...base, confirmation: "confirme" }, null).ton).toBe("ok");
  });
  it("un flux saisi par le membre est considéré comme confirmé", () => {
    const m = messageFlux({ ...base, source: "flux saisi", confirmation: "confirme" }, "https://feed.ausha.co/x");
    expect(m.titre).toBe("Flux saisi");
    expect(m.ton).toBe("ok");
  });
  it("sans flux, le membre est invité à en ajouter un", () => {
    expect(messageFlux(undefined, null).titre).toBe("Aucun flux");
    expect(messageFlux({ ...base, statut: "introuvable", source: null }, "").titre).toBe("Aucun flux");
  });
});
