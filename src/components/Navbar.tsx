import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, User, X } from "lucide-react";
import logoPds from "@/assets/logo-pds.png";
import { btnPrimary, container } from "@/lib/pds";

const links = [
  { label: "Écouter", href: "/ecouter", match: ["/ecouter", "/podcasts", "/podcasteur"] },
  { label: "Annuaire", href: "/annuaire-podcasts", match: ["/annuaire-podcasts"] },
  { label: "Studios", href: "/studios-podcast", match: ["/studios-podcast", "/annuaire-podcasts/studios"] },
  { label: "Agenda", href: "/evenements-podcast", match: ["/evenements-podcast", "/evenement-podcast", "/proposer-evenement-podcast", "/agenda"] },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const isActive = (match: string[]) => {
    const p = location.pathname;
    // Les fiches studio sont sous /annuaire-podcasts/studios : elles appartiennent à « Studios »
    if (match.includes("/annuaire-podcasts") && p.startsWith("/annuaire-podcasts/studios")) return false;
    return match.some((m) => p === m || p.startsWith(`${m}/`));
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background border-b border-encre">
      <div className={`${container} flex items-center justify-between h-16 md:h-[76px] gap-4`}>
        <Link to="/" className="flex items-center gap-3 min-h-[44px] shrink-0" aria-label="Les Podcasteur·euses du Sud, accueil">
          <img src={logoPds} alt="" className="w-10 h-10 md:w-11 md:h-11 object-cover" width="44" height="44" />
          <span className="title-section text-[17px] md:text-[20px] leading-none hidden min-[480px]:block">
            Les Podcasteur·euses du Sud
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const active = isActive(l.match);
            return (
              <NavLink
                key={l.href}
                to={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-3 min-h-[44px] inline-flex items-center text-[17px] font-semibold hover:text-primary ${
                  active ? "after:absolute after:left-3 after:right-3 after:bottom-1 after:h-[3px] after:bg-accent" : ""
                }`}
              >
                {l.label}
              </NavLink>
            );
          })}
          <Link to="/rejoindre-association" className={`${btnPrimary} ml-4 px-6`}>
            Adhérer
          </Link>
          <Link
            to="/espace-membre"
            className="ml-3 w-11 h-11 inline-flex items-center justify-center hover:text-primary"
            aria-label="Espace membre"
            title="Espace membre"
          >
            <User className="w-6 h-6" strokeWidth={1.75} />
          </Link>
        </nav>

        <div className="flex lg:hidden items-center gap-1">
          <Link to="/rejoindre-association" className={`${btnPrimary} px-4 text-sm`}>
            Adhérer
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-11 h-11 inline-flex items-center justify-center"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" aria-label="Navigation principale" className="lg:hidden border-t border-encre bg-background">
          <ul className={`${container} py-2`}>
            {links.map((l) => {
              const active = isActive(l.match);
              return (
                <li key={l.href} className="border-b border-filet last:border-0">
                  <Link
                    to={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center min-h-[52px] text-lg font-bold ${active ? "underline decoration-accent decoration-[3px] underline-offset-[6px]" : ""}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link to="/espace-membre" className="flex items-center gap-2 min-h-[52px] text-lg font-bold">
                <User className="w-5 h-5" /> Espace membre
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
