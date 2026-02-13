import { motion } from "framer-motion";
import { Newspaper, Lightbulb, CalendarDays, Mic2, ArrowUpRight } from "lucide-react";

const rubriques = [
  {
    icon: Newspaper,
    titre: "Actualités",
    desc: "Les dernières nouvelles de la scène podcast en Région Sud.",
    tag: "Média",
  },
  {
    icon: Lightbulb,
    titre: "Initiatives",
    desc: "Projets, lancements et formats émergents du territoire.",
    tag: "Création",
  },
  {
    icon: CalendarDays,
    titre: "Rencontres",
    desc: "Lives, tables rondes, ateliers et rendez-vous communautaires.",
    tag: "Événements",
  },
  {
    icon: Mic2,
    titre: "Coups de projecteur",
    desc: "Podcasts et créateurs mis en lumière par l'écosystème.",
    tag: "Spotlight",
  },
];

const DynamiqueSection = () => {
  return (
    <section id="dynamique" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-primary/30" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Écosystème</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">
              La dynamique du Sud
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            Un écosystème vivant, des voix qui bougent, des initiatives qui émergent.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {rubriques.map((r, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-background rounded-2xl border border-border p-6 sm:p-7 hover:border-primary/20 hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all">
                  <r.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2.5 py-1 rounded-full border border-border bg-card">
                  {r.tag}
                </span>
              </div>

              <h3 className="font-serif text-xl mb-2 text-foreground">{r.titre}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">{r.desc}</p>

              <div className="flex items-center gap-1.5 text-xs font-medium text-primary/60 group-hover:text-primary transition-colors">
                <span>Bientôt disponible</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DynamiqueSection;
