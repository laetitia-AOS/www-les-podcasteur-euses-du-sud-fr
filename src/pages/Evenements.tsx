import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, Ticket, ArrowRight, Plus, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const EventCard = ({ evt, index }: { evt: any; index: number }) => {
  const day = new Date(evt.date_debut).getDate();
  const monthShort = new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" });

  return (
    <Link to={`/evenement-podcast/${evt.slug || evt.id}`} className="block group">
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        className="bg-background-pure border border-border rounded-[20px] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        {/* Image hero */}
        {evt.image_url && (
          <div className="relative h-48 sm:h-56 overflow-hidden">
            <img
              src={evt.image_url}
              alt={`Illustration : ${evt.titre}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {/* Date badge on image */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-background-pure/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center shadow-lg">
              <span className="text-xl font-display font-bold text-bleu leading-none">{day}</span>
              <span className="text-[10px] font-semibold uppercase text-bleu/60 mt-0.5">{monthShort}</span>
            </div>
          </div>
        )}

        <div className="p-5 md:p-6">
          {/* Type + date row when no image */}
          <div className="flex items-center gap-2 mb-3">
            {!evt.image_url && (
              <div className="shrink-0 w-12 h-12 bg-bleu/10 rounded-xl flex flex-col items-center justify-center mr-2">
                <span className="text-lg font-display font-bold text-bleu leading-none">{day}</span>
                <span className="text-[9px] font-semibold uppercase text-bleu/50">{monthShort}</span>
              </div>
            )}
            <Badge className="text-[10px] font-semibold uppercase tracking-wider border-0 bg-bleu/10 text-bleu px-2.5 py-1 rounded-full">
              {TYPE_LABELS[evt.type] || evt.type}
            </Badge>
          </div>

          <h2 className="font-display font-bold text-xl text-foreground mb-1 group-hover:text-bleu transition-colors leading-tight">
            {evt.titre}
          </h2>
          {evt.sous_titre && (
            <p className="text-sm font-medium text-muted-foreground/80 mb-1">{evt.sous_titre}</p>
          )}
          {evt.description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">{evt.description}</p>
          )}

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5">
              <Clock className="w-3.5 h-3.5 text-bleu/50" />
              {formatTime(evt.date_debut)}{evt.date_fin && ` – ${formatTime(evt.date_fin)}`}
            </span>
            {evt.lieu && (
              <span className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5">
                <MapPin className="w-3.5 h-3.5 text-bleu/50" />{evt.lieu}
              </span>
            )}
            {evt.places && (
              <span className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5">
                <Ticket className="w-3.5 h-3.5 text-bleu/50" />{evt.places} places
              </span>
            )}
          </div>

          {/* CTA */}
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-bleu group-hover:gap-2.5 transition-all">
            Découvrir <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </motion.article>
    </Link>
  );
};

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
        {/* Hero bold blue — inspiré du template Apéro Écoute */}
        <section className="pt-24 pb-14 bg-bleu-dark relative overflow-hidden">
          {/* Decorative sun */}
          <div className="absolute top-6 right-8 md:right-16">
            <Sun className="w-8 h-8 text-soleil" strokeWidth={2.5} />
          </div>
          <div className="container mx-auto px-6 max-w-5xl relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-soleil mb-3 block">
                Les Podcasteur·euses du Sud
              </span>
              <h1 className="font-display font-bold text-3xl md:text-5xl text-white mb-3 leading-tight">
                Rencontres &{" "}
                <span className="text-soleil">Événements</span>
              </h1>
              <p className="text-base max-w-2xl leading-relaxed mb-8 text-white/55">
                Sessions d'écoute, ateliers pratiques et événements partenaires — retrouvez tous les rendez-vous de l'écosystème podcast en Région Sud.
              </p>
              <Link to="/proposer-evenement-podcast">
                <Button className="gap-2 rounded-pill font-bold bg-white text-bleu-dark hover:bg-white/90">
                  <Plus className="w-4 h-4" />Proposer un événement
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-6 max-w-5xl">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-72 bg-muted/50 rounded-[20px] animate-pulse" />)}
              </div>
            ) : !evenements?.length ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-bleu/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CalendarDays className="w-8 h-8 text-bleu/60" />
                </div>
                <p className="text-foreground font-display font-bold text-xl mb-2">Aucun événement à venir</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">Revenez bientôt !</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {evenements.map((evt, i) => (
                  <EventCard key={evt.id} evt={evt} index={i} />
                ))}
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
                          <div className="shrink-0 w-14 h-14 bg-bleu/10 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-bleu leading-none">{new Date(evt.date_debut).getDate()}</span>
                            <span className="text-[10px] uppercase text-bleu/50">{new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" })}</span>
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
