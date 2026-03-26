import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ContactCTA = () => {
  return (
    <section id="contact" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(circle at 50% 50%, hsl(229 88% 50% / 0.1) 0%, transparent 60%)"
      }} />

      <div className="container mx-auto px-6 max-w-2xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-6"
        >
          {/* Animated sun */}
          <div className="text-6xl animate-sun inline-block mb-4">☀️</div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight">
            Ta voix a sa place<br />
            <span className="text-secondary">dans le Sud.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Vous développez un projet, une idée ou une initiative en lien avec le podcast
            ou la création audio ? Contactez-nous pour faciliter les connexions et opportunités.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/referencer-mon-podcast"
              className="group inline-flex items-center gap-3 bg-secondary text-secondary-foreground px-8 py-4 rounded-full text-base font-bold hover:brightness-110 transition-all duration-300 shadow-lg shadow-secondary/25"
            >
              Référencer mon podcast
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-base font-semibold border border-foreground/20 text-foreground hover:border-foreground/40 transition-all"
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
