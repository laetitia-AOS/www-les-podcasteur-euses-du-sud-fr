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
      <SEOHead title={titreSeo("Page introuvable")} description="Cette page n'existe pas ou a changé d'adresse." path={pathname} noindex />
      <Navbar />
      <main className={`${container} pt-32 pb-24`}>
        <h1 className="title-page text-[56px] sm:text-[88px]">Page introuvable</h1>
        <p className="mt-5 text-lg max-w-[48ch]">Cette page n'existe pas ou a changé d'adresse.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className={btnPrimary}>Retour à l'accueil</Link>
          <Link to={PAGES.ecouter} className={btnSecondary}>Écouter les podcasts</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
