import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import HomeHero from "@/components/home/HomeHero";
import HomeEpisodes from "@/components/home/HomeEpisodes";
import HomePhotos from "@/components/home/HomePhotos";
import HomeQuiCherche from "@/components/home/HomeQuiCherche";
import HomeAgenda from "@/components/home/HomeAgenda";
import HomePresse from "@/components/home/HomePresse";
import HomeReseau from "@/components/home/HomeReseau";
import { useHomeProfiles, useUpcomingEvents } from "@/components/home/useHomeData";
import { useLatestEpisodes, useRecentEpisodes } from "@/lib/episodes";

const Index = () => {
  const { data: profiles = [] } = useHomeProfiles();
  const { data: events = [] } = useUpcomingEvents();
  const { data: epData, isLoading: epLoading } = useLatestEpisodes(8);
  const latest = epData?.latest || [];
  // « Derniers épisodes » : les 4 plus récents, tous membres confondus
  const { data: recent = [], isLoading: recentLoading } = useRecentEpisodes(4);
  const podcasts = profiles.filter((p) => p.type_profil === "podcasteur");

  return (
    <>
      <SEOHead
        title="Podcasts à Marseille et en Région Sud — Les Podcasteur·euses du Sud"
        description="Écoutez les podcasts, fictions sonores, livres audio et vodcasts fabriqués à Marseille et en Région Sud. Trouvez un·e créateur·ice, un studio, et venez aux apéros écoute."
        path="/"
      />
      <Navbar />
      <main>
        <HomeHero profiles={profiles} latest={latest} />
        <HomeEpisodes episodes={recent} fallback={podcasts} loading={recentLoading} />
        <HomePhotos />
        <HomeQuiCherche profiles={profiles} />
        <HomeAgenda events={events} />
        <HomePresse />
        <HomeReseau />
      </main>
      <Footer />
    </>
  );
};

export default Index;
