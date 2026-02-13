import { motion } from "framer-motion";

const VisionSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4">
            Le podcast transforme les territoires
          </h2>
          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            <p>
              Le podcast n'est plus un simple format.<br />
              Il est devenu un média, un espace d'expression et de création.
            </p>
            <p>
              En Région Sud, une diversité de voix et de récits émerge, encore dispersée et souvent invisible.
            </p>
            <p className="text-foreground font-serif text-xl sm:text-2xl">
              Podcasteur·euses du Sud est né de cette réalité.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VisionSection;
