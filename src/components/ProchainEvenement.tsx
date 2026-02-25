import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const ProchainEvenement = () => {
  const navigate = useNavigate();

  const { data: evt } = useQuery({
    queryKey: ["prochain-evenement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
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
    <section className="py-16 md:py-24 bg-background">
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

          <div className="relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-shadow duration-500">
            {/* Subtle accent gradient */}
            <div
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"
            />

            <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start">
              {/* Big date */}
              <div className="shrink-0 w-24 h-24 md:w-28 md:h-28 bg-primary/10 rounded-2xl flex flex-col items-center justify-center">
                <span className="text-4xl md:text-5xl font-bold text-primary leading-none">
                  {day}
                </span>
                <span className="text-sm font-semibold uppercase text-primary/70 mt-1">
                  {month}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
                  {evt.titre}
                </h2>
                {evt.description && (
                  <p className="text-muted-foreground leading-relaxed mb-5 max-w-xl">
                    {evt.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-primary/60" />
                    {formatDate(evt.date_debut)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary/60" />
                    {formatTime(evt.date_debut)}
                    {evt.date_fin && ` – ${formatTime(evt.date_fin)}`}
                  </span>
                  {evt.lieu && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary/60" />
                      {evt.lieu}
                      {evt.adresse && `, ${evt.adresse}`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate("/evenements")}
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Voir tous les événements
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProchainEvenement;
