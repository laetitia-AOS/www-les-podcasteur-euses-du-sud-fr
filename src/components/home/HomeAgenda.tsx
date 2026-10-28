import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Plus } from "lucide-react";
import { btnPrimary, btnSecondary, container, linkUnderline } from "@/lib/pds";
import { EVENT_TYPE_LABELS, cityFromAddress, isOnline, isOrganizedByPds, type HomeEvent } from "./useHomeData";

const FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "ligne", label: "En ligne" },
  { key: "place", label: "Sur place" },
  { key: "pds", label: "Organisés par PDS" },
  { key: "membres", label: "Proposés par les membres" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const matches = (e: HomeEvent, f: FilterKey) => {
  switch (f) {
    case "ligne": return isOnline(e);
    case "place": return !isOnline(e);
    case "pds": return isOrganizedByPds(e);
    case "membres": return !isOrganizedByPds(e);
    default: return true;
  }
};

const HomeAgenda = ({ events }: { events: HomeEvent[] }) => {
  const [filter, setFilter] = useState<FilterKey>("tous");
  const list = events.filter((e) => matches(e, filter)).slice(0, 3);

  return (
    <section className="bg-surface py-16 md:py-24 border-t border-filet" aria-labelledby="agenda-title">
      <div className={container}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="agenda-title" className="title-section text-[48px] sm:text-[64px]">Agenda</h2>
          <Link to="/proposer-evenement-podcast" className={btnSecondary}>
            <Plus className="w-4 h-4" aria-hidden /> Proposer un événement
          </Link>
        </div>

        <div role="group" aria-label="Filtrer les événements" className="mt-6 flex flex-wrap gap-2 pb-6 border-b-2 border-encre">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`min-h-[44px] px-4 border font-semibold text-[15px] ${
                filter === f.key ? "bg-encre text-surface border-encre" : "border-encre hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="py-10 text-lg text-muted-foreground border-b border-filet">Aucun événement à venir dans cette catégorie pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-filet border-b border-filet">
            {list.map((e, i) => {
              const d = new Date(e.date_debut);
              const dayMonth = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
              const dayHour = `${d.toLocaleDateString("fr-FR", { weekday: "short" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h")}`;
              const online = isOnline(e);
              const city = cityFromAddress(e.adresse);
              const href = e.slug ? `/evenement-podcast/${e.slug}` : "/evenements-podcast";
              return (
                <li key={e.id} className="grid grid-cols-[80px_1fr] sm:grid-cols-[110px_1fr_220px_auto] gap-x-5 gap-y-3 py-6 items-start sm:items-center">
                  <div>
                    <p className="title-section text-[34px] sm:text-[44px]">{dayMonth.replace("/", ".")}</p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">{dayHour}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-accent-text">
                      {EVENT_TYPE_LABELS[e.type] || e.type} · {isOrganizedByPds(e) ? "organisé par PDS" : "proposé par un membre"}
                    </p>
                    <Link to={href} className="block font-bold text-[20px] sm:text-[24px] leading-tight hover:underline underline-offset-4">{e.titre}</Link>
                    {e.sous_titre && <p className="text-muted-foreground mt-1 line-clamp-2">{e.sous_titre}</p>}
                  </div>
                  <div className="col-start-2 sm:col-start-auto text-[15px]">
                    {online ? (
                      <p className="inline-flex items-center gap-2"><Globe className="w-4 h-4" aria-hidden /> En ligne</p>
                    ) : (
                      <>
                        <p className="font-semibold">{e.lieu}</p>
                        {city && <p className="text-muted-foreground">{city}</p>}
                      </>
                    )}
                  </div>
                  <div className="col-start-2 sm:col-start-auto">
                    <Link to={href} className={`${i === 0 ? btnPrimary : btnSecondary} px-6`} aria-label={`${e.inscription_activee ? "S'inscrire" : "Je viens"} : ${e.titre}`}>
                      {e.inscription_activee ? "S'inscrire" : "Je viens"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[15px]">
          <p className="text-muted-foreground">Les événements proposés sont relus par l'équipe avant publication.</p>
          <div className="flex gap-6">
            <Link to="/evenements-podcast" className={`${linkUnderline} min-h-[44px] inline-flex items-center`}>Tout l'agenda</Link>
            <Link to="/evenements-podcast#passes" className={`${linkUnderline} min-h-[44px] inline-flex items-center`}>Archives</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeAgenda;
