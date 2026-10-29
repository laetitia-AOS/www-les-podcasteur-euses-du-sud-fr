import { useState, type ReactNode } from "react";
import { Link, Navigate, NavLink, useLocation } from "react-router-dom";
import { BookOpen, CalendarDays, ExternalLink, Inbox, Loader2, LogOut, Mail, Menu, Users, X } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useATraiter, totalRubrique } from "@/components/admin/useATraiter";

export const RUBRIQUES = [
  { id: "a-traiter", label: "À traiter", to: "/admin", icon: Inbox },
  { id: "membres", label: "Membres", to: "/admin/membres", icon: Users },
  { id: "annuaire", label: "Annuaire", to: "/admin/annuaire", icon: BookOpen },
  { id: "agenda", label: "Agenda", to: "/admin/agenda", icon: CalendarDays },
  { id: "messages", label: "Messages", to: "/admin/messages", icon: Mail },
] as const;

interface Props {
  titre: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** Cadre commun de l'administration : vérification admin, menu latéral, en-tête de rubrique. */
const AdminLayout = ({ titre, description, actions, children }: Props) => {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const { data: compteurs } = useATraiter(isAdmin);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  const total = compteurs ? Object.values(compteurs).reduce((a, b) => a + b, 0) : 0;
  const lien = "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold border-2 transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background";

  const nav = (
    <nav aria-label="Administration" className="flex flex-col gap-1">
      {RUBRIQUES.map((r) => {
        const n = r.id === "a-traiter" ? total : totalRubrique(compteurs, r.id);
        return (
          <NavLink
            key={r.id}
            to={r.to}
            end={r.to === "/admin"}
            onClick={() => setMenuOuvert(false)}
            className={({ isActive }) =>
              `${lien} ${isActive ? "bg-background text-foreground border-background" : "border-transparent text-primary-foreground hover:border-primary-foreground/60"}`
            }
          >
            <r.icon className="w-4 h-4 shrink-0" aria-hidden />
            <span className="flex-1">{r.label}</span>
            {n > 0 && <span className="font-mono text-xs bg-accent text-accent-foreground px-1.5 min-w-[1.4rem] text-center" aria-label={`${n} à traiter`}>{n}</span>}
          </NavLink>
        );
      })}
      <div className="mt-6 pt-4 border-t-2 border-primary-foreground/30 flex flex-col gap-1">
        <Link to="/" className={`${lien} border-transparent text-primary-foreground hover:border-primary-foreground/60`}>
          <ExternalLink className="w-4 h-4" aria-hidden /> Voir le site
        </Link>
        <button type="button" onClick={signOut} className={`${lien} border-transparent text-primary-foreground hover:border-primary-foreground/60 text-left`}>
          <LogOut className="w-4 h-4" aria-hidden /> Déconnexion
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Menu : colonne fixe sur ordinateur, déroulant sur téléphone */}
      <aside className="bg-primary text-primary-foreground md:w-60 md:shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4 md:py-6">
          <Link to="/admin" className="font-display font-black text-lg leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-background">
            Administration
            <span className="block font-mono text-[11px] font-normal tracking-widest uppercase text-accent">Podcasteur·euses du Sud</span>
          </Link>
          <button
            type="button"
            className="md:hidden p-2 border-2 border-primary-foreground/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-background"
            onClick={() => setMenuOuvert((v) => !v)}
            aria-expanded={menuOuvert}
            aria-controls="admin-menu"
          >
            {menuOuvert ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
            <span className="sr-only">{menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}</span>
          </button>
        </div>
        <div id="admin-menu" className={`${menuOuvert ? "block" : "hidden"} md:block px-3 pb-6`}>{nav}</div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="px-4 sm:px-8 py-8 max-w-7xl" key={pathname}>
          <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground">{titre}</h1>
              {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
