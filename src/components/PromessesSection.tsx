import { motion } from "framer-motion";
import { Search, Handshake, Sparkles, Building2, HeartHandshake } from "lucide-react";

const promesses = [
  { icon: Search, text: "Découvrir les podcasts ancrés localement", color: "bg-primary/10 text-primary" },
  { icon: Handshake, text: "Favoriser collaborations et invitations croisées", color: "bg-secondary/10 text-secondary" },
  { icon: Sparkles, text: "Mettre en lumière les créateurs et productions", color: "bg-accent/20 text-accent-foreground" },
  { icon: Building2, text: "Offrir un point d'entrée aux studios et partenaires", color: "bg-primary/10 text-primary" },
  { icon: HeartHandshake, text: "Nourrir une dynamique collective autour du podcast", color: "bg-secondary/10 text-secondary" },
];

const PromessesSection = () => {
  return (
    <section id="promesses" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl text-center mb-4"
        >
          Ce que l'initiative permet
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="section-divider w-16 mx-auto mb-12"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promesses.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-muted/30 transition-colors duration-300"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${p.color.split(" ")[0]}`}>
                <p.icon className={`w-6 h-6 ${p.color.split(" ")[1]}`} />
              </div>
              <p className="text-foreground font-medium leading-snug">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromessesSection;
