import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, btnSecondary, container } from "@/lib/pds";
import { PAGES } from "@/lib/seo";
import { NOM_ONDE, ONDE_CONFIRMER, jetonValide } from "@/lib/onde";

type Etat = "chargement" | "actif" | "desinscrit" | "introuvable" | "erreur";

/** /onde/confirmer?jeton=… : le lien reçu par e-mail active l'abonnement, sans connexion. */
const OndeConfirmer = () => {
  const [params] = useSearchParams();
  const jeton = params.get("jeton");
  const [etat, setEtat] = useState<Etat>(jetonValide(jeton) ? "chargement" : "introuvable");

  useEffect(() => {
    if (!jetonValide(jeton)) return;
    supabase.rpc("onde_confirmer", { _jeton: jeton.trim() }).then(({ data, error }) => {
      if (error) return setEtat("erreur");
      setEtat(data === "actif" || data === "desinscrit" ? data : "introuvable");
    });
  }, [jeton]);

  return (
    <>
      <SEOHead title={`Confirmer mon inscription — ${NOM_ONDE}`} description="Confirmation de l'inscription à L'Onde du Sud, la lettre mensuelle des Podcasteur·euses du Sud." path={ONDE_CONFIRMER} noindex />
      <Navbar />
      <main className="min-h-screen pt-16 md:pt-[76px] pb-20">
        <div className={`${container} pt-14 max-w-[760px]`} aria-live="polite">
          {etat === "chargement" && <p className="font-mono text-muted-foreground">Confirmation en cours…</p>}
          {etat === "actif" && (
            <>
              <h1 className="title-page text-[44px] sm:text-[64px]">C'est confirmé.</h1>
              <p className="mt-4 text-lg">Vous recevrez {NOM_ONDE} chaque mois. Un lien en bas de chaque e-mail permet de se désinscrire.</p>
              <Link to={PAGES.onde} className={`${btnPrimary} mt-8`}>Lire les numéros</Link>
            </>
          )}
          {etat === "desinscrit" && (
            <>
              <h1 className="title-page text-[44px] sm:text-[64px]">Vous êtes désinscrit·e.</h1>
              <p className="mt-4 text-lg">Ce lien ne vous réabonne pas. Pour recevoir de nouveau {NOM_ONDE}, inscrivez-vous sur sa page.</p>
              <Link to={PAGES.onde} className={`${btnSecondary} mt-8`}>Aller sur la page de {NOM_ONDE}</Link>
            </>
          )}
          {etat === "introuvable" && (
            <>
              <h1 className="title-page text-[44px] sm:text-[64px]">Lien non reconnu</h1>
              <p className="mt-4 text-lg">Ce lien est incomplet ou n'existe plus. Copiez le lien entier depuis l'e-mail, ou inscrivez-vous de nouveau.</p>
              <Link to={PAGES.onde} className={`${btnSecondary} mt-8`}>Aller sur la page de {NOM_ONDE}</Link>
            </>
          )}
          {etat === "erreur" && (
            <>
              <h1 className="title-page text-[44px] sm:text-[64px]">Un souci technique</h1>
              <p className="mt-4 text-lg">La confirmation n'a pas pu être enregistrée. Rechargez la page dans un instant.</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OndeConfirmer;
