import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  const scrollToForm = () => {
    document.getElementById("formulaire")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
    >
      {/* Rich layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(20,25%,12%)] via-[hsl(14,35%,22%)] to-[hsl(190,30%,16%)]" />
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 20% 80%, hsl(14 65% 45% / 0.35) 0%, transparent 70%),
          radial-gradient(ellipse 60% 50% at 85% 15%, hsl(190 45% 25% / 0.3) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 50% 40%, hsl(42 80% 55% / 0.1) 0%, transparent 50%)
        `
      }} />
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 container mx-auto px-6 max-w-5xl pt-20 pb-16">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-white/[0.08] text-white/80 backdrop-blur-sm border border-white/[0.08] tracking-wide">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Écosystème podcast · Région Sud
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] text-white leading-[1.05] max-w-4xl mb-8 tracking-tight"
          >
            Les voix du Sud.{" "}
            <span className="text-accent italic">Les formats.</span>{" "}
            <br className="hidden sm:block" />
            Les histoires.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-12 leading-relaxed"
          >
            Fédérer, rendre visibles et connecter les créateurs et productions audio ancrés en Région Sud.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button
              onClick={scrollToForm}
              className="group flex items-center gap-3 bg-accent text-accent-foreground px-8 py-4 rounded-xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-[0_8px_30px_-6px_hsl(42_80%_55%_/_0.4)] hover:shadow-[0_12px_40px_-6px_hsl(42_80%_55%_/_0.5)] hover:-translate-y-0.5"
            >
              Référencer mon podcast
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById("vision")?.scrollIntoView({ behavior: "smooth" })}
              className="group flex items-center gap-2 text-white/50 hover:text-white/80 px-5 py-4 text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Découvrir l'initiative
            </button>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-20 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-white/40 text-sm"
          >
            {[
              { value: "6", label: "départements" },
              { value: "∞", label: "formats" },
              { value: "1", label: "écosystème" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="text-2xl font-serif text-white/70">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
