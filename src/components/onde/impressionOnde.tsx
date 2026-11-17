// Version PDF d'un numéro (admin) : dans ce mode, chaque son est remplacé par un QR code et un lien court
// vers son écoute sur la page du numéro (www.les-podcasteur-euses-du-sud.fr/o/1/02). Pas de lecteur audio.
import { createContext, useContext, useEffect, useState } from "react";
import QRCode from "qrcode";
import { adresseImprimee, lienCourt } from "@/lib/ondePied";

/** Vrai dans la version PDF. */
export const ImpressionCtx = createContext(false);
export const useImpression = () => useContext(ImpressionCtx);
/** Numéro et rubrique (« 02 ») du bloc affiché ; sans rubrique : la version audio du numéro. */
export const SonCtx = createContext<{ numero: number; rubrique?: string } | null>(null);

/** QR code d'une adresse, en SVG (zone blanche autour comprise, pour rester lisible à l'impression). */
export const useQrSvg = (url: string | null) => {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    let actif = true;
    QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" })
      .then((s) => { if (actif) setSvg(s); })
      .catch(() => { if (actif) setSvg(null); });
    return () => { actif = false; };
  }, [url]);
  return svg;
};

/** QR code + lien court vers le son du bloc en cours. */
export const QrEcoute = ({ libelle = "Écouter ce son", className = "" }: { libelle?: string; className?: string }) => {
  const son = useContext(SonCtx);
  const url = son ? lienCourt(son.numero, son.rubrique) : null;
  const svg = useQrSvg(url);
  if (!url) return null;
  const adresse = adresseImprimee(url);
  return (
    <div className={`onde-qr flex items-center gap-4 break-inside-avoid ${className}`}>
      {svg ? (
        <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`QR code vers ${adresse}`} className="w-[96px] h-[96px] shrink-0 border-2 border-encre" />
      ) : (
        <span className="w-[96px] h-[96px] shrink-0 border-2 border-encre" aria-busy="true" />
      )}
      <p className="min-w-0 text-[13px] leading-snug">
        <span className="block font-bold text-[16px] leading-tight mb-1">{libelle}</span>
        Scanne le code ou tape l'adresse :
        <span className="block font-mono font-bold text-[13px] break-all">{adresse}</span>
      </p>
    </div>
  );
};

/** QR code + adresse d'un lien externe (version PDF), par exemple la source de « Ce qui bouge ». */
export const QrLien = ({ url, libelle, className = "" }: { url: string; libelle: string; className?: string }) => {
  const svg = useQrSvg(url);
  const adresse = adresseImprimee(url);
  return (
    <div className={`onde-qr flex items-center gap-4 break-inside-avoid ${className}`}>
      {svg ? (
        <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={`QR code vers ${adresse}`} className="w-[96px] h-[96px] shrink-0 border-2 border-encre" />
      ) : (
        <span className="w-[96px] h-[96px] shrink-0 border-2 border-encre" aria-busy="true" />
      )}
      <p className="min-w-0 text-[13px] leading-snug">
        <span className="block font-bold text-[16px] leading-tight mb-1">{libelle}</span>
        Scanne le code ou tape l'adresse :
        <span className="block font-mono font-bold text-[13px] break-all">{adresse}</span>
      </p>
    </div>
  );
};
