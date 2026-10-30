import { Link, useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { useMemo } from "react";
import { btnListen, container, h1Ligne } from "@/lib/pds";
import { usePlayer } from "@/contexts/PlayerContext";
import type { Episode } from "@/lib/episodes";
import { DEPARTEMENTS_PDS, chiffresAccueil, piocherMur, type HomeProfile } from "./useHomeData";

type Props = { profiles: HomeProfile[]; latest: Episode[] };

const HomeHero = ({ profiles, latest }: Props) => {
  const navigate = useNavigate();
  const { play } = usePlayer();

  const podcasts = profiles.filter((p) => p.type_profil === "podcasteur");
  const chiffres = chiffresAccueil(profiles);

  // Cinq pochettes tirées au hasard à chaque visite
  const wall = useMemo(() => piocherMur(profiles), [profiles]);

  const others = Math.max(podcasts.length - wall.length, 0);

  const listenNow = () => {
    if (latest[0]) play(latest[0]);
    else navigate("/ecouter");
  };

  return (
    <section className="bg-primary text-primary-foreground pt-16 md:pt-[76px]" aria-labelledby="home-title">
      <div className={`${container} py-12 md:py-20 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center`}>
        <div>
          <h1 id="home-title" className="title-page text-primary-foreground text-[64px] min-[420px]:text-[84px] sm:text-[112px] lg:text-[128px]">
            <span className="block">
              Le Sud
              <br />
              a des voix<span className="text-accent">.</span>
            </span>
            <span className={`${h1Ligne} text-primary-foreground mt-6`}>Les podcasts de Marseille et de Région Sud, et celles et ceux qui les font.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-[21px] leading-snug max-w-[34ch]">
            Podcasts, fictions sonores, livres audio, vodcasts : écoutez-les ici, trouvez qui les fabrique, venez les écouter avec nous.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button onClick={listenNow} className={`${btnListen} px-7 min-h-[56px] text-[17px]`}>
              <Play className="w-4 h-4" fill="currentColor" aria-hidden />
              Écouter maintenant
            </button>
            <Link to="/annuaire" className="inline-flex min-h-[44px] items-center text-[17px] font-bold underline underline-offset-4 decoration-2 hover:decoration-accent">
              Trouver un·e créateur·ice
            </Link>
          </div>
          {profiles.length > 0 && (
            <p className="mt-10 text-[17px]">
              {chiffres.personnes} créateur·ices et pros · {chiffres.podcasts} podcasts · {chiffres.studios} studio{chiffres.studios > 1 ? "s" : ""} · {DEPARTEMENTS_PDS} départements
            </p>
          )}
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5" aria-label="Quelques podcasts de la région">
          {wall.map((p) => (
            <li key={p.id}>
              <Link to={`/ecouter/${p.slug || p.id}`} className="group block">
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
                to="/ecouter"
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
