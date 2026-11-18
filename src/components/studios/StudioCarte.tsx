import { Link } from "react-router-dom";
import { ficheHref } from "@/lib/seo";
import { btnPrimary, btnSecondary, cleanCity } from "@/lib/pds";
import { accrocheLieu, formatCapacite, serviceLabel, tarifAffiche, type FicheLieu } from "@/lib/lieux";

export type StudioData = {
  type_lieu?: string;
  accroche?: string;
  phrase_accroche?: string;
  indication_tarifaire?: string;
  capacite?: string;
  accessibilite?: string[];
  services_studio?: string[];
  usages?: string[];
  galerie_urls?: string[];
};

export type StudioListe = {
  id: string;
  slug: string | null;
  type_profil: string;
  city_name: string | null;
  nom_podcast: string;
  vignette_url: string | null;
  consent_contact: boolean;
  studio_data: StudioData | string | null;
};

/** Données d'inscription d'un studio (archive), lues qu'elles soient en texte ou en objet. */
export const sdOf = (p: Pick<StudioListe, "studio_data">): StudioData => {
  if (!p.studio_data) return {};
  if (typeof p.studio_data === "string") { try { return JSON.parse(p.studio_data); } catch { return {}; } }
  return p.studio_data;
};

/** Carte d'un studio (photo, accroche, tarif, services, devis), partagée par Studios et les pages locales. */
const StudioCarte = ({ p, fiche, onDevis }: { p: StudioListe; fiche?: FicheLieu; onDevis: (id: string) => void }) => {
  const sd = sdOf(p);
  const services = (fiche?.services || []).map(serviceLabel);
  const photo = fiche?.photos?.[0] || sd.galerie_urls?.[0] || p.vignette_url;
  const href = ficheHref(p);
  const accroche = accrocheLieu(fiche, sd);
  const meta = [
    { k: "Tarif", v: tarifAffiche(fiche) },
    { k: "Capacité", v: formatCapacite(fiche?.capacite_voix) },
    { k: "Accès", v: fiche?.acces_transports },
  ].filter((m) => m.v);
  return (
    <li className="bg-surface border border-filet flex flex-col">
      <Link to={href} tabIndex={-1} aria-hidden className="block aspect-[16/9] bg-muted overflow-hidden">
        {photo && <img src={photo} alt={`Photo du studio ${p.nom_podcast}`} className="w-full h-full object-cover" loading="lazy" />}
      </Link>
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {sd.type_lieu && <p className="text-sm font-bold text-primary">{sd.type_lieu}</p>}
        <h2 className="title-section text-[30px] sm:text-[34px] mt-1">
          <Link to={href} className="hover:underline underline-offset-4">{p.nom_podcast}</Link>
        </h2>
        {p.city_name && <p className="text-[15px] text-muted-foreground">{cleanCity(p.city_name)}</p>}
        {accroche && <p className="mt-3 text-[17px] line-clamp-3">{accroche}</p>}
        {meta.length > 0 && (
          <dl className="mt-4 grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 border-y border-filet py-3">
            {meta.map((m) => (
              <div key={m.k} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{m.k}</dt>
                <dd className="font-mono text-sm break-words">{m.v}</dd>
              </div>
            ))}
          </dl>
        )}
        {services.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
            {services.slice(0, 5).map((s) => <li key={s}>{s}</li>)}
          </ul>
        )}
        <div className="mt-auto pt-5 flex flex-wrap gap-3">
          {p.consent_contact && (
            <button onClick={() => onDevis(p.id)} className={btnPrimary} aria-label={`Demander un devis à ${p.nom_podcast}`}>Demander un devis</button>
          )}
          <Link to={href} className={btnSecondary} aria-label={`Voir la fiche de ${p.nom_podcast}`}>Voir la fiche</Link>
        </div>
      </div>
    </li>
  );
};

export default StudioCarte;
