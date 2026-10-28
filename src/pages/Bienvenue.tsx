import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { btnPrimary, btnSecondary, container } from "@/lib/pds";

/** Page d'arrivée après le paiement HelloAsso. */
const Bienvenue = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Bienvenue dans l'association — Les Podcasteur·euses du Sud" description="Merci pour votre adhésion aux Podcasteur·euses du Sud." path="/bienvenue" />
    <Navbar />
    <main className="pt-16 md:pt-[76px]">
      <section className="bg-primary text-primary-foreground">
        <div className={`${container} py-14 md:py-20`}>
          <h1 className="title-page text-[56px] sm:text-[96px] text-primary-foreground max-w-[12ch]">Bienvenue dans le réseau</h1>
          <p className="mt-5 text-lg max-w-[52ch]">Merci pour votre adhésion aux Podcasteur·euses du Sud. Votre paiement est bien enregistré.</p>
        </div>
      </section>
      <div className={`${container} py-12 md:py-16 grid md:grid-cols-2 gap-6`}>
        <div className="border-2 border-encre bg-surface p-6">
          <h2 className="title-section text-[30px]">Votre profil est déjà créé</h2>
          <p className="mt-3 text-[17px]">
            Il sera visible sur le site après la relecture de l'équipe, sous 48 à 72 heures, si l'adresse e-mail de l'adhésion est la même que celle du profil.
          </p>
          <Link to="/mon-espace" className={`${btnPrimary} mt-6`}>Mon espace membre</Link>
        </div>
        <div className="border-2 border-filet bg-surface p-6">
          <h2 className="title-section text-[30px]">Pas encore de profil ?</h2>
          <p className="mt-3 text-[17px]">Créez votre fiche annuaire avec votre photo, puis ajoutez vos podcasts si vous en avez.</p>
          <Link to="/rejoindre-association#inscription" className={`${btnSecondary} mt-6`}>Créer mon profil</Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Bienvenue;
