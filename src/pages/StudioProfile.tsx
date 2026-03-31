import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MapPin, ExternalLink, ArrowLeft, Loader2, Mail, Phone, Globe,
  Building2, Mic, CheckCircle, Calendar, Users, Wrench, Camera,
  Clock, DollarSign, Handshake, Accessibility, ChevronRight, Star,
  ChevronLeft, X
} from "lucide-react";

interface StudioData {
  statut_structure?: string;
  fonction_contact?: string;
  accroche?: string;
  adresse_complete?: string;
  accessibilite?: string[];
  infos_acces?: string;
  type_lieu?: string;
  usages?: string[];
  capacite?: string;
  equipements?: string[];
  precisions_materiel?: string;
  accompagnement_technique?: string;
  services_studio?: string[];
  public_cible?: string[];
  disponibilite_lieu?: string;
  mode_reservation?: string;
  tarification?: string;
  indication_tarifaire?: string;
  accueil_petit_budget?: string;
  ouvert_a?: string[];
  recherche_actuellement?: string[];
  liens_complementaires?: { type: string; url: string }[];
  galerie_urls?: string[];
  visibility?: {
    show_email?: boolean;
    show_phone?: boolean;
    show_full_address?: boolean;
    show_city_only?: boolean;
    show_tarifs?: boolean;
    show_reservation_link?: boolean;
  };
}

interface StudioProfileData {
  id: string;
  slug: string | null;
  nom_podcast: string;
  structure: string | null;
  description: string;
  bio_750: string | null;
  vignette_url: string | null;
  lien_principal: string | null;
  lien_ecoute: string;
  lien_linkedin: string | null;
  email: string;
  telephone: string | null;
  prenom: string | null;
  nom: string | null;
  metier_principal: string | null;
  city_name: string | null;
  department_label: string | null;
  consent_contact: boolean;
  consent_mise_en_relation: boolean;
  services_3: string[] | null;
  disponibilite: string | null;
  studio_data: StudioData | null;
}

const StudioProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<StudioProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!slug) return;
      let query = supabase.from("podcasts").select("*").eq("valide", true).eq("type_profil", "studio");
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUuid) query = query.eq("id", slug);
      else query = query.eq("slug", slug);
      const { data, error } = await query.maybeSingle();
      if (!error && data) setProfile(data as unknown as StudioProfileData);
      setLoading(false);
    };
    fetchProfile();
  }, [slug]);

  const sd = profile?.studio_data || {};
  const vis = sd.visibility || {};

  const jsonLd = useMemo(() => {
    if (!profile) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: profile.nom_podcast,
      url: `https://www.les-podcasteur-euses-du-sud.fr/annuaire-podcasts/studios/${slug}`,
      ...(profile.description && { description: profile.description }),
      ...(profile.vignette_url && { image: profile.vignette_url }),
      ...(profile.city_name && {
        address: {
          "@type": "PostalAddress",
          ...(vis.show_full_address && sd.adresse_complete && { streetAddress: sd.adresse_complete }),
          addressLocality: profile.city_name.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, ""),
          addressRegion: "Provence-Alpes-Côte d'Azur",
          addressCountry: "FR",
        },
      }),
      ...(sd.type_lieu && { additionalType: sd.type_lieu }),
      memberOf: { "@type": "Organization", name: "Les Podcasteur·euses du Sud", url: "https://www.les-podcasteur-euses-du-sud.fr" },
    };
  }, [profile, slug, sd, vis]);

  const seoTitle = profile
    ? `${profile.nom_podcast} | ${sd.type_lieu || "Studio podcast"} à ${profile.city_name?.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "") || "Région Sud"} | Les Podcasteur·euses du Sud`
    : "Studio — Les Podcasteur·euses du Sud";

  const seoDesc = profile
    ? `${profile.nom_podcast}, ${sd.type_lieu?.toLowerCase() || "studio podcast"} à ${profile.city_name?.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "") || "Région Sud"}. ${sd.services_studio?.slice(0, 3).join(", ") || ""} — Annuaire des Podcasteur·euses du Sud.`.slice(0, 160)
    : "Studio podcast référencé dans l'annuaire de l'écosystème podcast en Région Sud.";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20 text-center">
          <h1 className="font-display font-bold text-2xl text-foreground mb-4">Studio introuvable</h1>
          <Link to="/annuaire-podcasts"><Button variant="outline">Retour à l'annuaire</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const cityClean = profile.city_name?.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "") || "";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        path={`/annuaire-podcasts/studios/${slug}`}
        image={profile.vignette_url || undefined}
        type="place"
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="pt-16 pb-20">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10 border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%)]" />
          <div className="container mx-auto px-6 max-w-5xl relative">
            <Link to="/annuaire-podcasts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-6">
              <ArrowLeft className="w-4 h-4" /> Retour à l'annuaire
            </Link>

            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 pt-6 pb-10">
              {/* Photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-40 h-28 md:w-52 md:h-36 rounded-2xl overflow-hidden bg-card border-2 border-background shadow-lg flex-shrink-0 ring-4 ring-background"
              >
                {profile.vignette_url ? (
                  <img src={profile.vignette_url} alt={profile.nom_podcast} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <Building2 className="w-16 h-16 text-primary/20" />
                  </div>
                )}
              </motion.div>

              {/* Identity */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1 min-w-0"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-card/80 text-primary border border-primary/15 backdrop-blur-sm">
                    <Building2 className="w-3.5 h-3.5" />
                    Studio / Lieu
                  </span>
                  {sd.type_lieu && (
                    <Badge variant="secondary">{sd.type_lieu}</Badge>
                  )}
                  {sd.statut_structure && (
                    <Badge variant="outline">{sd.statut_structure}</Badge>
                  )}
                </div>

                <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground leading-tight mb-1">
                  {profile.nom_podcast}
                </h1>

                {sd.accroche && (
                  <p className="text-base text-foreground/70 mb-1 italic">{sd.accroche}</p>
                )}

                {cityClean && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {cityClean}{profile.department_label ? ` · ${profile.department_label}` : ""}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.lien_principal && (vis.show_reservation_link !== false) && (
                    <a href={profile.lien_principal} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-2 rounded-full">
                        <ExternalLink className="w-4 h-4" /> Voir le site / Réserver
                      </Button>
                    </a>
                  )}
                  {vis.show_email && profile.consent_contact && (
                    <a href={`mailto:${profile.email}`}>
                      <Button variant="outline" size="sm" className="gap-2 rounded-full">
                        <Mail className="w-4 h-4" /> Contacter
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 max-w-5xl -mt-1">
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            {/* Main column */}
            <div className="md:col-span-2 space-y-6">
              {/* Presentation */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6 md:p-8">
                <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Présentation
                </h2>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-[15px]">
                  {profile.description}
                </p>
              </motion.div>

              {/* Gallery — right after Présentation */}
              {sd.galerie_urls && sd.galerie_urls.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" /> Galerie
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sd.galerie_urls.map((url, i) => (
                      <button key={i} onClick={() => setSelectedPhoto(url)} className="rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow">
                        <img src={url} alt={`${profile.nom_podcast} - photo ${i + 1}`} className="w-full h-32 object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Services */}
              {sd.services_studio && sd.services_studio.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" /> Services proposés
                  </h2>
                  <div className="grid gap-2">
                    {sd.services_studio.map((s, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80 bg-muted/50 rounded-lg px-4 py-2.5">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> {s}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Usages */}
              {sd.usages && sd.usages.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" /> Formats & usages possibles
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {sd.usages.map((u) => (
                      <Badge key={u} variant="secondary" className="text-sm py-1.5 px-3">{u}</Badge>
                    ))}
                  </div>
                  {sd.capacite && (
                    <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Capacité : {sd.capacite}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Equipments */}
              {sd.equipements && sd.equipements.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" /> Équipements
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sd.equipements.map((eq) => (
                      <Badge key={eq} variant="outline" className="text-sm py-1.5 px-3">{eq}</Badge>
                    ))}
                  </div>
                  {sd.precisions_materiel && (
                    <p className="text-sm text-foreground/70 border-t border-border pt-4">{sd.precisions_materiel}</p>
                  )}
                  {sd.accompagnement_technique && (
                    <p className="text-sm text-foreground/70 mt-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" /> Accompagnement technique : {sd.accompagnement_technique}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Reservation */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-card border border-border rounded-2xl p-6 md:p-8">
                <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Réservation & disponibilité
                </h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {sd.disponibilite_lieu && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Disponibilité</p>
                      <p className="text-foreground/80">{sd.disponibilite_lieu}</p>
                    </div>
                  )}
                  {sd.mode_reservation && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Réservation</p>
                      <p className="text-foreground/80">{sd.mode_reservation}</p>
                    </div>
                  )}
                  {vis.show_tarifs && sd.tarification && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tarification</p>
                      <p className="text-foreground/80">{sd.tarification}</p>
                    </div>
                  )}
                  {vis.show_tarifs && sd.indication_tarifaire && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Indication tarifaire</p>
                      <p className="text-foreground/80">{sd.indication_tarifaire}</p>
                    </div>
                  )}
                </div>
                {sd.accueil_petit_budget && (
                  <p className="text-sm text-foreground/70 mt-4 pt-4 border-t border-border">
                    Accueil projets associatifs / petit budget : <span className="font-medium">{sd.accueil_petit_budget}</span>
                  </p>
                )}
              </motion.div>

              {/* Accessibility */}
              {(sd.accessibilite?.length || sd.infos_acces) && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                    <Accessibility className="w-4 h-4 text-primary" /> Accessibilité & infos pratiques
                  </h2>
                  {sd.accessibilite && sd.accessibilite.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {sd.accessibilite.map((a) => (
                        <Badge key={a} variant="secondary">{a}</Badge>
                      ))}
                    </div>
                  )}
                  {sd.infos_acces && (
                    <p className="text-sm text-foreground/70">{sd.infos_acces}</p>
                  )}
                </motion.div>
              )}

              {/* Gallery removed — now after Présentation */}

              {/* Collaborations */}
              {(sd.ouvert_a?.length || sd.recherche_actuellement?.length) && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.55 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-primary" /> Collaborations
                  </h2>
                  {sd.ouvert_a && sd.ouvert_a.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Le lieu est ouvert à</p>
                      <div className="flex flex-wrap gap-2">
                        {sd.ouvert_a.map((o) => <Badge key={o} variant="secondary" className="bg-secondary/15">{o}</Badge>)}
                      </div>
                    </div>
                  )}
                  {sd.recherche_actuellement && sd.recherche_actuellement.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recherche actuellement</p>
                      <div className="flex flex-wrap gap-2">
                        {sd.recherche_actuellement.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Contact card */}
              {profile.consent_contact && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Contact</p>
                  <div className="space-y-3">
                    {vis.show_email && (
                      <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <span className="truncate">{profile.email}</span>
                      </a>
                    )}
                    {vis.show_phone && profile.telephone && (
                      <>
                        {!phoneRevealed ? (
                          <Button onClick={() => setPhoneRevealed(true)} variant="outline" className="w-full gap-2 justify-start">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-left text-sm">Afficher le numéro</span>
                          </Button>
                        ) : (
                          <a href={`tel:${profile.telephone}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <span>{profile.telephone}</span>
                          </a>
                        )}
                      </>
                    )}
                    {profile.lien_principal && (
                      <a href={profile.lien_principal} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Globe className="w-4 h-4 text-primary" />
                        </div>
                        <span className="truncate">Site web</span>
                      </a>
                    )}
                    {sd.liens_complementaires?.map((l, i) => (
                      l.url && (
                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Globe className="w-4 h-4 text-primary" />
                          </div>
                          <span className="truncate">{l.type}</span>
                        </a>
                      )
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Location card */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}
                className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Localisation</p>
                <div className="space-y-3 text-sm">
                  {vis.show_full_address && sd.adresse_complete && (
                    <div className="flex items-start gap-3 text-foreground/70">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      <span>{sd.adresse_complete}</span>
                    </div>
                  )}
                  {(!vis.show_full_address || !sd.adresse_complete) && cityClean && (
                    <div className="flex items-center gap-3 text-foreground/70">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{cityClean}{profile.department_label ? `, ${profile.department_label}` : ""}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Info card */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">En bref</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-foreground/70">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>Studio / Lieu d'enregistrement</span>
                  </div>
                  {profile.structure && (
                    <div className="flex items-center gap-3 text-foreground/70">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span>{profile.structure}</span>
                    </div>
                  )}
                  {sd.statut_structure && (
                    <div className="flex items-center gap-3 text-foreground/70">
                      <ChevronRight className="w-4 h-4 text-primary" />
                      <span>{sd.statut_structure}</span>
                    </div>
                  )}
                  {sd.type_lieu && (
                    <div className="flex items-center gap-3 text-foreground/70">
                      <Mic className="w-4 h-4 text-primary" />
                      <span>{sd.type_lieu}</span>
                    </div>
                  )}
                  {sd.disponibilite_lieu && (
                    <div className="flex items-center gap-3 text-foreground/70">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{sd.disponibilite_lieu}</span>
                    </div>
                  )}
                  {sd.public_cible && sd.public_cible.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Public ciblé</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sd.public_cible.map((p) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}
                className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/15 rounded-2xl p-5 text-center">
                <p className="text-sm font-medium text-foreground mb-3">Vous aussi, référencez votre lieu !</p>
                <Link to="/formulaire?type=studio">
                  <Button size="sm" className="rounded-full w-full">Référencer un studio</Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Photo lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <img src={selectedPhoto} alt="Photo agrandie" className="max-w-full max-h-[90vh] rounded-2xl" />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StudioProfile;
