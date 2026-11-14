import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, btnSecondary, container } from "@/lib/pds";
import { PAGES } from "@/lib/seo";
import { NOM_ONDE, ONDE_DESINSCRIPTION, jetonValide } from "@/lib/onde";

type Etat = "chargement" | "desinscrit" | "reinscription" | "reinscrit" | "introuvable" | "erreur";

/** /onde/desinscription?jeton=… : un clic sur le lien désinscrit, sans connexion, avec « Me réinscrire ». */
const OndeDesinscription = () => {
  const [params] = useSearchParams();
  const jeton = params.get("jeton");
  const [etat, setEtat] = useState<Etat>(jetonValide(jeton) ? "chargement" : "introuvable");
  const [erreurReinscription, setErreurReinscription] = useState(false);

  useEffect(() => {
    if (!jetonValide(jeton)) return;
    supabase.rpc("onde_desinscrire", { _jeton: jeton.trim() }).then(({ data, error }) => {
      if (error) return setEtat("erreur");
      setEtat(data === "desinscrit" ? "desinscrit" : "introuvable");
    });
  }, [jeton]);

  const reinscrire = async () => {
    if (!jetonValide(jeton)) return;
    setEtat("reinscription");
    setErreurReinscription(false);
    const { data, error } = await supabase.rpc("onde_reinscrire", { _jeton: jeton.trim() });
    if (error || data !== "actif") {
      setErreurReinscription(true);
      setEtat("desinscrit");
      return;
    }
    setEtat("reinscrit");
  };

  return (
    <>
      <SEOHead title={`Désinscription — ${NOM_ONDE}`} description="Désinscription de L'Onde du Sud, la lettre mensuelle des Podcasteur·euses du Sud." path={ONDE_DESINSCRIPTION} noindex />
      <Navbar />
      <main className="min-h-screen pt-16 md:pt-[76px] pb-20">
        <div className={`${container} pt-14 max-w-[760px]`} aria-live="polite">
          {etat === "chargement" && <p className="font-mono text-muted-foreground">Désinscription en cours…</p>}
          {(etat === "desinscrit" || etat === "reinscription") && (
            <>
              <h1 className="title-page text-[44px] sm:text-[64px]">Vous êtes désinscrit·e.</h1>
              <p className="mt-4 text-lg">Vous ne recevrez plus {NOM_ONDE} par e-mail. Les numéros restent à lire sur le site.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={reinscrire} disabled={etat === "reinscription"} className={btnPrimary}>
                  {etat === "reinscription" ? "Un instant…" : "Me réinscrire"}
                </button>
                <Link to={PAGES.onde} className={btnSecondary}>Lire les numéros</Link>
              </div>
              <p className="mt-3 text-sm text-muted-foreground max-w-[60ch]">
                En cliquant sur « Me réinscrire », vous recevrez de nouveau {NOM_ONDE} par e-mail. Vous pourrez vous désinscrire à tout moment.
              </p>
              {erreurReinscription && <p role="alert" className="mt-3 text-destructive font-semibold">La réinscription n'a pas pu être enregistrée. Réessayez dans un instant.</p>}
            </>
          )}
          {etat === "reinscrit" && (
            <>
              <h1 className="title-page text-[44px] sm:text-[64px]">Vous êtes réinscrit·e.</h1>
              <p className="mt-4 text-lg">Vous recevrez de nouveau {NOM_ONDE} chaque mois.</p>
              <Link to={PAGES.onde} className={`${btnPrimary} mt-8`}>Lire les numéros</Link>
            </>
          )}
          {etat === "introuvable" && (
            <>
              <h1 className="title-page text-[44px] sm:text-[64px]">Lien non reconnu</h1>
              <p className="mt-4 text-lg">Ce lien est incomplet ou n'existe plus. Copiez le lien entier depuis l'e-mail, ou écrivez-nous depuis la page contact.</p>
              <Link to={PAGES.onde} className={`${btnSecondary} mt-8`}>Aller sur la page de {NOM_ONDE}</Link>
            </>
          )}
          {etat === "erreur" && (
            <>
              <h1 className="title-page text-[44px] sm:text-[64px]">Un souci technique</h1>
              <p className="mt-4 text-lg">La désinscription n'a pas pu être enregistrée. Rechargez la page dans un instant.</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OndeDesinscription;
