import { useMemo, useState, useEffect } from "react";
import { compterStat } from "@/lib/stats";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import FiltresRepliables from "@/components/FiltresRepliables";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGES_SEO } from "@/lib/seo";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLatestEpisodes, type Episode } from "@/lib/episodes";
import { btnPrimary, btnSecondary, cleanCity, container, h1Ligne, formatShortDate, fullName } from "@/lib/pds";

interface Podcast {
  id: string;
  slug: string | null;
  nom_podcast: string;
  description: string;
  thematique: string | null;
  lien_ecoute: string;
  vignette_url: string | null;
  created_at: string;
  prenom: string | null;
  nom: string | null;
  city_name: string | null;
  ville: string | null;
  department_code: string | null;
  department_label: string | null;
}

// 12 podcasts d'abord, puis tous les autres d'un coup : le nombre annoncé est toujours celui affiché.
const INITIAL_COUNT = 12;

const SORTS = [
  { value: "ajout", label: "Ajouté récemment" },
  { value: "episode", label: "Dernier épisode publié" },
  { value: "nom", label: "Nom, de A à Z" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

const fieldClass =
  "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Écouter les podcasts de Marseille et de la Région Sud",
  description: "Podcasts, fictions sonores, livres audio et vodcasts fabriqués à Marseille et en Région Sud, à écouter directement sur le site.",
  url: "https://www.les-podcasteur-euses-du-sud.fr/ecouter",
  inLanguage: "fr",
};

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const Podcasts = () => {
  const { play, isCurrent, playing } = usePlayer();
  const [visible, setVisible] = useState(INITIAL_COUNT);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [sort, setSort] = useState<SortKey>("ajout");
  const [theme, setTheme] = useState("");

  const { data: podcasts = [], isLoading } = useQuery({
    queryKey: ["ecouter-podcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, nom_podcast, description, thematique, lien_ecoute, vignette_url, created_at, prenom, nom, city_name, ville, department_code, department_label")
        .eq("valide", true)
        .eq("type_profil", "podcasteur")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Podcast[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: epData } = useLatestEpisodes(40);
  const episodeByPodcast = useMemo(() => {
    const m = new Map<string, Episode>();
    (epData?.latest || []).forEach((e) => m.set(e.podcastId, e));
    return m;
  }, [epData]);

  // Thèmes réels de la base ; « Autre » relégué en fin de liste
  const themes = useMemo(() => {
    const set = new Set<string>();
    podcasts.forEach((p) => p.thematique && set.add(p.thematique));
    return Array.from(set).sort((a, b) => {
      if (a === "Autre") return 1;
      if (b === "Autre") return -1;
      return a.localeCompare(b, "fr");
    });
  }, [podcasts]);

  const departements = useMemo(() => {
    const m = new Map<string, string>();
    podcasts.forEach((p) => p.department_code && m.set(p.department_code, p.department_label || p.department_code));
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [podcasts]);

  // Tri par dernier épisode proposé seulement quand tous les podcasts ont un flux lu par le site
  const tousOntUnFlux = podcasts.length > 0 && podcasts.every((p) => episodeByPodcast.has(p.id));
  const sorts = SORTS.filter((s) => s.value !== "episode" || tousOntUnFlux);
  const sortActif: SortKey = sort === "episode" && !tousOntUnFlux ? "ajout" : sort;

  const filtered = useMemo(() => {
    let r = podcasts;
    if (theme) r = r.filter((p) => p.thematique === theme);
    if (dept) r = r.filter((p) => p.department_code === dept);
    if (search.trim()) {
      const q = norm(search.trim());
      r = r.filter((p) =>
        [p.nom_podcast, p.description, p.prenom, p.nom, p.city_name, p.ville, p.thematique]
          .filter(Boolean)
          .some((v) => norm(v as string).includes(q)),
      );
    }
    const sorted = [...r];
    if (sortActif === "nom") sorted.sort((a, b) => a.nom_podcast.localeCompare(b.nom_podcast, "fr"));
    else if (sortActif === "episode") {
      sorted.sort((a, b) => {
        const da = episodeByPodcast.get(a.id)?.date || "";
        const db = episodeByPodcast.get(b.id)?.date || "";
        if (da !== db) return db.localeCompare(da);
        return b.created_at.localeCompare(a.created_at);
      });
    }
    return sorted;
  }, [podcasts, theme, dept, search, sortActif, episodeByPodcast]);

  useEffect(() => setVisible(INITIAL_COUNT), [search, dept, theme, sort]);

  const remaining = filtered.length - visible;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={PAGES_SEO.ecouter.title}
        description={PAGES_SEO.ecouter.description}
        path="/ecouter"
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14`}>
          <h1 className="title-page text-[64px] sm:text-[96px]">
            <span className="block">Écouter</span>
            <span className={h1Ligne}>les podcasts de Marseille et de Région Sud</span>
          </h1>
          <p className="mt-3 md:mt-4 text-[17px] md:text-lg max-w-[52ch]">
            {podcasts.length > 0 ? `${podcasts.length} podcasts à lancer ici.` : "Lancez un épisode ici."} Il continue pendant que vous naviguez d'une page à l'autre.
          </p>

          {/* Thèmes : une bande qui défile sur téléphone, sur plusieurs lignes au-delà */}
          <div role="group" aria-label="Filtrer par thème" className="mt-5 md:mt-6 -mx-5 px-5 md:mx-0 md:px-0 flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 [scrollbar-width:thin]">
            {["", ...themes].map((t) => (
              <button
                key={t || "tous"}
                onClick={() => setTheme(t)}
                aria-pressed={theme === t}
                className={`shrink-0 whitespace-nowrap min-h-[44px] px-4 border font-semibold text-[15px] ${theme === t ? "bg-encre text-surface border-encre" : "border-encre bg-surface hover:bg-muted"}`}
              >
                {t || "Tous les thèmes"}
              </button>
            ))}
          </div>

          <FiltresRepliables actifs={(search.trim() ? 1 : 0) + (dept ? 1 : 0)} className="mt-4 md:mt-6">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr] pb-6 md:border-b-2 md:border-encre">
            <div>
              <label htmlFor="ecouter-search" className="block text-sm font-bold mb-1.5">Rechercher</label>
              <input
                id="ecouter-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Un titre, un nom, un sujet"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="ecouter-dept" className="block text-sm font-bold mb-1.5">Département</label>
              <select id="ecouter-dept" value={dept} onChange={(e) => setDept(e.target.value)} className={fieldClass}>
                <option value="">Toute la région</option>
                {departements.map(([code, label]) => (
                  <option key={code} value={code}>{label} ({code})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ecouter-sort" className="block text-sm font-bold mb-1.5">Trier par</label>
              <select id="ecouter-sort" value={sortActif} onChange={(e) => setSort(e.target.value as SortKey)} className={fieldClass}>
                {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          </FiltresRepliables>

          <p className="mt-5 md:mt-8 font-mono text-sm text-muted-foreground" aria-live="polite">
            {isLoading ? "Chargement…" : remaining > 0 ? `${visible} podcasts affichés sur ${filtered.length}` : `${filtered.length} podcast${filtered.length > 1 ? "s" : ""}`}
          </p>

          {!isLoading && filtered.length === 0 ? (
            <p className="py-16 text-lg">Aucun podcast ne correspond à cette recherche. Essayez un autre mot ou un autre thème.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
              {filtered.slice(0, visible).map((p) => {
                const ep = episodeByPodcast.get(p.id);
                const active = ep ? isCurrent(ep) && playing : false;
                const author = fullName(p.prenom, p.nom);
                const city = cleanCity(p.city_name || p.ville);
                const href = `/ecouter/${p.slug || p.id}`;
                return (
                  <li key={p.id} className="flex flex-col">
                    <Link to={href} className="block aspect-square bg-muted overflow-hidden" tabIndex={-1} aria-hidden>
                      {p.vignette_url ? (
                        <img src={p.vignette_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex w-full h-full items-center justify-center bg-primary text-primary-foreground title-section text-2xl p-4 text-center">{p.nom_podcast}</span>
                      )}
                    </Link>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={href} className="block font-bold text-[17px] leading-tight hover:underline underline-offset-4">
                          {p.nom_podcast}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-0.5">{[author, city].filter(Boolean).join(" · ")}</p>
                      </div>
                      {ep ? (
                        <button
                          onClick={() => play(ep)}
                          className={`shrink-0 w-11 h-11 rounded-full border-2 border-primary inline-flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary hover:text-primary-foreground"}`}
                          aria-label={`${active ? "Mettre en pause" : "Écouter le dernier épisode de"} ${p.nom_podcast}`}
                        >
                          {active ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
                        </button>
                      ) : (
                        <a
                          href={p.lien_ecoute}
                          onClick={() => compterStat(p.id, "ecoute")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 w-11 h-11 rounded-full border-2 border-primary text-primary inline-flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
                          aria-label={`Écouter ${p.nom_podcast} (nouvel onglet)`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {ep?.date && (
                      <p className="mt-2 font-mono text-xs text-muted-foreground">Dernier épisode · {formatShortDate(ep.date)}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {remaining > 0 && (
            <div className="flex justify-center mt-12">
              <button onClick={() => setVisible(filtered.length)} className={btnSecondary}>
                {remaining > 1 ? `Voir les ${remaining} autres podcasts` : "Voir le dernier podcast"}
              </button>
            </div>
          )}
        </div>

        <section className="mt-16 md:mt-24 bg-surface border-y border-filet" aria-label="Adhérer">
          <div className={`${container} py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5`}>
            <p className="font-bold text-lg sm:text-xl max-w-[52ch]">
              Votre podcast est fait dans la région ? Adhérez pour qu'il apparaisse ici et tourne dans le lecteur.
            </p>
            <Link to="/adherer" className={`${btnPrimary} px-7 shrink-0 self-start sm:self-auto`}>Adhérer</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Podcasts;
