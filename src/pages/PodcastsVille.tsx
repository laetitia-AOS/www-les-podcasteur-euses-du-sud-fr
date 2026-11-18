import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PodcastCarte, { type PodcastListe } from "@/components/listes/PodcastCarte";
import EventRow from "@/components/agenda/EventRow";
import { useUpcomingEvents, isOnline } from "@/components/home/useHomeData";
import { useLatestEpisodes, type Episode } from "@/lib/episodes";
import { PAGES, SITE_URL, breadcrumbLd } from "@/lib/seo";
import { aUnPodcast, btnPrimary, container, h1Ligne, linkUnderline } from "@/lib/pds";
import { LIENS_LOCAUX, dansZone, evenementDansZone, seoDe, type PagePodcastsLocale } from "@/lib/pagesLocales";

type Ligne = PodcastListe & { department_code: string | null; created_at: string };

/** Podcasts des membres d'une ville ou d'un département, avec ses rendez-vous podcast et ses studios. */
const PodcastsVille = ({ page }: { page: PagePodcastsLocale }) => {
  const seo = seoDe(page.cle);

  const { data: tous = [], isLoading } = useQuery({
    queryKey: ["podcasts-locaux"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts_publics")
        .select("id, slug, nom_podcast, lien_ecoute, vignette_url, prenom, nom, city_name, ville, department_code, created_at")
        .eq("type_profil", "podcasteur")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as Ligne[]).filter((p) => aUnPodcast({ type_profil: "podcasteur", nom_podcast: p.nom_podcast }));
    },
    staleTime: 5 * 60 * 1000,
  });
  const podcasts = useMemo(() => tous.filter((p) => dansZone(page, p)), [tous, page]);

  const { data: epData } = useLatestEpisodes(40);
  const episodeByPodcast = useMemo(() => {
    const m = new Map<string, Episode>();
    (epData?.latest || []).forEach((e) => m.set(e.podcastId, e));
    return m;
  }, [epData]);

  const { data: evenements = [] } = useUpcomingEvents();
  const rendezVous = evenements.filter((e) => !isOnline(e) && evenementDansZone(page, e)).slice(0, 4);

  const titre = `Podcasts ${page.lieu}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: titre,
      description: seo.description,
      url: `${SITE_URL}${page.chemin}`,
      inLanguage: "fr",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: podcasts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/ecouter/${p.slug || p.id}`,
          name: p.nom_podcast,
        })),
      },
    },
    breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Écouter", path: PAGES.ecouter }, { name: titre, path: page.chemin }]),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seo.title} description={seo.description} path={page.chemin} jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14`}>
          <nav aria-label="Fil d'Ariane" className="font-mono text-sm text-muted-foreground">
            <Link to={PAGES.ecouter} className="underline underline-offset-4 hover:text-foreground">Écouter</Link>
            <span aria-hidden> / </span>
            <span>{titre}</span>
          </nav>
          <h1 className="title-page text-[56px] sm:text-[88px] mt-4">
            <span className="block">Podcasts</span>
            <span className={h1Ligne}>{page.lieu}</span>
          </h1>
          <p className="mt-3 md:mt-4 text-[17px] md:text-lg max-w-[60ch]">
            {isLoading
              ? "Chargement des podcasts…"
              : `${podcasts.length} podcast${podcasts.length > 1 ? "s" : ""} fait${podcasts.length > 1 ? "s" : ""} ${page.lieu} par des membres des Podcasteur·euses du Sud, l'association des créateur·ices de podcasts de la région. Lancez un épisode ici\u00a0: il continue pendant que vous naviguez.`}
          </p>

          <ul className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {podcasts.map((p) => <PodcastCarte key={p.id} p={p} ep={episodeByPodcast.get(p.id)} />)}
          </ul>
        </div>

        <section className={`${container} mt-16 md:mt-24`} aria-labelledby="rdv-title">
          <h2 id="rdv-title" className="title-section text-[36px] sm:text-[48px] pb-4 border-b-2 border-encre">Rendez-vous podcast {page.lieu}</h2>
          {rendezVous.length > 0 ? (
            <ul className="divide-y divide-filet border-b border-filet">
              {rendezVous.map((e, i) => <EventRow key={e.id} e={e} primary={i === 0} cta="Voir" />)}
            </ul>
          ) : (
            <p className="py-6 text-[17px] border-b border-filet">Pas de rendez-vous annoncé ici pour l'instant.</p>
          )}
          <Link to={PAGES.agenda} className={`${linkUnderline} mt-4 inline-flex min-h-[44px] items-center`}>Tout l'agenda podcast de la région<span aria-hidden>&nbsp;→</span></Link>
        </section>

        <section className={`${container} mt-12 md:mt-16`} aria-labelledby="aussi-title">
          <h2 id="aussi-title" className="title-section text-[28px] sm:text-[34px]">Aussi sur le site</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6">
            {page.studios && (
              <li><Link to={page.studios} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>Studios podcast {page.lieu}</Link></li>
            )}
            {LIENS_LOCAUX.filter((l) => l.to !== page.chemin && l.to !== page.studios).map((l) => (
              <li key={l.to}><Link to={l.to} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>{l.label}</Link></li>
            ))}
            <li><Link to={PAGES.ecouter} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>Tous les podcasts de la région</Link></li>
            <li><Link to={PAGES.annuaire} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>Annuaire des pros de l'audio</Link></li>
          </ul>
        </section>

        <section className="mt-16 md:mt-24 bg-surface border-y border-filet" aria-label="Adhérer">
          <div className={`${container} py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5`}>
            <p className="font-bold text-lg sm:text-xl max-w-[52ch]">
              Vous faites un podcast {page.lieu} ? Adhérez pour qu'il apparaisse ici et tourne dans le lecteur.
            </p>
            <Link to={PAGES.adherer} className={`${btnPrimary} px-7 shrink-0 self-start sm:self-auto`}>Adhérer</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PodcastsVille;
