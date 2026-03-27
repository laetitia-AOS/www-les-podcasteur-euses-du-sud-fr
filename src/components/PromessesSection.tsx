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
    <section id="promesses" className="py-20 md:py-32 relative overflow-hidden" style={{ backgroundColor: "#F6F1E8" }}>
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
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Valeur</span>
            <div className="h-px w-8 bg-primary/30" />
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground">
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
              className="group relative flex flex-col items-center text-center p-6 sm:p-5 rounded-[18px] hover:-translate-y-1 transition-all duration-300"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(184,92,56,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <div
                className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-5 group-hover:shadow-md transition-all"
                style={{
                  backgroundColor: "#FDFAF5",
                  border: "1px solid rgba(184,92,56,0.1)",
                }}
              >
                <p.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1 text-foreground">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromessesSection;
