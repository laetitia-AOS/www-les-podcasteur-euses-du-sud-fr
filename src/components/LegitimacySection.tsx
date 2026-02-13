import { motion } from "framer-motion";

const LegitimacySection = () => {
  return (
    <section className="py-16 md:py-24 bg-warm-glow">
      <div className="container mx-auto px-6 max-w-3xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-xl sm:text-2xl font-serif text-foreground leading-relaxed"
        >
          Podcasteur·euses du Sud est une initiative dédiée à la visibilité et à la structuration de la scène podcast en Région Sud.
        </motion.p>
      </div>
    </section>
  );
};

export default LegitimacySection;
