import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
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
  return <Navigate to={`${to}/${slug}`} replace />;
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
            <Route path="/evenements-podcast" element={<Evenements />} />
            <Route path="/podcasts" element={<Podcasts />} />
            <Route path="/proposer-evenement-podcast" element={<ProposerEvenement />} />
            <Route path="/evenement-podcast/:slug" element={<EvenementDetail />} />
            <Route path="/rejoindre-association" element={<Adhesion />} />
            <Route path="/annuaire-podcasts" element={<Annuaire />} />
            <Route path="/annuaire" element={<Navigate to="/annuaire-podcasts" replace />} />
            <Route path="/podcasteur/:slug" element={<ProfilMembre />} />
            <Route path="/annuaire-podcasts/studios/:slug" element={<StudioProfile />} />
            <Route path="/annuaire-podcasts/structures/:slug" element={<StructureEcoProfile />} />
            <Route path="/bienvenue" element={<Bienvenue />} />
            <Route path="/referencer-mon-podcast" element={<Formulaire />} />
            <Route path="/studios-podcast" element={<AgencesStudios />} />
            {/* Redirections anciennes URLs */}
            <Route path="/evenements" element={<Navigate to="/evenements-podcast" replace />} />
            <Route path="/evenement/:slug" element={<SlugRedirect to="/evenement-podcast" />} />
            <Route path="/proposer-evenement" element={<Navigate to="/proposer-evenement-podcast" replace />} />
            <Route path="/adhesion" element={<Navigate to="/rejoindre-association" replace />} />
            <Route path="/profil/:slug" element={<SlugRedirect to="/podcasteur" />} />
            <Route path="/formulaire" element={<Navigate to="/referencer-mon-podcast" replace />} />
            <Route path="/agences-studios" element={<Navigate to="/studios-podcast" replace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/adhesions" element={<AdminAdhesions />} />
            <Route path="/admin/evenements" element={<AdminEvenements />} />
            <Route path="/admin/contacts" element={<AdminContacts />} />
            <Route path="/admin/podcasts" element={<AdminPodcasts />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/espace-membre" element={<PodcasteurLogin />} />
            <Route path="/espace-podcasteur" element={<PodcasteurLogin />} />
            <Route path="/mon-espace" element={<MonPodcast />} />
            <Route path="/mon-podcast" element={<MonPodcast />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
