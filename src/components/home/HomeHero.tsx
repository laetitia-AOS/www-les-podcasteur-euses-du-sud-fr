import { Link, useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { useMemo } from "react";
import { btnListen, container } from "@/lib/pds";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Episode } from "@/lib/episodes";
import type { HomeProfile } from "./useHomeData";

// Pochettes mises en avant en premier sur le mur, dans cet ordre, si elles existent.
const WALL_PRIORITY = ["vitamine sud", "marseille creative", "chaos debout", "symbioses", "un pas dehors"];
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

type Props = { profiles: HomeProfile[]; latest: Episode[] };

const HomeHero = ({ profiles, latest }: Props) => {
  const navigate = useNavigate();
  const { play } = usePlayer();

  const podcasts = profiles.filter((p) => p.type_profil === "podcasteur");
  const departements = new Set(profiles.map((p) => p.department_code).filter(Boolean)).size;

  const wall = useMemo(() => {
    const withCover = podcasts.filter((p) => p.vignette_url);
    const picked: HomeProfile[] = [];
    for (const key of WALL_PRIORITY) {
      const found = withCover.find((p) => norm(p.nom_podcast).startsWith(key));
      if (found) picked.push(found);
    }
    for (const p of withCover) {
      if (picked.length >= 5) break;
      if (!picked.includes(p)) picked.push(p);
    }
    return picked.slice(0, 5);
  }, [podcasts]);

  const others = Math.max(podcasts.length - wall.length, 0);

  const listenNow = () => {
    if (latest[0]) play(latest[0]);
    else navigate("/podcasts");
  };

  return (
    <section className="bg-primary text-primary-foreground pt-16 md:pt-[76px]" aria-labelledby="home-title">
      <div className={`${container} py-12 md:py-20 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center`}>
        <div>
          <h1 id="home-title" className="title-page text-primary-foreground text-[64px] min-[420px]:text-[84px] sm:text-[112px] lg:text-[128px]">
            Le sud
            <br />
            au casque<span className="text-accent">.</span>
            <span className="sr-only"> Podcasts, fictions sonores, livres audio et vodcasts de Marseille et de la Région Sud</span>
          </h1>
          <p className="mt-8 text-lg sm:text-[21px] leading-snug max-w-[34ch]">
            Podcasts, fictions sonores, livres audio, vodcasts. Les voix qui se fabriquent à Marseille et en Région Sud, et les gens qui les font.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button onClick={listenNow} className={`${btnListen} px-7 min-h-[56px] text-[17px]`}>
              <Play className="w-4 h-4" fill="currentColor" aria-hidden />
              Écouter maintenant
            </button>
            <Link to="/annuaire-podcasts" className="inline-flex min-h-[44px] items-center text-[17px] font-bold underline underline-offset-4 decoration-2 hover:decoration-accent">
              Trouver un·e créateur·ice
            </Link>
          </div>
          {profiles.length > 0 && (
            <p className="mt-10 text-[17px]">
              {profiles.length} créateur·ices · {podcasts.length} podcasts · {departements} départements
            </p>
          )}
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5" aria-label="Quelques podcasts de la région">
          {wall.map((p) => (
            <li key={p.id}>
              <Link to={`/podcasteur/${p.slug || p.id}`} className="group block">
                <span className="block aspect-square border-[6px] border-surface bg-surface overflow-hidden">
                  <img
                    src={p.vignette_url!}
                    alt={`Pochette du podcast ${p.nom_podcast}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </span>
                <span className="block mt-2 font-bold text-[15px] leading-tight group-hover:underline underline-offset-4">{p.nom_podcast}</span>
              </Link>
            </li>
          ))}
          {others > 0 && (
            <li>
              <Link
                to="/podcasts"
                className="flex aspect-square border-[3px] border-surface items-end p-4 sm:p-5 text-xl sm:text-2xl font-bold leading-tight hover:bg-primary-hover"
              >
                Les {others} autres →
              </Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
};

export default HomeHero;
