import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import MentionsLegales from "./pages/MentionsLegales";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import CGU from "./pages/CGU";
import PolitiqueCookies from "./pages/PolitiqueCookies";
import AdminAdhesions from "./pages/AdminAdhesions";
import AdminEvenements from "./pages/AdminEvenements";
import AdminLogin from "./pages/AdminLogin";
import AdminContacts from "./pages/AdminContacts";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPodcasts from "./pages/AdminPodcasts";
import Evenements from "./pages/Evenements";
import ResetPassword from "./pages/ResetPassword";
import PodcasteurLogin from "./pages/PodcasteurLogin";
import MonPodcast from "./pages/MonPodcast";
import NotFound from "./pages/NotFound";
import Adhesion from "./pages/Adhesion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
          <Route path="/conditions-utilisation" element={<CGU />} />
          <Route path="/politique-cookies" element={<PolitiqueCookies />} />
          <Route path="/evenements" element={<Evenements />} />
          <Route path="/adhesion" element={<Adhesion />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/adhesions" element={<AdminAdhesions />} />
          <Route path="/admin/evenements" element={<AdminEvenements />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/podcasts" element={<AdminPodcasts />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/espace-podcasteur" element={<PodcasteurLogin />} />
          <Route path="/mon-podcast" element={<MonPodcast />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
