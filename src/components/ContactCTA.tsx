import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ContactCTA = () => {
  return (
    <section id="contact" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-6"
        >
          <div className="flex items-center gap-3 justify-center">
            <div className="h-px w-8 bg-secondary/30" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary/70">
              Écosystème
            </span>
            <div className="h-px w-8 bg-secondary/30" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">
            Entrer en relation avec l'écosystème
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Vous développez un projet, une idée ou une initiative en lien avec le podcast
            ou la création audio ? Contactez-nous pour faciliter les connexions et opportunités.
          </p>
          <Link
            to="/contact"
            className="group inline-flex items-center gap-3 bg-secondary text-secondary-foreground px-8 py-4 rounded-xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Nous contacter
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactCTA;
