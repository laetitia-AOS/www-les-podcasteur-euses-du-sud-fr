// Encart fixe en bas de chaque numéro (et sur /onde) : « L'Onde du Sud est faite avec les sons de ses membres… »
import { Link } from "react-router-dom";
import { btnListen } from "@/lib/pds";
import { SITE_URL } from "@/lib/seo";
import { adresseImprimee } from "@/lib/ondePied";
import { ONDE_DEPOSER, texteEncartDepot, useDepotsCeMois } from "@/lib/ondeDepots";

const EncartDepot = ({ className = "" }: { className?: string }) => {
  const { data: n = 0, isLoading } = useDepotsCeMois();
  return (
    <aside aria-label="Déposer pour L'Onde du Sud" className={`break-inside-avoid border-2 border-encre border-l-[10px] border-l-accent bg-surface p-5 sm:p-7 ${className}`}>
      <p className="text-[17px] sm:text-[19px] font-semibold leading-snug max-w-[60ch]" aria-busy={isLoading}>
        {isLoading ? "L'Onde du Sud est faite avec les sons de ses membres. Dépose le tien avant le 25 pour le prochain numéro." : texteEncartDepot(n)}
      </p>
      <Link to={ONDE_DEPOSER} className={`${btnListen} mt-5`}>Déposer pour L'Onde</Link>
      <span className="hidden print:block mt-1 font-mono text-[11px]">{adresseImprimee(`${SITE_URL}${ONDE_DEPOSER}`)}</span>
    </aside>
  );
};

export default EncartDepot;
