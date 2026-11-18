import { Link } from "react-router-dom";
import { ExternalLink, Pause, Play } from "lucide-react";
import { compterStat } from "@/lib/stats";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Episode } from "@/lib/episodes";
import { cleanCity, formatShortDate, fullName } from "@/lib/pds";

export type PodcastListe = {
  id: string;
  slug: string | null;
  nom_podcast: string;
  lien_ecoute: string;
  vignette_url: string | null;
  prenom: string | null;
  nom: string | null;
  city_name: string | null;
  ville: string | null;
};

/** Carte d'un podcast (pochette, nom, auteur·ice, ville, bouton d'écoute), partagée par Écouter et les pages locales. */
const PodcastCarte = ({ p, ep }: { p: PodcastListe; ep?: Episode }) => {
  const { play, isCurrent, playing } = usePlayer();
  const active = ep ? isCurrent(ep) && playing : false;
  const author = fullName(p.prenom, p.nom);
  const city = cleanCity(p.city_name || p.ville);
  const href = `/ecouter/${p.slug || p.id}`;
  return (
    <li className="flex flex-col">
      <Link to={href} className="block aspect-square bg-muted overflow-hidden" tabIndex={-1} aria-hidden>
        {p.vignette_url ? (
          <img src={p.vignette_url} alt={`Pochette du podcast ${p.nom_podcast}`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="flex w-full h-full items-center justify-center bg-primary text-primary-foreground title-section text-2xl p-4 text-center">{p.nom_podcast}</span>
        )}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={href} className="block font-bold text-[17px] leading-tight hover:underline underline-offset-4">
            {p.nom_podcast}
          </Link>
          <p className="text-sm text-muted-foreground mt-0.5">{[author, city].filter(Boolean).join(" · ")}</p>
        </div>
        {ep ? (
          <button
            onClick={() => play(ep)}
            className={`shrink-0 w-11 h-11 rounded-full border-2 border-primary inline-flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary hover:text-primary-foreground"}`}
            aria-label={`${active ? "Mettre en pause" : "Écouter le dernier épisode de"} ${p.nom_podcast}`}
          >
            {active ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
          </button>
        ) : (
          <a
            href={p.lien_ecoute}
            onClick={() => compterStat(p.id, "ecoute")}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-11 h-11 rounded-full border-2 border-primary text-primary inline-flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
            aria-label={`Écouter ${p.nom_podcast} (nouvel onglet)`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
      {ep?.date && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Dernier épisode · {formatShortDate(ep.date)}</p>
      )}
    </li>
  );
};

export default PodcastCarte;
