import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import logoPds from "@/assets/logo-pds.png";

const links = [
  { label: "Podcasts", href: "/podcasts" },
  { label: "Annuaire", href: "/annuaire-podcasts" },
  { label: "Agences/Studios", href: "/agences-studios" },
  { label: "Événements", href: "/evenements" },
  { label: "Référencer", href: "/formulaire" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("/")) {
      navigate(href);
    } else if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: href } });
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle scroll after navigating back to home
  useEffect(() => {
    if (location.pathname === "/" && location.state?.scrollTo) {
      const target = location.state.scrollTo as string;
      // Small delay to let the page render
      setTimeout(() => {
        document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      // Clear the state to avoid re-scrolling
      window.history.replaceState({}, "");
    }
  }, [location.pathname, location.state]);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-6 max-w-6xl flex items-center justify-between h-16">
        <button
          onClick={() => handleClick("#hero")}
          className="flex items-center gap-2.5 font-serif text-lg transition-colors text-foreground"
        >
          <img src={logoPds} alt="Les Podcasteur·euses du Sud" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
          <span className="hidden sm:inline font-bold">Les Podcasteur·euses du Sud</span>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => handleClick(l.href)}
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => handleClick("/espace-membre")}
            className="ml-2 p-2 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Espace membre"
            title="Espace membre"
          >
            <User className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-md transition-colors text-foreground"
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-md border-b border-border overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {links.map((l) => (
                <button
                  key={l.href}
                  onClick={() => handleClick(l.href)}
                  className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => handleClick("/espace-membre")}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <User className="w-4 h-4" />
                Espace membre
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
