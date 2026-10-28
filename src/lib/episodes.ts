import { useQuery } from "@tanstack/react-query";

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

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/podcast-episodes`;

const call = async <T,>(query: string): Promise<T> => {
  const res = await fetch(`${FN_URL}${query}`, {
    headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
  });
  if (!res.ok) throw new Error("Épisodes indisponibles");
  return res.json();
};

/** Derniers épisodes, un par podcast, du plus récent au plus ancien. */
export const useLatestEpisodes = (limit = 8) =>
  useQuery({
    queryKey: ["latest-episodes", limit],
    queryFn: () => call<{ latest: Episode[]; lastDates: Record<string, string | null> }>(`?limit=${limit}`),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

/** Épisodes d'un podcast précis. */
export const usePodcastEpisodes = (id?: string) =>
  useQuery({
    queryKey: ["podcast-episodes", id],
    queryFn: () => call<{ episodes: Episode[] }>(`?id=${id}`),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
