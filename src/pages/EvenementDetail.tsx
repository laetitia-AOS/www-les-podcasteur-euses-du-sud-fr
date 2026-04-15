import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { withUtm } from "@/lib/utm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, ExternalLink, Ticket, ArrowLeft, Share2, Sun, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

const EvenementDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: evt, isLoading } = useQuery({
    queryKey: ["evenement-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .eq("slug", slug)
        .eq("publie", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: evt?.titre, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  const jsonLd = useMemo(() => evt ? {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evt.titre,
    description: evt.description || evt.sous_titre || "Événement podcast",
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
  } : undefined, [evt]);

  const seoTitle = evt ? `${evt.titre} — Les Podcasteur·euses du Sud` : "Événement — Les Podcasteur·euses du Sud";
  const seoDesc = evt ? (evt.description || evt.sous_titre || `Événement podcast : ${evt.titre}`) : "Événement podcast en Région Sud.";

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="h-72 bg-muted/50 rounded-[20px] animate-pulse mb-8" />
            <div className="h-8 bg-muted/50 rounded-xl animate-pulse w-2/3 mb-4" />
            <div className="h-4 bg-muted/50 rounded-lg animate-pulse w-1/3" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!evt) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <CalendarDays className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h1 className="font-display font-bold text-2xl text-foreground mb-2">Événement introuvable</h1>
            <p className="text-muted-foreground mb-6">Cet événement n'existe pas ou n'est plus disponible.</p>
            <Link to="/evenements-podcast">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux événements
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const isPast = new Date(evt.date_debut) < new Date();
  const mapsQuery = evt.adresse ? encodeURIComponent(evt.adresse) : evt.lieu ? encodeURIComponent(evt.lieu) : null;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        path={`/evenement-podcast/${slug}`}
        image={evt.image_url || undefined}
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="min-h-screen">
        {/* Blue header band — style template Apéro Écoute */}
        <section className="pt-24 pb-10 bg-bleu-dark relative overflow-hidden">
          <div className="absolute top-6 right-8 md:right-16">
            <Sun className="w-7 h-7 text-soleil" strokeWidth={2.5} />
          </div>
          <div className="container mx-auto px-6 max-w-4xl relative z-10">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Link to="/evenements-podcast" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" />
                Tous les événements
              </Link>

              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soleil block mb-2">
                {TYPE_LABELS[evt.type] || evt.type} · {new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </span>

              <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-2 leading-tight">
                {evt.titre}
              </h1>
              {evt.sous_titre && (
                <p className="text-base text-white/60 max-w-2xl leading-relaxed">{evt.sous_titre}</p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Event image */}
        {evt.image_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="container mx-auto px-6 max-w-4xl -mt-2"
          >
            <div className="rounded-[20px] overflow-hidden shadow-xl">
              <img
                src={evt.image_url}
                alt={`Illustration : ${evt.titre}`}
                className="w-full h-56 sm:h-72 md:h-[400px] object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div className="container mx-auto px-6 max-w-4xl py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Info blocks — inspired by template */}
            <div className="space-y-4 mb-8">
              {/* Date / time */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-bleu/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarDays className="w-5 h-5 text-bleu" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground capitalize">
                    <time dateTime={evt.date_debut}>{formatDate(evt.date_debut)}</time>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    De {formatTime(evt.date_debut)}{evt.date_fin && ` à ${formatTime(evt.date_fin)}`}
                  </p>
                </div>
              </div>

              {/* Location */}
              {evt.lieu && (
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-bleu/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-bleu" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{evt.lieu}</p>
                    {evt.adresse && <p className="text-sm text-muted-foreground">{evt.adresse}</p>}
                    {mapsQuery && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-bleu hover:text-bleu-dark mt-1 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Voir l'itinéraire →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Places */}
              {evt.places && (
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-bleu/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Ticket className="w-5 h-5 text-bleu" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{evt.places} place{evt.places > 1 ? "s" : ""}</p>
                    <p className="text-sm text-muted-foreground">Capacité de l'événement</p>
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="h-px bg-border mb-8" />

            {/* Description */}
            {evt.description && (
              <div className="mb-8">
                <h2 className="font-display font-bold text-xl text-foreground mb-4">À propos de l'événement</h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-[15px]">
                  {evt.description}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {evt.lien_externe && !isPast && (
                <a
                  href={withUtm(evt.lien_externe, "evenement")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="gap-2 rounded-pill font-bold bg-bleu text-white hover:bg-bleu-dark">
                    S'inscrire / Plus d'infos
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
              <Button variant="outline" onClick={handleShare} className="gap-2 rounded-pill">
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
            </div>

            {isPast && (
              <Badge variant="outline" className="mt-6 text-muted-foreground">
                Cet événement est passé
              </Badge>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default EvenementDetail;
