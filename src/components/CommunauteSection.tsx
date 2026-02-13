import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CommunauteSection = () => {
  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 70% 50%, hsl(14 65% 55%) 0%, transparent 60%)`
      }} />

      <div className="relative container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="bg-gradient-to-br from-[hsl(20,25%,14%)] via-[hsl(14,30%,20%)] to-[hsl(190,25%,18%)] rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
        >
          {/* Inner glow */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(ellipse at 50% 100%, hsl(42 80% 55% / 0.3) 0%, transparent 60%)`
          }} />

          <div className="relative">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-6">
              Participer à la dynamique
            </h2>
            <p className="text-lg text-white/60 leading-relaxed max-w-xl mx-auto mb-10">
              Podcasteurs, studios, partenaires, acteurs de l'audio ou curieux du média :
              contribuez à la vitalité de l'écosystème podcast régional.
            </p>
            <a
              href="mailto:contact@podcasteusesdusud.fr"
              className="group inline-flex items-center gap-3 bg-accent text-accent-foreground px-8 py-4 rounded-xl font-semibold hover:brightness-110 transition-all duration-300 shadow-[0_8px_30px_-6px_hsl(42_80%_55%_/_0.35)]"
            >
              Prendre contact
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunauteSection;
