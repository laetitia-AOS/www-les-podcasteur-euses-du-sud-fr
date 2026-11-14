import { Link } from "react-router-dom";
import AbonnementOnde from "@/components/onde/AbonnementOnde";
import { container, linkUnderline } from "@/lib/pds";
import { NOM_ONDE } from "@/lib/onde";
import { PAGES } from "@/lib/seo";

/** « L'Onde du Sud » sur l'accueil : une phrase, l'abonnement et le lien vers les numéros. */
const HomeOnde = () => (
  <section className="py-16 md:py-24 border-t border-filet" aria-labelledby="onde-title">
    <div className={`${container} grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-8 lg:gap-16 items-start`}>
      <div>
        <h2 id="onde-title" className="title-section text-[48px] sm:text-[64px]">{NOM_ONDE}</h2>
        <p className="mt-5 text-lg max-w-[40ch]">
          Chaque mois, ce qui se crée avec le son dans le Sud : des écoutes, des coulisses, l'agenda, faits avec les sons des membres.
        </p>
        <Link to={PAGES.onde} className={`${linkUnderline} mt-4 inline-flex min-h-[44px] items-center`}>
          Lire les numéros<span aria-hidden>&nbsp;→</span>
        </Link>
      </div>
      <div className="border-2 border-encre bg-surface p-5 sm:p-7">
        <AbonnementOnde />
      </div>
    </div>
  </section>
);

export default HomeOnde;
