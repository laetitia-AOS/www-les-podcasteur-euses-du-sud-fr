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
    <section className="py-20 md:py-28 bg-warm-glow">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4">
            La dynamique du Sud
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Un écosystème vivant, des voix qui bougent, des initiatives qui émergent.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {rubriques.map((r, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative bg-background rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <r.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-2 text-foreground">{r.titre}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                {r.desc}
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">
                  Bientôt disponible
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DynamiqueSection;
