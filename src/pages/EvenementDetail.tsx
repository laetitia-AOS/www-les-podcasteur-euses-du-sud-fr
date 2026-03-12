import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, ExternalLink, Ticket, ArrowLeft, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

const EvenementDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: evt, isLoading, error } = useQuery({
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
            <div className="h-72 bg-muted/50 rounded-2xl animate-pulse mb-8" />
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
            <h1 className="font-serif text-2xl text-foreground mb-2">Événement introuvable</h1>
            <p className="text-muted-foreground mb-6">Cet événement n'existe pas ou n'est plus disponible.</p>
            <Link to="/evenements">
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

  const day = new Date(evt.date_debut).getDate();
  const monthShort = new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" });
  const isPast = new Date(evt.date_debut) < new Date();

  return (
    <>
      <Navbar />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <main className="min-h-screen pt-20 pb-16">
        {/* Hero image */}
        {evt.image_url ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-64 sm:h-80 md:h-[420px] overflow-hidden"
          >
            <img
              src={evt.image_url}
              alt={`Illustration : ${evt.titre}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            {/* Date badge on image */}
            <div className="absolute top-6 right-6 w-18 h-18 bg-card/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center shadow-xl px-4 py-3" aria-hidden="true">
              <span className="text-2xl font-bold text-primary leading-none">{day}</span>
              <span className="text-xs font-semibold uppercase text-primary/70 mt-0.5">{monthShort}</span>
            </div>
          </motion.div>
        ) : (
          <div className="pt-4" />
        )}

        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className={evt.image_url ? "-mt-16 relative z-10" : "mt-8"}
          >
            {/* Back link */}
            <div className="mb-6">
              <Link to="/evenements" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Tous les événements
              </Link>
            </div>

            {/* Main card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="p-6 md:p-10">
                {/* Type badge + share */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border ${TYPE_COLORS[evt.type] || "bg-muted text-muted-foreground"}`}>
                      {TYPE_LABELS[evt.type] || evt.type}
                    </Badge>
                    {isPast && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Événement passé
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground hover:text-primary">
                    <Share2 className="w-4 h-4 mr-1.5" />
                    Partager
                  </Button>
                </div>

                {/* Title */}
                <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2 leading-tight">
                  {evt.titre}
                </h1>
                {evt.sous_titre && (
                  <p className="text-lg font-semibold text-primary/80 mb-6 leading-snug">
                    {evt.sous_titre}
                  </p>
                )}

                {/* Info grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        <time dateTime={evt.date_debut}>{formatDate(evt.date_debut)}</time>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(evt.date_debut)}
                        {evt.date_fin && ` – ${formatTime(evt.date_fin)}`}
                      </p>
                    </div>
                  </div>

                  {evt.lieu && (
                    <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{evt.lieu}</p>
                        {evt.adresse && <p className="text-xs text-muted-foreground">{evt.adresse}</p>}
                      </div>
                    </div>
                  )}

                  {evt.places && (
                    <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{evt.places} place{evt.places > 1 ? "s" : ""}</p>
                        <p className="text-xs text-muted-foreground">Capacité de l'événement</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {evt.description && (
                  <div className="mb-8">
                    <h2 className="font-serif text-xl text-foreground mb-3">À propos</h2>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {evt.description}
                    </div>
                  </div>
                )}

                {/* CTA */}
                {evt.lien_externe && !isPast && (
                  <a
                    href={evt.lien_externe}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground bg-primary px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-md hover:shadow-lg"
                  >
                    S'inscrire / Plus d'infos
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default EvenementDetail;
