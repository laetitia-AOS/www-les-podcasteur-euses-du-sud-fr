import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Mic2, ArrowUpRight, MapPin, Loader2, ChevronDown, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

interface Podcast {
  id: string;
  slug: string | null;
  nom_podcast: string;
  description: string;
  ville: string | null;
  thematique: string | null;
  lien_ecoute: string;
  vignette_url: string | null;
  created_at: string;
  prenom: string | null;
  nom: string | null;
  bio_750: string | null;
  type_profil: string;
}

const INITIAL_COUNT = 12;
const LOAD_MORE_COUNT = 12;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Podcasts du Sud — Tous les podcasts de la Région Sud",
  description: "Découvrez les podcasts créés en Provence-Alpes-Côte d'Azur. Écoutez, explorez et connectez-vous aux voix du Sud.",
  url: "https://www.les-podcasteur-euses-du-sud.fr/podcasts",
};

const Podcasts = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(INITIAL_COUNT);
  const [search, setSearch] = useState("");
  const [thematique, setThematique] = useState("");

  useEffect(() => {
    const fetchPodcasts = async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, nom_podcast, description, ville, thematique, lien_ecoute, vignette_url, created_at, prenom, nom, bio_750, type_profil")
        .eq("valide", true)
        .eq("type_profil", "podcasteur")
        .order("created_at", { ascending: false });

      if (!error && data) setPodcasts(data);
      setLoading(false);
    };
    fetchPodcasts();
  }, []);

  const thematiques = useMemo(() => {
    const set = new Set<string>();
    podcasts.forEach((p) => p.thematique && set.add(p.thematique));
    return Array.from(set).sort();
  }, [podcasts]);

  const filtered = useMemo(() => {
    let result = podcasts;
    if (thematique) {
      result = result.filter((p) => p.thematique === thematique);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nom_podcast.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.ville && p.ville.toLowerCase().includes(q)) ||
          (p.prenom && p.prenom.toLowerCase().includes(q)) ||
          (p.nom && p.nom.toLowerCase().includes(q))
      );
    }
    return result;
  }, [podcasts, search, thematique]);

  const hasMore = visible < filtered.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisible(INITIAL_COUNT);
  }, [search, thematique]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Podcasts — Tous les podcasts de la Région Sud"
        description="Découvrez les podcasts créés en Provence-Alpes-Côte d'Azur. Écoutez, explorez et connectez-vous aux voix du Sud."
        path="/podcasts"
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-primary/30" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                Flux
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-3">
              La dynamique audio du Sud
            </h1>
            <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
              Un écosystème vivant, des voix qui bougent, des créateurs qui émergent.
              Explorez tous les podcasts référencés en Région Sud.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un podcast, un nom, une ville…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {thematiques.length > 0 && (
              <select
                value={thematique}
                onChange={(e) => setThematique(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              >
                <option value="">Toutes les thématiques</option>
                {thematiques.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </motion.div>

          {/* Results count */}
          {!loading && (
            <p className="text-xs text-muted-foreground mb-6">
              {filtered.length} podcast{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
            </p>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : filtered.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.slice(0, visible).map((p, i) => (
                  <motion.article
                    key={p.id}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: (i % LOAD_MORE_COUNT) * 0.04 }}
                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {p.vignette_url ? (
                        <img
                          src={p.vignette_url}
                          alt={`Vignette de ${p.nom_podcast}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Mic2 className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="font-serif text-lg text-foreground mb-1 line-clamp-1">
                        {p.nom_podcast}
                      </h2>

                      {(p.ville || p.thematique) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          {p.ville && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {p.ville}
                            </span>
                          )}
                          {p.ville && p.thematique && <span>—</span>}
                          {p.thematique && <span>{p.thematique}</span>}
                        </div>
                      )}

                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-2">
                        {p.description}
                      </p>

                      {(p.prenom || p.nom) && (
                        <p className="text-xs text-muted-foreground mb-1">par {p.prenom} {p.nom}</p>
                      )}

                      {p.bio_750 && (
                        <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-3">{p.bio_750}</p>
                      )}

                      <div className="flex items-center gap-3 mt-auto">
                        <a
                          href={p.lien_ecoute}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Écouter
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                        <Link
                          to={`/profil/${p.slug || p.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Voir le profil
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setVisible((v) => v + LOAD_MORE_COUNT)}
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 hover:shadow-md transition-all duration-300"
                  >
                    Voir plus de podcasts ({filtered.length - visible} restants)
                    <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Mic2 className="w-7 h-7 text-primary/50" />
              </div>
              <h2 className="font-serif text-xl mb-2 text-foreground">
                {search || thematique ? "Aucun résultat" : "Les premiers podcasts arrivent bientôt"}
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                {search || thematique
                  ? "Essayez d'ajuster votre recherche ou vos filtres."
                  : "Le flux se construit en temps réel grâce aux créateurs qui référencent leurs podcasts."}
              </p>
              {!search && !thematique && (
                <a
                  href="/formulaire"
                  className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Référencer mon podcast
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Podcasts;
