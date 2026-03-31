import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { withUtm } from "@/lib/utm";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MapPin, ArrowLeft, Building2, Globe, ExternalLink, CheckCircle,
  Loader2, Mail, Phone, Sparkles, Handshake, Users, ImageIcon,
  ChevronLeft, ChevronRight, X
} from "lucide-react";

interface ProfileData {
  id: string;
  nom_podcast: string;
  structure: string | null;
  type_profil: string;
  city_name: string | null;
  department_label: string | null;
  bio_750: string | null;
  lien_principal: string | null;
  lien_linkedin: string | null;
  vignette_url: string | null;
  metier_principal: string | null;
  services_3: string[] | null;
  consent_contact: boolean;
  consent_mise_en_relation: boolean;
  email: string;
  telephone: string | null;
  cherche_collaboration: string[] | null;
  peut_apporter: string[] | null;
  studio_data: any;
}

const StructureEcoProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!slug) return;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      let query = supabase.from("podcasts").select("*").eq("valide", true).eq("type_profil", "structure_eco");
      query = isUuid ? query.eq("id", slug) : query.eq("slug", slug);
      const { data, error } = await query.maybeSingle();
      if (!error && data) setProfile(data as unknown as ProfileData);
      setLoading(false);
    };
    fetch();
  }, [slug]);

  const sd = profile?.studio_data ? (typeof profile.studio_data === "string" ? JSON.parse(profile.studio_data) : profile.studio_data) : {};
  const structureName = profile?.nom_podcast || "";
  const typeStructure = profile?.metier_principal || sd?.type_structure || "";
  const cityClean = profile?.city_name?.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "") || "";

  const seoTitle = profile
    ? `${structureName} | ${typeStructure} à ${cityClean} | Les Podcasteur·euses du Sud`
    : "Structure — Les Podcasteur·euses du Sud";
  const seoDesc = profile?.bio_750
    ? `${structureName}, ${typeStructure.toLowerCase()} à ${cityClean}. ${profile.bio_750.slice(0, 120)}…`
    : `Structure de l'écosystème podcast en Région Sud.`;

  const jsonLd = useMemo(() => {
    if (!profile) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: structureName,
      url: profile.lien_principal || `https://www.les-podcasteur-euses-du-sud.fr/annuaire-podcasts/structures/${slug}`,
      description: profile.bio_750 || undefined,
      image: profile.vignette_url || undefined,
      address: cityClean ? { "@type": "PostalAddress", addressLocality: cityClean, addressRegion: "Provence-Alpes-Côte d'Azur", addressCountry: "FR" } : undefined,
      memberOf: { "@type": "Organization", name: "Les Podcasteur·euses du Sud", url: "https://www.les-podcasteur-euses-du-sud.fr" },
    };
  }, [profile, structureName, cityClean, slug]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!profile) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20 text-center">
        <h1 className="font-display font-bold text-2xl text-foreground mb-4">Structure introuvable</h1>
        <Link to="/annuaire-podcasts"><Button variant="outline">Retour à l'annuaire</Button></Link>
      </main>
      <Footer />
    </div>
  );

  const domainesAction = sd?.domaines_action || profile.services_3 || [];
  const publicCible = sd?.public_cible || profile.peut_apporter || [];
  const collaborations = sd?.collaborations || profile.cherche_collaboration || [];
  const galerieUrls: string[] = sd?.galerie_urls || [];
  const showContact = profile.consent_contact && profile.consent_mise_en_relation;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seoTitle} description={seoDesc} path={`/annuaire-podcasts/structures/${slug}`} image={profile.vignette_url || undefined} type="profile" jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-16 pb-20">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-secondary/15 via-primary/10 to-accent/10 border-b border-border">
          <div className="container mx-auto px-6 max-w-5xl relative">
            <Link to="/annuaire-podcasts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors pt-6">
              <ArrowLeft className="w-4 h-4" /> Retour à l'annuaire
            </Link>
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 pt-6 pb-10">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-card border-2 border-background shadow-lg flex-shrink-0 ring-4 ring-background">
                {profile.vignette_url ? (
                  <img src={profile.vignette_url} alt={structureName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/5"><Building2 className="w-16 h-16 text-secondary/20" /></div>
                )}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-card/80 text-secondary border border-secondary/15 backdrop-blur-sm">
                    <Building2 className="w-3.5 h-3.5" /> Structure écosystème
                  </span>
                  {typeStructure && <Badge variant="secondary">{typeStructure}</Badge>}
                </div>
                <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground leading-tight mb-1">{structureName}</h1>
                {sd?.phrase_accroche && <p className="text-base text-foreground/70 italic mb-2">{sd.phrase_accroche}</p>}
                {cityClean && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {cityClean}{profile.department_label ? ` · ${profile.department_label}` : ""}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.lien_principal && (
                    <a href={profile.lien_principal} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-2 rounded-full"><Globe className="w-4 h-4" /> Site web</Button>
                    </a>
                  )}
                  {profile.lien_linkedin && (
                    <a href={profile.lien_linkedin} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2 rounded-full"><Globe className="w-4 h-4" /> LinkedIn</Button>
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="md:col-span-2 space-y-6">
              {profile.bio_750 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Présentation</h2>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-line text-[15px]">{profile.bio_750}</p>
                </motion.div>
              )}

              {/* Gallery — right after Présentation */}
              {galerieUrls.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Photos</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galerieUrls.map((url: string, i: number) => (
                      <button key={i} onClick={() => setSelectedPhoto(url)} className="aspect-[4/3] rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow">
                        <img src={url} alt={`${structureName} - Photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {domainesAction.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Domaines d'action</h2>
                  <div className="grid gap-2">
                    {domainesAction.map((d: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80 bg-muted/50 rounded-lg px-4 py-2.5">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> {d}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {collaborations.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Handshake className="w-4 h-4 text-primary" /> Ouvert·e à</h2>
                  <div className="flex flex-wrap gap-2">
                    {collaborations.map((c: string, i: number) => <Badge key={i} variant="outline">{c}</Badge>)}
                  </div>
                </motion.div>
              )}

              {/* Gallery removed — now after Présentation */}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-display font-bold text-base text-foreground">Informations</h3>
                {typeStructure && (
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Type</p><p className="text-sm text-foreground">{typeStructure}</p></div>
                )}
                {cityClean && (
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Localisation</p><p className="text-sm text-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {cityClean}</p></div>
                )}
                {publicCible.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Public cible</p>
                    <div className="flex flex-wrap gap-1.5">{publicCible.map((p: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>)}</div>
                  </div>
                )}
              </div>

              {showContact && (
                <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="font-display font-bold text-base text-foreground">Contact</h3>
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline"><Mail className="w-4 h-4" /> {profile.email}</a>
                  {profile.telephone && <p className="flex items-center gap-2 text-sm text-foreground"><Phone className="w-4 h-4 text-muted-foreground" /> {profile.telephone}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Photo lightbox with navigation */}
        {selectedPhoto && galerieUrls.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <button onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            {galerieUrls.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); const idx = galerieUrls.indexOf(selectedPhoto!); setSelectedPhoto(galerieUrls[(idx - 1 + galerieUrls.length) % galerieUrls.length]); }} className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); const idx = galerieUrls.indexOf(selectedPhoto!); setSelectedPhoto(galerieUrls[(idx + 1) % galerieUrls.length]); }} className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <img src={selectedPhoto} alt="Photo agrandie" className="max-w-full max-h-[85vh] rounded-2xl" onClick={(e) => e.stopPropagation()} />
            {galerieUrls.length > 1 && (
              <p className="absolute bottom-6 text-white/60 text-sm">{galerieUrls.indexOf(selectedPhoto!) + 1} / {galerieUrls.length}</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StructureEcoProfile;
