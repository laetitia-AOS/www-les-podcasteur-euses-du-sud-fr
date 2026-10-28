import type { PodcastInvite } from "./PodcastsInvitesEditor";
import { withUtm } from "@/lib/utm";

interface Props {
  podcasts: PodcastInvite[];
}

/** « Les podcasts de la soirée » : pochettes carrées, nom du podcast et de l'hôte·sse. */
const PodcastsInvitesDisplay = ({ podcasts }: Props) => {
  const items = (podcasts || []).filter((p) => p && (p.nom_podcast || p.host || p.vignette_url));
  if (items.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="podcasts-soiree-title">
      <h2 id="podcasts-soiree-title" className="title-section text-[30px] sm:text-[36px] pb-3 border-b-2 border-encre">
        Les podcasts de la soirée
      </h2>
      <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p, i) => {
          const inner = (
            <>
              <span className="block aspect-square bg-muted overflow-hidden">
                {p.vignette_url && <img src={p.vignette_url} alt={`Pochette du podcast ${p.nom_podcast || p.host}`} className="w-full h-full object-cover" loading="lazy" />}
              </span>
              {p.nom_podcast && <span className="block mt-2 font-bold text-[16px] leading-tight">{p.nom_podcast}</span>}
              {p.host && <span className="block text-sm text-muted-foreground">{p.host}</span>}
            </>
          );
          return (
            <li key={i}>
              {p.lien_ecoute ? (
                <a href={withUtm(p.lien_ecoute, "evenement-invite")} target="_blank" rel="noopener noreferrer" className="block group hover:[&_span.font-bold]:underline" aria-label={`Écouter ${p.nom_podcast || p.host} (nouvel onglet)`}>
                  {inner}
                </a>
              ) : inner}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default PodcastsInvitesDisplay;
