import { motion } from "framer-motion";
import { ArrowRight, Instagram, Linkedin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SoundWaves = () => (
  <svg viewBox="0 0 400 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={i}
        d={`M ${30 + i * 15} 150 Q ${100 + i * 10} ${80 - i * 12}, ${200} ${150} T ${370 - i * 15} 150`}
        fill="none"
        stroke={i % 2 === 0 ? "rgba(200,116,42,0.25)" : "rgba(124,107,158,0.2)"}
        strokeWidth={2 - i * 0.2}
        className="animate-wave"
        style={{ animationDelay: `${i * 0.5}s` }}
      />
    ))}
  </svg>
);

const FloatingCard = ({ children, delay, className = "" }: { children: React.ReactNode; delay: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={`animate-float bg-background-pure border border-primary/10 rounded-xl px-4 py-2.5 text-sm shadow-md ${className}`}
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
      {/* Decorative circle */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{
        background: "radial-gradient(circle, hsl(27 67% 47%) 0%, transparent 70%)"
      }} />

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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border tracking-wide"
                style={{
                  background: "rgba(200,116,42,0.10)",
                  borderColor: "rgba(200,116,42,0.25)",
                  color: "hsl(22 68% 33%)",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Écosystème podcast · Région Sud
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.05] mb-7 tracking-tight"
            >
              <span className="font-display font-black text-ink">Ici on</span>
              <br />
              <span className="font-serif italic text-primary text-[1.1em]">raconte.</span>
              <br />
              <span className="font-display font-medium text-muted-foreground text-[0.6em]">On écoute. On crée.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-lg text-muted-foreground max-w-[420px] leading-relaxed mb-10"
              style={{ lineHeight: 1.7 }}
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
                className="group flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full text-base font-bold hover:bg-primary-hover transition-all duration-300 shadow-lg shadow-primary/20 hover:-translate-y-0.5"
              >
                Référencer mon podcast
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/annuaire-podcasts")}
                className="flex items-center gap-2 text-base font-semibold text-foreground hover:text-primary transition-all duration-300"
                style={{ borderBottom: "1.5px solid hsl(33 40% 62%)" }}
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
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 hover:bg-primary/10 border border-primary/10 hover:border-primary/25 transition-all duration-300"
                aria-label="Suivez-nous sur Instagram"
              >
                <Instagram className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://www.linkedin.com/company/les-podcasteur-euses-du-sud/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-muted/60 hover:bg-primary/10 border border-primary/10 hover:border-primary/25 transition-all duration-300"
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
              className="mt-14 flex items-center gap-8 sm:gap-10 text-sm pt-6"
              style={{ borderTop: "1px solid rgba(200,116,42,0.15)" }}
            >
              {[
                { value: "14+", label: "CRÉATEURS" },
                { value: "6", label: "DÉPARTEMENTS" },
                { value: "∞", label: "FORMATS" },
                { value: "1", label: "ÉCOSYSTÈME" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-2xl font-display font-black text-primary">{stat.value}</span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Poster card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:flex items-center justify-center min-h-[500px]"
          >
            {/* Poster card */}
            <div
              className="relative w-[340px] h-[420px] rounded-3xl overflow-hidden"
              style={{
                backgroundColor: "hsl(36 22% 15%)",
                boxShadow: "24px 24px 0px hsl(37 28% 88%)",
              }}
            >
              {/* Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  Région Sud · PACA
                </span>
              </div>

              {/* Sound waves */}
              <div className="absolute inset-0 flex items-center justify-center">
                <SoundWaves />
              </div>

              {/* Center mic */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl animate-micro-pulse drop-shadow-lg" style={{ filter: "drop-shadow(0 0 20px rgba(200,116,42,0.4))" }}>🎙</span>
              </div>

              {/* Bottom text */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ink/80 to-transparent">
                <p className="font-serif italic text-white text-lg leading-snug">Les voix du territoire</p>
                <p className="text-white/50 text-sm mt-1">Podcast · Création · Région Sud</p>
              </div>
            </div>

            {/* Floating cards */}
            <FloatingCard delay={0.8} className="absolute top-8 right-0">
              <span className="text-muted-foreground">🎧</span>{" "}
              <span className="text-foreground font-medium">Dernier épisode</span>
            </FloatingCard>
            <FloatingCard delay={1.0} className="absolute bottom-24 -left-4">
              <span className="text-muted-foreground">📅</span>{" "}
              <span className="text-foreground font-medium">Prochain événement</span>
            </FloatingCard>
            <FloatingCard delay={1.2} className="absolute bottom-8 right-4">
              <span className="text-foreground font-medium">Ouvert·e aux collabs</span>{" "}
              <span className="w-2 h-2 rounded-full bg-pin inline-block animate-pulse" />
            </FloatingCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
