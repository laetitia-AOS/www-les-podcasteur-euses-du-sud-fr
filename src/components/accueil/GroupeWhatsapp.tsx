import { useQrSvg } from "@/components/onde/impressionOnde";
import { btnPrimary } from "@/lib/pds";

/**
 * Bouton « Rejoindre le groupe » (sur téléphone, il ouvre WhatsApp directement) et QR code généré à partir du lien,
 * masqué sur petit écran. Ne s'affiche qu'avec un lien reçu de la base pour la personne connectée.
 */
const GroupeWhatsapp = ({ nom, lien }: { nom: string; lien: string }) => {
  const svg = useQrSvg(lien);
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-12">
      <div>
        <p className="text-[15px]">Le groupe de ton département : <strong>{nom}</strong></p>
        <a href={lien} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} mt-3`}>
          Rejoindre le groupe {nom}
        </a>
      </div>
      <figure className="hidden md:block shrink-0">
        {svg ? (
          <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`QR code pour rejoindre le groupe WhatsApp ${nom}`} className="w-[140px] h-[140px] border-2 border-encre bg-surface" />
        ) : (
          <span className="block w-[140px] h-[140px] border-2 border-encre" aria-busy="true" />
        )}
        <figcaption className="mt-1.5 font-mono text-xs text-muted-foreground max-w-[140px]">Scanne-le avec ton téléphone</figcaption>
      </figure>
    </div>
  );
};

export default GroupeWhatsapp;
