import { motion } from "framer-motion";
import { Search, Handshake, Sparkles, Building2, HeartHandshake } from "lucide-react";

const promesses = [
  { icon: Search, text: "Découvrir les podcasts ancrés localement" },
  { icon: Handshake, text: "Favoriser collaborations et invitations croisées" },
  { icon: Sparkles, text: "Mettre en lumière les créateurs et productions" },
  { icon: Building2, text: "Offrir un point d'entrée aux studios et partenaires" },
  { icon: HeartHandshake, text: "Nourrir une dynamique collective autour du podcast" },
];

const PromessesSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl text-center mb-14"
        >
          Ce que l'initiative permet
        </motion.h2>

        <div className="grid sm:grid-cols-2 gap-5">
          {promesses.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="flex items-start gap-4 bg-card rounded-lg p-6 shadow-sm border border-border"
            >
              <div className="shrink-0 w-11 h-11 rounded-full bg-secondary/10 flex items-center justify-center">
                <p.icon className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-lg text-foreground leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromessesSection;
