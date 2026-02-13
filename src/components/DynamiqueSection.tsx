import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic2, ArrowUpRight, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Podcast {
  id: string;
  nom_podcast: string;
  description: string;
  ville: string | null;
  thematique: string | null;
  lien_ecoute: string;
  vignette_url: string | null;
  created_at: string;
}

const DynamiqueSection = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPodcasts = async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, nom_podcast, description, ville, thematique, lien_ecoute, vignette_url, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!error && data) setPodcasts(data);
      setLoading(false);
    };
    fetchPodcasts();
  }, []);

  const hasContent = podcasts.length > 0;

  return (
    <section id="dynamique" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-primary/30" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                Flux
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">
              La dynamique audio du Sud
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            Un écosystème vivant, des voix qui bougent, des créateurs qui émergent.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : hasContent ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {podcasts.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group bg-background rounded-2xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {/* Vignette */}
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {p.vignette_url ? (
                    <img
                      src={p.vignette_url}
                      alt={`Vignette de ${p.nom_podcast}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Mic2 className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-serif text-lg text-foreground mb-1 line-clamp-1">
                    {p.nom_podcast}
                  </h3>

                  {(p.ville || p.thematique) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      {p.ville && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {p.ville}
                        </span>
                      )}
                      {p.ville && p.thematique && <span>—</span>}
                      {p.thematique && <span>{p.thematique}</span>}
                    </div>
                  )}

                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
                    {p.description}
                  </p>

                  <a
                    href={p.lien_ecoute}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Écouter le podcast
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          /* Empty state — teasing */
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Mic2 className="w-7 h-7 text-primary/50" />
            </div>
            <h3 className="font-serif text-xl mb-2 text-foreground">
              Les premiers podcasts arrivent bientôt
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Le flux se construit en temps réel grâce aux créateurs qui référencent leurs podcasts.
              Soyez parmi les premiers à apparaître.
            </p>
            <a
              href="#formulaire"
              className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Référencer mon podcast
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DynamiqueSection;
