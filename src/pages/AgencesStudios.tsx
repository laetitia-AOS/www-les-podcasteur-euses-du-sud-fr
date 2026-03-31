import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Search, Building2, Handshake } from "lucide-react";
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
        .in("type_profil", ["structure_eco", "studio"])
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
            <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl mb-2 text-foreground">Agences & Studios</h1>
            <p className="text-muted-foreground text-sm max-w-2xl mb-4">
              Radios, festivals, incubateurs, institutions, collectifs — les structures qui font vivre l'écosystème podcast en région Sud.
            </p>
            <Link to="/referencer-mon-podcast">
              <Button className="gap-2 rounded-full font-bold"><Building2 className="w-4 h-4" />Référencer ma structure</Button>
            </Link>
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="flex flex-wrap gap-3 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-primary/12 bg-background-pure text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select value={filterTypeStructure} onChange={(e) => setFilterTypeStructure(e.target.value)} className="rounded-xl border border-primary/12 bg-background-pure px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Tous les types</option>
              {typesStructure.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="rounded-xl border border-primary/12 bg-background-pure px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Tous les départements</option>
              {departements.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
            </select>
          </motion.div>

          <p className="text-sm text-muted-foreground mb-6">{filtered.length} structure{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}</p>

          {/* Grid — horizontal cards */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-background-pure border border-primary/8 rounded-2xl p-6 animate-pulse h-28" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground"><p>Aucune structure ne correspond à vos critères.</p></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {filtered.map((profile, i) => {
                const cityClean = profile.city_name?.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "") || "";
                const sd = profile.studio_data ? (typeof profile.studio_data === "string" ? JSON.parse(profile.studio_data) : profile.studio_data) : {};
                const accroche = sd?.phrase_accroche || profile.bio_750?.slice(0, 120) || "";

                return (
                  <motion.div key={profile.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.03 }}>
                    <Link
                      to={profile.type_profil === "studio" ? `/annuaire-podcasts/studios/${profile.slug || profile.id}` : `/annuaire-podcasts/structures/${profile.slug || profile.id}`}
                      className="group flex items-start gap-4 bg-background-pure border border-primary/8 rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 hover:-translate-y-[3px] transition-all duration-300"
                    >
                      {/* Logo */}
                      <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                        {profile.vignette_url ? (
                          <img src={profile.vignette_url} alt={profile.nom_podcast} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Building2 className="w-7 h-7 text-muted-foreground/30" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {profile.metier_principal && (
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{profile.metier_principal}</p>
                        )}
                        <h3 className="font-display font-bold text-lg text-foreground mb-0.5 truncate">{profile.nom_podcast}</h3>
                        {cityClean && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3" />{cityClean}
                          </p>
                        )}
                        {accroche && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{accroche}</p>}

                        {profile.services_3 && profile.services_3.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {profile.services_3.slice(0, 3).map((s, j) => (
                              <Badge key={j} variant="outline" className="text-[11px]">{s}</Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          {profile.consent_mise_en_relation && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(61,107,79,0.1)", color: "hsl(148 28% 40%)" }}>
                              <Handshake className="w-3 h-3" /> Ouvert aux collabs
                            </span>
                          )}
                          <span className="text-xs font-medium text-primary flex items-center gap-1 ml-auto">
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
