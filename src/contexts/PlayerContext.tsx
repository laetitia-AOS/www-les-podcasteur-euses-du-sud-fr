import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Episode } from "@/lib/episodes";

type PlayerState = {
  episode: Episode | null;
  playing: boolean;
  current: number;
  duration: number;
  play: (ep: Episode) => void;
  toggle: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  close: () => void;
  isCurrent: (ep: Pick<Episode, "audioUrl">) => boolean;
};

const PlayerContext = createContext<PlayerState | null>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    audioRef.current = a;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(isFinite(a.duration) ? a.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
    };
  }, []);

  const play = useCallback((ep: Episode) => {
    const a = audioRef.current;
    if (!a) return;
    if (episode?.audioUrl === ep.audioUrl) {
      if (a.paused) a.play().catch(() => setPlaying(false));
      else a.pause();
      return;
    }
    setEpisode(ep);
    setCurrent(0);
    setDuration(ep.duration || 0);
    a.src = ep.audioUrl;
    a.play().catch(() => setPlaying(false));
  }, [episode]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !episode) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [episode]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, t);
    setCurrent(a.currentTime);
  }, []);

  const skip = useCallback((delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min((a.duration || Infinity), a.currentTime + delta));
  }, []);

  const close = useCallback(() => {
    const a = audioRef.current;
    if (a) { a.pause(); a.removeAttribute("src"); a.load(); }
    setEpisode(null);
    setPlaying(false);
  }, []);

  const isCurrent = useCallback((ep: Pick<Episode, "audioUrl">) => episode?.audioUrl === ep.audioUrl, [episode]);

  return (
    <PlayerContext.Provider value={{ episode, playing, current, duration, play, toggle, seek, skip, close, isCurrent }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer doit être utilisé dans PlayerProvider");
  return ctx;
};
