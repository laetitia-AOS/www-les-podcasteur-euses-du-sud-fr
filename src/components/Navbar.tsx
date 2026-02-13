import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Menu, X } from "lucide-react";

const links = [
  { label: "Vision", href: "#vision" },
  { label: "Objectifs", href: "#objectifs" },
  { label: "Promesses", href: "#promesses" },
  { label: "Dynamique", href: "#dynamique" },
  { label: "Participer", href: "#communaute" },
  { label: "Contact", href: "#contact" },
  { label: "Référencer", href: "#formulaire" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 max-w-6xl flex items-center justify-between h-16">
        <button
          onClick={() => handleClick("#hero")}
          className={`flex items-center gap-2 font-serif text-lg transition-colors ${
            scrolled ? "text-foreground" : "text-primary-foreground"
          }`}
        >
          <Mic2 className="w-5 h-5" />
          <span className="hidden sm:inline">Podcasteur·euses du Sud</span>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => handleClick(l.href)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                scrolled
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden p-2 rounded-md transition-colors ${
            scrolled ? "text-foreground" : "text-primary-foreground"
          }`}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
