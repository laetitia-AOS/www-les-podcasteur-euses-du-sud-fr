import { useId, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

type Props = {
  /** Nombre de filtres actifs, affiché dans le bouton : « Filtrer (2) » */
  actifs: number;
  children: ReactNode;
  className?: string;
};

/**
 * Sur téléphone (moins de 768 px), les filtres sont repliés derrière un bouton « Filtrer ».
 * À partir de 768 px, ils sont toujours affichés et le bouton disparaît.
 */
const FiltresRepliables = ({ actifs, children, className = "" }: Props) => {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-controls={id}
        className="md:hidden w-full min-h-[48px] px-4 inline-flex items-center justify-between gap-3 border-2 border-encre bg-surface font-bold text-[16px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-accent"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" aria-hidden />
          {actifs > 0 ? `Filtrer (${actifs})` : "Filtrer"}
        </span>
        <span aria-hidden className="text-sm font-normal">{ouvert ? "Fermer" : "Ouvrir"}</span>
      </button>
      <div id={id} className={`${ouvert ? "block mt-4" : "hidden"} md:block md:mt-0`}>
        {children}
      </div>
    </div>
  );
};

export default FiltresRepliables;
