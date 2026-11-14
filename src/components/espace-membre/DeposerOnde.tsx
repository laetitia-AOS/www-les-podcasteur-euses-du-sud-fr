// Espace membre : « Déposer pour L'Onde » (lot 5). Réservé aux adhérent·es à jour (vérifié par la base : peut_deposer_onde,
// puis par la fonction serveur « onde-depot »). Le membre ne voit que ses propres dépôts (mes_depots_onde).
import { useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sectionTitle } from "@/components/espace-membre/types";
import { btnPrimary, btnSecondary, formatShortDate, linkUnderline } from "@/lib/pds";
import { IMAGE_TYPES, useFichiersEquipe } from "@/lib/onde";
import {
  ANCRE_DEPOT, CASE_ACCORD, CASE_DROITS, LIMITES_DEPOT, TYPES_DEPOT, envoyerDepot, erreursDepot, libelleTypeDepot,
  lienPublication, retirerDepot, statutMembre, type ChampsDepot, type MonDepot,
} from "@/lib/ondeDepots";

const field = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";
const vide: ChampsDepot = { type: "", titre: "", texte: "", son: "fichier", audio: null, lien: "", photo: null, retirerPhoto: false, droits: false, accord: false };

const DeposerOnde = ({ adhererHref }: { adhererHref: string }) => {
  const id = useId();
  const qc = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [c, setC] = useState<ChampsDepot>(vide);
  const [modifie, setModifie] = useState<MonDepot | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState("");
  const [aRetirer, setARetirer] = useState<MonDepot | null>(null);
  const [cle, setCle] = useState(0); // remet à zéro les champs de fichier

  const { data: peut, isLoading: chargePeut } = useQuery({
    queryKey: ["onde-peut-deposer"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("peut_deposer_onde");
      if (error) throw error;
      return !!data;
    },
  });
  const { data: depots = [] } = useQuery({
    queryKey: ["mes-depots-onde"],
    queryFn: async (): Promise<MonDepot[]> => {
      const { data, error } = await supabase.rpc("mes_depots_onde");
      if (error) throw error;
      return (data || []) as MonDepot[];
    },
  });
  const resoudre = useFichiersEquipe(depots.flatMap((d) => [d.audio_url || "", d.photo_url || ""]).filter(Boolean));

  const maj = (p: Partial<ChampsDepot>) => setC((x) => ({ ...x, ...p }));
  const recommencer = () => { setC(vide); setModifie(null); setErr({}); setMsg(""); setCle((k) => k + 1); };

  const modifier = (d: MonDepot) => {
    setModifie(d);
    setC({
      depotId: d.id, type: d.type, titre: d.titre, texte: d.texte, son: d.audio_url ? "fichier" : "lien", audio: null,
      lien: d.lien_ecoute || "", photo: null, retirerPhoto: false, droits: false, accord: false, aDejaUnMp3: !!d.audio_url,
    });
    setErr({});
    setMsg("");
    setCle((k) => k + 1);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    const x = erreursDepot(c);
    setErr(x);
    setMsg("");
    if (Object.keys(x).length) {
      requestAnimationFrame(() => document.getElementById(`${id}-erreurs`)?.focus());
      return;
    }
    setEnvoi(true);
    try {
      await envoyerDepot(c);
      toast.success(modifie ? "Dépôt modifié" : "Dépôt reçu : merci ! L'équipe de L'Onde le lira pour le prochain numéro.");
      recommencer();
      qc.invalidateQueries({ queryKey: ["mes-depots-onde"] });
      qc.invalidateQueries({ queryKey: ["onde-depots-ce-mois"] });
    } catch (er) {
      setMsg((er as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  const retirer = async () => {
    const d = aRetirer;
    setARetirer(null);
    if (!d) return;
    try {
      await retirerDepot(d.id);
      if (modifie?.id === d.id) recommencer();
      toast.success("Dépôt retiré");
      qc.invalidateQueries({ queryKey: ["mes-depots-onde"] });
      qc.invalidateQueries({ queryKey: ["onde-depots-ce-mois"] });
    } catch (er) {
      toast.error((er as Error).message);
    }
  };

  const desc = (k: string) => (err[k] ? `${id}-e-${k}` : undefined);
  const erreur = (k: string) => (err[k] ? <p id={`${id}-e-${k}`} className="mt-1 text-sm text-destructive">{err[k]}</p> : null);

  return (
    <section id={ANCRE_DEPOT} aria-labelledby={`${id}-titre`} className="scroll-mt-6">
      <h2 id={`${id}-titre`} className={`${sectionTitle} pb-3 border-b-2 border-encre`}>Déposer pour L'Onde</h2>
      <p className="mt-4 text-[15px] max-w-[66ch]">
        L'Onde du Sud, la lettre mensuelle, se fabrique d'abord avec ce que déposent les adhérent·es : un son, une écoute, un projet,
        les coulisses d'une fabrication. L'équipe pioche chaque mois. Déposez avant le 25 pour le numéro suivant.
      </p>

      {chargePeut ? (
        <Loader2 className="mt-5 w-5 h-5 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
      ) : !peut ? (
        <div className="mt-5 border-2 border-primary bg-primary/5 p-5 sm:p-6">
          <p className="font-bold text-[17px]">Le dépôt est réservé aux adhérent·es à jour</p>
          <p className="mt-2 text-[15px] max-w-[62ch]">Avec l'adhésion, vous pouvez proposer vos sons pour L'Onde du Sud, en plus de la visibilité de votre fiche.</p>
          <Link to={adhererHref} className={`${btnPrimary} mt-4`}>Adhérer</Link>
        </div>
      ) : (
        <form ref={formRef} onSubmit={soumettre} noValidate className="mt-6 bg-surface border border-filet p-5 sm:p-7 space-y-6 scroll-mt-6">
          <p className="font-bold text-[18px]">{modifie ? `Modifier « ${modifie.titre} »` : "Nouveau dépôt"}</p>

          {Object.keys(err).length > 0 && (
            <div id={`${id}-erreurs`} tabIndex={-1} role="alert" className="border-2 border-destructive p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <p className="font-bold">Il manque quelque chose :</p>
              <ul className="list-disc pl-6 mt-1 text-[15px]">{Object.values(err).map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}

          <fieldset aria-describedby={desc("type")}>
            <legend className="block text-sm font-bold mb-2">Ce que je dépose *</legend>
            <div className="grid sm:grid-cols-2 gap-2">
              {TYPES_DEPOT.map((t) => (
                <label key={t.id} className="flex items-start gap-3 min-h-[48px] border-2 border-encre bg-background px-3 py-2.5 cursor-pointer has-[:checked]:bg-primary/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
                  <input type="radio" name={`${id}-type`} value={t.id} checked={c.type === t.id} onChange={() => maj({ type: t.id })} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
                  <span className="text-[15px] leading-snug">{t.label}</span>
                </label>
              ))}
            </div>
            {erreur("type")}
          </fieldset>

          <div>
            <div className="flex justify-between items-baseline gap-3 mb-1">
              <label htmlFor={`${id}-t`} className="block text-sm font-bold">Titre *</label>
              <span className={`font-mono text-xs ${c.titre.length > LIMITES_DEPOT.titre ? "text-destructive font-bold" : "text-muted-foreground"}`}>{c.titre.length} / {LIMITES_DEPOT.titre}</span>
            </div>
            <input id={`${id}-t`} value={c.titre} onChange={(e) => maj({ titre: e.target.value })} className={field} aria-invalid={!!err.titre} aria-describedby={desc("titre")} />
            {erreur("titre")}
          </div>

          <div>
            <div className="flex justify-between items-baseline gap-3 mb-1">
              <label htmlFor={`${id}-x`} className="block text-sm font-bold">Quelques lignes *</label>
              <span className={`font-mono text-xs ${c.texte.length > LIMITES_DEPOT.texte ? "text-destructive font-bold" : "text-muted-foreground"}`}>{c.texte.length} / {LIMITES_DEPOT.texte}</span>
            </div>
            <p id={`${id}-x-aide`} className="text-sm text-muted-foreground mb-1.5">Ce qu'on entend, et comment c'est fait.</p>
            <textarea id={`${id}-x`} rows={5} value={c.texte} onChange={(e) => maj({ texte: e.target.value })} className={`${field} py-2`} aria-invalid={!!err.texte} aria-describedby={[`${id}-x-aide`, desc("texte")].filter(Boolean).join(" ")} />
            {erreur("texte")}
          </div>

          <fieldset aria-describedby={desc("son")}>
            <legend className="block text-sm font-bold mb-2">Le son *</legend>
            <div className="flex flex-wrap gap-2">
              {([["fichier", "Un fichier MP3"], ["lien", "Un lien d'écoute"]] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 min-h-[44px] border-2 border-encre bg-background px-3 cursor-pointer has-[:checked]:bg-primary/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
                  <input type="radio" name={`${id}-son`} value={v} checked={c.son === v} onChange={() => maj({ son: v })} className="h-5 w-5 accent-primary" />
                  <span className="text-[15px]">{l}</span>
                </label>
              ))}
            </div>
            {c.son === "fichier" ? (
              <div className="mt-3">
                <label htmlFor={`${id}-mp3`} className="block text-sm font-bold mb-1">{c.aDejaUnMp3 ? "Remplacer le MP3 (facultatif)" : "Fichier MP3"}</label>
                {c.aDejaUnMp3 && modifie?.audio_url && <audio controls preload="none" src={resoudre(modifie.audio_url)} className="w-full max-w-xl mb-2" aria-label="Écouter le MP3 déjà déposé" />}
                <input key={`mp3-${cle}`} id={`${id}-mp3`} type="file" accept="audio/mpeg,.mp3" onChange={(e) => maj({ audio: e.target.files?.[0] || null })} className="block text-[15px] file:mr-3 file:min-h-[44px] file:px-4 file:border-2 file:border-encre file:bg-background file:font-bold file:cursor-pointer" />
                <p className="mt-1 text-sm text-muted-foreground">MP3 de 20 Mo au maximum.</p>
              </div>
            ) : (
              <div className="mt-3">
                <label htmlFor={`${id}-lien`} className="block text-sm font-bold mb-1">Lien d'écoute</label>
                <input id={`${id}-lien`} type="url" inputMode="url" placeholder="https://…" value={c.lien} onChange={(e) => maj({ lien: e.target.value })} className={field} />
              </div>
            )}
            {erreur("son")}
          </fieldset>

          <div>
            <label htmlFor={`${id}-photo`} className="block text-sm font-bold mb-1">Une photo (facultatif)</label>
            {modifie?.photo_url && !c.retirerPhoto && !c.photo && (
              <div className="flex items-center gap-3 mb-2">
                <img src={resoudre(modifie.photo_url)} alt="" className="w-24 aspect-[4/3] object-cover border border-filet" />
                <button type="button" className={`${linkUnderline} text-sm min-h-[44px]`} onClick={() => maj({ retirerPhoto: true })}>Retirer la photo</button>
              </div>
            )}
            <input key={`photo-${cle}`} id={`${id}-photo`} type="file" accept={IMAGE_TYPES.join(",")} onChange={(e) => maj({ photo: e.target.files?.[0] || null })} className="block text-[15px] file:mr-3 file:min-h-[44px] file:px-4 file:border-2 file:border-encre file:bg-background file:font-bold file:cursor-pointer" aria-describedby={desc("photo")} />
            <p className="mt-1 text-sm text-muted-foreground">JPG, PNG ou WebP, réduite automatiquement (3 Mo au maximum).</p>
            {erreur("photo")}
          </div>

          <div className="space-y-3">
            {([["droits", CASE_DROITS], ["accord", CASE_ACCORD]] as const).map(([k, texte]) => (
              <div key={k}>
                <label htmlFor={`${id}-${k}`} className="flex items-start gap-3 text-[15px] cursor-pointer">
                  <input id={`${id}-${k}`} type="checkbox" checked={c[k]} onChange={(e) => maj({ [k]: e.target.checked })} className="mt-1 h-5 w-5 shrink-0 accent-primary" aria-invalid={!!err[k]} aria-describedby={desc(k)} />
                  <span>{texte} *</span>
                </label>
                {erreur(k)}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={btnPrimary} disabled={envoi}>
              {envoi && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
              {envoi ? "Envoi en cours…" : modifie ? "Enregistrer les modifications" : "Envoyer mon dépôt"}
            </button>
            {modifie && <button type="button" className={btnSecondary} onClick={recommencer} disabled={envoi}>Annuler</button>}
          </div>
          {msg && <p role="alert" className="text-destructive font-semibold">{msg}</p>}
          <p className="text-xs text-muted-foreground">{LIMITES_DEPOT.parMois} dépôts par mois au maximum. Vous pouvez modifier ou retirer un dépôt tant qu'il n'est pas publié.</p>
        </form>
      )}

      <h3 className="font-bold text-xl mt-10 mb-3">Mes dépôts</h3>
      {depots.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">Aucun dépôt pour l'instant.</p>
      ) : (
        <ul className="border-t-2 border-encre divide-y divide-filet">
          {depots.map((d) => {
            const publie = lienPublication(d);
            return (
              <li key={d.id} className="py-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs flex flex-wrap items-center gap-2">
                    <span className="border border-encre px-1.5 py-0.5">{libelleTypeDepot(d.type)}</span>
                    <span className="text-muted-foreground">{formatShortDate(d.created_at)}</span>
                  </p>
                  <p className="font-bold mt-1">{d.titre}</p>
                  <p className="mt-1 text-sm">
                    <span className={`inline-block px-1.5 py-0.5 font-bold ${publie ? "bg-primary text-primary-foreground" : d.statut === "retenu" ? "bg-accent text-accent-foreground" : "border border-encre"}`}>{statutMembre(d)}</span>
                    {publie && <Link to={publie} className={`${linkUnderline} ml-3 inline-flex items-center gap-1 min-h-[44px]`}>Voir le numéro <ExternalLink className="w-3.5 h-3.5" aria-hidden /></Link>}
                  </p>
                </div>
                {!publie && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={btnSecondary} onClick={() => modifier(d)} disabled={!peut}>Modifier<span className="sr-only"> : {d.titre}</span></button>
                    <button type="button" className={btnSecondary} onClick={() => setARetirer(d)}>Retirer<span className="sr-only"> : {d.titre}</span></button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!aRetirer} onOpenChange={(o) => !o && setARetirer(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer « {aRetirer?.titre} » ?</AlertDialogTitle>
            <AlertDialogDescription>Le dépôt et ses fichiers sont effacés : l'équipe de L'Onde ne pourra plus l'utiliser.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={retirer}>Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default DeposerOnde;
