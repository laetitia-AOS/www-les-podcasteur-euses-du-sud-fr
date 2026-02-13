import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CommunauteSection = () => {
  const navigate = useNavigate();
  return (
    <section id="communaute" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 70% 50%, hsl(42 95% 52%) 0%, transparent 60%)`
      }} />

      <div className="relative container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="bg-gradient-to-br from-[hsl(220,50%,18%)] via-[hsl(220,45%,22%)] to-[hsl(225,40%,16%)] rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(ellipse at 50% 100%, hsl(42 95% 52% / 0.4) 0%, transparent 60%)`
          }} />

          <div className="relative">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-6">
              Participer à la dynamique
            </h2>
            <p className="text-lg text-white/60 leading-relaxed max-w-xl mx-auto mb-10">
              Podcasteurs, studios, partenaires, acteurs de l'audio ou curieux du média :
              contribuez à la vitalité de l'écosystème podcast régional.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/contact")}
                className="group inline-flex items-center gap-3 bg-accent text-accent-foreground px-8 py-4 rounded-xl font-semibold hover:brightness-110 transition-all duration-300 shadow-[0_8px_30px_-6px_hsl(42_80%_55%_/_0.35)]"
              >
                Prendre contact
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://www.helloasso.com/associations/les-podcasteur-euses-du-sud/adhesions/rejoindre-les-podcasteureuses-du-sud"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-white/10 text-white border border-white/15 px-8 py-4 rounded-xl font-semibold hover:bg-white/15 transition-all duration-300 backdrop-blur-sm"
              >
                <Users className="w-4 h-4" />
                Adhérer à l'association
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunauteSection;
