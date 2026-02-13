import { motion } from "framer-motion";
import { Newspaper, Lightbulb, CalendarDays, Mic2 } from "lucide-react";

const rubriques = [
  {
    icon: Newspaper,
    titre: "Actualités",
    desc: "Les dernières nouvelles de la scène podcast en Région Sud.",
  },
  {
    icon: Lightbulb,
    titre: "Initiatives",
    desc: "Projets, lancements et formats émergents du territoire.",
  },
  {
    icon: CalendarDays,
    titre: "Rencontres & Événements",
    desc: "Lives, tables rondes, ateliers et rendez-vous de la communauté.",
  },
  {
    icon: Mic2,
    titre: "Coups de projecteur",
    desc: "Podcasts et créateurs mis en lumière par l'écosystème.",
  },
];

const DynamiqueSection = () => {
  return (
    <section id="dynamique" className="py-16 md:py-24 bg-warm-glow">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-3">
            La dynamique du Sud
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Un écosystème vivant, des voix qui bougent, des initiatives qui émergent.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {rubriques.map((r, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-background rounded-xl border border-border p-5 hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <r.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-lg mb-1.5 text-foreground">{r.titre}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">{r.desc}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs font-medium text-primary/70">Bientôt disponible</span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DynamiqueSection;
