import { useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import VisionSection from "@/components/VisionSection";
import ObjectifsSection from "@/components/ObjectifsSection";
import PromessesSection from "@/components/PromessesSection";
import DynamiqueSection from "@/components/DynamiqueSection";
import ProchainEvenement from "@/components/ProchainEvenement";
import Footer from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    document.title = "Les Podcasteur·euses du Sud — Écosystème podcast Région Sud";
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <HeroSection />
        <article>
          <VisionSection />
          <ObjectifsSection />
          <PromessesSection />
        </article>
        <DynamiqueSection />
        <ProchainEvenement />
      </main>
      <Footer />
    </>
  );
};

export default Index;
