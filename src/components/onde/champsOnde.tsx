// Champs communs de l'éditeur de L'Onde du Sud (mêmes composants que le reste de l'administration).
import { useRef, type ReactNode } from "react";
import { Bold, Italic, Link2, Loader2, Upload } from "lucide-react";
import TexteRiche from "@/components/onde/TexteRiche";
import { Compteur, btnOutil } from "@/components/onde/adminOnde";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { btnSecondary } from "@/lib/pds";

export const Champ = ({ id, label, max, n, aide, children }: { id: string; label: string; max?: number; n?: number; aide?: ReactNode; children: ReactNode }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-baseline gap-3">
      <Label htmlFor={id}>{label}</Label>
      {max !== undefined && n !== undefined && <Compteur n={n} max={max} />}
    </div>
    {children}
    {aide && <p className="text-xs text-muted-foreground">{aide}</p>}
  </div>
);

/** Bouton d'envoi de fichier, au style des boutons secondaires de l'admin. */
export const BoutonFichier = ({ label, accept, enCours, multiple, onFiles }: { label: string; accept: string; enCours: boolean; multiple?: boolean; onFiles: (f: File[]) => void }) => (
  <label className={`${btnSecondary} cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary ${enCours ? "opacity-60 pointer-events-none" : ""}`}>
    {enCours ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Upload className="w-4 h-4" aria-hidden />}
    {enCours ? "Envoi en cours…" : label}
    <input type="file" accept={accept} multiple={multiple} className="sr-only" disabled={enCours} onChange={(e) => { onFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
  </label>
);

/** Texte avec gras, italique et liens : on sélectionne des mots puis on clique sur un bouton. */
export const ChampTexteRiche = ({ id, value, onChange, rows = 8 }: { id: string; value: string; onChange: (v: string) => void; rows?: number }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const entourer = (avant: string, apres: string, defaut: string, choisirApres?: [number, number]) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || defaut;
    onChange(value.slice(0, s) + avant + sel + apres + value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      if (choisirApres) {
        const debut = s + avant.length + sel.length + choisirApres[0];
        el.setSelectionRange(debut, debut + choisirApres[1]);
      } else {
        el.setSelectionRange(s + avant.length, s + avant.length + sel.length);
      }
    });
  };
  const aMiseEnForme = /\*|\[/.test(value);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Mise en forme du texte">
        <button type="button" className={btnOutil} onClick={() => entourer("**", "**", "texte en gras")}><Bold className="w-4 h-4" aria-hidden /> Gras</button>
        <button type="button" className={btnOutil} onClick={() => entourer("*", "*", "texte en italique")}><Italic className="w-4 h-4" aria-hidden /> Italique</button>
        <button type="button" className={btnOutil} onClick={() => entourer("[", "](https://)", "texte du lien", [2, 8])}><Link2 className="w-4 h-4" aria-hidden /> Lien</button>
      </div>
      <Textarea id={id} ref={ref} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      <p className="text-xs text-muted-foreground">
        Sélectionnez des mots puis cliquez sur Gras, Italique ou Lien. Pour un lien, collez l'adresse à la place de « https:// ». Laissez une ligne vide entre deux paragraphes.
      </p>
      {aMiseEnForme && (
        <div className="border border-filet bg-background p-3 text-[15px]">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Rendu sur le site</p>
          <TexteRiche texte={value} />
        </div>
      )}
    </div>
  );
};
