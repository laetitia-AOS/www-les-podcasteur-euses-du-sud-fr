import { Link, useLocation } from "react-router-dom";
import { container, linkUnderline } from "@/lib/pds";
import AbonnementOnde from "@/components/onde/AbonnementOnde";
import { PAGES } from "@/lib/seo";
import { LIENS_LOCAUX } from "@/lib/pagesLocales";

/**
 * Abonnement à L'Onde du Sud en tête du pied de page, sauf dans l'administration et sur les pages de L'Onde,
 * qui ont déjà leur propre formulaire (ou un lien personnel de confirmation / désinscription).
 */
const avecOnde = (path: string) => !/^\/(admin|onde)(\/|$)/.test(path);

const Footer = () => {
  const { pathname } = useLocation();
  return (
    <footer className="bg-background border-t border-encre">
      {avecOnde(pathname) && (
        <section aria-labelledby="pied-onde" className="border-b border-encre">
          <div className={`${container} py-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-6 lg:gap-12 items-start`}>
            <div>
              <h2 id="pied-onde" className="title-section text-[24px] sm:text-[28px] leading-tight">
                L'Onde du Sud, la lettre mensuelle de la création sonore du Sud
              </h2>
              <Link to={PAGES.onde} className={`${linkUnderline} mt-2 inline-flex min-h-[44px] items-center`}>
                Lire les numéros<span aria-hidden>&nbsp;→</span>
              </Link>
            </div>
            <AbonnementOnde />
          </div>
        </section>
      )}
      <div className={`${container} py-8 flex flex-col gap-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[15px]">Les Podcasteur·euses du Sud · association · Marseille</p>
          <ul className="flex flex-wrap items-center gap-x-6">
            <li>
              <a href="https://www.instagram.com/les_podcasteur.euses_du_sud/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline underline-offset-4">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/company/les-podcasteur-euses-du-sud/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline underline-offset-4">
                LinkedIn
              </a>
            </li>
            <li>
              <Link to="/onde" className="inline-flex min-h-[44px] items-center underline underline-offset-4">L'Onde du Sud</Link>
            </li>
            <li>
              <Link to="/partenaires" className="inline-flex min-h-[44px] items-center underline underline-offset-4">Partenaires</Link>
            </li>
            <li>
              <Link to="/contact" className="inline-flex min-h-[44px] items-center underline underline-offset-4">Nous écrire</Link>
            </li>
          </ul>
        </div>
        <ul aria-label="Podcast dans le Sud" className="flex flex-wrap gap-x-6 text-[15px] border-t border-filet pt-3">
          {LIENS_LOCAUX.map((l) => (
            <li key={l.to}><Link to={l.to} className="inline-flex min-h-[44px] items-center underline underline-offset-4">{l.label}</Link></li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-x-5 text-sm text-muted-foreground border-t border-filet pt-3">
          <li><Link to="/mentions-legales" className="inline-flex min-h-[44px] items-center hover:text-foreground">Mentions légales</Link></li>
          <li><Link to="/politique-de-confidentialite" className="inline-flex min-h-[44px] items-center hover:text-foreground">Confidentialité</Link></li>
          <li><Link to="/conditions-utilisation" className="inline-flex min-h-[44px] items-center hover:text-foreground">Conditions d'utilisation</Link></li>
          <li><Link to="/politique-cookies" className="inline-flex min-h-[44px] items-center hover:text-foreground">Cookies</Link></li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
