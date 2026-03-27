import { useMemo } from "react";
import HeroSection, { HeroSearchBar } from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import MarqueeBanner from "@/components/MarqueeBanner";
import VisionSection from "@/components/VisionSection";
import ObjectifsSection from "@/components/ObjectifsSection";
import PromessesSection from "@/components/PromessesSection";
import DynamiqueSection from "@/components/DynamiqueSection";
import ProchainEvenement from "@/components/ProchainEvenement";
import ContactCTA from "@/components/ContactCTA";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  const breadcrumbLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.les-podcasteur-euses-du-sud.fr/" },
      { "@type": "ListItem", position: 2, name: "Annuaire", item: "https://www.les-podcasteur-euses-du-sud.fr/annuaire-podcasts" },
      { "@type": "ListItem", position: 3, name: "Événements", item: "https://www.les-podcasteur-euses-du-sud.fr/evenements-podcast" },
      { "@type": "ListItem", position: 4, name: "Référencer", item: "https://www.les-podcasteur-euses-du-sud.fr/referencer-mon-podcast" },
      { "@type": "ListItem", position: 5, name: "Contact", item: "https://www.les-podcasteur-euses-du-sud.fr/contact" },
    ],
  }), []);

  return (
    <>
      <SEOHead
        title="Les Podcasteur·euses du Sud — Écosystème podcast Région Sud"
        description="Découvrez, référencez et connectez les podcasts et créateurs audio de la Région Sud : Marseille, Nice, Toulon, Aix-en-Provence et au-delà."
        path="/"
        jsonLd={breadcrumbLd}
      />
      <Navbar />
      <main className="min-h-screen">
        <HeroSection />
        <HeroSearchBar />
        <MarqueeBanner />
        <article>
          <VisionSection />
          <ObjectifsSection />
          <PromessesSection />
        </article>
        <DynamiqueSection />
        <ProchainEvenement />
        <ContactCTA />
      </main>
      <Footer />
    </>
  );
};

export default Index;
