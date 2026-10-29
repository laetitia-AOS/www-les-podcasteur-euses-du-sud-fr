import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";

/** Redirige une ancienne adresse de l'admin en gardant l'onglet demandé. */
const AdminRedirect = ({ to }: { to: string }) => {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
};
import ScrollToTop from "./components/ScrollToTop";
import { PlayerProvider } from "./contexts/PlayerContext";
import PlayerBar from "./components/PlayerBar";
import Index from "./pages/Index";

// Lazy-loaded pages
const Contact = lazy(() => import("./pages/Contact"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const CGU = lazy(() => import("./pages/CGU"));
const PolitiqueCookies = lazy(() => import("./pages/PolitiqueCookies"));
const AdminAdhesions = lazy(() => import("./pages/AdminAdhesions"));
const AdminEvenements = lazy(() => import("./pages/AdminEvenements"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminContacts = lazy(() => import("./pages/AdminContacts"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminPodcasts = lazy(() => import("./pages/AdminPodcasts"));
const Evenements = lazy(() => import("./pages/Evenements"));
const EvenementDetail = lazy(() => import("./pages/EvenementDetail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PodcasteurLogin = lazy(() => import("./pages/PodcasteurLogin"));
const MonPodcast = lazy(() => import("./pages/MonPodcast"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Adhesion = lazy(() => import("./pages/Adhesion"));
const Annuaire = lazy(() => import("./pages/Annuaire"));
const ProfilMembre = lazy(() => import("./pages/ProfilMembre"));
const Bienvenue = lazy(() => import("./pages/Bienvenue"));
const Formulaire = lazy(() => import("./pages/Formulaire"));
const StudioProfile = lazy(() => import("./pages/StudioProfile"));
const StructureEcoProfile = lazy(() => import("./pages/StructureEcoProfile"));
const AgencesStudios = lazy(() => import("./pages/AgencesStudios"));
const ProposerEvenement = lazy(() => import("./pages/ProposerEvenement"));
const Podcasts = lazy(() => import("./pages/Podcasts"));

const queryClient = new QueryClient();

const SlugRedirect = ({ to }: { to: string }) => {
  const { slug } = useParams();
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: `${to}/${slug}`, search, hash }} replace />;
};

/** Ancienne adresse d'une page : on garde les paramètres (?etape=…) et l'ancre (#inscription). */
const KeepRedirect = ({ to }: { to: string }) => {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} replace />;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PlayerProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
            <Route path="/conditions-utilisation" element={<CGU />} />
            <Route path="/politique-cookies" element={<PolitiqueCookies />} />
            <Route path="/agenda" element={<Evenements />} />
            <Route path="/agenda/:slug" element={<EvenementDetail />} />
            <Route path="/ecouter" element={<Podcasts />} />
            <Route path="/ecouter/:slug" element={<ProfilMembre />} />
            <Route path="/annuaire" element={<Annuaire />} />
            <Route path="/annuaire/:slug" element={<ProfilMembre />} />
            <Route path="/studios" element={<AgencesStudios />} />
            <Route path="/studios/:slug" element={<StudioProfile />} />
            <Route path="/structures/:slug" element={<StructureEcoProfile />} />
            <Route path="/adherer" element={<Adhesion />} />
            <Route path="/proposer-evenement-podcast" element={<ProposerEvenement />} />
            <Route path="/bienvenue" element={<Bienvenue />} />
            <Route path="/referencer-mon-podcast" element={<Formulaire />} />
            {/* Anciennes adresses : redirection vers l'adresse actuelle (adresse, paramètres et ancre conservés) */}
            <Route path="/podcasts" element={<KeepRedirect to="/ecouter" />} />
            <Route path="/podcasteur/:slug" element={<ProfilMembre />} />
            <Route path="/profil/:slug" element={<ProfilMembre />} />
            <Route path="/annuaire-podcasts" element={<KeepRedirect to="/annuaire" />} />
            <Route path="/annuaire-podcasts/studios/:slug" element={<SlugRedirect to="/studios" />} />
            <Route path="/annuaire-podcasts/structures/:slug" element={<SlugRedirect to="/structures" />} />
            <Route path="/studios-podcast" element={<KeepRedirect to="/studios" />} />
            <Route path="/agences-studios" element={<KeepRedirect to="/studios" />} />
            <Route path="/evenements" element={<KeepRedirect to="/agenda" />} />
            <Route path="/evenements-podcast" element={<KeepRedirect to="/agenda" />} />
            <Route path="/evenement/:slug" element={<SlugRedirect to="/agenda" />} />
            <Route path="/evenement-podcast/:slug" element={<SlugRedirect to="/agenda" />} />
            <Route path="/rejoindre-association" element={<KeepRedirect to="/adherer" />} />
            <Route path="/adhesion" element={<KeepRedirect to="/adherer" />} />
            <Route path="/proposer-evenement" element={<KeepRedirect to="/proposer-evenement-podcast" />} />
            <Route path="/formulaire" element={<KeepRedirect to="/referencer-mon-podcast" />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/membres" element={<AdminAdhesions />} />
            <Route path="/admin/annuaire" element={<AdminPodcasts />} />
            <Route path="/admin/agenda" element={<AdminEvenements />} />
            <Route path="/admin/messages" element={<AdminContacts />} />
            {/* Anciennes adresses de l'admin */}
            <Route path="/admin/adhesions" element={<AdminRedirect to="/admin/membres" />} />
            <Route path="/admin/evenements" element={<AdminRedirect to="/admin/agenda" />} />
            <Route path="/admin/contacts" element={<AdminRedirect to="/admin/messages" />} />
            <Route path="/admin/podcasts" element={<AdminRedirect to="/admin/annuaire" />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/espace-membre" element={<PodcasteurLogin />} />
            <Route path="/espace-podcasteur" element={<PodcasteurLogin />} />
            <Route path="/mon-espace" element={<MonPodcast />} />
            <Route path="/mon-podcast" element={<MonPodcast />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <PlayerBar />
      </BrowserRouter>
      </PlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
