import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroPodcast from "@/assets/hero-podcast.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative min-h-[100vh] flex items-center overflow-hidden bg-background bg-sunny-gradient"
    >
      <div className="relative z-10 container mx-auto px-6 max-w-6xl pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text content */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/15 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Écosystème podcast · Région Sud
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] text-foreground leading-[1.08] mb-7 tracking-tight"
            >
              Les voix du Sud.{" "}
              <span className="text-primary italic">Les formats.</span>{" "}
              <br className="hidden sm:block" />
              Les histoires.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-lg text-muted-foreground max-w-lg leading-relaxed mb-10"
            >
              Les Podcasteur·euses du Sud fédère, rend visibles et connecte les créateurs et productions audio ancrés en Région Sud.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col items-start gap-3"
            >
              <button
                onClick={() => navigate("/formulaire")}
                className="group flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Référencer mon podcast
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-xs text-muted-foreground/70 ml-1">
                Ouvert à tous les podcasts de la Région Sud
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-4"
            >
              <button
                onClick={() => document.getElementById("dynamique")?.scrollIntoView({ behavior: "smooth" })}
                className="group flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Découvrir les podcasts
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-14 flex items-center gap-8 sm:gap-10 text-muted-foreground text-sm"
            >
              {[
                { value: "6", label: "départements" },
                { value: "∞", label: "formats" },
                { value: "1", label: "écosystème" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-2xl font-serif text-foreground">{stat.value}</span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Editorial photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]">
              <img
                src={heroPodcast}
                alt="Créatrice de podcast enregistrant dans un studio lumineux en Région Sud"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl bg-secondary/20 -z-10" />
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-primary/15 -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
