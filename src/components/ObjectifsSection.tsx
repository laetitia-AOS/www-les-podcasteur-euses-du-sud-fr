import { motion } from "framer-motion";
import { Eye, Users, Layers, ArrowRightLeft, Rocket } from "lucide-react";

const objectifs = [
  { icon: Eye, text: "Rendre visibles les podcasts et créateurs du territoire", accent: "from-primary/20 to-primary/5" },
  { icon: Users, text: "Faciliter les connexions et collaborations", accent: "from-secondary/20 to-secondary/5" },
  { icon: Layers, text: "Structurer une scène podcast régionale identifiable", accent: "from-accent/20 to-accent/5" },
  { icon: ArrowRightLeft, text: "Créer des passerelles entre acteurs de l'audio", accent: "from-primary/20 to-primary/5" },
  { icon: Rocket, text: "Soutenir la diversité des formats et des voix", accent: "from-secondary/20 to-secondary/5" },
];

const ObjectifsSection = () => {
  return (
    <section id="objectifs" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-12 md:gap-20 items-start">
          {/* Left: title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="md:sticky md:top-28"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-primary/30" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Objectifs</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-[2.6rem] leading-tight mb-4">
              Pourquoi cette initiative existe
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Cinq engagements pour structurer et animer la scène podcast du Sud.
            </p>
          </motion.div>

          {/* Right: list */}
          <div className="space-y-3">
            {objectifs.map((o, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group flex items-center gap-5 bg-background rounded-xl px-6 py-5 border border-border hover:border-primary/20 hover:shadow-md transition-all duration-300"
              >
                <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${o.accent} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <o.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <p className="text-foreground leading-snug font-medium">{o.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ObjectifsSection;
