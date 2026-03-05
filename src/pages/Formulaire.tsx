import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FormSection from "@/components/FormSection";
import { useEffect } from "react";

const Formulaire = () => {
  useEffect(() => {
    document.title = "Référencer mon profil — Les Podcasteur·euses du Sud";
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <FormSection />
      </main>
      <Footer />
    </div>
  );
};

export default Formulaire;
