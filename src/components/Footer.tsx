import { Link } from "react-router-dom";
import logoPds from "@/assets/logo-pds.png";

const Footer = () => {
  return (
    <footer className="py-16 border-t" style={{ backgroundColor: "hsl(197 47% 15%)", borderColor: "rgba(184,92,56,0.15)" }}>
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-3">
            <img src={logoPds} alt="Les Podcasteur·euses du Sud" className="w-10 h-10 rounded-xl object-cover" loading="lazy" decoding="async" />
            <div>
              <span className="font-display font-semibold text-lg block leading-tight" style={{ color: "rgba(253,250,245,0.9)" }}>
                Les Podcasteur·euses du Sud
              </span>
              <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(253,250,245,0.4)" }}>
                Réseau pro · Région Sud PACA
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: "rgba(253,250,245,0.4)" }}>
            <Link to="/evenements-podcast" className="hover:text-primary transition-colors">Événements</Link>
            <span className="w-1 h-1 rounded-full hidden sm:block" style={{ backgroundColor: "rgba(253,250,245,0.1)" }} />
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <span className="w-1 h-1 rounded-full hidden sm:block" style={{ backgroundColor: "rgba(253,250,245,0.1)" }} />
            <Link to="/mentions-legales" className="hover:text-primary transition-colors">Mentions légales</Link>
            <span className="w-1 h-1 rounded-full hidden sm:block" style={{ backgroundColor: "rgba(253,250,245,0.1)" }} />
            <Link to="/politique-de-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            <span className="w-1 h-1 rounded-full hidden sm:block" style={{ backgroundColor: "rgba(253,250,245,0.1)" }} />
            <Link to="/conditions-utilisation" className="hover:text-primary transition-colors">CGU</Link>
            <span className="w-1 h-1 rounded-full hidden sm:block" style={{ backgroundColor: "rgba(253,250,245,0.1)" }} />
            <Link to="/politique-cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
