import { Link } from "react-router-dom";
import { Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { formatClock } from "@/lib/pds";

/** Lecteur fixé en bas de l'écran : il continue de jouer pendant la navigation. */
const PlayerBar = () => {
  const { episode, playing, current, duration, toggle, seek, skip, close } = usePlayer();
  if (!episode) return null;

  const podcastHref = episode.podcastSlug ? `/podcasteur/${episode.podcastSlug}` : `/podcasteur/${episode.podcastId}`;

  return (
    <>
      <div aria-hidden className="h-[132px] sm:h-[76px]" />
      <section
        aria-label="Lecteur audio"
        className="fixed bottom-0 inset-x-0 z-50 bg-encre text-surface border-t-[3px] border-accent"
      >
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 py-3 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none sm:w-[300px]">
            {episode.image && (
              <img src={episode.image} alt={`Pochette de ${episode.podcastName}`} className="w-11 h-11 object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{episode.title}</p>
              <p className="text-xs text-surface/75 truncate">{episode.podcastName}{episode.author ? ` · ${episode.author}` : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => skip(-15)} className="w-11 h-11 inline-flex items-center justify-center hover:text-accent" aria-label="Reculer de 15 secondes">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={toggle}
              className="w-11 h-11 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center hover:bg-accent-hover"
              aria-label={playing ? "Mettre en pause" : "Lire"}
            >
              {playing ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>
            <button onClick={() => skip(30)} className="w-11 h-11 inline-flex items-center justify-center hover:text-accent" aria-label="Avancer de 30 secondes">
              <RotateCw className="w-5 h-5" />
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
            Voir le podcast
          </Link>
          <button onClick={close} className="w-11 h-11 inline-flex items-center justify-center hover:text-accent shrink-0" aria-label="Fermer le lecteur">
            <X className="w-5 h-5" />
          </button>
        </div>
      </section>
    </>
  );
};

export default PlayerBar;
