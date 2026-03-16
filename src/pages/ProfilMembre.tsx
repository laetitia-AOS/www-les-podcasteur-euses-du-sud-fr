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
  MapPin, Headphones, ExternalLink, ArrowLeft, Briefcase, Heart,
  CheckCircle, Music, Tag, BarChart3, Clock, Coins, Loader2, Mail, Phone,
  Globe, Mic, Sparkles, Wifi, Handshake
} from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  id: string;
  prenom: string | null;
  nom: string | null;
  type_profil: string;
  city_name: string | null;
  department_label: string | null;
  bio_750: string | null;
  lien_principal: string | null;
  lien_linkedin: string | null;
  nom_podcast: string | null;
  lien_ecoute: string;
  description: string;
  vignette_url: string | null;
  thematique: string | null;
  type_podcast: string | null;
  niveau_avancement: string | null;
  frequence_publication: string | null;
  monetise: string | null;
  besoins_podcast: string[] | null;
  priorite_actuelle: string | null;
  metier_principal: string | null;
  services_3: string[] | null;
  disponibilite: string | null;
  consent_contact: boolean;
  consent_mise_en_relation: boolean;
  email: string;
  telephone: string | null;
  structure: string | null;
  cherche_collaboration: string[] | null;
  peut_apporter: string[] | null;
  format_collaboration: string | null;
}

const profilConfig: Record<string, { label: string; icon: typeof Headphones; gradient: string; accent: string }> = {
  podcasteur: { label: "Podcasteur·euse", icon: Headphones, gradient: "from-primary/20 via-secondary/10 to-accent/10", accent: "primary" },
  pro_podcast: { label: "Acteur·ice de l'écosystème", icon: Briefcase, gradient: "from-secondary/20 via-primary/10 to-accent/10", accent: "secondary" },
  soutien: { label: "Soutien / Curieux·se", icon: Heart, gradient: "from-accent/15 via-primary/10 to-secondary/10", accent: "primary" },
  structure_eco: { label: "Structure écosystème", icon: Briefcase, gradient: "from-secondary/15 via-accent/10 to-primary/10", accent: "secondary" },
};

const besoinsLabels: Record<string, string> = {
  audience_visibilite: "Audience & Visibilité",
  reseau_collaborations: "Réseau & Collaborations",
  monetisation: "Monétisation",
  contenu_editorial: "Contenu & Éditorial",
  technique_voix: "Technique & Voix",
  strategie: "Stratégie",
  legitimite_posture: "Légitimité & Posture",
};

const niveauLabels: Record<string, string> = {
  lancement: "Lancement (0–10 épisodes)",
  croissance: "En croissance (10–50)",
  installe: "Installé (50+)",
};

const ProfilMembre = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!slug) return;
      let query = supabase.from("podcasts").select("*").eq("valide", true);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUuid) {
        query = query.eq("id", slug);
      } else {
        query = query.eq("slug", slug);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        setProfile(data as unknown as ProfileData);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [slug]);

  const config = profile ? (profilConfig[profile.type_profil] || profilConfig.podcasteur) : profilConfig.podcasteur;
  const ProfilIcon = config.icon;
  const fullName = profile ? `${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() : "";
  const showContact = profile ? profile.consent_contact && profile.consent_mise_en_relation : false;

  const jsonLd = useMemo(() => {
    if (!profile) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: fullName,
      url: `https://www.les-podcasteur-euses-du-sud.fr/profil/${slug}`,
      ...(profile.bio_750 && { description: profile.bio_750 }),
      ...(profile.vignette_url && { image: profile.vignette_url }),
      ...(profile.city_name && {
        address: {
          "@type": "PostalAddress",
          addressLocality: profile.city_name.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, ""),
          addressRegion: "Provence-Alpes-Côte d'Azur",
          addressCountry: "FR",
        },
      }),
      ...(profile.metier_principal && { jobTitle: profile.metier_principal }),
      ...(profile.structure && { worksFor: { "@type": "Organization", name: profile.structure } }),
      memberOf: { "@type": "Organization", name: "Les Podcasteur·euses du Sud", url: "https://www.les-podcasteur-euses-du-sud.fr" },
    };
  }, [profile, fullName, slug]);

  const seoTitle = profile
    ? (profile.type_profil === "podcasteur" && profile.nom_podcast
      ? `${profile.nom_podcast} par ${fullName} — Les Podcasteur·euses du Sud`
      : `${fullName} — Les Podcasteur·euses du Sud`)
    : "Profil — Les Podcasteur·euses du Sud";
  const seoDesc = profile
    ? (profile.bio_750 ? profile.bio_750.slice(0, 155) + "…" : `${fullName}, ${config.label} référencé·e dans l'écosystème podcast de la Région Sud.`)
    : "Profil membre de l'écosystème podcast de la Région Sud.";

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
          <h1 className="font-serif text-2xl text-foreground mb-4">Profil introuvable</h1>
          <Link to="/annuaire"><Button variant="outline">Retour à l'annuaire</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        path={`/profil/${slug}`}
        image={profile.vignette_url || undefined}
        type="profile"
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="pt-16 pb-20">
        {/* Hero banner */}
        <div className={`relative bg-gradient-to-br ${config.gradient} border-b border-border`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%)]" />
          <div className="container mx-auto px-6 max-w-5xl relative">
            <Link to="/annuaire" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-6">
              <ArrowLeft className="w-4 h-4" /> Retour à l'annuaire
            </Link>

            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 pt-6 pb-10">
              {/* Avatar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-card border-2 border-background shadow-lg flex-shrink-0 ring-4 ring-background"
              >
                {profile.vignette_url ? (
                  <img src={profile.vignette_url} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <ProfilIcon className="w-16 h-16 text-primary/20" />
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
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-card/80 text-primary border border-primary/15 backdrop-blur-sm">
                    <ProfilIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                </div>
                <h1 className="font-serif text-3xl md:text-4xl text-foreground leading-tight mb-1">
                  {fullName}
                </h1>
                {profile.type_profil === "pro_podcast" && profile.metier_principal && (
                  <p className="text-base font-medium text-foreground/70 mb-1">{profile.metier_principal}</p>
                )}
                {profile.type_profil === "podcasteur" && profile.nom_podcast && (
                  <p className="text-base font-medium text-foreground/70 mb-1">🎙 {profile.nom_podcast}</p>
                )}
                {profile.structure && (
                  <p className="text-sm text-foreground/60 mb-1">{profile.structure}</p>
                )}
                {profile.city_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {profile.city_name.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/,"")}{profile.department_label ? ` · ${profile.department_label}` : ""}
                  </p>
                )}

                {/* Quick action buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.lien_ecoute && profile.type_profil === "podcasteur" && (
                    <a href={profile.lien_ecoute} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-2 rounded-full">
                        <Headphones className="w-4 h-4" /> Écouter le podcast
                      </Button>
                    </a>
                  )}
                  {profile.lien_linkedin && (
                    <a href={profile.lien_linkedin} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2 rounded-full">
                        <Globe className="w-4 h-4" /> LinkedIn
                      </Button>
                    </a>
                  )}
                  {profile.lien_principal && (
                    <a href={profile.lien_principal} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2 rounded-full">
                        <Globe className="w-4 h-4" /> Site web
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
              {/* Bio */}
              {profile.bio_750 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8"
                >
                  <h2 className="font-serif text-lg text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Présentation
                  </h2>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-[15px]">
                    {profile.bio_750}
                  </p>
                </motion.div>
              )}

              {/* Podcast section */}
              {profile.type_profil === "podcasteur" && profile.nom_podcast && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8"
                >
                  <h2 className="font-serif text-lg text-foreground mb-5 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" /> Le podcast
                  </h2>
                  <div className="flex items-start gap-5">
                    {profile.vignette_url && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-border shadow-sm flex-shrink-0">
                        <img src={profile.vignette_url} alt={profile.nom_podcast} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-xl text-foreground mb-1">{profile.nom_podcast}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{profile.description}</p>
                      {profile.lien_ecoute && (
                        <a href={profile.lien_ecoute} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mt-3 hover:underline">
                          <Headphones className="w-4 h-4" /> Écouter
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Meta tags */}
                  <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border">
                    {profile.thematique && (
                      <Badge variant="secondary" className="gap-1">
                        <Tag className="w-3 h-3" /> {profile.thematique}
                      </Badge>
                    )}
                    {profile.type_podcast && (
                      <Badge variant="secondary">{profile.type_podcast}</Badge>
                    )}
                    {profile.frequence_publication && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" /> {profile.frequence_publication}
                      </Badge>
                    )}
                    {profile.monetise && (
                      <Badge variant="secondary" className="gap-1">
                        <Coins className="w-3 h-3" /> Monétisé : {profile.monetise}
                      </Badge>
                    )}
                  </div>

                  {/* Besoins */}
                  {profile.besoins_podcast && profile.besoins_podcast.length > 0 && profile.besoins_podcast[0] !== "non_specifie" && (
                    <div className="mt-5 pt-5 border-t border-border">
                      <p className="text-sm font-semibold text-foreground mb-3">Besoins identifiés</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.besoins_podcast.map((b) => (
                          <Badge key={b} variant="outline">{besoinsLabels[b] || b}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.priorite_actuelle && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-foreground mb-1">Priorité actuelle</p>
                      <p className="text-sm text-muted-foreground">{profile.priorite_actuelle}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Pro section */}
              {profile.type_profil === "pro_podcast" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8"
                >
                  <h2 className="font-serif text-lg text-foreground mb-5 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Expertise & Services
                  </h2>
                  {profile.metier_principal && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Métier principal</p>
                      <p className="text-lg font-serif text-foreground">{profile.metier_principal}</p>
                    </div>
                  )}
                  {profile.services_3 && profile.services_3.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Services proposés</p>
                      <div className="grid gap-2">
                        {profile.services_3.map((s, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80 bg-muted/50 rounded-lg px-4 py-2.5">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.disponibilite && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Disponibilité</p>
                      <p className="text-sm text-foreground/80">{profile.disponibilite}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Collaborations block (all types) */}
              {(profile.cherche_collaboration?.length || profile.peut_apporter?.length || profile.format_collaboration) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8"
                >
                  <h2 className="font-serif text-lg text-foreground mb-5 flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-primary" /> Collaborations
                  </h2>

                  {profile.cherche_collaboration && profile.cherche_collaboration.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ce que je cherche</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.cherche_collaboration.map((item) => (
                          <Badge key={item} variant="outline">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.peut_apporter && profile.peut_apporter.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ce que je peux apporter</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.peut_apporter.map((item) => (
                          <Badge key={item} variant="secondary" className="bg-secondary/15">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.format_collaboration && (
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      {profile.format_collaboration.includes("présentiel") ? (
                        <MapPin className="w-4 h-4 text-primary" />
                      ) : profile.format_collaboration.includes("distance") ? (
                        <Wifi className="w-4 h-4 text-primary" />
                      ) : (
                        <Handshake className="w-4 h-4 text-primary" />
                      )}
                      <span>Format préféré : {profile.format_collaboration}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Contact card */}
              {showContact && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Contact</p>
                  <div className="space-y-3">
                    {profile.telephone && (
                      <>
                        {!phoneRevealed ? (
                          <Button
                            onClick={() => setPhoneRevealed(true)}
                            variant="outline"
                            className="w-full gap-2 justify-start"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-left text-sm">Afficher le numéro de téléphone</span>
                          </Button>
                        ) : (
                          <a
                            href={`tel:${profile.telephone}`}
                            className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <span>{profile.telephone}</span>
                          </a>
                        )}
                      </>
                    )}

                    {profile.lien_linkedin && (
                      <a href={profile.lien_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Globe className="w-4 h-4 text-primary" />
                        </div>
                        <span className="truncate">LinkedIn</span>
                      </a>
                    )}
                    {profile.lien_principal && (
                      <a href={profile.lien_principal} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Globe className="w-4 h-4 text-primary" />
                        </div>
                        <span className="truncate">Site web</span>
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Consent badges */}
              {!showContact && (profile.consent_contact || profile.consent_mise_en_relation) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="bg-card border border-border rounded-2xl p-5 space-y-2"
                >
                  {profile.consent_contact && (
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Ok pour être contacté(e)</span>
                    </div>
                  )}
                  {profile.consent_mise_en_relation && (
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Ok pour mise en relation</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Quick info card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">En bref</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-foreground/70">
                    <ProfilIcon className="w-4 h-4 text-primary" />
                    <span>{config.label}</span>
                  </div>
                  {profile.city_name && (
                    <div className="flex items-center gap-3 text-foreground/70">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{profile.city_name}</span>
                    </div>
                  )}

                  {/* Podcasteur-specific sidebar items */}
                  {profile.type_profil === "podcasteur" && (
                    <>
                      {profile.thematique && (
                        <div className="flex items-center gap-3 text-foreground/70">
                          <Tag className="w-4 h-4 text-primary" />
                          <span>{profile.thematique}</span>
                        </div>
                      )}
                      {profile.frequence_publication && (
                        <div className="flex items-center gap-3 text-foreground/70">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{profile.frequence_publication}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Pro-specific sidebar items */}
                  {profile.type_profil === "pro_podcast" && (
                    <>
                      {profile.metier_principal && (
                        <div className="flex items-center gap-3 text-foreground/70">
                          <Briefcase className="w-4 h-4 text-primary" />
                          <span>{profile.metier_principal}</span>
                        </div>
                      )}
                      {profile.disponibilite && (
                        <div className="flex items-center gap-3 text-foreground/70">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{profile.disponibilite}</span>
                        </div>
                      )}
                      {profile.format_collaboration && (
                        <div className="flex items-center gap-3 text-foreground/70">
                          {profile.format_collaboration.includes("présentiel") ? <MapPin className="w-4 h-4 text-primary" /> : <Wifi className="w-4 h-4 text-primary" />}
                          <span>{profile.format_collaboration}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Matching info for all types in sidebar */}
                  {profile.cherche_collaboration && profile.cherche_collaboration.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Cherche :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.cherche_collaboration.map((item) => (
                          <Badge key={item} variant="outline" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.type_profil === "pro_podcast" && profile.peut_apporter && profile.peut_apporter.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Peut apporter :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.peut_apporter.map((item) => (
                          <Badge key={item} variant="secondary" className="text-xs bg-secondary/15">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/15 rounded-2xl p-5 text-center"
              >
                <p className="text-sm font-medium text-foreground mb-3">Vous aussi, rejoignez le collectif&nbsp;!</p>
                <Link to="/adhesion">
                  <Button size="sm" className="rounded-full w-full">Rejoindre</Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

    </div>
  );
};

export default ProfilMembre;
