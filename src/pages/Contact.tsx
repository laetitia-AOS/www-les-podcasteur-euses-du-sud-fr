import ContactSection from "@/components/ContactSection";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Contact = () => {
  return (
    <>
      <SEOHead
        title="Contact — Les Podcasteur·euses du Sud"
        description="Contactez Les Podcasteur·euses du Sud pour collaborer, participer ou proposer un projet audio en Région Sud."
        path="/contact"
      />
      <Navbar />
      <main className="min-h-screen pt-16">
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

export default Contact;
