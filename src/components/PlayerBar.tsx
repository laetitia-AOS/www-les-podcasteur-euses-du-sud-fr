import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchWelcomeEpisode } from "@/lib/episodes";
import { Pause, Play, RotateCcw, RotateCw, Square } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { formatClock } from "@/lib/pds";

// Pages privées : le lecteur vide n'y est pas affiché (un épisode en cours, lui, reste visible).
const PRIVE = [/^\/admin/, /^\/mon-espace/, /^\/mon-podcast/, /^\/espace-membre/, /^\/espace-podcasteur/, /^\/reset-password/];

const ctrl = "w-11 h-11 inline-flex items-center justify-center hover:text-accent disabled:opacity-40 disabled:hover:text-surface";

/** Lecteur fixé en bas de toutes les pages publiques : il continue de jouer pendant la navigation. */
const PlayerBar = () => {
  const { episode, playing, current, duration, toggle, seek, skip, close, load } = usePlayer();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const prive = PRIVE.some((r) => r.test(pathname));
  const welcomeDone = useRef(false);

  // À l'arrivée : un épisode récent d'un membre à jour est prêt dans le lecteur, sans se lancer
  useEffect(() => {
    if (welcomeDone.current || isAdmin) return;
    welcomeDone.current = true;
    fetchWelcomeEpisode().then((ep) => { if (ep) load(ep); }).catch(() => {});
  }, [isAdmin, load]);

  if (isAdmin || (!episode && prive)) return null;

  const podcastHref = episode ? `/ecouter/${episode.podcastSlug || episode.podcastId}` : "/ecouter";

  return (
    <>
      <div aria-hidden className={episode ? "h-[132px] sm:h-[76px]" : "h-[76px]"} />
      <section
        aria-label="Lecteur audio"
        className="fixed bottom-0 inset-x-0 z-50 bg-encre text-surface border-t-[3px] border-accent"
      >
        {episode ? (
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 py-3 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2">
            <Link to={podcastHref} className="group flex items-center gap-3 min-w-0 flex-1 sm:flex-none sm:w-[300px]">
              {episode.image && (
                <img src={episode.image} alt={`Pochette de ${episode.podcastName}`} className="w-11 h-11 object-cover shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block font-bold text-sm truncate group-hover:underline underline-offset-4">{episode.title}</span>
                <span className="block text-xs text-surface/75 truncate">{episode.podcastName}{episode.author ? ` · ${episode.author}` : ""}</span>
              </span>
            </Link>

            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => skip(-15)} className={ctrl} aria-label="Reculer de 15 secondes">
                <RotateCcw className="w-5 h-5" aria-hidden />
              </button>
              <button
                onClick={toggle}
                className="w-11 h-11 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center hover:bg-accent-hover"
                aria-label={playing ? "Mettre en pause" : "Lire"}
              >
                {playing ? <Pause className="w-5 h-5" fill="currentColor" aria-hidden /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" aria-hidden />}
              </button>
              <button onClick={() => skip(30)} className={ctrl} aria-label="Avancer de 30 secondes">
                <RotateCw className="w-5 h-5" aria-hidden />
              </button>
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-[200px] order-last sm:order-none basis-full sm:basis-auto">
              <span className="font-mono text-xs tabular-nums w-14 text-right">{formatClock(current)}</span>
              <label className="sr-only" htmlFor="player-progress">Position dans l'épisode</label>
              <input
                id="player-progress"
                type="range"
                min={0}
                max={duration || 0}
                step={1}
                value={Math.min(current, duration || 0)}
                onChange={(e) => seek(Number(e.target.value))}
                className="flex-1 h-1 accent-accent cursor-pointer"
              />
              <span className="font-mono text-xs tabular-nums w-14">{formatClock(duration)}</span>
            </div>

            <Link to={podcastHref} className="hidden md:inline-flex min-h-[44px] items-center text-sm font-bold underline underline-offset-4 shrink-0">
              Voir la fiche
            </Link>
            <button onClick={close} className={`${ctrl} shrink-0`} aria-label="Arrêter l'écoute">
              <Square className="w-4 h-4" fill="currentColor" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 py-3 flex items-center gap-x-4">
            <button disabled className="w-11 h-11 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center opacity-40 shrink-0" aria-label="Lire (aucun épisode choisi)">
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" aria-hidden />
            </button>
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-bold">Lecteur</span>
              <span className="text-surface/75"> · Lancez un épisode : il continue pendant que vous naviguez.</span>
            </p>
            {pathname !== "/ecouter" && (
              <Link to="/ecouter" className="inline-flex min-h-[44px] items-center text-sm font-bold underline underline-offset-4 shrink-0">
                Choisir un podcast
              </Link>
            )}
          </div>
        )}
      </section>
    </>
  );
};

export default PlayerBar;
