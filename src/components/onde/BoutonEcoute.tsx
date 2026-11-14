import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { episodeOnde, type BlocAudio, type NumeroOnde } from "@/lib/onde";

export type Resoudre = (url: string) => string | undefined;

const btnRond =
  "w-12 h-12 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center shrink-0 hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40";

/** Bouton lecture relié au lecteur du site (barre en bas de page). */
const BoutonEcoute = ({ n, extrait, resoudre, label }: { n: NumeroOnde; extrait?: BlocAudio; resoudre: Resoudre; label: string }) => {
  const { play, isCurrent, playing } = usePlayer();
  const ep = episodeOnde(n, extrait, resoudre);
  const actif = !!ep && isCurrent(ep) && playing;
  return (
    <button type="button" className={btnRond} disabled={!ep} onClick={() => ep && play(ep)} aria-label={actif ? `Mettre en pause : ${label}` : `Écouter : ${label}`}>
      {actif ? <Pause className="w-5 h-5" fill="currentColor" aria-hidden /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" aria-hidden />}
    </button>
  );
};

export default BoutonEcoute;
