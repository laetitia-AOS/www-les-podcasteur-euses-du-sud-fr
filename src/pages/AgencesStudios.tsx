import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  MapPin, ArrowRight, Search, Building2, Handshake, Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const departements = [
  { code: "04", label: "Alpes-de-Haute-Provence" },
  { code: "05", label: "Hautes-Alpes" },
  { code: "06", label: "Alpes-Maritimes" },
  { code: "13", label: "Bouches-du-Rhône" },
  { code: "83", label: "Var" },
  { code: "84", label: "Vaucluse" },
];

const typesStructure = [
  "Radio associative ou locale",
  "Festival ou événement récurrent",
  "Incubateur ou accélérateur",
  "Institution ou collectivité",
  "Média ou groupe média",
  "Association / collectif",
  "Autre",
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

interface Profile {
  id: string;
  slug: string | null;
  type_profil: string;
  city_name: string | null;
  department_label: string | null;
  department_code: string | null;
  bio_750: string | null;
  nom_podcast: string;
  metier_principal: string | null;
  services_3: string[] | null;
  vignette_url: string | null;
  consent_mise_en_relation: boolean;
  cherche_collaboration: string[] | null;
  studio_data: any;
}

const AgencesStudios = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("");
  const [filterTypeStructure, setFilterTypeStructure] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCollab, setFilterCollab] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, type_profil, city_name, department_label, department_code, bio_750, nom_podcast, metier_principal, services_3, vignette_url, consent_mise_en_relation, cherche_collaboration, studio_data")
        .eq("valide", true)
        .eq("type_profil", "structure_eco")
        .order("created_at", { ascending: false });
      if (!error && data) setProfiles(data as unknown as Profile[]);
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (filterDept && p.department_code !== filterDept) return false;
      if (filterTypeStructure && p.metier_principal !== filterTypeStructure) return false;
      if (filterCollab && !p.consent_mise_en_relation) return false;
      if (searchQuery) {
        const q = searchQuery.trim();
        const searchable = [
          p.nom_podcast, p.bio_750, p.metier_principal,
          p.city_name, p.department_label,
          ...(p.services_3 || [])
        ].filter(Boolean).join(" ");
        if (!fuzzyMatch(searchable, q)) return false;
      }
      return true;
    });
  }, [profiles, filterDept, filterTypeStructure, searchQuery, filterCollab]);

  const selectClass = "rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Agences & Studios — Écosystème Podcast Région Sud"
        description="Radios, festivals, incubateurs, institutions : découvrez les structures de l'écosystème podcast en Provence-Alpes-Côte d'Azur."
        path="/studios-podcast"
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
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl mb-4">
              Agences & Studios
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
              Radios, festivals, incubateurs, institutions, collectifs…
              Les structures qui font vivre l'écosystème podcast en région Sud.
            </p>
            <Link to="/referencer-mon-podcast">
              <Button className="gap-2">
                <Building2 className="w-4 h-4" />
                Référencer ma structure
              </Button>
            </Link>
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
                placeholder="Rechercher une structure, un type, une ville…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={filterTypeStructure} onChange={(e) => setFilterTypeStructure(e.target.value)} className={selectClass}>
                <option value="">Tous les types</option>
                {typesStructure.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={selectClass}>
                <option value="">Tous les départements</option>
                {departements.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={filterCollab}
                  onChange={(e) => setFilterCollab(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                />
                Ouvert·e aux collaborations
              </label>
            </div>
          </motion.div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} structure{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
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
              <p>Aucune structure ne correspond à vos critères.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((profile, i) => {
                const cityClean = profile.city_name?.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "") || "";
                const sd = profile.studio_data ? (typeof profile.studio_data === "string" ? JSON.parse(profile.studio_data) : profile.studio_data) : {};
                const accroche = sd?.phrase_accroche || profile.bio_750?.slice(0, 100) || "";
                const coverUrl = (sd?.galerie_urls && sd.galerie_urls.length > 0) ? sd.galerie_urls[0] : profile.vignette_url;

                return (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.03 }}
                  >
                    <Link
                      to={`/annuaire-podcasts/structures/${profile.slug || profile.id}`}
                      className="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full"
                    >
                      {/* Cover image */}
                      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={profile.nom_podcast}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/10 to-primary/10">
                            <Building2 className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {/* Name on cover */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-display font-bold text-lg text-foreground leading-snug drop-shadow-md">{profile.nom_podcast}</h3>
                          {cityClean && (
                            <p className="text-xs text-white/80 flex items-center gap-1 mt-1 drop-shadow">
                              <MapPin className="w-3 h-3" />
                              {cityClean}{profile.department_label ? `, ${profile.department_label.split(" — ")[1] || profile.department_label}` : ""}
                            </p>
                          )}
                        </div>
                        {/* Logo overlay */}
                        {profile.vignette_url && sd?.galerie_urls && sd.galerie_urls.length > 0 && (
                          <div className="absolute top-3 left-3 w-10 h-10 rounded-lg overflow-hidden border-2 border-white/80 shadow-md bg-white">
                            <img src={profile.vignette_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {profile.consent_mise_en_relation && (
                          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-green-700 border border-green-200 shadow-sm backdrop-blur-sm">
                            <Handshake className="w-3 h-3" /> Collabs
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {profile.metier_principal && (
                          <Badge variant="secondary" className="text-xs mb-2">{profile.metier_principal}</Badge>
                        )}
                        {accroche && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {sd?.phrase_accroche ? <em>{accroche}</em> : accroche}
                          </p>
                        )}

                        {profile.services_3 && profile.services_3.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {profile.services_3.slice(0, 2).map((s, j) => (
                              <Badge key={j} variant="outline" className="text-[11px]">{s}</Badge>
                            ))}
                            {profile.services_3.length > 2 && (
                              <Badge variant="outline" className="text-[11px]">+{profile.services_3.length - 2}</Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                          <span className="text-xs font-medium text-primary flex items-center gap-1">
                            Voir la fiche <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
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

export default AgencesStudios;
