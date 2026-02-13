import { motion } from "framer-motion";
import { MapPin, Users, Eye, Radio } from "lucide-react";

const benefits = [
  {
    icon: MapPin,
    text: "Identifier votre podcast dans l'écosystème régional",
  },
  {
    icon: Users,
    text: "Faciliter les collaborations et rencontres",
  },
  {
    icon: Eye,
    text: "Développer votre visibilité locale",
  },
  {
    icon: Radio,
    text: "Rejoindre une dynamique collective autour de l'audio",
  },
];

const BenefitsSection = () => {
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
          Pourquoi référencer son podcast ?
        </motion.h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex items-start gap-4 bg-background rounded-lg p-6 shadow-sm border border-border"
            >
              <div className="shrink-0 w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg text-foreground leading-relaxed">{b.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
