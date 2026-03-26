import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import logoPds from "@/assets/logo-pds.png";

const links = [
  { label: "Podcasts", href: "/podcasts" },
  { label: "Annuaire", href: "/annuaire-podcasts" },
  { label: "Agences/Studios", href: "/studios-podcast" },
  { label: "Événements", href: "/evenements-podcast" },
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

  useEffect(() => {
    if (location.pathname === "/" && location.state?.scrollTo) {
      const target = location.state.scrollTo as string;
      setTimeout(() => {
        document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      window.history.replaceState({}, "");
    }
  }, [location.pathname, location.state]);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-primary/20 shadow-lg shadow-primary/5"
          : "bg-background/60 backdrop-blur-sm border-transparent"
      }`}
    >
      <div className="container mx-auto px-6 max-w-6xl flex items-center justify-between h-16">
        <button
          onClick={() => handleClick("/")}
          className="flex items-center gap-2.5 transition-colors text-foreground"
        >
          <img src={logoPds} alt="Les Podcasteur·euses du Sud" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="font-display font-bold text-sm text-foreground">Les Podcasteur·euses du Sud</span>
            <span className="text-[10px] text-secondary font-medium tracking-wide">Écosystème podcast · Région Sud</span>
          </div>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => handleClick(l.href)}
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-secondary"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => handleClick("/rejoindre-association")}
            className="ml-3 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-primary/20"
          >
            Rejoindre le collectif
          </button>
          <button
            onClick={() => handleClick("/espace-membre")}
            className="ml-2 p-2 rounded-full transition-colors text-muted-foreground hover:text-secondary hover:bg-muted/50"
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
            className="md:hidden bg-background/95 backdrop-blur-md border-b border-primary/20 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {links.map((l) => (
                <button
                  key={l.href}
                  onClick={() => handleClick(l.href)}
                  className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:text-secondary hover:bg-muted/50 transition-colors"
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => handleClick("/rejoindre-association")}
                className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-semibold text-primary hover:bg-muted/50 transition-colors"
              >
                Rejoindre le collectif
              </button>
              <button
                onClick={() => handleClick("/espace-membre")}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-secondary hover:bg-muted/50 transition-colors"
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
