import ContactSection from "@/components/ContactSection";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGES_SEO } from "@/lib/seo";

const Contact = () => {
  return (
    <>
      <SEOHead
        title={PAGES_SEO.contact.title}
        description={PAGES_SEO.contact.description}
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
