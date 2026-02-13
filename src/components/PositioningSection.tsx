import { motion } from "framer-motion";

const PositioningSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-xl sm:text-2xl md:text-3xl font-serif leading-relaxed text-foreground">
            Le podcast est devenu un média à part entière.
          </p>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Podcasteur·euses du Sud fédère et rend visibles celles et ceux qui produisent, racontent et créent en audio sur le territoire.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PositioningSection;
