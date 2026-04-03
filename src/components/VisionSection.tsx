import { motion } from "framer-motion";

const VisionSection = () => {
  return (
    <section id="vision" className="py-20 md:py-32 relative" style={{ backgroundColor: "#F6F1E8" }}>
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

          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-center leading-snug text-foreground">
            Le podcast transforme<br />les territoires
          </h2>

          <div className="space-y-5 text-lg text-muted-foreground leading-relaxed text-center" style={{ lineHeight: 1.7 }}>
            <p>
              Podcast, livre audio, vodcast, fiction sonore, création musicale — l'audio
              est devenu un média à part entière, un espace d'expression et de transmission.
            </p>
            <p>
              À Marseille et en Région Sud, une diversité de voix, de récits et d'initiatives
              audio émerge, souvent dispersée et encore peu visible.
            </p>
          </div>

          <div className="pt-4">
            <p className="text-xl sm:text-2xl text-center">
              <span className="font-display font-bold text-primary">Les Podcasteur·euses du Sud</span>{" "}
              <span className="font-display font-bold text-foreground">est né·e de cette réalité.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VisionSection;
