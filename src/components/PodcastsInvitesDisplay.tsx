import type { PodcastInvite } from "./PodcastsInvitesEditor";
import { withUtm } from "@/lib/utm";
import { formatName } from "@/lib/pds";
import { useHomeProfiles } from "@/components/home/useHomeData";
import MemberAvatar, { avatarFor } from "@/components/MemberAvatar";

const norm = (s?: string | null) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

interface Props {
  podcasts: PodcastInvite[];
}

/** « Les podcasts de la soirée » : pochettes carrées, nom du podcast et de l'hôte·sse. */
const PodcastsInvitesDisplay = ({ podcasts }: Props) => {
  const items = (podcasts || []).filter((p) => p && (p.nom_podcast || p.host || p.vignette_url));
  // Sans visuel saisi : la pochette du podcast s'il est dans l'annuaire, sinon la photo ou le premier podcast de l'hôte·sse
  const { data: profils = [] } = useHomeProfiles();
  const visuel = (p: PodcastInvite): { url: string; alt: string } | null => {
    if (p.vignette_url) return { url: p.vignette_url, alt: `Pochette du podcast ${p.nom_podcast || formatName(p.host)}` };
    const podcast = p.nom_podcast ? profils.find((f) => f.type_profil === "podcasteur" && f.vignette_url && norm(f.nom_podcast) === norm(p.nom_podcast)) : undefined;
    if (podcast) return { url: podcast.vignette_url!, alt: `Pochette du podcast ${podcast.nom_podcast}` };
    const hote = p.host ? profils.find((f) => norm(`${f.prenom} ${f.nom}`) === norm(p.host)) : undefined;
    return hote ? avatarFor(hote, profils) : null;
  };
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
                {(() => {
                  const v = visuel(p);
                  if (v) return <img src={v.url} alt={v.alt} className="w-full h-full object-cover" loading="lazy" />;
                  const [prenom, ...reste] = formatName(p.host).split(" ");
                  return (
                    <span className="flex w-full h-full items-center justify-center">
                      <MemberAvatar prenom={prenom} nom={reste.join(" ")} className="w-24 h-24 text-3xl" />
                    </span>
                  );
                })()}
              </span>
              {p.nom_podcast && <span className="block mt-2 font-bold text-[16px] leading-tight">{p.nom_podcast}</span>}
              {p.host && <span className="block text-sm text-muted-foreground">{formatName(p.host)}</span>}
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
