import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fullName } from "@/lib/pds";

export type Episode = {
  podcastId: string;
  podcastSlug: string | null;
  podcastName: string;
  author: string;
  city: string | null;
  title: string;
  date: string | null;
  duration: number | null;
  audioUrl: string;
  image: string | null;
  link: string | null;
  summary?: string | null;
};

// Les épisodes sont enregistrés par la lecture planifiée des flux (toutes les 6 heures).
// La base ne renvoie que ceux des podcasts visibles dont le membre est à jour de cotisation.
const SELECT =
  "titre, date_publication, duree_secondes, audio_url, image_url, resume, lien, podcast_id, podcasts!inner(slug, nom_podcast, prenom, nom, city_name, vignette_url)";

type Row = {
  titre: string;
  date_publication: string | null;
  duree_secondes: number | null;
  audio_url: string;
  image_url: string | null;
  resume: string | null;
  lien: string | null;
  podcast_id: string;
  podcasts: { slug: string | null; nom_podcast: string; prenom: string | null; nom: string | null; city_name: string | null; vignette_url: string | null } | null;
};

export const toEpisode = (r: Row): Episode => ({
  podcastId: r.podcast_id,
  podcastSlug: r.podcasts?.slug ?? null,
  podcastName: r.podcasts?.nom_podcast ?? "",
  author: fullName(r.podcasts?.prenom, r.podcasts?.nom),
  city: r.podcasts?.city_name ?? null,
  title: r.titre,
  date: r.date_publication,
  duration: r.duree_secondes,
  audioUrl: r.audio_url,
  image: r.podcasts?.vignette_url || r.image_url,
  link: r.lien,
  summary: r.resume,
});

const fetchRows = async (build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
  const { data, error } = await build(base());
  if (error) throw error;
  return ((data || []) as unknown as Row[]).map(toEpisode);
};
const base = () =>
  supabase.from("episodes").select(SELECT).order("date_publication", { ascending: false, nullsFirst: false });

/** Dernier épisode de chaque podcast, du plus récent au plus ancien, et date du dernier épisode par podcast. */
export const useLatestEpisodes = (limit = 8) =>
  useQuery({
    queryKey: ["latest-episodes", limit],
    queryFn: async () => {
      const all = await fetchRows((q) => q.limit(400));
      const seen = new Set<string>();
      const latest: Episode[] = [];
      const lastDates: Record<string, string | null> = {};
      for (const ep of all) {
        if (seen.has(ep.podcastId)) continue;
        seen.add(ep.podcastId);
        latest.push(ep);
        lastDates[ep.podcastId] = ep.date;
      }
      return { latest: latest.slice(0, limit), lastDates };
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

/** Les épisodes les plus récents, tous membres confondus. */
export const useRecentEpisodes = (limit = 4) =>
  useQuery({
    queryKey: ["recent-episodes", limit],
    queryFn: () => fetchRows((q) => q.limit(limit)),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

/** Épisodes d'un podcast précis (10 au maximum). */
export const usePodcastEpisodes = (id?: string) =>
  useQuery({
    queryKey: ["podcast-episodes", id],
    queryFn: async () => ({ episodes: await fetchRows((q) => q.eq("podcast_id", id!).limit(10)) }),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

/** Dernier épisode d'un podcast, pour les boutons lecture. */
export const fetchLatestEpisode = async (podcastId: string): Promise<Episode | null> =>
  (await fetchRows((q) => q.eq("podcast_id", podcastId).limit(1)))[0] ?? null;

/**
 * Épisode chargé à l'arrivée sur le site : le dernier épisode d'un membre à jour tiré au hasard
 * parmi ceux qui ont publié dans les 30 derniers jours.
 */
export const pickWelcomeEpisode = (episodes: Episode[], now = Date.now(), rand = Math.random): Episode | null => {
  const limit = now - 30 * 24 * 3600 * 1000;
  const latestByPodcast = new Map<string, Episode>();
  for (const ep of episodes) {
    if (!ep.date || new Date(ep.date).getTime() < limit) continue;
    const cur = latestByPodcast.get(ep.podcastId);
    if (!cur || (cur.date || "") < ep.date) latestByPodcast.set(ep.podcastId, ep);
  }
  const list = [...latestByPodcast.values()];
  return list.length ? list[Math.floor(rand() * list.length)] : null;
};

export const fetchWelcomeEpisode = async (): Promise<Episode | null> => {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const rows = await fetchRows((q) => q.gte("date_publication", since).limit(200));
  return pickWelcomeEpisode(rows);
};

/** Vérifie un lien de flux RSS côté serveur. Renvoie un message d'erreur, ou null si le flux est valide. */
export const verifierFlux = async (url: string): Promise<{ ok: boolean; message: string }> => {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verifier-flux`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ url }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    return { ok: !!data.ok, message: data.message || "La vérification du flux n'a pas abouti." };
  } catch {
    return { ok: false, message: "La vérification du flux n'a pas abouti. Réessayez." };
  }
};
