import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { btnPrimary, btnSecondary, container } from "@/lib/pds";
import { PAGES, titreSeo } from "@/lib/seo";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={titreSeo("Cette page n'existe pas")} description="Cette page n'existe pas ou a changé d'adresse." path={pathname} noindex />
      <Navbar />
      <main className={`${container} pt-32 pb-24`}>
        <p className="font-mono text-sm text-muted-foreground">Erreur 404</p>
        <h1 className="title-page text-[52px] sm:text-[88px] mt-2">Cette page n'existe pas</h1>
        <p className="mt-5 text-lg max-w-[52ch]">
          L'adresse est peut-être mal tapée, ou la page a changé de place. Voici par où reprendre :
        </p>
        <ul className="mt-8 flex flex-wrap gap-3">
          <li><Link to={PAGES.ecouter} className={btnPrimary}>Écouter</Link></li>
          <li><Link to={PAGES.annuaire} className={btnSecondary}>Annuaire</Link></li>
          <li><Link to={PAGES.agenda} className={btnSecondary}>Agenda</Link></li>
        </ul>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
