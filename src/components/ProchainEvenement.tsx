import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const TYPE_LABELS: Record<string, string> = {
  rencontre: "Rencontre",
  atelier: "Atelier",
  evenement: "Événement",
  partenaire: "Partenaire",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

const ProchainEvenement = () => {
  const navigate = useNavigate();

  const { data: evt } = useQuery({
    queryKey: ["prochain-evenement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .eq("publie", true)
        .gte("date_debut", new Date().toISOString())
        .order("date_debut", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!evt) return null;

  const day = new Date(evt.date_debut).getDate();
  const month = new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" });

  return (
    <section className="py-16 md:py-24" aria-labelledby="next-event-heading">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-6 bg-secondary/40" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Prochain rendez-vous
            </span>
          </div>

          <article className="relative bg-primary rounded-[28px] overflow-hidden">
            {/* Decorative circle */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-secondary/10 -translate-y-1/3 translate-x-1/3" />

            <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
              {/* Date badge */}
              <div className="shrink-0 w-24 h-24 bg-foreground/10 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center" aria-hidden="true">
                <span className="text-4xl font-display font-extrabold text-secondary leading-none">{day}</span>
                <span className="text-xs font-semibold uppercase text-primary-foreground/70 mt-1">{month}</span>
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-foreground/10 text-primary-foreground/80 mb-3">
                  {TYPE_LABELS[evt.type] || evt.type}
                </span>
                <h2 id="next-event-heading" className="font-display font-extrabold text-2xl md:text-3xl text-primary-foreground mb-2 leading-tight">
                  {evt.titre}
                </h2>
                {evt.sous_titre && (
                  <p className="text-base text-primary-foreground/75 mb-4">{evt.sous_titre}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/70">
                  <span className="flex items-center gap-1.5 bg-foreground/10 rounded-lg px-3 py-1.5">
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    <time dateTime={evt.date_debut}>{formatDate(evt.date_debut)}</time>
                  </span>
                  {evt.lieu && (
                    <span className="flex items-center gap-1.5 bg-foreground/10 rounded-lg px-3 py-1.5">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      {evt.lieu}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => navigate(evt.slug ? `/evenement-podcast/${evt.slug}` : "/evenements-podcast")}
                  className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-primary bg-foreground px-6 py-3 rounded-full hover:brightness-95 transition-all shadow-md"
                >
                  Découvrir
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        </motion.div>
      </div>
    </section>
  );
};

export default ProchainEvenement;
