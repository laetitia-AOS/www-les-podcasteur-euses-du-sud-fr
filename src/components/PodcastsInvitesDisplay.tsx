import { Mic2, ArrowUpRight } from "lucide-react";
import type { PodcastInvite } from "./PodcastsInvitesEditor";
import { withUtm } from "@/lib/utm";

interface Props {
  podcasts: PodcastInvite[];
}

const PodcastsInvitesDisplay = ({ podcasts }: Props) => {
  const items = (podcasts || []).filter((p) => p && (p.nom_podcast || p.host || p.vignette_url));
  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 bg-bleu/10 rounded-xl flex items-center justify-center shrink-0">
          <Mic2 className="w-5 h-5 text-bleu" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-foreground leading-tight">
            Podcasts à l'écoute
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} podcast{items.length > 1 ? "s" : ""} mis en avant durant l'événement
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((p, i) => {
          const CardInner = (
            <div
              className="group rounded-[14px] p-3 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: "#FDFAF5",
                border: "1px solid rgba(184,92,56,0.12)",
              }}
            >
              <div className="shrink-0 w-16 h-16 rounded-[10px] overflow-hidden bg-muted flex items-center justify-center">
                {p.vignette_url ? (
                  <img
                    src={p.vignette_url}
                    alt={`Vignette : ${p.nom_podcast || p.host}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <Mic2 className="w-6 h-6 text-primary/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {p.nom_podcast && (
                  <p className="font-display font-semibold text-[15px] text-foreground truncate">
                    {p.nom_podcast}
                  </p>
                )}
                {p.host && (
                  <p className="text-sm text-primary font-medium truncate">{p.host}</p>
                )}
                {p.lien_ecoute && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-bleu mt-0.5">
                    Écouter <ArrowUpRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );

          return p.lien_ecoute ? (
            <a
              key={i}
              href={withUtm(p.lien_ecoute, "evenement-invite")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Écouter ${p.nom_podcast || p.host}`}
            >
              {CardInner}
            </a>
          ) : (
            <div key={i}>{CardInner}</div>
          );
        })}
      </div>
    </section>
  );
};

export default PodcastsInvitesDisplay;
