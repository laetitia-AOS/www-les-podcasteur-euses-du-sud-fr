import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, Users, Ticket, ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_COLORS: Record<string, string> = {
  rencontre: "bg-primary/10 text-terre border-primary/20",
  atelier: "bg-lavande/10 text-lavande border-lavande/20",
  evenement: "bg-turquoise/10 text-turquoise border-turquoise/20",
  partenaire: "bg-muted text-muted-foreground border-primary/10",
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
      location: { "@type": "Place", name: evt.lieu, ...(evt.adresse && { address: { "@type": "PostalAddress", streetAddress: evt.adresse } }) },
    }),
    ...(evt.image_url && { image: evt.image_url }),
    ...(evt.places && { maximumAttendeeCapacity: evt.places }),
    organizer: { "@type": "Organization", name: "Les Podcasteur·euses du Sud", url: "https://www.les-podcasteur-euses-du-sud.fr" },
  }));

  return (
    <>
      <SEOHead
        title="Événements podcast Région Sud — Les Podcasteur·euses du Sud"
        description="Agenda des rencontres, ateliers et événements podcast en Provence-Alpes-Côte d'Azur."
        path="/evenements-podcast"
        jsonLd={jsonLdEvents}
      />
      <Navbar />
      <main className="min-h-screen">
        {/* Hero dark */}
        <section className="pt-24 pb-12" style={{ backgroundColor: "hsl(40 20% 8%)" }}>
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">Rencontres & Événements</h1>
              <p className="text-base max-w-2xl leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
                Sessions d'écoute, ateliers pratiques et événements partenaires — retrouvez tous les rendez-vous de l'écosystème.
              </p>
              <Link to="/proposer-evenement-podcast">
                <Button className="gap-2 rounded-full font-bold"><Plus className="w-4 h-4" />Proposer un événement</Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-6 max-w-5xl">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-muted/50 rounded-2xl animate-pulse" />)}
              </div>
            ) : !evenements?.length ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CalendarDays className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-foreground font-display font-bold text-xl mb-2">Aucun événement à venir</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">Revenez bientôt !</p>
              </div>
            ) : (
              <div className="space-y-6">
                {evenements.map((evt, i) => {
                  const day = new Date(evt.date_debut).getDate();
                  const monthShort = new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" });
                  const isLavande = evt.type === "evenement" || evt.type === "partenaire";

                  return (
                    <Link to={`/evenement-podcast/${evt.slug || evt.id}`} key={evt.id} className="block">
                      <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                        className="group flex flex-col md:flex-row gap-0 bg-background-pure border border-primary/8 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/20 hover:-translate-y-[3px] transition-all duration-300"
                      >
                        {/* Date column */}
                        <div className={`shrink-0 w-full md:w-24 flex md:flex-col items-center justify-center gap-1 p-4 ${isLavande ? "bg-lavande/10" : "bg-primary/10"}`}>
                          <span className={`text-3xl md:text-4xl font-display font-bold leading-none ${isLavande ? "text-lavande" : "text-primary"}`}>{day}</span>
                          <span className={`text-xs font-semibold uppercase ${isLavande ? "text-lavande/70" : "text-primary/70"}`}>{monthShort}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-5 md:p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`text-xs border ${TYPE_COLORS[evt.type] || "bg-muted text-muted-foreground"}`}>
                              {TYPE_LABELS[evt.type] || evt.type}
                            </Badge>
                          </div>
                          <h2 className="font-display font-bold text-xl text-foreground mb-1 group-hover:text-primary transition-colors">{evt.titre}</h2>
                          {evt.sous_titre && <p className="text-sm font-medium text-muted-foreground/80 mb-1">{evt.sous_titre}</p>}
                          {evt.description && <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">{evt.description}</p>}
                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary/50" />{formatTime(evt.date_debut)}{evt.date_fin && ` – ${formatTime(evt.date_fin)}`}</span>
                            {evt.lieu && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary/50" />{evt.lieu}</span>}
                            {evt.places && <span className="flex items-center gap-1.5"><Ticket className="w-4 h-4 text-primary/50" />{evt.places} places</span>}
                          </div>
                        </div>

                        {/* Actions column */}
                        <div className="shrink-0 flex md:flex-col items-center justify-center gap-3 p-4 md:p-6 border-t md:border-t-0 md:border-l border-primary/8">
                          {evt.places && (
                            <div className="text-center">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mb-1">
                                <div className="h-full bg-primary rounded-full animate-fill" style={{ "--fill-to": "73%" } as any} />
                              </div>
                              <span className="text-xs text-muted-foreground">Places restantes</span>
                            </div>
                          )}
                          <span className="text-sm font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                            Détails <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </motion.article>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Past events */}
            {pastEvents && pastEvents.length > 0 && (
              <section className="mt-20">
                <div className="flex items-center gap-3 mb-8 justify-center">
                  <div className="h-px w-10 bg-border" />
                  <h2 className="font-display font-bold text-2xl text-foreground">Événements passés</h2>
                  <div className="h-px w-10 bg-border" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {pastEvents.map((evt) => (
                    <Link to={`/evenement-podcast/${evt.slug || evt.id}`} key={evt.id}>
                      <article className="flex items-center gap-4 bg-muted/20 border border-border/50 rounded-xl p-4 opacity-60 hover:opacity-90 transition-opacity">
                        {evt.image_url ? (
                          <img src={evt.image_url} alt="" className="shrink-0 w-14 h-14 rounded-xl object-cover" loading="lazy" />
                        ) : (
                          <div className="shrink-0 w-14 h-14 bg-muted rounded-xl flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-muted-foreground leading-none">{new Date(evt.date_debut).getDate()}</span>
                            <span className="text-[10px] uppercase text-muted-foreground/70">{new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" })}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{evt.titre}</p>
                          <p className="text-xs text-muted-foreground">{evt.lieu && `${evt.lieu} · `}<time dateTime={evt.date_debut}>{formatDate(evt.date_debut)}</time></p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Evenements;
