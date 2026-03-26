import { motion } from "framer-motion";

const VisionSection = () => {
  return (
    <section id="vision" className="py-20 md:py-32 bg-background bg-grid relative">
      <div className="container mx-auto px-6 max-w-3xl relative">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-3 justify-center mb-2">
            <div className="h-px w-8 bg-primary/30" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Vision</span>
            <div className="h-px w-8 bg-primary/30" />
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-center leading-snug">
            Le podcast transforme<br />les territoires
          </h2>

          <div className="space-y-5 text-lg text-muted-foreground leading-relaxed text-center">
            <p>
              Le podcast est devenu un média à part entière — un espace d'expression,
              de création et de transmission.
            </p>
            <p>
              En Région Sud, une diversité de voix, de récits et d'initiatives audio émerge,
              souvent dispersée et encore peu visible.
            </p>
          </div>

          <div className="pt-4">
            <p className="text-foreground font-display font-bold text-xl sm:text-2xl text-center italic">
              Les Podcasteur·euses du Sud est né·e de cette réalité.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VisionSection;
