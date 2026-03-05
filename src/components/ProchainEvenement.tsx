import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, ArrowRight, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
    <section className="py-16 md:py-24 bg-background" aria-labelledby="next-event-heading">
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

          <article className="relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

            {evt.image_url && (
              <div className="relative h-48 md:h-64 overflow-hidden">
                <img
                  src={evt.image_url}
                  alt={`Illustration : ${evt.titre}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <div className="absolute top-4 right-4 w-20 h-20 bg-card/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center shadow-lg" aria-hidden="true">
                  <span className="text-3xl font-bold text-primary leading-none">{day}</span>
                  <span className="text-xs font-semibold uppercase text-primary/70 mt-1">{month}</span>
                </div>
                <div className="absolute bottom-4 left-6">
                  <Badge className="text-xs bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
                    {TYPE_LABELS[evt.type] || evt.type}
                  </Badge>
                </div>
              </div>
            )}

            <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start">
              {!evt.image_url && (
                <div className="shrink-0 w-24 h-24 md:w-28 md:h-28 bg-primary/10 rounded-2xl flex flex-col items-center justify-center" aria-hidden="true">
                  <span className="text-4xl md:text-5xl font-bold text-primary leading-none">{day}</span>
                  <span className="text-sm font-semibold uppercase text-primary/70 mt-1">{month}</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                {!evt.image_url && (
                  <Badge className="text-xs bg-primary/10 text-primary border border-primary/20 mb-3">
                    {TYPE_LABELS[evt.type] || evt.type}
                  </Badge>
                )}
                <h2 id="next-event-heading" className="font-serif text-2xl md:text-3xl text-foreground mb-1 leading-tight">
                  {evt.titre}
                </h2>
                {evt.sous_titre && (
                  <p className="text-lg font-semibold text-primary/80 mb-3 leading-snug">
                    {evt.sous_titre}
                  </p>
                )}
                {evt.description && (
                  <p className="text-muted-foreground leading-relaxed mb-5 max-w-xl">
                    {evt.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-primary/60" aria-hidden="true" />
                    <time dateTime={evt.date_debut}>{formatDate(evt.date_debut)}</time>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary/60" aria-hidden="true" />
                    {formatTime(evt.date_debut)}
                    {evt.date_fin && ` – ${formatTime(evt.date_fin)}`}
                  </span>
                  {evt.lieu && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary/60" aria-hidden="true" />
                      {evt.lieu}{evt.adresse && `, ${evt.adresse}`}
                    </span>
                  )}
                  {evt.places && (
                    <span className="flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-primary/60" aria-hidden="true" />
                      {evt.places} place{evt.places > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {evt.lien_externe && (
                    <a
                      href={evt.lien_externe}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground bg-primary px-5 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-sm"
                    >
                      S'inscrire
                    </a>
                  )}
                  <button
                    onClick={() => navigate("/evenements")}
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-1"
                  >
                    Voir tous les événements
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        </motion.div>
      </div>
    </section>
  );
};

export default ProchainEvenement;
