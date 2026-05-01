import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

interface AdhesionPromoCardProps {
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Bandeau de promotion de l'adhésion.
 * Message clé : adhérer = activer la visibilité de son profil/podcast sur le site.
 * Sans adhésion : profil enregistré dans la base mais pas mis en avant.
 */
const AdhesionPromoCard = ({ variant = "default", className = "" }: AdhesionPromoCardProps) => {
  if (variant === "compact") {
    return (
      <div
        className={`bg-secondary/15 border border-secondary/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${className}`}
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-secondary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">
              Adhérez pour activer votre visibilité
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              Sans adhésion, votre profil reste enregistré dans la base mais n'est pas mis en avant dans l'annuaire ni sur le flux.
            </p>
          </div>
        </div>
        <Link
          to="/rejoindre-association"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold hover:brightness-110 transition-all shadow-sm"
        >
          Adhérer à l'association
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`bg-secondary/15 border-2 border-secondary/40 rounded-2xl p-6 sm:p-7 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-lg text-foreground mb-2">
            Adhérez pour activer votre visibilité
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            En adhérant à l'association, votre fiche et vos podcasts sont <strong className="text-foreground font-semibold">activés et mis en avant</strong> dans l'annuaire et sur le flux du site.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Sans adhésion, votre profil reste bien enregistré dans notre base de données mais n'est pas publié publiquement.
          </p>
          <Link
            to="/rejoindre-association"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold hover:brightness-110 transition-all shadow-md"
          >
            Adhérer à l'association
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdhesionPromoCard;
