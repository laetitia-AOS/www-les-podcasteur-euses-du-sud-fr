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
    <section className="py-20 md:py-28 bg-warm-glow">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl text-center mb-14"
        >
          Pourquoi Podcasteur·euses du Sud existe
        </motion.h2>

        <div className="grid sm:grid-cols-2 gap-5">
          {objectifs.map((o, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="flex items-start gap-4 bg-background rounded-lg p-6 shadow-sm border border-border"
            >
              <div className="shrink-0 w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <o.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg text-foreground leading-relaxed">{o.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ObjectifsSection;
