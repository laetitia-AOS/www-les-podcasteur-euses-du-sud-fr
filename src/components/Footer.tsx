import { Link } from "react-router-dom";
import { container } from "@/lib/pds";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-encre">
      <div className={`${container} py-8 flex flex-col gap-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[15px]">Les Podcasteur·euses du Sud · association · Marseille</p>
          <ul className="flex flex-wrap items-center gap-x-6">
            <li>
              <a href="https://www.instagram.com/les_podcasteur.euses_du_sud/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline underline-offset-4">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/company/les-podcasteur-euses-du-sud/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center underline underline-offset-4">
                LinkedIn
              </a>
            </li>
            <li>
              <Link to="/contact" className="inline-flex min-h-[44px] items-center underline underline-offset-4">Contact</Link>
            </li>
          </ul>
        </div>
        <ul className="flex flex-wrap gap-x-5 text-sm text-muted-foreground border-t border-filet pt-3">
          <li><Link to="/mentions-legales" className="inline-flex min-h-[44px] items-center hover:text-foreground">Mentions légales</Link></li>
          <li><Link to="/politique-de-confidentialite" className="inline-flex min-h-[44px] items-center hover:text-foreground">Confidentialité</Link></li>
          <li><Link to="/conditions-utilisation" className="inline-flex min-h-[44px] items-center hover:text-foreground">Conditions d'utilisation</Link></li>
          <li><Link to="/politique-cookies" className="inline-flex min-h-[44px] items-center hover:text-foreground">Cookies</Link></li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
