import ContactSection from "@/components/ContactSection";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Contact = () => {
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
