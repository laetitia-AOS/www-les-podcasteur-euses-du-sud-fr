// Admin → Agenda : « Créer le post Insta » (admins seulement). Tout est fait dans le navigateur ; rien n'est publié sur Instagram.
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { eventHref } from "@/components/agenda/EventRow";
import { EVENT_TYPE_LABELS, cityFromAddress, isOnline } from "@/components/home/useHomeData";
import { cleanAddress, dateLongue, heureParis, publicDescription, readableTitle, surPlusieursJours } from "@/lib/events";
import { SITE_URL } from "@/lib/seo";
import {
  LEGENDE_MAX, TAILLES_INSTA, dessinerPostInsta, legendeInsta, rappelCollaborateur,
  type FormatInsta, type InfoInsta,
} from "@/lib/partageEvenement";

export type EvenementInsta = {
  id: string; titre: string; sous_titre?: string | null; description?: string | null;
  date_debut: string; date_fin?: string | null; lieu?: string | null; adresse?: string | null;
  type: string; slug?: string | null; format?: string | null; image_url?: string | null; tarif?: string | null;
};

/** Informations de l'événement pour les visuels et la légende (mêmes mises en forme que la page publique). */
export const infoInsta = (e: EvenementInsta): InfoInsta => {
  const enLigne = isOnline({ lieu: e.lieu ?? null, adresse: e.adresse ?? null, format: e.format ?? null });
  const plusieurs = surPlusieursJours(e.date_debut, e.date_fin);
  const horaires = plusieurs
    ? `de ${heureParis(e.date_debut)} (premier jour) à ${heureParis(e.date_fin!)} (dernier jour)`
    : e.date_fin ? `de ${heureParis(e.date_debut)} à ${heureParis(e.date_fin)}` : `à partir de ${heureParis(e.date_debut)}`;
  return {
    titre: readableTitle(e.titre),
    type: EVENT_TYPE_LABELS[e.type] || "Événement",
    typeCode: e.type,
    dateLong: dateLongue(e.date_debut, e.date_fin),
    horaires,
    lieu: e.lieu,
    adresse: e.adresse ? cleanAddress(e.adresse) : null,
    ville: enLigne ? "" : cityFromAddress(e.adresse) || (e.lieu && /marseille/i.test(e.lieu) ? "Marseille" : ""),
    enLigne,
    tarif: e.tarif,
    sousTitre: e.sous_titre,
    description: publicDescription(e.description),
    url: `${SITE_URL}${eventHref({ id: e.id, slug: e.slug ?? null } as Parameters<typeof eventHref>[0])}`,
    image: e.image_url,
  };
};

const btn = "inline-flex min-h-[44px] items-center gap-2 border-2 border-foreground bg-card px-3 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";
const choix = (actif: boolean) =>
  `min-h-[44px] px-4 text-sm font-bold border-2 border-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${actif ? "bg-foreground text-background" : "bg-card"}`;

const NOMS: Record<FormatInsta, string> = { post: "Post 4:5 (1080 × 1350)", story: "Story 9:16 (1080 × 1920)" };

const PostInsta = ({ evenement, compte, onClose }: { evenement: EvenementInsta | null; compte?: string | null; onClose: () => void }) => {
  const info = useMemo(() => (evenement ? infoInsta(evenement) : null), [evenement]);
  const aUnePhoto = !!evenement?.image_url;
  const [avecPhoto, setAvecPhoto] = useState(true);
  const [apercus, setApercus] = useState<Partial<Record<FormatInsta, string>>>({});
  const [occupe, setOccupe] = useState(false);
  const photo = aUnePhoto && avecPhoto;
  const legende = info ? legendeInsta(info, compte) : "";

  useEffect(() => { setAvecPhoto(true); }, [evenement?.id]);

  useEffect(() => {
    if (!info) return;
    let actif = true;
    const urls: string[] = [];
    setOccupe(true);
    Promise.all((["post", "story"] as FormatInsta[]).map(async (f) => {
      const b = await dessinerPostInsta(info, f, photo);
      const u = URL.createObjectURL(b); urls.push(u);
      return [f, u] as const;
    }))
      .then((r) => { if (actif) setApercus(Object.fromEntries(r)); })
      .catch(() => toast.error("Les visuels n'ont pas pu être créés."))
      .finally(() => { if (actif) setOccupe(false); });
    return () => { actif = false; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [info, photo]);

  const telecharger = (f: FormatInsta) => {
    const u = apercus[f];
    if (!u || !evenement) return;
    const a = document.createElement("a");
    a.href = u;
    a.download = `${evenement.slug || "evenement"}-insta-${f}${photo ? "" : "-sans-photo"}.png`;
    a.click();
  };

  const copier = async () => {
    try { await navigator.clipboard.writeText(legende); toast.success("Légende copiée."); }
    catch { toast.error("La copie n'a pas fonctionné : sélectionne le texte et copie-le à la main."); }
  };

  return (
    <Dialog open={!!evenement} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-none sm:rounded-none border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Créer le post Insta</DialogTitle>
          <DialogDescription>{info?.titre} · rien n'est publié automatiquement : télécharge les visuels et copie la légende.</DialogDescription>
        </DialogHeader>

        <div role="group" aria-label="Version du visuel" className="flex flex-wrap gap-2">
          <button type="button" className={choix(photo)} aria-pressed={photo} disabled={!aUnePhoto} onClick={() => setAvecPhoto(true)}>Avec la photo</button>
          <button type="button" className={choix(!photo)} aria-pressed={!photo} onClick={() => setAvecPhoto(false)}>Sans photo</button>
          {!aUnePhoto && <p className="self-center text-sm text-muted-foreground">Pas de photo pour cet événement : version typographique.</p>}
          {aUnePhoto && <p className="self-center text-sm text-muted-foreground">« Sans photo » si la photo appartient à l'organisateur.</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-5" aria-busy={occupe}>
          {(["post", "story"] as FormatInsta[]).map((f) => {
            const [w, h] = TAILLES_INSTA[f];
            return (
              <figure key={f} className="space-y-2">
                <figcaption className="font-mono text-[13px] font-bold">{NOMS[f]}</figcaption>
                <div className="border-2 border-foreground bg-muted mx-auto" style={{ aspectRatio: `${w} / ${h}`, maxHeight: 460 }}>
                  {apercus[f]
                    ? <img src={apercus[f]} alt={`Aperçu du visuel ${f === "post" ? "post" : "story"}${photo ? " avec la photo" : " sans photo"}`} className="w-full h-full object-contain" />
                    : <span className="flex h-full items-center justify-center"><Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-hidden /></span>}
                </div>
                <button type="button" className={btn} onClick={() => telecharger(f)} disabled={!apercus[f] || occupe}>
                  <Download className="w-4 h-4" aria-hidden /> Télécharger en PNG<span className="sr-only"> : {NOMS[f]}</span>
                </button>
              </figure>
            );
          })}
        </div>

        <div className="space-y-2">
          <label htmlFor="legende-insta" className="block text-sm font-bold">Légende prête à copier</label>
          <textarea id="legende-insta" readOnly value={legende} rows={10} className="w-full border-2 border-foreground bg-card p-3 text-[15px] font-sans" />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={btn} onClick={copier}><Copy className="w-4 h-4" aria-hidden /> Copier</button>
            <span className="font-mono text-[12px] text-muted-foreground">{legende.length} / {LEGENDE_MAX} caractères</span>
          </div>
          <p className="border-l-4 border-accent pl-3 text-[15px] font-semibold">{rappelCollaborateur(compte)}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostInsta;
