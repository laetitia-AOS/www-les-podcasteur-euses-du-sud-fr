import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ContactCTA = () => {
  return (
    <section id="contact" className="py-20 md:py-28 relative overflow-hidden" style={{ backgroundColor: "#EDE3D3" }}>
      <div className="container mx-auto px-6 max-w-2xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-6"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Rejoindre</span>

          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl leading-tight text-foreground">
            Ta voix a sa place<br />
            <span className="font-display italic text-primary">dans le Sud.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto" style={{ lineHeight: 1.7 }}>
            Vous développez un projet, une idée ou une initiative en lien avec le podcast
            ou la création audio ? Contactez-nous pour faciliter les connexions et opportunités.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/referencer-mon-podcast"
              className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-pill text-base font-semibold hover:bg-primary-hover transition-all duration-300"
              style={{ boxShadow: "0 4px 14px rgba(184,92,56,0.2)" }}
            >
              Référencer mon podcast
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-pill text-base font-semibold transition-all text-primary hover:bg-primary hover:text-primary-foreground"
              style={{ border: "1px solid rgba(184,92,56,0.3)" }}
            >
              Nous contacter
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactCTA;
