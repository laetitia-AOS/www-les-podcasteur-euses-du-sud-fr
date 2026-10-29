import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGES_SEO, SITE_NAME, SITE_URL } from "@/lib/seo";
import HomeHero from "@/components/home/HomeHero";
import HomeEpisodes from "@/components/home/HomeEpisodes";
import HomePhotos from "@/components/home/HomePhotos";
import HomeQuiCherche from "@/components/home/HomeQuiCherche";
import HomeAgenda from "@/components/home/HomeAgenda";
import HomePresse from "@/components/home/HomePresse";
import HomeReseau from "@/components/home/HomeReseau";
import { useHomeProfiles, useUpcomingEvents } from "@/components/home/useHomeData";
import { useLatestEpisodes, useRecentEpisodes } from "@/lib/episodes";

// Organisation : présente aussi dans la page de départ du site, répétée ici pour l'accueil
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organisation`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  image: `${SITE_URL}/og-image.jpg`,
  description: "Association des podcasteur·euses et des pros de l'audio de Marseille et de Région Sud : écoute, annuaire, studios et agenda.",
  address: { "@type": "PostalAddress", streetAddress: "18 rue Saint Suffren", addressLocality: "Marseille", postalCode: "13006", addressRegion: "Provence-Alpes-Côte d'Azur", addressCountry: "FR" },
  areaServed: { "@type": "AdministrativeArea", name: "Provence-Alpes-Côte d'Azur" },
  sameAs: ["https://www.linkedin.com/company/les-podcasteur-euses-du-sud/", "https://www.instagram.com/les_podcasteur.euses_du_sud/"],
};

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
        title={PAGES_SEO.accueil.title}
        description={PAGES_SEO.accueil.description}
        path="/"
        jsonLd={ORGANIZATION_LD}
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
