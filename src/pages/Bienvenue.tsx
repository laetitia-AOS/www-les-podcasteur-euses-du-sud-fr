import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { anneeEnCours, libelleValidite, periodeRenouvellement } from "@/lib/espaceMembre";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import AccueilMembre from "@/components/accueil/AccueilMembre";
import { btnPrimary, btnSecondary, container } from "@/lib/pds";

type Profil = "avec" | "sans" | "inconnu";

/** Profil créé dans ce navigateur juste avant le paiement (moins de 2 jours), sinon fiches de la personne connectée. */
const chercherProfil = async (): Promise<Profil> => {
  try {
    const t = Number(localStorage.getItem("pds_profil_cree") || 0);
    if (t && Date.now() - t < 2 * 24 * 3600_000) return "avec";
  } catch { /* navigation privée */ }
  const { data: { session } } = await supabase.auth.getSession();
  const mail = session?.user.email;
  if (!mail) return "inconnu";
  const { data, error } = await supabase.from("podcasts").select("id").eq("email", mail.toLowerCase()).limit(1);
  if (error) return "inconnu";
  return data && data.length ? "avec" : "sans";
};

/**
 * Page d'arrivée après le paiement HelloAsso (/bienvenue) ou après la connexion qui suit la création d'une fiche
 * (/bienvenue/accueil) : bienvenue, comment participer, groupe WhatsApp du département, message de présentation.
 */
const Bienvenue = ({ apresPaiement = true }: { apresPaiement?: boolean }) => {
  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    let actif = true;
    chercherProfil().then((p) => { if (actif) setProfil(p); }).catch(() => actif && setProfil("inconnu"));
    return () => { actif = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Bienvenue — Les Podcasteur·euses du Sud" description="Bienvenue chez les Podcasteur·euses du Sud : comment participer et rejoindre le groupe de ton département." path="/bienvenue" noindex />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <section className="bg-primary text-primary-foreground">
          <div className={`${container} py-14 md:py-20`}>
            <h1 className="title-page text-[48px] sm:text-[88px] text-primary-foreground max-w-[14ch]">Bienvenue chez les Podcasteur·euses du Sud</h1>
            <p className="mt-5 text-lg max-w-[56ch]">
              Une association loi 1901 qui relie celles et ceux qui font le son dans toute la Région Sud.
              « Le podcast est l'outil, la création sonore est la matière. »
            </p>
            {apresPaiement && (
              <p className="mt-4 text-lg font-bold" data-validite>
                Ton paiement est bien enregistré. {libelleValidite(anneeEnCours())}.
                {periodeRenouvellement() && <span className="block font-normal text-[17px]">Tu étais déjà membre {anneeEnCours()} ? Ce paiement couvre toute l'année {anneeEnCours() + 1}.</span>}
              </p>
            )}
          </div>
        </section>

        <div className={`${container} py-12 md:py-16 space-y-12`}>
          {profil === "sans" && (
            <div className="border-2 border-encre bg-surface p-6 max-w-[680px]">
              <h2 className="title-section text-[28px]">Crée ta fiche</h2>
              <p className="mt-3 text-[17px]">Ta fiche annuaire avec ta photo, puis tes podcasts si tu en as. Utilise la même adresse e-mail que pour l'adhésion.</p>
              <Link to="/adherer#inscription" className={`${btnPrimary} mt-5`}>Créer ma fiche</Link>
            </div>
          )}
          {profil === "inconnu" && apresPaiement && (
            <div className="border-2 border-filet bg-surface p-6 max-w-[680px]">
              <h2 className="title-section text-[28px]">Ta fiche</h2>
              <p className="mt-3 text-[17px]">
                Déjà une fiche avec la même adresse e-mail ? L'équipe relit chaque fiche avant de la mettre en ligne, sous 48 à 72 heures. Pas encore de fiche ? Crée-la maintenant.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/mon-espace" className={btnSecondary}>Mon espace membre</Link>
                <Link to="/adherer#inscription" className={btnSecondary}>Créer ma fiche</Link>
              </div>
            </div>
          )}
          <AccueilMembre variante="page" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Bienvenue;
