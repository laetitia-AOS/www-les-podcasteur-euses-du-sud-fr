// Pied fixe en bas de chaque numéro (page, aperçu, PDF ; l'e-mail le reproduit dans onde-email.ts) :
// « Ce que l'adhésion t'ouvre » et trois boutons. Rien à remplir d'un numéro à l'autre.
// « Recevoir L'Onde chaque mois » est masqué pour un·e membre connecté·e ou un·e abonné·e actif·ve (pas dans le PDF) ;
// « Soutenir L'Onde par un don » n'apparaît que si le lien de don est rempli dans l'admin.
import { useId } from "react";
import { Link } from "react-router-dom";
import { btnListen, btnPrimary, btnSecondary } from "@/lib/pds";
import { PAGES, SITE_URL } from "@/lib/seo";
import {
  ADHESION_OUVRE, PIED_ABONNEMENT, PIED_ADHERER, PIED_DON, TITRE_ADHESION_OUVRE, adresseImprimee, useEtatLecteur, useLienDon,
} from "@/lib/ondePied";
import { useImpression } from "@/components/onde/impressionOnde";

const Bouton = ({ href, classe, impression, children }: { href: string; classe: string; impression: boolean; children: string }) => {
  if (impression) {
    const abs = href.startsWith("http") ? href : `${SITE_URL}${href.startsWith("#") ? `${PAGES.onde}${href}` : href}`;
    return (
      <div className="min-w-0">
        <span className={classe}>{children}</span>
        <span className="block mt-1 font-mono text-[11px] break-all">{adresseImprimee(abs)}</span>
      </div>
    );
  }
  if (href.startsWith("#")) return <a href={href} className={classe}>{children}</a>;
  if (href.startsWith("/")) return <Link to={href} className={classe}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classe}>
      {children}<span className="sr-only"> (nouvel onglet)</span>
    </a>
  );
};

const PiedNumero = ({ lienAbonnement = `${PAGES.onde}#recevoir`, className = "" }: { lienAbonnement?: string; className?: string }) => {
  const id = useId();
  const impression = useImpression();
  const { data: lecteur } = useEtatLecteur();
  const { data: lienDon } = useLienDon();
  const montrerAbonnement = impression || !(lecteur === "membre" || lecteur === "abonne");
  return (
    <aside aria-labelledby={`${id}-titre`} className={`onde-pied border-2 border-encre bg-surface break-inside-avoid ${className}`}>
      <div className="p-5 sm:p-7">
        <h2 id={`${id}-titre`} className="title-section text-[24px] sm:text-[28px]">{TITRE_ADHESION_OUVRE}</h2>
        <ul className="mt-4 grid gap-2 text-[16px] max-w-[64ch]">
          {ADHESION_OUVRE.map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden className="mt-[0.5em] w-2 h-2 bg-accent shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t-2 border-encre p-5 sm:p-7 flex flex-wrap items-start gap-3">
        {montrerAbonnement && <Bouton href={lienAbonnement} classe={btnSecondary} impression={impression}>{PIED_ABONNEMENT}</Bouton>}
        <Bouton href={PAGES.adherer} classe={btnPrimary} impression={impression}>{PIED_ADHERER}</Bouton>
        {lienDon && <Bouton href={lienDon} classe={btnListen} impression={impression}>{PIED_DON}</Bouton>}
      </div>
    </aside>
  );
};

export default PiedNumero;
