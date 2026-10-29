import { Link } from "react-router-dom";
import { compterStat } from "@/lib/stats";
import { ExternalLink, Pause, Play } from "lucide-react";
import { container, cleanCity, formatDuration, formatShortDate, fullName, linkUnderline } from "@/lib/pds";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Episode } from "@/lib/episodes";
import type { HomeProfile } from "./useHomeData";

type Props = { episodes: Episode[]; fallback: HomeProfile[]; loading: boolean };

const HomeEpisodes = ({ episodes, fallback, loading }: Props) => {
  const { play, isCurrent, playing } = usePlayer();
  const rows = episodes.slice(0, 4);
  const showFallback = !loading && rows.length === 0;

  return (
    <section className="py-16 md:py-24" aria-labelledby="episodes-title">
      <div className={container}>
        <div className="flex items-end justify-between gap-4 border-b-2 border-encre pb-5">
          <h2 id="episodes-title" className="title-section text-[44px] sm:text-[64px]">
            {showFallback ? "Derniers podcasts ajoutés" : "Derniers épisodes"}
          </h2>
          <Link to="/ecouter" className={`${linkUnderline} min-h-[44px] inline-flex items-center shrink-0`}>Tous les podcasts</Link>
        </div>

        {loading && (
          <ul aria-hidden className="divide-y divide-filet">
            {[0, 1, 2, 3].map((i) => <li key={i} className="h-[104px] bg-muted/40" />)}
          </ul>
        )}

        {!loading && rows.length > 0 && (
          <ul className="divide-y divide-filet border-b border-filet">
            {rows.map((ep, i) => {
              const active = isCurrent(ep) && playing;
              return (
                <li key={ep.audioUrl} className="grid grid-cols-[44px_56px_1fr] sm:grid-cols-[56px_72px_1fr_180px_auto] items-center gap-x-4 sm:gap-x-5 gap-y-1 py-4">
                  <button
                    onClick={() => play(ep)}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full inline-flex items-center justify-center border-2 border-primary ${
                      i === 0 || active ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary hover:text-primary-foreground"
                    }`}
                    aria-label={`${active ? "Mettre en pause" : "Écouter"} : ${ep.title}, ${ep.podcastName}`}
                  >
                    {active ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
                  </button>
                  {ep.image ? (
                    <img src={ep.image} alt={`Pochette de ${ep.podcastName}`} className="w-14 h-14 sm:w-[72px] sm:h-[72px] object-cover" loading="lazy" />
                  ) : <span className="w-14 h-14 sm:w-[72px] sm:h-[72px] bg-muted" />}
                  <div className="min-w-0">
                    <p className="font-bold text-[17px] sm:text-[21px] leading-tight line-clamp-2">{ep.title}</p>
                    <p className="text-muted-foreground text-[15px] sm:text-[17px] truncate">
                      <Link to={`/podcasteur/${ep.podcastSlug || ep.podcastId}`} className="hover:underline underline-offset-4">{ep.podcastName}</Link>
                      {ep.author ? ` · ${ep.author}` : ""}
                    </p>
                    <p className="sm:hidden font-mono text-xs text-muted-foreground mt-1">
                      {[cleanCity(ep.city), formatShortDate(ep.date), formatDuration(ep.duration)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="hidden sm:block font-mono text-sm text-muted-foreground">{cleanCity(ep.city)}</p>
                  <p className="hidden sm:block font-mono text-sm text-muted-foreground text-right whitespace-nowrap">
                    {[formatShortDate(ep.date), formatDuration(ep.duration)].filter(Boolean).join(" · ")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {showFallback && (
          <ul className="divide-y divide-filet border-b border-filet">
            {fallback.slice(0, 4).map((p) => (
              <li key={p.id} className="grid grid-cols-[44px_56px_1fr] sm:grid-cols-[56px_72px_1fr_180px] items-center gap-x-4 sm:gap-x-5 py-4">
                <a
                  href={p.lien_ecoute || "#"}
                  onClick={() => compterStat(p.id, "ecoute")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-full inline-flex items-center justify-center border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  aria-label={`Écouter ${p.nom_podcast} (nouvel onglet)`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {p.vignette_url ? (
                  <img src={p.vignette_url} alt={`Pochette de ${p.nom_podcast}`} className="w-14 h-14 sm:w-[72px] sm:h-[72px] object-cover" loading="lazy" />
                ) : <span className="w-14 h-14 sm:w-[72px] sm:h-[72px] bg-muted" />}
                <div className="min-w-0">
                  <Link to={`/podcasteur/${p.slug || p.id}`} className="font-bold text-[17px] sm:text-[21px] leading-tight hover:underline underline-offset-4">{p.nom_podcast}</Link>
                  <p className="text-muted-foreground text-[15px] sm:text-[17px] truncate">{fullName(p.prenom, p.nom)}</p>
                </div>
                <p className="hidden sm:block font-mono text-sm text-muted-foreground">{cleanCity(p.city_name)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default HomeEpisodes;
