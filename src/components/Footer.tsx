import { Mic2 } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-background">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mic2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-serif text-lg text-foreground block leading-tight">
                Les Podcasteur·euses du Sud
              </span>
              <span className="text-xs text-muted-foreground">
                Écosystème podcast · Région Sud
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a
              href="mailto:contact@podcasteusesdusud.fr"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">
              Mentions légales
            </Link>
            <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
            <Link to="/politique-de-confidentialite" className="hover:text-foreground transition-colors">
              Confidentialité
            </Link>
            <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
            <Link to="/conditions-utilisation" className="hover:text-foreground transition-colors">
              CGU
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
