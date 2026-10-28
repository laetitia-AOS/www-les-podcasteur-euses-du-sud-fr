import { describe, it, expect } from "vitest";
import { pickWelcomeEpisode, type Episode } from "./episodes";

const ep = (podcastId: string, date: string | null, title = "x"): Episode => ({
  podcastId, podcastSlug: null, podcastName: podcastId, author: "", city: null, title, date, duration: null,
  audioUrl: `https://a.test/${podcastId}-${title}.mp3`, image: null, link: null,
});

describe("épisode chargé à l'arrivée sur le site", () => {
  const now = new Date("2026-10-28T12:00:00Z").getTime();

  it("ignore les membres qui n'ont rien publié depuis 30 jours", () => {
    const list = [ep("ancien", "2026-09-20T10:00:00Z"), ep("recent", "2026-10-20T10:00:00Z")];
    expect(pickWelcomeEpisode(list, now, () => 0)?.podcastId).toBe("recent");
  });

  it("prend le dernier épisode du membre tiré au sort", () => {
    const list = [ep("a", "2026-10-01T10:00:00Z", "vieux"), ep("a", "2026-10-25T10:00:00Z", "neuf")];
    expect(pickWelcomeEpisode(list, now, () => 0)?.title).toBe("neuf");
  });

  it("tire au sort parmi les membres, pas parmi les épisodes", () => {
    const list = [ep("a", "2026-10-25T10:00:00Z"), ep("a", "2026-10-24T10:00:00Z"), ep("b", "2026-10-23T10:00:00Z")];
    expect(pickWelcomeEpisode(list, now, () => 0.99)?.podcastId).toBe("b");
  });

  it("aucun épisode récent : rien n'est chargé", () => {
    expect(pickWelcomeEpisode([ep("a", "2026-08-01T10:00:00Z")], now)).toBeNull();
  });
});
