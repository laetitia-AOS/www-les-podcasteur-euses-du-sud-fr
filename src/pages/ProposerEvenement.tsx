import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGES_SEO } from "@/lib/seo";
import ProposerEvenementForm from "@/components/agenda/ProposerEvenementForm";
import { container } from "@/lib/pds";

const ProposerEvenement = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title={PAGES_SEO.proposer.title}
      description={PAGES_SEO.proposer.description}
      path="/proposer-evenement-podcast"
    />
    <Navbar />
    <main className="pt-16 md:pt-[76px]">
      <div className={`${container} pt-6`}>
        <Link to="/agenda" className="inline-flex min-h-[44px] items-center font-bold underline underline-offset-4"><span aria-hidden>←&nbsp;</span>Agenda</Link>
      </div>
      <div className={`${container} pt-4 pb-20 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16`}>
        <div>
          <h1 className="title-page text-[52px] sm:text-[72px]">Proposer un événement</h1>
          <p className="mt-5 text-lg">Un atelier, un live, une projection d'écoute, une rencontre : si ça parle podcast ou création sonore, il a sa place ici.</p>
          <p className="mt-4 text-[15px] text-muted-foreground">
            Chaque proposition est relue par l'équipe avant publication, sous 48 à 72 heures. L'association n'est pas tenue de publier tous les événements reçus ; les membres à jour de leur cotisation passent en priorité.
          </p>
        </div>
        <ProposerEvenementForm />
      </div>
    </main>
    <Footer />
  </div>
);

export default ProposerEvenement;
