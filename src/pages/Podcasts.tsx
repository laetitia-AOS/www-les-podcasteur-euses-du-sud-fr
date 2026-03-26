import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Mic2, ArrowUpRight, MapPin, Loader2, ChevronDown, Search, X, Play } from "lucide-react";
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

const INITIAL_COUNT = 16;
const LOAD_MORE_COUNT = 12;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Podcasts du Sud — Tous les podcasts de la Région Sud",
  description: "Découvrez les podcasts créés en Provence-Alpes-Côte d'Azur.",
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
    if (thematique) result = result.filter((p) => p.thematique === thematique);
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

  useEffect(() => {
    setVisible(INITIAL_COUNT);
  }, [search, thematique]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Podcasts — Tous les podcasts de la Région Sud" description="Découvrez les podcasts créés en Provence-Alpes-Côte d'Azur." path="/podcasts" jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Header */}
          <div className="border-b border-primary/10 pb-8 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl mb-2 text-foreground">Flux podcasts</h1>
              {!loading && <p className="text-muted-foreground text-sm">{filtered.length} show{filtered.length > 1 ? "s" : ""} référencé{filtered.length > 1 ? "s" : ""}</p>}
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un podcast, un nom, une ville…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-primary/12 bg-background-pure text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setThematique("")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!thematique ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  Tous
                </button>
                {thematiques.map((t) => (
                  <button
                    key={t}
                    onClick={() => setThematique(t === thematique ? "" : t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${thematique === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : filtered.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.slice(0, visible).map((p, i) => (
                  <motion.article
                    key={p.id}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: (i % LOAD_MORE_COUNT) * 0.04 }}
                    className="group bg-background-pure rounded-2xl border border-primary/8 overflow-hidden hover:border-primary/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col relative"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-lavande scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {p.vignette_url ? (
                        <img src={p.vignette_url} alt={`Vignette de ${p.nom_podcast}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/8 to-lavande/5">
                          <Mic2 className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      {/* Play overlay on hover */}
                      <a
                        href={p.lien_ecoute}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                        </div>
                      </a>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h2 className="font-display font-bold text-base text-foreground mb-0.5 line-clamp-1">{p.nom_podcast}</h2>
                      {(p.prenom || p.nom) && <p className="text-sm text-primary font-medium mb-1">{p.prenom} {p.nom}</p>}
                      {(p.ville || p.thematique) && (
                        <div className="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground mb-2">
                          {p.ville && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.ville}</span>}
                          {p.thematique && <span className="inline-flex px-2 py-0.5 rounded-full text-terre" style={{ background: "rgba(200,116,42,0.08)" }}>{p.thematique}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-auto pt-2">
                        <Link to={`/podcasteur/${p.slug || p.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Voir le profil</Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button onClick={() => setVisible((v) => v + LOAD_MORE_COUNT)} className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-primary/15 bg-background-pure text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-300">
                    Voir plus ({filtered.length - visible} restants) <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5"><Mic2 className="w-7 h-7 text-primary/50" /></div>
              <h2 className="font-display font-bold text-xl mb-2 text-foreground">{search || thematique ? "Aucun résultat" : "Les premiers podcasts arrivent bientôt"}</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">{search || thematique ? "Ajustez votre recherche." : "Le flux se construit en temps réel."}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Podcasts;
