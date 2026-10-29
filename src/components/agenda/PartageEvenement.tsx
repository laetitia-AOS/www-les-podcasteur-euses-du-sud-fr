import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Mail, Share2 } from "lucide-react";
import { dessinerVignette, mailtoPartage, textePartage, type FormatVignette, type InfoPartage } from "@/lib/partageEvenement";

const lienBtn = "inline-flex min-h-[44px] items-center gap-2 border-2 border-foreground bg-card px-3 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Partager un événement : réseaux, lien, texte prêt à publier, et vignettes à télécharger
 * (paysage pour LinkedIn / Facebook, carrée pour Instagram).
 */
const PartageEvenement = ({ info, slug }: { info: InfoPartage; slug: string }) => {
  const [apercu, setApercu] = useState<string | null>(null);
  const [occupe, setOccupe] = useState<FormatVignette | null>(null);
  const texte = textePartage(info);
  const ouvrir = (u: string) => window.open(u, "_blank", "noopener,noreferrer,width=640,height=640");

  // Aperçu de la vignette paysage
  useEffect(() => {
    let url: string | null = null;
    let actif = true;
    dessinerVignette(info, "paysage").then((b) => { if (actif) { url = URL.createObjectURL(b); setApercu(url); } }).catch(() => null);
    return () => { actif = false; if (url) URL.revokeObjectURL(url); };
  }, [info.titre, info.dateLong, info.horaires, info.lieu, info.image, info.tarif]); // eslint-disable-line react-hooks/exhaustive-deps

  const copier = async (t: string, quoi: string) => {
    try { await navigator.clipboard.writeText(t); toast.success(`${quoi} copié.`); }
    catch { toast.error("La copie n'a pas fonctionné."); }
  };

  const telecharger = async (format: FormatVignette) => {
    setOccupe(format);
    try {
      const b = await dessinerVignette(info, format);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `${slug}-${format === "carre" ? "instagram" : "reseaux"}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { toast.error("La vignette n'a pas pu être créée."); }
    setOccupe(null);
  };

  // Partage du téléphone (avec la vignette quand c'est possible)
  const partageNatif = async () => {
    try {
      const b = await dessinerVignette(info, "carre");
      const fichier = new File([b], `${slug}.png`, { type: "image/png" });
      const data: ShareData = { title: `${info.type} : ${info.titre}`, text: texte, url: info.url };
      if (navigator.canShare?.({ ...data, files: [fichier] })) await navigator.share({ ...data, files: [fichier] });
      else await navigator.share(data);
    } catch { /* partage annulé */ }
  };
  const peutPartager = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <section aria-labelledby="partage-titre" className="mt-6 pt-4 border-t border-filet">
      <h2 id="partage-titre" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Partager l'événement</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {peutPartager && (
          <button type="button" onClick={partageNatif} className={lienBtn}><Share2 className="w-4 h-4" aria-hidden /> Partager…</button>
        )}
        <button type="button" onClick={() => ouvrir(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(info.url)}`)} className={lienBtn}>
          LinkedIn<span className="sr-only"> (nouvelle fenêtre)</span>
        </button>
        <button type="button" onClick={() => ouvrir(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(info.url)}`)} className={lienBtn}>
          Facebook<span className="sr-only"> (nouvelle fenêtre)</span>
        </button>
        <button type="button" onClick={() => ouvrir(`https://wa.me/?text=${encodeURIComponent(texte)}`)} className={lienBtn}>
          WhatsApp<span className="sr-only"> (nouvelle fenêtre)</span>
        </button>
        <a href={mailtoPartage(info)} className={lienBtn}><Mail className="w-4 h-4" aria-hidden /> E-mail</a>
        <button type="button" onClick={() => copier(info.url, "Lien")} className={lienBtn}><Copy className="w-4 h-4" aria-hidden /> Copier le lien</button>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold">Vignette à publier</p>
        {apercu ? (
          <img src={apercu} alt={`Affiche de ${info.titre}`} className="mt-2 w-full border-2 border-foreground" width={1200} height={630} />
        ) : (
          <div className="mt-2 aspect-[1200/630] w-full border-2 border-dashed border-border" aria-hidden />
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => telecharger("paysage")} disabled={!!occupe} className={lienBtn}>
            <Download className="w-4 h-4" aria-hidden /> {occupe === "paysage" ? "Création…" : "LinkedIn / Facebook"}
          </button>
          <button type="button" onClick={() => telecharger("carre")} disabled={!!occupe} className={lienBtn}>
            <Download className="w-4 h-4" aria-hidden /> {occupe === "carre" ? "Création…" : "Instagram (carrée)"}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold">Texte prêt à publier</p>
        <textarea readOnly value={texte} rows={8} className="mt-2 w-full border border-input bg-card p-2 text-sm" aria-label="Texte prêt à publier" />
        <button type="button" onClick={() => copier(texte, "Texte")} className={`${lienBtn} mt-2`}><Copy className="w-4 h-4" aria-hidden /> Copier le texte</button>
        <p className="mt-2 text-xs text-muted-foreground">
          Astuce : sur LinkedIn ou Instagram, publiez la vignette avec ce texte, c'est ce qui donne le plus de visibilité.
        </p>
      </div>
    </section>
  );
};

export default PartageEvenement;
