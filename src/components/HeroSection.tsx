import { motion } from "framer-motion";

const HeroSection = () => {
  const scrollToForm = () => {
    document.getElementById("formulaire")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
    >
      {/* Gradient background instead of image with text */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(20,30%,18%)] via-[hsl(14,40%,28%)] to-[hsl(190,35%,22%)]" />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 20% 80%, hsl(14 65% 55% / 0.4) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, hsl(190 45% 30% / 0.3) 0%, transparent 50%),
                          radial-gradient(circle at 50% 50%, hsl(42 80% 65% / 0.15) 0%, transparent 60%)`
      }} />

      <div className="relative z-10 container mx-auto px-6 text-center pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-primary-foreground/90 backdrop-blur-sm border border-white/10">
            Écosystème podcast · Région Sud
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-primary-foreground leading-[1.1] max-w-4xl mx-auto mb-6"
        >
          Les voix du Sud.{" "}
          <em className="italic text-accent">Les formats.</em>{" "}
          Les histoires.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Podcasteur·euses du Sud fédère, rend visibles et connecte
          les créateurs et productions audio ancrés en Région Sud.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={scrollToForm}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Référencer mon podcast
          </button>
          <button
            onClick={() => document.getElementById("vision")?.scrollIntoView({ behavior: "smooth" })}
            className="text-primary-foreground/70 hover:text-primary-foreground px-6 py-4 text-sm font-medium transition-colors"
          >
            Découvrir l'initiative ↓
          </button>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
