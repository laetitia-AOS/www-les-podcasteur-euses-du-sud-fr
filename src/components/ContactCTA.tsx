import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ContactCTA = () => {
  return (
    <section id="contact" className="py-20 md:py-28 bg-muted relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full opacity-[0.08]" style={{
        background: "radial-gradient(circle, hsl(27 67% 47%), transparent 70%)"
      }} />
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full opacity-[0.06]" style={{
        background: "radial-gradient(circle, hsl(265 20% 52%), transparent 70%)"
      }} />

      <div className="container mx-auto px-6 max-w-2xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-6"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Rejoindre</span>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight text-foreground">
            Ta voix a sa place<br />
            <span className="text-primary">dans le Sud.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto" style={{ lineHeight: 1.7 }}>
            Vous développez un projet, une idée ou une initiative en lien avec le podcast
            ou la création audio ? Contactez-nous pour faciliter les connexions et opportunités.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/referencer-mon-podcast"
              className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full text-base font-bold hover:bg-primary-hover transition-all duration-300 shadow-lg shadow-primary/15"
            >
              Référencer mon podcast
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-base font-semibold border border-foreground/20 text-foreground hover:border-primary hover:text-primary transition-all"
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
