import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, Headphones, ArrowRight, Search, Users, Briefcase, Heart, Handshake, BarChart3, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const departements = [
  { code: "04", label: "Alpes-de-Haute-Provence" },
  { code: "05", label: "Hautes-Alpes" },
  { code: "06", label: "Alpes-Maritimes" },
  { code: "13", label: "Bouches-du-Rhône" },
  { code: "83", label: "Var" },
  { code: "84", label: "Vaucluse" },
];

const metiers = [
  "Studio / enregistrement",
  "Montage / mixage",
  "Réalisation / production",
  "Sound design / composition",
  "Voix off",
  "Vidéo / teasers / motion",
  "Identité sonore / branding",
  "Copywriting / éditorial",
  "Diffusion / marketing / RP",
  "Stratégie / monétisation",
  "Formation / coaching",
  "Régie pub / partenariats",
  "Autre",
];

const thematiques = [
  "Conversations & société",
  "Business & parcours de vie",
  "Culture, création & récits",
  "Sport & dépassement",
  "Santé, mental & équilibre",
  "Transmission & éducation",
  "Tech, médias & nouveaux usages",
  "Territoires, initiatives & regards",
  "Autre",
];

const chercheCollaborationOptions = [
  "Un·e podcasteur·euse pour co-production",
  "Un·e monteur·euse / ingénieur son",
  "Un·e studio d'enregistrement",
  "Un·e voix off",
  "Un·e expert·e en stratégie podcast",
  "Un·e graphiste / motion designer",
  "Des invité·es pour mon podcast",
  "Un·e partenaire pour un événement",
  "Des sponsors / partenaires commerciaux",
  "Un·e coach ou mentor·e",
];

const niveauLabels: Record<string, string> = {
  lancement: "Lancement",
  croissance: "Croissance",
  installe: "Installé",
};

const normalize = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const fuzzyMatch = (haystack: string, needle: string) => {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (h.includes(n)) return true;
  if (n.length >= 4) {
    for (let i = 0; i < n.length; i++) {
      const partial = n.slice(0, i) + n.slice(i + 1);
      if (h.includes(partial)) return true;
    }
  }
  return false;
};

const profilBadge = (type: string) => {
  switch (type) {
    case "pro_podcast":
      return { label: "Acteur·ice de l'écosystème", icon: Briefcase, className: "bg-secondary/15 text-secondary border-secondary/30" };
    case "soutien":
      return { label: "Soutien", icon: Heart, className: "bg-primary/10 text-primary border-primary/30" };
    case "studio":
      return { label: "Studio / Lieu", icon: Building2, className: "bg-accent/15 text-accent-foreground border-accent/30" };
    default:
      return { label: "Podcasteur·euse", icon: Headphones, className: "bg-accent/15 text-accent-foreground border-accent/30" };
  }
};

interface Profile {
  id: string;
  slug: string | null;
  prenom: string | null;
  nom: string | null;
  type_profil: string;
  city_name: string | null;
  department_label: string | null;
  department_code: string | null;
  bio_750: string | null;
  nom_podcast: string | null;
  lien_ecoute: string;
  metier_principal: string | null;
  services_3: string[] | null;
  thematique: string | null;
  vignette_url: string | null;
  consent_mise_en_relation: boolean;
  niveau_avancement: string | null;
  disponibilite: string | null;
  cherche_collaboration: string[] | null;
  peut_apporter: string[] | null;
  format_collaboration: string | null;
}

const Annuaire = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMetier, setFilterMetier] = useState("");
  const [filterThematique, setFilterThematique] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCollab, setFilterCollab] = useState(false);
  const [filterChercheCollab, setFilterChercheCollab] = useState("");
  const [filterFormat, setFilterFormat] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, prenom, nom, type_profil, city_name, department_label, department_code, bio_750, nom_podcast, lien_ecoute, metier_principal, services_3, thematique, vignette_url, consent_mise_en_relation, niveau_avancement, disponibilite, cherche_collaboration, peut_apporter, format_collaboration")
        .eq("valide", true)
        .order("created_at", { ascending: false });
      if (!error && data) setProfiles(data as unknown as Profile[]);
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (filterDept && p.department_code !== filterDept) return false;
      if (filterType && p.type_profil !== filterType) return false;
      if (filterMetier && p.metier_principal !== filterMetier) return false;
      if (filterThematique && p.thematique !== filterThematique) return false;
      if (filterCollab && !p.consent_mise_en_relation) return false;
      if (filterChercheCollab && (!p.cherche_collaboration || !p.cherche_collaboration.includes(filterChercheCollab))) return false;
      if (filterFormat && p.format_collaboration !== filterFormat) return false;
      if (searchQuery) {
        const q = searchQuery.trim();
        const searchable = [
          p.prenom, p.nom, p.nom_podcast, p.bio_750, p.metier_principal,
          p.city_name, p.department_label, p.department_code,
          p.thematique, ...(p.services_3 || [])
        ].filter(Boolean).join(" ");
        if (!fuzzyMatch(searchable, q)) return false;
      }
      return true;
    });
  }, [profiles, filterDept, filterType, filterMetier, filterThematique, searchQuery, filterCollab, filterChercheCollab, filterFormat]);

  const selectClass = "rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Annuaire — Écosystème Podcast Région Sud"
        description="Podcasteurs, studios, monteurs, voix off, consultants : trouvez tous les acteurs de l'écosystème podcast en Provence-Alpes-Côte d'Azur."
        path="/annuaire"
      />
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4">
              Annuaire — Écosystème Podcast
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
              Podcasteurs, monteurs, studios, voix off, sound designers, consultants…
              L'écosystème podcast en région Sud, au même endroit.
            </p>
            <a href="/adhesion">
              <Button className="gap-2">
                <Users className="w-4 h-4" />
                Rejoindre le collectif
              </Button>
            </a>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5 mb-8 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un nom, podcast, métier, ville…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterMetier(""); setFilterThematique(""); }} className={selectClass}>
                <option value="">Tous les profils</option>
                <option value="podcasteur">Podcasteurs</option>
                <option value="pro_podcast">Acteurs de l'écosystème</option>
                <option value="studio">Studios / Lieux</option>
                <option value="soutien">Soutiens</option>
              </select>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={selectClass}>
                <option value="">Tous les départements</option>
                {departements.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
              {filterType === "pro_podcast" && (
                <select value={filterMetier} onChange={(e) => setFilterMetier(e.target.value)} className={selectClass}>
                  <option value="">Tous les métiers</option>
                  {metiers.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              {filterType === "podcasteur" && (
                <select value={filterThematique} onChange={(e) => setFilterThematique(e.target.value)} className={selectClass}>
                  <option value="">Toutes les thématiques</option>
                  {thematiques.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>

            {/* Matching filters */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Matching</p>
              <div className="flex flex-wrap gap-3 items-center">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={filterCollab}
                    onChange={(e) => setFilterCollab(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                  />
                  Ouvert·e aux collaborations
                </label>
                <select value={filterChercheCollab} onChange={(e) => setFilterChercheCollab(e.target.value)} className={selectClass}>
                  <option value="">Cherche à collaborer avec…</option>
                  {chercheCollaborationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className={selectClass}>
                  <option value="">Format</option>
                  <option value="En présentiel (Marseille / région)">En présentiel</option>
                  <option value="À distance">À distance</option>
                  <option value="Présentiel et à distance">Présentiel et à distance</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} profil{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse h-56" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>Aucun profil ne correspond à vos critères.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((profile, i) => {
                const badge = profilBadge(profile.type_profil);
                const BadgeIcon = badge.icon;
                return (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.03 }}
                  >
                    <Link
                      to={profile.type_profil === "studio" ? `/annuaire/studios/${profile.slug || profile.id}` : `/profil/${profile.slug || profile.id}`}
                      className="block bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full relative"
                    >
                      {/* Collab badge */}
                      {profile.consent_mise_en_relation && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                          <Handshake className="w-3 h-3" /> Ouvert·e aux collabs
                        </span>
                      )}

                      <div className="flex items-start gap-4 mb-3">
                        {/* Photo */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          {profile.vignette_url ? (
                            <img
                              src={profile.vignette_url}
                              alt={`${profile.prenom ?? ""} ${profile.nom ?? ""}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              <BadgeIcon className="w-6 h-6 text-primary/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif text-lg text-foreground truncate">
                              {profile.type_profil === "studio" ? profile.nom_podcast : `${profile.prenom} ${profile.nom}`}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border mt-1 ${badge.className}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          {profile.city_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {profile.city_name.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/,"")}{profile.department_label ? `, ${profile.department_label.split(" — ")[1] || profile.department_label}` : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Conditional content per type */}
                      {profile.type_profil === "podcasteur" && (
                        <div className="space-y-1.5 mb-2">
                          {profile.nom_podcast && (
                            <p className="text-sm font-medium text-foreground truncate">{profile.nom_podcast}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {profile.thematique && (
                              <Badge variant="secondary" className="text-xs">{profile.thematique}</Badge>
                            )}
                          </div>
                          {profile.cherche_collaboration && profile.cherche_collaboration.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Cherche : {profile.cherche_collaboration.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </div>
                      )}

                      {profile.type_profil === "pro_podcast" && (
                        <div className="space-y-1.5 mb-2">
                          {profile.metier_principal && (
                            <p className="text-sm font-medium text-foreground">{profile.metier_principal}</p>
                          )}
                          {profile.services_3 && profile.services_3.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              {profile.services_3.slice(0, 2).join(", ")}
                            </p>
                          )}
                          {profile.disponibilite && (
                            <p className="text-xs text-muted-foreground">{profile.disponibilite}</p>
                          )}
                          {profile.peut_apporter && profile.peut_apporter.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Peut apporter : {profile.peut_apporter.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </div>
                      )}

                      {profile.type_profil === "soutien" && (
                        <div className="space-y-1.5 mb-2">
                          {profile.bio_750 && (
                            <p className="text-sm text-muted-foreground line-clamp-3">{profile.bio_750}</p>
                          )}
                          {profile.cherche_collaboration && profile.cherche_collaboration.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Cherche : {profile.cherche_collaboration.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs font-medium text-primary flex items-center gap-1">
                          Voir la fiche <ArrowRight className="w-3 h-3" />
                        </span>
                        {profile.type_profil === "podcasteur" && profile.lien_ecoute && (
                          <a
                            href={profile.lien_ecoute}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto text-xs font-medium text-secondary flex items-center gap-1 hover:underline"
                          >
                            <Headphones className="w-3 h-3" /> Écouter
                          </a>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Annuaire;
