import { motion } from "framer-motion";
import { ArrowRight, Instagram, Linkedin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SoundWaves = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    {/* Concentric rings */}
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="absolute rounded-full border animate-wave"
        style={{
          width: `${120 + i * 80}px`,
          height: `${120 + i * 80}px`,
          borderColor: i % 2 === 0 ? "hsl(229 88% 50% / 0.3)" : "hsl(49 100% 50% / 0.2)",
          animationDelay: `${i * 0.6}s`,
        }}
      />
    ))}
    {/* Center mic */}
    <div className="relative z-10 w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30">
      <span className="text-4xl">🎙</span>
    </div>
  </div>
);

const FloatingCard = ({ children, delay, className = "" }: { children: React.ReactNode; delay: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={`animate-float bg-card/80 backdrop-blur-md border border-border rounded-xl px-4 py-2.5 text-sm shadow-lg ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    {children}
  </motion.div>
);

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative min-h-[100vh] flex items-center overflow-hidden bg-background"
    >
      {/* Radial gradient */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 70% at 75% 50%, hsl(229 88% 50% / 0.12) 0%, transparent 60%)"
      }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid" />

      <div className="relative z-10 container mx-auto px-6 max-w-6xl pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary-glow border border-primary/20 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Écosystème podcast · Région Sud
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] text-foreground leading-[1.05] mb-7 tracking-tight"
            >
              Les voix<br />
              du Sud.{" "}
              <span className="text-primary-glow italic">Ici. Maintenant.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-lg text-foreground/70 max-w-lg leading-relaxed mb-10"
            >
              Les Podcasteur·euses du Sud fédère, rend visibles et connecte les créateurs et productions audio ancrés en Région Sud.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4"
            >
              <button
                onClick={() => navigate("/referencer-mon-podcast")}
                className="group flex items-center gap-3 bg-secondary text-secondary-foreground px-8 py-4 rounded-full text-base font-bold hover:brightness-110 transition-all duration-300 shadow-lg shadow-secondary/25 hover:-translate-y-0.5"
              >
                Référencer mon podcast
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/annuaire-podcasts")}
                className="flex items-center gap-2 px-6 py-4 rounded-full text-base font-semibold border border-foreground/20 text-foreground hover:border-foreground/40 transition-all duration-300"
              >
                Explorer l'annuaire
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-6 flex items-center gap-4"
            >
              <span className="text-sm text-muted-foreground font-medium">Suivez-nous</span>
              <a
                href="https://www.instagram.com/les_podcasteur.euses_du_sud/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 hover:bg-primary/20 border border-border hover:border-primary/30 transition-all duration-300"
                aria-label="Suivez-nous sur Instagram"
              >
                <Instagram className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://www.linkedin.com/company/les-podcasteur-euses-du-sud/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 hover:bg-primary/20 border border-border hover:border-primary/30 transition-all duration-300"
                aria-label="Suivez-nous sur LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-14 flex items-center gap-8 sm:gap-10 text-sm"
            >
              {[
                { value: "14+", label: "créateurs" },
                { value: "6", label: "départements" },
                { value: "∞", label: "formats" },
                { value: "1", label: "écosystème" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold text-secondary">{stat.value}</span>
                  <span className="text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Sound waves + floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:flex items-center justify-center min-h-[500px]"
          >
            <SoundWaves />

            {/* Floating cards */}
            <FloatingCard delay={0.8} className="absolute top-8 right-4">
              <span className="text-muted-foreground">🎧</span>{" "}
              <span className="text-foreground font-medium">Dernier épisode</span>
            </FloatingCard>
            <FloatingCard delay={1.0} className="absolute bottom-20 left-0" >
              <span className="text-muted-foreground">📅</span>{" "}
              <span className="text-foreground font-medium">Prochain événement</span>
            </FloatingCard>
            <FloatingCard delay={1.2} className="absolute bottom-8 right-8">
              <span className="text-foreground font-medium">Ouvert·e aux collabs</span>{" "}
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
            </FloatingCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
