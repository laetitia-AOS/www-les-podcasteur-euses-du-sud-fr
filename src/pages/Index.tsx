import HeroSection from "@/components/HeroSection";
import PositioningSection from "@/components/PositioningSection";
import BenefitsSection from "@/components/BenefitsSection";
import FormSection from "@/components/FormSection";
import LegitimacySection from "@/components/LegitimacySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <PositioningSection />
      <BenefitsSection />
      <FormSection />
      <LegitimacySection />
      <Footer />
    </main>
  );
};

export default Index;
