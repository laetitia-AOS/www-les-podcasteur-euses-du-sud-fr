import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import { EVENT_TYPE_LABELS, cityFromAddress, isOnline, isOrganizedByPds, type HomeEvent } from "@/components/home/useHomeData";

export const eventHref = (e: Pick<HomeEvent, "slug" | "id">) => `/agenda/${e.slug || e.id}`;

/** Ligne d'événement partagée par l'accueil et l'agenda. */
const EventRow = ({ e, primary, cta }: { e: HomeEvent; primary?: boolean; cta?: string }) => {
  const d = new Date(e.date_debut);
  const dayMonth = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }).replace("/", ".");
  const dayHour = `${d.toLocaleDateString("fr-FR", { weekday: "short" })} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h")}`;
  const online = isOnline(e);
  const city = cityFromAddress(e.adresse);
  const href = eventHref(e);
  const label = cta || (e.inscription_activee ? "S'inscrire" : "Je viens");

  return (
    <li className="grid grid-cols-[80px_1fr] sm:grid-cols-[110px_1fr_220px_auto] gap-x-5 gap-y-3 py-6 items-start sm:items-center">
      <div>
        <p className="title-section text-[34px] sm:text-[44px]"><time dateTime={e.date_debut}>{dayMonth}</time></p>
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
        <Link to={href} className={`${primary ? btnPrimary : btnSecondary} px-6`} aria-label={`${label} : ${e.titre}`}>
          {label}
        </Link>
      </div>
    </li>
  );
};

export default EventRow;
