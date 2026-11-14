// « Déposer pour L'Onde » (lien des numéros et des e-mails) : un·e adhérent·e à jour arrive dans son espace membre,
// une personne connectée sans adhésion arrive sur la page d'adhésion, une personne non connectée choisit ici.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { btnPrimary, btnSecondary, container } from "@/lib/pds";
import { PAGES } from "@/lib/seo";
import { ANCRE_DEPOT, ONDE_DEPOSER } from "@/lib/ondeDepots";

const OndeDeposer = () => {
  const navigate = useNavigate();
  const [etat, setEtat] = useState<"verif" | "visiteur">("verif");

  useEffect(() => {
    let fini = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (fini) return;
      if (!session) { setEtat("visiteur"); return; }
      const { data } = await supabase.rpc("peut_deposer_onde");
      if (fini) return;
      navigate(data ? `/mon-espace#${ANCRE_DEPOT}` : PAGES.adherer, { replace: true });
    })();
    return () => { fini = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Déposer pour L'Onde du Sud — Les Podcasteur·euses du Sud" description="Les adhérent·es déposent leurs sons pour L'Onde du Sud, la lettre mensuelle des Podcasteur·euses du Sud." path={ONDE_DEPOSER} noindex />
      <Navbar />
      <main className={`${container} pt-28 md:pt-32 pb-24`}>
        {etat === "verif" ? (
          <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
        ) : (
          <div className="max-w-[640px]">
            <h1 className="title-page text-[44px] sm:text-[64px]">Déposer pour L'Onde</h1>
            <p className="mt-5 text-lg">
              L'Onde du Sud est faite avec les sons de ses membres : un son, une écoute, un projet, les coulisses d'une fabrication.
              Le dépôt est réservé aux adhérent·es à jour, depuis l'espace membre.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={PAGES.adherer} className={btnPrimary}>Adhérer</Link>
              <Link to={`/espace-membre?retour=${encodeURIComponent(ONDE_DEPOSER)}`} className={btnSecondary}>Déjà membre : me connecter</Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OndeDeposer;
