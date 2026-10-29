import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import logoPds from "@/assets/logo-pds.png";
import { linkUnderline } from "@/lib/pds";

/** Gabarit des pages de connexion (membre, admin, mot de passe) : bandeau avec le logo, colonne étroite. */
export const ConnexionShell = ({ espace, children }: { espace: string; children: ReactNode }) => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-encre">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 min-h-[64px] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-h-[44px]" aria-label="Retour à l'accueil des Podcasteur·euses du Sud">
          <img src={logoPds} alt="" className="w-10 h-10 object-cover" width="40" height="40" />
          <span className="font-bold text-[17px]">{espace}</span>
        </Link>
        <Link to="/" className={`${linkUnderline} text-sm min-h-[44px] inline-flex items-center`}>Retour au site</Link>
      </div>
    </header>
    <main className="mx-auto max-w-[520px] px-5 sm:px-8 py-14 sm:py-20">{children}</main>
  </div>
);

/** Écran affiché pendant la vérification d'un lien de connexion ou de réinitialisation. */
export const ConnexionEnCours = ({ texte = "Connexion en cours…" }: { texte?: string }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-5" role="status" aria-live="polite">
    <img src={logoPds} alt="Les Podcasteur·euses du Sud" className="w-20 h-20 object-cover" width="80" height="80" />
    <p className="title-section text-[28px] sm:text-[34px] text-center">{texte}</p>
    <span aria-hidden className="block w-40 h-1 bg-muted overflow-hidden">
      <span className="block h-full w-1/3 bg-primary motion-safe:animate-[connexion_1.2s_ease-in-out_infinite]" />
    </span>
  </div>
);
