import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, ExternalLink, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  rencontre: "Rencontre",
  atelier: "Atelier",
  evenement: "Événement",
  partenaire: "Partenaire",
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const Evenements = () => {
  useEffect(() => {
    document.title = "Événements — Les Podcasteur·euses du Sud";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Retrouvez les prochains rendez-vous, sessions d'écoute et événements des Podcasteur·euses du Sud en Région PACA.");
  }, []);

  const { data: evenements, isLoading } = useQuery({
    queryKey: ["evenements-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .gte("date_debut", new Date().toISOString())
        .order("date_debut", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: pastEvents } = useQuery({
    queryKey: ["evenements-past"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .lt("date_debut", new Date().toISOString())
        .order("date_debut", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <section className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Agenda
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Rencontres & Événements
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Retrouvez les prochains rendez-vous des Podcasteur·euses du Sud :
              sessions d'écoute, ateliers et événements partenaires.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !evenements?.length ? (
            <div className="text-center py-20">
              <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun événement à venir pour le moment.</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Revenez bientôt pour découvrir nos prochains rendez-vous !
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {evenements.map((evt: any, i: number) => (
                <motion.article
                  key={evt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Cover image */}
                  {evt.image_url && (
                    <div className="relative h-48 md:h-56 overflow-hidden">
                      <img
                        src={evt.image_url}
                        alt={evt.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
                      <div className="absolute bottom-4 left-6">
                        <Badge variant="secondary" className="text-xs backdrop-blur-sm">
                          {TYPE_LABELS[evt.type] || evt.type}
                        </Badge>
                      </div>
                      {/* Date pill on image */}
                      <div className="absolute top-4 right-4 w-16 h-16 bg-card/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center shadow-lg">
                        <span className="text-xl font-bold text-primary leading-none">
                          {new Date(evt.date_debut).getDate()}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-primary/70">
                          {new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Date badge (only if no image) */}
                      {!evt.image_url && (
                        <div className="shrink-0 w-20 h-20 bg-primary/10 rounded-2xl flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-primary leading-none">
                            {new Date(evt.date_debut).getDate()}
                          </span>
                          <span className="text-xs font-semibold uppercase text-primary/70 mt-1">
                            {new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" })}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {!evt.image_url && (
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {TYPE_LABELS[evt.type] || evt.type}
                            </Badge>
                          </div>
                        )}

                        <h2 className="font-serif text-xl md:text-2xl text-foreground mb-1">
                          {evt.titre}
                        </h2>
                        {evt.sous_titre && (
                          <p className="text-base font-semibold text-primary/80 mb-3">
                            {evt.sous_titre}
                          </p>
                        )}
                        {evt.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                            {evt.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary/50" />
                            {formatTime(evt.date_debut)}
                            {evt.date_fin && ` – ${formatTime(evt.date_fin)}`}
                          </span>
                          {evt.lieu && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-primary/50" />
                              {evt.lieu}
                              {evt.adresse && `, ${evt.adresse}`}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4 text-primary/50" />
                            {formatDate(evt.date_debut)}
                          </span>
                          {evt.places && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-primary/50" />
                              {evt.places} place{evt.places > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {evt.lien_externe && (
                          <a
                            href={evt.lien_externe}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            Plus d'infos <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {/* Past events */}
          {pastEvents && pastEvents.length > 0 && (
            <div className="mt-20">
              <h2 className="font-serif text-2xl text-foreground mb-8 text-center">
                Événements passés
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {pastEvents.map((evt: any) => (
                  <div
                    key={evt.id}
                    className="flex items-center gap-4 bg-muted/20 border border-border/50 rounded-xl p-4 opacity-70 hover:opacity-90 transition-opacity"
                  >
                    {evt.image_url ? (
                      <img src={evt.image_url} alt="" className="shrink-0 w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="shrink-0 w-14 h-14 bg-muted rounded-xl flex flex-col items-center justify-center">
                        <span className="text-sm font-bold text-muted-foreground leading-none">
                          {new Date(evt.date_debut).getDate()}
                        </span>
                        <span className="text-[10px] uppercase text-muted-foreground/70">
                          {new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{evt.titre}</p>
                      {evt.sous_titre && <p className="text-xs text-muted-foreground truncate">{evt.sous_titre}</p>}
                      <p className="text-xs text-muted-foreground">
                        {evt.lieu && `${evt.lieu} · `}{formatDate(evt.date_debut)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Evenements;
