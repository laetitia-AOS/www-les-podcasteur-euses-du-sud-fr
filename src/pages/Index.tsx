import { useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import VisionSection from "@/components/VisionSection";
import ObjectifsSection from "@/components/ObjectifsSection";
import PromessesSection from "@/components/PromessesSection";
import DynamiqueSection from "@/components/DynamiqueSection";
import CommunauteSection from "@/components/CommunauteSection";
import ContactCTA from "@/components/ContactCTA";
import FormSection from "@/components/FormSection";
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
        <CommunauteSection />
        <ContactCTA />
        <FormSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;
