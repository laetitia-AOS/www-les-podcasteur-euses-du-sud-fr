import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MapPin, Headphones, ArrowRight, Search, Users, Briefcase, Heart, Handshake, Building2, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import AdhesionPromoCard from "@/components/AdhesionPromoCard";

const departements = [
  { code: "04", label: "Alpes-de-Haute-Provence" },
  { code: "05", label: "Hautes-Alpes" },
  { code: "06", label: "Alpes-Maritimes" },
  { code: "13", label: "Bouches-du-Rhône" },
  { code: "83", label: "Var" },
  { code: "84", label: "Vaucluse" },
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
      return { label: "Acteur·ice de l'écosystème", icon: Briefcase, color: "bg-lavande/10 text-lavande border-lavande/20", avatarColor: "bg-lavande/20 text-lavande" };
    case "soutien":
      return { label: "Soutien", icon: Heart, color: "bg-primary/10 text-terre border-primary/20", avatarColor: "bg-primary/20 text-primary" };
    case "studio":
      return { label: "Studio / Lieu", icon: Building2, color: "bg-turquoise/10 text-turquoise border-turquoise/20", avatarColor: "bg-turquoise/20 text-turquoise" };
    case "structure_eco":
      return { label: "Structure écosystème", icon: Building2, color: "bg-pin/10 text-pin border-pin/20", avatarColor: "bg-pin/20 text-pin" };
    default:
      return { label: "Podcasteur·euse", icon: Headphones, color: "bg-primary/10 text-terre border-primary/20", avatarColor: "bg-primary/20 text-primary" };
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
  studio_data: any;
}

const Annuaire = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCollab, setFilterCollab] = useState(false);
  const [filterChercheCollab, setFilterChercheCollab] = useState("");
  const [filterFormat, setFilterFormat] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, prenom, nom, type_profil, city_name, department_label, department_code, bio_750, nom_podcast, lien_ecoute, metier_principal, services_3, thematique, vignette_url, consent_mise_en_relation, niveau_avancement, disponibilite, cherche_collaboration, peut_apporter, format_collaboration, studio_data")
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
  }, [profiles, filterDept, filterType, searchQuery, filterCollab, filterChercheCollab, filterFormat]);

  const collabCount = useMemo(() => profiles.filter(p => p.consent_mise_en_relation).length, [profiles]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Annuaire — Écosystème Podcast Région Sud"
        description="Podcasteurs, studios, monteurs, voix off, consultants : trouvez tous les acteurs de l'écosystème podcast en Provence-Alpes-Côte d'Azur."
        path="/annuaire-podcasts"
      />
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl mb-2 text-foreground">Annuaire</h1>
              <p className="text-muted-foreground text-sm">
                Podcasteurs, monteurs, studios, voix off, sound designers, consultants — l'écosystème podcast en région Sud.
              </p>
            </div>
            <Link
              to="/espace-membre"
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/50 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-primary" />
              Déjà référencé·e ? <span className="text-primary font-semibold">Ajouter mon podcast →</span>
            </Link>
          </motion.div>

          <AdhesionPromoCard variant="compact" className="mb-8" />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:w-[260px] shrink-0"
            >
              <div className="bg-background-pure border-r border-primary/10 rounded-2xl lg:rounded-none lg:border-r lg:border-l-0 lg:border-t-0 lg:border-b-0 p-5 lg:pr-6 space-y-5 lg:sticky lg:top-20">
                {/* Search */}
                <div className="flex items-center gap-2 border-b border-primary/10 pb-4">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>

                {/* Type filter pills */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Type</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "", label: "Tous" },
                      { value: "podcasteur", label: "Podcasteur·euse" },
                      { value: "pro_podcast", label: "Pro écosystème" },
                      { value: "studio", label: "Studio" },
                      { value: "structure_eco", label: "Structure" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setFilterType(t.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterType === t.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Département */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Département</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterDept("")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!filterDept ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                    >
                      Tous
                    </button>
                    {departements.map((d) => (
                      <button
                        key={d.code}
                        onClick={() => setFilterDept(d.code === filterDept ? "" : d.code)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterDept === d.code ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      >
                        {d.code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disponibilité */}
                <div className="border-t border-primary/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Disponibilité</p>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={filterCollab}
                      onChange={(e) => setFilterCollab(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                    />
                    Ouvert·e aux collabs ({collabCount})
                  </label>
                </div>

                {/* Cherche */}
                <div className="border-t border-primary/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cherche à collaborer avec</p>
                  <select value={filterChercheCollab} onChange={(e) => setFilterChercheCollab(e.target.value)} className="w-full rounded-xl border border-primary/12 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Tous</option>
                    {chercheCollaborationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {/* Format */}
                <div className="border-t border-primary/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Format de travail</p>
                  <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)} className="w-full rounded-xl border border-primary/12 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Tous</option>
                    <option value="En présentiel (Marseille / région)">Présentiel</option>
                    <option value="À distance">À distance</option>
                    <option value="Présentiel et à distance">Présentiel et à distance</option>
                  </select>
                </div>
              </div>
            </motion.aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-5">
                {filtered.length} profil{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
              </p>

              {loading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-background-pure border border-primary/8 rounded-2xl p-6 animate-pulse h-56" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <p>Aucun profil ne correspond à vos critères.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((profile, i) => {
                    const badge = profilBadge(profile.type_profil);
                    const BadgeIcon = badge.icon;
                    const initials = `${(profile.prenom || "")[0] || ""}${(profile.nom || "")[0] || ""}`.toUpperCase();
                    const cityClean = profile.city_name?.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "") || "";

                    return (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.03 }}
                      >
                        <Link
                          to={profile.type_profil === "studio" ? `/annuaire-podcasts/studios/${profile.slug || profile.id}` : profile.type_profil === "structure_eco" ? `/annuaire-podcasts/structures/${profile.slug || profile.id}` : `/podcasteur/${profile.slug || profile.id}`}
                          className="block bg-background-pure border border-primary/8 rounded-2xl p-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-[3px] transition-all duration-300 h-full relative"
                        >
                          {/* Dispo badge */}
                          {profile.consent_mise_en_relation && (
                            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(61,107,79,0.1)", color: "hsl(148 28% 40%)" }}>
                              ● Dispo
                            </span>
                          )}

                          <div className="flex items-start gap-3 mb-3">
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${badge.avatarColor}`}>
                              {profile.vignette_url ? (
                                <img src={profile.vignette_url} alt="" className="w-full h-full rounded-full object-cover" loading="lazy" />
                              ) : initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display font-bold text-base text-foreground truncate">
                                {profile.type_profil === "studio" || profile.type_profil === "structure_eco" ? profile.nom_podcast : `${profile.prenom} ${profile.nom}`}
                              </h3>
                              {profile.metier_principal && (
                                <p className="text-sm text-primary font-medium truncate">{profile.metier_principal}</p>
                              )}
                              {cityClean && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" />{cityClean}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
                              <BadgeIcon className="w-3 h-3" />{badge.label}
                            </span>
                            {profile.thematique && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs text-terre" style={{ background: "rgba(200,116,42,0.08)" }}>{profile.thematique}</span>
                            )}
                          </div>

                          {/* Collab info — works for all profile types */}
                          {(() => {
                            const sd = profile.studio_data ? (typeof profile.studio_data === "string" ? JSON.parse(profile.studio_data) : profile.studio_data) : {};
                            const isStudioOrStructure = profile.type_profil === "studio" || profile.type_profil === "structure_eco";
                            const cherche = isStudioOrStructure
                              ? (sd.recherche_actuellement || sd.collaborations || profile.cherche_collaboration || [])
                              : (profile.cherche_collaboration || []);
                            const apporte = isStudioOrStructure
                              ? (sd.services_studio || sd.domaines_action || profile.services_3 || profile.peut_apporter || [])
                              : (profile.peut_apporter || []);

                            return (
                              <>
                                {cherche.length > 0 && (
                                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                    Cherche : {cherche.slice(0, 2).join(", ")}
                                  </p>
                                )}
                                {apporte.length > 0 && (
                                  <p className="text-xs mb-2 line-clamp-1" style={{ color: "hsl(148 28% 40%)" }}>
                                    {isStudioOrStructure ? "Propose" : "Apporte"} : {apporte.slice(0, 2).join(", ")}
                                  </p>
                                )}
                              </>
                            );
                          })()}

                          {/* Footer */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/8">
                            {profile.type_profil === "podcasteur" && profile.nom_podcast && (
                              <span className="text-xs text-muted-foreground italic truncate flex-1">{profile.nom_podcast}</span>
                            )}
                            <span className="text-xs font-medium text-primary flex items-center gap-1 ml-auto shrink-0">
                              Voir <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Annuaire;
