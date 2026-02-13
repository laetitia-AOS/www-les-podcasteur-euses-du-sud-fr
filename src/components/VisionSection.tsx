import { motion } from "framer-motion";

const VisionSection = () => {
  return (
    <section id="vision" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-center mb-2">
            Le podcast transforme les territoires
          </h2>
          <div className="section-divider w-16 mx-auto" />
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed text-center">
            <p>
              Le podcast est devenu un média à part entière, un espace d'expression,
              de création et de transmission.
            </p>
            <p>
              En Région Sud, une diversité de voix, de récits et d'initiatives audio émerge,
              souvent dispersée et encore peu visible.
            </p>
          </div>
          <p className="text-foreground font-serif text-xl sm:text-2xl text-center pt-2">
            Podcasteur·euses du Sud est né de cette réalité.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default VisionSection;
