import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import EventRow from "@/components/agenda/EventRow";
import { btnSecondary, container, linkUnderline } from "@/lib/pds";
import { isOnline, isOrganizedByPds, type HomeEvent } from "./useHomeData";

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
          <Link to="/agenda#proposer" className={btnSecondary}>
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
            {list.map((e, i) => <EventRow key={e.id} e={e} primary={i === 0} />)}
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
