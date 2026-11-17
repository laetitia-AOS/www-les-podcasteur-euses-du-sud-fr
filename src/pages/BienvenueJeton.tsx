import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { btnPrimary, btnSecondary, container } from "@/lib/pds";

/**
 * Liens des e-mails d'accueil : « J'ai rejoint le groupe » et « Ne plus recevoir de relance ».
 * Le jeton (usage unique, vérifié en base) n'agit qu'après un clic sur la page, pour qu'une messagerie qui ouvre
 * les liens toute seule ne déclenche rien.
 */
const BienvenueJeton = ({ usage }: { usage: "rejoint" | "stop" }) => {
  const [params] = useSearchParams();
  const jeton = params.get("jeton") || "";
  const [etat, setEtat] = useState<"attente" | "envoi" | "ok" | "deja" | "invalide">("attente");
  const valide = /^[0-9a-f]{64}$/.test(jeton);

  const confirmer = async () => {
    setEtat("envoi");
    const { data, error } = await supabase.rpc("accueil_jeton_utiliser", { _jeton: jeton });
    if (error) { setEtat("invalide"); return; }
    setEtat(data === usage ? "ok" : data === "deja" ? "deja" : "invalide");
  };

  const titre = usage === "rejoint" ? "Tu as rejoint le groupe ?" : "Ne plus recevoir de relance";
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${titre} — Les Podcasteur·euses du Sud`} description="Lien personnel reçu par e-mail." path={usage === "rejoint" ? "/bienvenue/rejoint" : "/bienvenue/relances"} noindex />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} py-14 md:py-20 max-w-[760px]`} aria-live="polite">
          <h1 className="title-page text-[44px] sm:text-[64px]">{titre}</h1>
          {!valide || etat === "invalide" ? (
            <>
              <p className="mt-5 text-lg">Ce lien n'est pas valable. Tu peux l'indiquer directement dans ton espace membre.</p>
              <Link to="/mon-espace#whatsapp" className={`${btnSecondary} mt-6`}>Mon espace membre</Link>
            </>
          ) : etat === "ok" || etat === "deja" ? (
            <>
              <p className="mt-5 text-lg font-bold">
                {usage === "rejoint"
                  ? etat === "ok" ? "C'est noté, bienvenue dans le groupe ! On ne t'en reparlera plus." : "C'était déjà noté : merci !"
                  : "C'est noté : tu ne recevras plus de relance pour le groupe WhatsApp."}
              </p>
              <Link to="/agenda" className={`${btnSecondary} mt-6`}>Voir l'agenda</Link>
            </>
          ) : (
            <>
              <p className="mt-5 text-lg max-w-[56ch]">
                {usage === "rejoint"
                  ? "Confirme que tu as rejoint le groupe WhatsApp de ton département : on ne te relancera plus."
                  : "Confirme et tu ne recevras plus de relance pour le groupe WhatsApp. Tu restes membre, rien d'autre ne change."}
              </p>
              <button type="button" onClick={confirmer} disabled={etat === "envoi"} className={`${btnPrimary} mt-6`}>
                {etat === "envoi" ? "Enregistrement…" : usage === "rejoint" ? "Oui, j'ai rejoint le groupe" : "Ne plus recevoir de relance"}
              </button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BienvenueJeton;
