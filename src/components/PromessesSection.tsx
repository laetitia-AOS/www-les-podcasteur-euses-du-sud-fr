import { motion } from "framer-motion";
import { Search, Handshake, Sparkles, Building2, HeartHandshake } from "lucide-react";

const promesses = [
  { icon: Search, title: "Découvrir", text: "Les podcasts ancrés localement" },
  { icon: Handshake, title: "Collaborer", text: "Invitations croisées et co-créations" },
  { icon: Sparkles, title: "Rayonner", text: "Mise en lumière des créateurs" },
  { icon: Building2, title: "Connecter", text: "Studios, partenaires et acteurs" },
  { icon: HeartHandshake, title: "Fédérer", text: "Dynamique collective du podcast" },
];

const PromessesSection = () => {
  return (
    <section id="promesses" className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle, hsl(14 65% 55%) 0%, transparent 70%)`
      }} />

      <div className="container mx-auto px-6 max-w-5xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px w-8 bg-primary/30" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Valeur</span>
            <div className="h-px w-8 bg-primary/30" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">
            Ce que l'initiative permet
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-1">
          {promesses.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative flex flex-col items-center text-center p-6 sm:p-5 rounded-2xl hover:bg-card transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-5 group-hover:border-primary/20 group-hover:shadow-sm transition-all">
                <p.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg mb-1 text-foreground">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromessesSection;
