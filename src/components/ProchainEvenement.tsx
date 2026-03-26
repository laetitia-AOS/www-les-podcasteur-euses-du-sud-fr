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
            <div className="h-px w-6 bg-primary/40" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Prochain rendez-vous
            </span>
          </div>

          <article className="relative rounded-[28px] overflow-hidden" style={{ backgroundColor: "hsl(40 20% 8%)" }}>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/3 translate-x-1/3" style={{ background: "rgba(200,116,42,0.08)" }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/3 -translate-x-1/3" style={{ background: "rgba(124,107,158,0.06)" }} />

            <div className="relative p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
              {/* Date badge */}
              <div className="shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center" style={{ background: "rgba(200,116,42,0.15)", border: "1px solid rgba(200,116,42,0.25)" }} aria-hidden="true">
                <span className="text-4xl font-display font-black text-primary leading-none">{day}</span>
                <span className="text-xs font-semibold uppercase mt-1" style={{ color: "hsl(33 40% 62%)" }}>{month}</span>
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}>
                  {TYPE_LABELS[evt.type] || evt.type}
                </span>
                <h2 id="next-event-heading" className="font-display font-black text-2xl md:text-3xl text-white mb-2 leading-tight">
                  {evt.titre}
                </h2>
                {evt.sous_titre && (
                  <p className="text-base mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>{evt.sous_titre}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    <time dateTime={evt.date_debut}>{formatDate(evt.date_debut)}</time>
                  </span>
                  {evt.lieu && (
                    <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      {evt.lieu}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => navigate(evt.slug ? `/evenement-podcast/${evt.slug}` : "/evenements-podcast")}
                  className="inline-flex items-center gap-2 mt-6 text-sm font-bold px-6 py-3 rounded-full hover:brightness-95 transition-all shadow-md"
                  style={{ background: "hsl(38 33% 94%)", color: "hsl(40 20% 8%)" }}
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
