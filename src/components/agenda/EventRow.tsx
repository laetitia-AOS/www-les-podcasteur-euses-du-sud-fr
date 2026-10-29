import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import { dateParis, horairesParis, jourCourt, readableTitle } from "@/lib/events";
import { EVENT_TYPE_LABELS, cityFromAddress, isOnline, organisateurLabel, type HomeEvent } from "@/components/home/useHomeData";

export const eventHref = (e: Pick<HomeEvent, "slug" | "id">) => `/agenda/${e.slug || e.id}`;

/** Ligne d'événement partagée par l'accueil et l'agenda. */
const EventRow = ({ e, primary, cta }: { e: HomeEvent; primary?: boolean; cta?: string }) => {
  // Plusieurs jours : « 19–20.06 » ; un seul jour : « 09.11 » et les horaires
  const dayMonth = jourCourt(e.date_debut, e.date_fin);
  const plusieursJours = dayMonth.includes("–");
  const dayHour = plusieursJours
    ? `${dateParis(e.date_debut, { weekday: "short" })}–${dateParis(e.date_fin!, { weekday: "short" })}`
    : `${dateParis(e.date_debut, { weekday: "short" })} ${horairesParis(e.date_debut, e.date_fin)}`;
  const online = isOnline(e);
  const city = cityFromAddress(e.adresse);
  const href = eventHref(e);
  const label = cta || "Je viens";

  return (
    <li className="grid grid-cols-[80px_1fr] sm:grid-cols-[110px_1fr_220px_auto] gap-x-5 gap-y-3 py-6 items-start sm:items-center">
      <div>
        <p className={`title-section ${plusieursJours ? "text-[22px] sm:text-[30px]" : "text-[34px] sm:text-[44px]"}`}><time dateTime={e.date_debut}>{dayMonth}</time></p>
        <p className="font-mono text-xs text-muted-foreground mt-1">{dayHour}</p>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-accent-text">
          {EVENT_TYPE_LABELS[e.type] || e.type} · {organisateurLabel(e)}{e.tarif ? ` · ${e.tarif}` : ""}
        </p>
        <Link to={href} className="block font-bold text-[20px] sm:text-[24px] leading-tight hover:underline underline-offset-4">{readableTitle(e.titre)}</Link>
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
        <Link to={href} className={`${primary ? btnPrimary : btnSecondary} px-6`} aria-label={`${label} : ${readableTitle(e.titre)}`}>
          {label}
        </Link>
      </div>
    </li>
  );
};

export default EventRow;
