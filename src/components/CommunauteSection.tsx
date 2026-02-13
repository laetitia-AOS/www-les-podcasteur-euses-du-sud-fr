import { motion } from "framer-motion";

const CommunauteSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">
            Participer à la dynamique
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Podcasteurs, studios, partenaires, acteurs de l'audio ou curieux du média :
            Podcasteur·euses du Sud est ouvert à celles et ceux qui souhaitent contribuer
            à la vitalité de l'écosystème podcast régional.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a
              href="mailto:contact@podcasteusesdusud.fr"
              className="inline-block bg-secondary text-secondary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Prendre contact
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CommunauteSection;
