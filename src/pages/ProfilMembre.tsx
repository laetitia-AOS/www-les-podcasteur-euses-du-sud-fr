import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MapPin, Headphones, ExternalLink, ArrowLeft, Briefcase, Heart,
  CheckCircle, Music, Tag, BarChart3, Clock, Coins, Loader2
} from "lucide-react";

interface ProfileData {
  id: string;
  prenom: string | null;
  nom: string | null;
  type_profil: string;
  city_name: string | null;
  department_label: string | null;
  bio_750: string | null;
  lien_principal: string | null;
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
}

const profilLabel: Record<string, { label: string; icon: typeof Headphones }> = {
  podcasteur: { label: "Podcasteur·euse", icon: Headphones },
  pro_podcast: { label: "Pro du podcast", icon: Briefcase },
  soutien: { label: "Soutien / Curieux", icon: Heart },
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
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", id)
        .eq("valide", true)
        .maybeSingle();
      if (!error && data) {
        setProfile(data as unknown as ProfileData);
        document.title = `${data.prenom || ""} ${data.nom || ""} — Les Podcasteur·euses du Sud`;
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

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

  const profil = profilLabel[profile.type_profil] || profilLabel.podcasteur;
  const ProfilIcon = profil.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Back */}
          <Link to="/annuaire" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Retour à l'annuaire
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-serif text-3xl text-foreground">
                    {profile.prenom} {profile.nom}
                  </h1>
                  {profile.city_name && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                      <MapPin className="w-4 h-4" />
                      {profile.city_name}{profile.department_label ? `, ${profile.department_label}` : ""}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <ProfilIcon className="w-4 h-4" />
                  {profil.label}
                </span>
              </div>

              {/* Bio */}
              {profile.bio_750 && (
                <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{profile.bio_750}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-6">
                {profile.consent_contact && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <CheckCircle className="w-3 h-3" /> Ok pour être contacté(e)
                  </span>
                )}
                {profile.consent_mise_en_relation && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-secondary/10 text-secondary-foreground border border-secondary/20">
                    <CheckCircle className="w-3 h-3" /> Ok pour mise en relation
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-3 mt-6">
                {profile.lien_principal && (
                  <a href={profile.lien_principal} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" /> Site / Portfolio
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Podcasteur section */}
            {profile.type_profil === "podcasteur" && profile.nom_podcast && (
              <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <h2 className="font-serif text-xl text-foreground flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" /> Podcast
                </h2>
                <div className="flex items-start gap-4">
                  {profile.vignette_url && (
                    <img src={profile.vignette_url} alt={profile.nom_podcast} className="w-20 h-20 rounded-xl object-cover border border-border" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-serif text-lg text-foreground">{profile.nom_podcast}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
                    {profile.lien_ecoute && (
                      <a href={profile.lien_ecoute} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mt-3 hover:underline">
                        <Headphones className="w-4 h-4" /> Écouter
                      </a>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {profile.thematique && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      <Tag className="w-3 h-3" /> {profile.thematique}
                    </span>
                  )}
                  {profile.type_podcast && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{profile.type_podcast}</span>
                  )}
                  {profile.niveau_avancement && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      <BarChart3 className="w-3 h-3" /> {niveauLabels[profile.niveau_avancement] || profile.niveau_avancement}
                    </span>
                  )}
                  {profile.frequence_publication && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      <Clock className="w-3 h-3" /> {profile.frequence_publication}
                    </span>
                  )}
                  {profile.monetise && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      <Coins className="w-3 h-3" /> Monétisé : {profile.monetise}
                    </span>
                  )}
                </div>

                {/* Besoins */}
                {profile.besoins_podcast && profile.besoins_podcast.length > 0 && profile.besoins_podcast[0] !== "non_specifie" && (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-foreground mb-2">Besoins</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.besoins_podcast.map((b) => (
                        <Badge key={b} variant="outline" className="text-xs">{besoinsLabels[b] || b}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {profile.priorite_actuelle && (
                  <div className="pt-1">
                    <p className="text-sm font-medium text-foreground mb-1">Priorité actuelle</p>
                    <p className="text-sm text-muted-foreground">{profile.priorite_actuelle}</p>
                  </div>
                )}
              </div>
            )}

            {/* Pro section */}
            {profile.type_profil === "pro_podcast" && (
              <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <h2 className="font-serif text-xl text-foreground flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" /> Métier & Services
                </h2>
                {profile.metier_principal && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Métier principal</p>
                    <p className="text-foreground/80">{profile.metier_principal}</p>
                  </div>
                )}
                {profile.services_3 && profile.services_3.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Services proposés</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.services_3.map((s, i) => (
                        <Badge key={i} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {profile.disponibilite && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Disponibilité</p>
                    <p className="text-foreground/80">{profile.disponibilite}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilMembre;
