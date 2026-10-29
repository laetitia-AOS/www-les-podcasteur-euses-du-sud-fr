import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { anneeEnCours, libelleValidite, periodeRenouvellement } from "@/lib/espaceMembre";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
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
  const { data, error } = await supabase.from("podcasts").select("id").eq("email", mail).limit(1);
  if (error) return "inconnu";
  return data && data.length ? "avec" : "sans";
};

/** Page d'arrivée après le paiement HelloAsso. */
const Bienvenue = () => {
  const [profil, setProfil] = useState<Profil | null>(null);

  useEffect(() => {
    let actif = true;
    chercherProfil().then((p) => { if (actif) setProfil(p); }).catch(() => actif && setProfil("inconnu"));
    return () => { actif = false; };
  }, []);

  const carteAvec = (
    <div className="border-2 border-encre bg-surface p-6">
      <h2 className="title-section text-[30px]">{profil === "avec" ? "Votre profil est déjà créé" : "Vous avez déjà un profil ?"}</h2>
      <p className="mt-3 text-[17px]">
        Il sera visible sur le site après la relecture de l'équipe, sous 48 à 72 heures, si l'adresse e-mail de l'adhésion est la même que celle du profil.
      </p>
      <Link to="/mon-espace" className={`${btnPrimary} mt-6`}>Mon espace membre</Link>
    </div>
  );
  const carteSans = (
    <div className="border-2 border-filet bg-surface p-6">
      <h2 className="title-section text-[30px]">{profil === "sans" ? "Créez votre profil" : "Pas encore de profil ?"}</h2>
      <p className="mt-3 text-[17px]">Créez votre fiche annuaire avec votre photo, puis ajoutez vos podcasts si vous en avez. Utilisez la même adresse e-mail que pour l'adhésion.</p>
      <Link to="/adherer#inscription" className={`${profil === "sans" ? btnPrimary : btnSecondary} mt-6`}>Créer mon profil</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Bienvenue dans l'association — Les Podcasteur·euses du Sud" description="Merci pour votre adhésion aux Podcasteur·euses du Sud." path="/bienvenue" noindex />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <section className="bg-primary text-primary-foreground">
          <div className={`${container} py-14 md:py-20`}>
            <h1 className="title-page text-[56px] sm:text-[96px] text-primary-foreground max-w-[12ch]">Bienvenue dans le réseau</h1>
            <p className="mt-5 text-lg max-w-[52ch]">Merci pour votre adhésion aux Podcasteur·euses du Sud. Votre paiement est bien enregistré.</p>
            <p className="mt-3 text-lg font-bold" data-validite>
              {libelleValidite(anneeEnCours())}.
              {periodeRenouvellement() && <span className="block font-normal text-[17px]">Vous étiez déjà membre {anneeEnCours()} ? Ce paiement couvre toute l'année {anneeEnCours() + 1}.</span>}
            </p>
          </div>
        </section>
        <div className={`${container} py-12 md:py-16`} aria-live="polite">
          {profil === null ? (
            <p className="font-mono text-muted-foreground">Chargement…</p>
          ) : profil === "avec" ? (
            <div className="max-w-[640px]">{carteAvec}</div>
          ) : profil === "sans" ? (
            <div className="max-w-[640px]">{carteSans}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">{carteAvec}{carteSans}</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Bienvenue;
