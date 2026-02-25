import { Link } from "react-router-dom";
import logoPds from "@/assets/logo-pds.png";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-background">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-3">
            <img src={logoPds} alt="Les Podcasteur·euses du Sud" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <span className="font-serif text-lg text-foreground block leading-tight font-bold">
                Les Podcasteur·euses du Sud
              </span>
              <span className="text-xs text-muted-foreground">
                Écosystème podcast · Région Sud
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
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
