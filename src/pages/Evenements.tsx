import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, ExternalLink, Users, Ticket, ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_COLORS: Record<string, string> = {
  rencontre: "bg-primary/10 text-primary border-primary/20",
  atelier: "bg-secondary/10 text-secondary-foreground border-secondary/30",
  evenement: "bg-accent/10 text-accent-foreground border-accent/30",
  partenaire: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABELS: Record<string, string> = {
  rencontre: "Rencontre",
  atelier: "Atelier",
  evenement: "Événement",
  partenaire: "Partenaire",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const Evenements = () => {

  const { data: evenements, isLoading } = useQuery({
    queryKey: ["evenements-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .eq("publie", true)
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
        .eq("publie", true)
        .lt("date_debut", new Date().toISOString())
        .order("date_debut", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  // JSON-LD for upcoming events
  const jsonLdEvents = evenements?.map((evt) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: evt.titre,
    description: evt.description || evt.sous_titre || `Événement podcast organisé par Les Podcasteur·euses du Sud`,
    startDate: evt.date_debut,
    ...(evt.date_fin && { endDate: evt.date_fin }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(evt.lieu && {
      location: {
        "@type": "Place",
        name: evt.lieu,
        ...(evt.adresse && { address: { "@type": "PostalAddress", streetAddress: evt.adresse } }),
      },
    }),
    ...(evt.image_url && { image: evt.image_url }),
    ...(evt.places && { maximumAttendeeCapacity: evt.places }),
    organizer: {
      "@type": "Organization",
      name: "Les Podcasteur·euses du Sud",
      url: "https://www.les-podcasteur-euses-du-sud.fr",
    },
  }));

  return (
    <>
      <SEOHead
        title="Événements podcast Région Sud — Les Podcasteur·euses du Sud"
        description="Agenda des rencontres, ateliers et événements podcast en Provence-Alpes-Côte d'Azur. Rejoignez la communauté des créateurs audio du Sud."
        path="/evenements-podcast"
        jsonLd={jsonLdEvents}
      />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <section className="container mx-auto px-6 max-w-5xl" aria-labelledby="events-heading">
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Agenda
            </span>
            <h1 id="events-heading" className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Rencontres & Événements
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed mb-6">
              Sessions d'écoute, ateliers pratiques et événements partenaires — retrouvez tous les rendez-vous de l'écosystème podcast en Région Sud.
            </p>
            <Link to="/proposer-evenement-podcast">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Proposer un événement
              </Button>
            </Link>
          </motion.header>

          {isLoading ? (
            <div className="space-y-6" aria-busy="true">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !evenements?.length ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CalendarDays className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-foreground font-serif text-xl mb-2">Aucun événement à venir</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Revenez bientôt pour découvrir nos prochains rendez-vous ! En attendant, explorez l'annuaire des podcasts du Sud.
              </p>
            </div>
          ) : (
            <div className="space-y-8" role="list" aria-label="Événements à venir">
              {evenements.map((evt, i) => {
                const day = new Date(evt.date_debut).getDate();
                const monthShort = new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" });

                return (
                  <Link to={`/evenement-podcast/${evt.slug || evt.id}`} className="block">
                  <motion.article
                    key={evt.id}
                    role="listitem"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                  >
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-60" />

                    {evt.image_url && (
                      <div className="relative h-52 md:h-64 overflow-hidden">
                        <img
                          src={evt.image_url}
                          alt={`Illustration de l'événement : ${evt.titre}`}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                        <div className="absolute bottom-4 left-6 flex items-center gap-2">
                          <Badge className={`text-xs border ${TYPE_COLORS[evt.type] || "bg-muted text-muted-foreground"}`}>
                            {TYPE_LABELS[evt.type] || evt.type}
                          </Badge>
                        </div>
                        <div className="absolute top-4 right-4 w-16 h-16 bg-card/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center shadow-lg" aria-hidden="true">
                          <span className="text-xl font-bold text-primary leading-none">{day}</span>
                          <span className="text-[10px] font-semibold uppercase text-primary/70">{monthShort}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {!evt.image_url && (
                          <div className="shrink-0 w-20 h-20 bg-primary/10 rounded-2xl flex flex-col items-center justify-center" aria-hidden="true">
                            <span className="text-2xl font-bold text-primary leading-none">{day}</span>
                            <span className="text-xs font-semibold uppercase text-primary/70 mt-1">{monthShort}</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {!evt.image_url && (
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs border ${TYPE_COLORS[evt.type] || "bg-muted text-muted-foreground"}`}>
                                {TYPE_LABELS[evt.type] || evt.type}
                              </Badge>
                            </div>
                          )}

                          <h2 className="font-serif text-xl md:text-2xl text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">
                            {evt.titre}
                          </h2>
                          {evt.sous_titre && (
                            <p className="text-base font-semibold text-primary/80 mb-3 leading-snug">
                              {evt.sous_titre}
                            </p>
                          )}
                          {evt.description && (
                            <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-2xl line-clamp-3">
                              {evt.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="w-4 h-4 text-primary/50" aria-hidden="true" />
                              <time dateTime={evt.date_debut}>{formatDate(evt.date_debut)}</time>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-primary/50" aria-hidden="true" />
                              {formatTime(evt.date_debut)}
                              {evt.date_fin && ` – ${formatTime(evt.date_fin)}`}
                            </span>
                            {evt.lieu && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-primary/50" aria-hidden="true" />
                                {evt.lieu}{evt.adresse && `, ${evt.adresse}`}
                              </span>
                            )}
                            {evt.places && (
                              <span className="flex items-center gap-1.5">
                                <Ticket className="w-4 h-4 text-primary/50" aria-hidden="true" />
                                {evt.places} place{evt.places > 1 ? "s" : ""} disponible{evt.places > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                            Voir les détails
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Past events */}
          {pastEvents && pastEvents.length > 0 && (
            <section className="mt-20" aria-labelledby="past-events-heading">
              <div className="flex items-center gap-3 mb-8 justify-center">
                <div className="h-px w-10 bg-border" />
                <h2 id="past-events-heading" className="font-serif text-2xl text-foreground">
                  Événements passés
                </h2>
                <div className="h-px w-10 bg-border" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {pastEvents.map((evt) => (
                  <Link to={`/evenement-podcast/${evt.slug || evt.id}`} key={evt.id}>
                  <article
                    className="flex items-center gap-4 bg-muted/20 border border-border/50 rounded-xl p-4 opacity-60 hover:opacity-90 transition-opacity"
                  >
                    {evt.image_url ? (
                      <img src={evt.image_url} alt="" className="shrink-0 w-14 h-14 rounded-xl object-cover" loading="lazy" />
                    ) : (
                      <div className="shrink-0 w-14 h-14 bg-muted rounded-xl flex flex-col items-center justify-center" aria-hidden="true">
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
                        {evt.lieu && `${evt.lieu} · `}
                        <time dateTime={evt.date_debut}>{formatDate(evt.date_debut)}</time>
                      </p>
                    </div>
                  </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Evenements;
