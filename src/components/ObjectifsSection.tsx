import { motion } from "framer-motion";
import { Eye, Users, Layers, ArrowRightLeft, Rocket } from "lucide-react";

const objectifs = [
  { icon: Eye, text: "Rendre visibles les podcasts et créateurs du territoire" },
  { icon: Users, text: "Faciliter les connexions et collaborations" },
  { icon: Layers, text: "Structurer une scène podcast régionale identifiable" },
  { icon: ArrowRightLeft, text: "Créer des passerelles entre acteurs de l'audio" },
  { icon: Rocket, text: "Soutenir la diversité des formats et des voix" },
];

const ObjectifsSection = () => {
  return (
    <section id="objectifs" className="py-16 md:py-24 bg-warm-glow">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-start">
          {/* Left: title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="md:sticky md:top-28"
          >
            <h2 className="font-serif text-3xl sm:text-4xl md:text-[2.6rem] leading-tight">
              Pourquoi Podcasteur·euses du Sud existe
            </h2>
            <div className="section-divider w-12 mt-5" />
          </motion.div>

          {/* Right: list */}
          <div className="space-y-4">
            {objectifs.map((o, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="flex items-center gap-4 bg-background rounded-lg px-5 py-4 border border-border"
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <o.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground leading-snug">{o.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ObjectifsSection;
