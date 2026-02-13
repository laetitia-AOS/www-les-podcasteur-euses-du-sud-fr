import { useEffect } from "react";
import ContactSection from "@/components/ContactSection";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contact = () => {
  useEffect(() => {
    document.title = "Contact — Les Podcasteur·euses du Sud";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Contactez Les Podcasteur·euses du Sud pour collaborer, participer ou proposer un projet audio en Région Sud.");
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

export default Contact;
