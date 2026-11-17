// Éditeur de L'Onde : « Générer la couverture » à partir de la version audio du numéro (fond encre, forme d'onde orange).
// La couverture 1200 × 630 est enregistrée comme couverture du numéro (et sert d'image de partage) ;
// les deux formats se téléchargent. Envoi par onde-fichier : réservé aux admins et éditeur·ices, vérifié par le serveur.
import { useEffect, useState } from "react";
import { Download, Loader2, Waves } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import { titreFiche } from "@/lib/pds";
import { altCouverture, cheminFichier, envoyerFichierOnde, type NumeroOnde } from "@/lib/onde";
import {
  TAILLES_COUVERTURE, dessinerCouverture, formeOndeAudio, nomFichierCouverture, titresDansCeNumero, type FormatCouverture,
} from "@/lib/ondeCouverture";

const FORMATS: FormatCouverture[] = ["portrait", "partage"];
const NOMS: Record<FormatCouverture, string> = { portrait: "LinkedIn et Instagram", partage: "Image de partage" };

const CouvertureOnde = ({ n, resoudre, onCouverture }: {
  n: NumeroOnde; resoudre: (u: string) => string | undefined; onCouverture: (url: string, alt: string) => void;
}) => {
  const [occupe, setOccupe] = useState(false);
  const [apercus, setApercus] = useState<Partial<Record<FormatCouverture, string>>>({});
  useEffect(() => () => Object.values(apercus).forEach((u) => u && URL.revokeObjectURL(u)), [apercus]);

  // Seule la version audio de ce numéro (dossier du numéro dans l'espace privé) peut servir
  const audioDuNumero = !!n.audio_url && (cheminFichier(n.audio_url) || "").startsWith(`${n.id}/`);

  const generer = async () => {
    if (!n.audio_url || !audioDuNumero) return;
    const lien = resoudre(n.audio_url);
    if (!lien) { toast.error("La version audio se prépare : réessaie dans un instant."); return; }
    setOccupe(true);
    try {
      const niveaux = await formeOndeAudio(lien);
      const ids = n.blocs.slice(0, 4).flatMap((b) => (b.type === "podcast" && b.podcast_id ? [b.podcast_id] : []));
      const noms: Record<string, string> = {};
      if (ids.length) {
        const { data } = await supabase.from("podcasts").select("id, nom_podcast, prenom, nom").in("id", ids);
        (data || []).forEach((p) => { noms[p.id] = titreFiche(p); });
      }
      const info = { numero: n.numero, mois: n.mois, titres: titresDansCeNumero(n.blocs, noms), niveaux };
      const [portrait, partage] = await Promise.all(FORMATS.map((f) => dessinerCouverture(info, f)));
      setApercus({ portrait: URL.createObjectURL(portrait), partage: URL.createObjectURL(partage) });
      const fichier = new File([partage], "couverture.png", { type: "image/png" });
      const url = await envoyerFichierOnde(n.id, fichier, "image", { pret: true });
      onCouverture(url, altCouverture(n));
      toast.success("Couverture générée et enregistrée comme couverture du numéro.");
    } catch (e) {
      toast.error((e as Error).message || "La couverture n'a pas pu être générée.");
    } finally {
      setOccupe(false);
    }
  };

  const telecharger = (f: FormatCouverture) => {
    const u = apercus[f];
    if (!u) return;
    const a = document.createElement("a");
    a.href = u;
    a.download = nomFichierCouverture(n, f);
    a.click();
  };

  return (
    <div className="border-2 border-encre bg-surface p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} onClick={generer} disabled={!audioDuNumero || occupe} aria-describedby="couverture-aide">
          {occupe ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Waves className="w-4 h-4" aria-hidden />}
          {occupe ? "Génération…" : "Générer la couverture"}
        </button>
        {FORMATS.map((f) => {
          const [w, h] = TAILLES_COUVERTURE[f];
          return (
            <button key={f} type="button" className={btnSecondary} onClick={() => telecharger(f)} disabled={!apercus[f] || occupe}>
              <Download className="w-4 h-4" aria-hidden /> Télécharger {w}×{h}<span className="sr-only"> ({NOMS[f]})</span>
            </button>
          );
        })}
      </div>
      <p id="couverture-aide" className="text-sm text-muted-foreground">
        {audioDuNumero
          ? "Fond encre, forme d'onde tirée de la version audio du numéro, titres des 4 premiers blocs. La version 1200×630 devient la couverture du numéro et son image de partage."
          : "Charge d'abord la version audio du numéro."}
      </p>
      {(apercus.portrait || apercus.partage) && (
        <div className="grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-start">
          {FORMATS.map((f) => {
            const [w, h] = TAILLES_COUVERTURE[f];
            return apercus[f] ? (
              <figure key={f} className="space-y-1">
                <img src={apercus[f]} alt={`Aperçu de la couverture ${w}×${h}`} className="w-full h-auto border border-filet" />
                <figcaption className="text-xs text-muted-foreground"><span className="font-mono">{w}×{h}</span> · {NOMS[f]}</figcaption>
              </figure>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export default CouvertureOnde;
