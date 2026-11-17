import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import { dateParis, horairesParis, jourCourt, readableTitle } from "@/lib/events";
import { EVENT_TYPE_LABELS, cityFromAddress, estRendezVousPds, isOnline, organisateurLabel, type HomeEvent } from "@/components/home/useHomeData";

export const eventHref = (e: Pick<HomeEvent, "slug" | "id">) => `/agenda/${e.slug || e.id}`;

/**
 * Ligne d'événement partagée par l'accueil et l'agenda.
 * `vedette` : sur l'agenda, un vrai rendez-vous PDS est affiché en plus grand, encadré, avec son image.
 */
const EventRow = ({ e, primary, cta, vedette }: { e: HomeEvent; primary?: boolean; cta?: string; vedette?: boolean }) => {
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
  const titre = readableTitle(e.titre);

  if (vedette && estRendezVousPds(e)) {
    const typeTarif = [EVENT_TYPE_LABELS[e.type] || e.type, e.tarif].filter(Boolean).join(" · ");
    return (
      <li className="py-6">
        <article className={`grid gap-4 sm:gap-6 border-[3px] border-primary bg-surface p-4 sm:p-6 ${e.image_url ? "grid-cols-[104px_1fr] sm:grid-cols-[220px_1fr]" : "grid-cols-1"}`}>
          {e.image_url && (
            <Link to={href} tabIndex={-1} aria-hidden="true" className="block self-start aspect-[4/5] overflow-hidden bg-muted">
              <img src={e.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </Link>
          )}
          <div className="min-w-0 flex flex-col">
            <p className="self-start bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wide px-2 py-1">Organisé par PDS</p>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
              <span className={`title-section text-primary ${plusieursJours ? "text-[30px] sm:text-[44px]" : "text-[44px] sm:text-[64px]"}`}><time dateTime={e.date_debut}>{dayMonth}</time></span>
              <span className="font-mono text-sm text-muted-foreground">{dayHour}</span>
            </p>
            {typeTarif && <p className="mt-2 text-sm font-bold text-accent-text">{typeTarif}</p>}
            <h3 className="mt-1">
              <Link to={href} className="block font-bold text-[24px] sm:text-[34px] leading-tight hover:underline underline-offset-4">{titre}</Link>
            </h3>
            {e.sous_titre && <p className="text-muted-foreground mt-2 line-clamp-3 max-w-[60ch]">{e.sous_titre}</p>}
            <div className="mt-3 text-[15px]">
              {online ? (
                <p className="inline-flex items-center gap-2"><Globe className="w-4 h-4" aria-hidden /> En ligne</p>
              ) : (
                <p><span className="font-semibold">{e.lieu}</span>{city && <span className="text-muted-foreground">{e.lieu ? " · " : ""}{city}</span>}</p>
              )}
            </div>
            <div className="mt-4 sm:mt-auto sm:pt-5">
              <Link to={href} className={`${btnPrimary} px-6`} aria-label={`${label} : ${titre}`}>{label}</Link>
            </div>
          </div>
        </article>
      </li>
    );
  }

  return (
    <li className="grid grid-cols-[80px_1fr] sm:grid-cols-[110px_1fr_220px_auto] gap-x-5 gap-y-3 py-6 items-start sm:items-center">
      <div>
        <p className={`title-section ${plusieursJours ? "text-[22px] sm:text-[30px]" : "text-[34px] sm:text-[44px]"}`}><time dateTime={e.date_debut}>{dayMonth}</time></p>
        <p className="font-mono text-xs text-muted-foreground mt-1">{dayHour}</p>
      </div>
      <div className="min-w-0">
        {/* Parties manquantes (organisateur inconnu, tarif vide) retirées : pas de point séparateur orphelin */}
        <p className="text-sm font-bold text-accent-text">
          {[EVENT_TYPE_LABELS[e.type] || e.type, organisateurLabel(e), e.tarif].filter(Boolean).join(" · ")}
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
