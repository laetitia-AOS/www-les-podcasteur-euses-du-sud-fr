import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight, PartyPopper, Mic, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Bienvenue = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/20 mb-6">
              <PartyPopper className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
              Bienvenue dans le collectif !
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-2">
              Merci pour ton adhésion aux Podcasteur·euses du Sud 🎉
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Tu fais maintenant partie de l'écosystème podcast en région Sud.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-8 sm:p-10 mb-8"
          >
            <h2 className="font-serif text-xl sm:text-2xl text-foreground mb-3">
              Complète ton profil
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Référence ton podcast, tes compétences ou ton activité pour apparaître dans l'annuaire
              et être visible par toute la communauté.
            </p>
            <button
              onClick={() => navigate("/formulaire")}
              className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <Mic className="w-5 h-5" />
              Compléter mon profil
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm"
          >
            <button
              onClick={() => navigate("/annuaire")}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="w-4 h-4" />
              Découvrir l'annuaire
            </button>
            <span className="hidden sm:inline text-border">·</span>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Retour à l'accueil
            </button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Bienvenue;
