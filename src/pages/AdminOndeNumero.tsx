import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowDown, ArrowUp, BarChart3, CalendarDays, CalendarRange, Check, Eye, Image as ImageIcon, Loader2,
  Mic, Music, MousePointerClick, Plus, Trash2, Type, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import AdminLayout from "@/components/admin/AdminLayout";
import { BadgeStatut, btnIcone, dateHeure, messageOnde, useNomsEquipe } from "@/components/onde/adminOnde";
import { BoutonFichier, Champ, ChampTexteRiche } from "@/components/onde/champsOnde";
import { EditeurEvenements, EditeurNouveauxMembres, EditeurPodcast } from "@/components/onde/EditeursAuto";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import {
  IMAGE_TYPES, LIMITES_ONDE, NOM_ONDE, ONDE_COLUMNS_EQUIPE, TYPES_BLOCS, deplacer, envoyerFichierOnde, etiquetteNumero,
  fichiersNumero, libelleType, manquesPublication, nouveauBloc, numeroRubrique, ondeHref, slugOnde, useFichiersEquipe,
  type Bloc, type NumeroOnde, type TypeBloc,
} from "@/lib/onde";

type Etat = { t: "ok" | "modifie" | "encours" | "erreur"; msg?: string; quand?: Date };
type Envoi = (cle: string, file: File, sorte: "image" | "audio", apres: (url: string) => void) => Promise<void>;

const ICONES: Record<TypeBloc, typeof Type> = {
  texte: Type, images: ImageIcon, audio: Music, bouton: MousePointerClick, chiffres: BarChart3,
  evenements: CalendarDays, podcast: Mic, nouveaux_membres: Users, trimestre: CalendarRange,
};

const EditeurBloc = ({
  b, i, total, numeroId, resoudre, envoi, envoyer, onChange, onMove, onDelete,
}: {
  b: Bloc; i: number; total: number; numeroId: string; resoudre: (u: string) => string; envoi: string | null; envoyer: Envoi;
  onChange: (b: Bloc) => void; onMove: (sens: -1 | 1) => void; onDelete: () => void;
}) => {
  const Icone = ICONES[b.type];
  const pid = `bloc-${b.id}`;
  return (
    <li className="border-2 border-encre bg-surface scroll-mt-24" id={pid}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-filet">
        <span className="font-mono font-bold text-lg shrink-0">{numeroRubrique(i)}</span>
        <span className="flex-1 min-w-0 inline-flex items-center gap-1.5 font-bold leading-tight"><Icone className="w-4 h-4 shrink-0" aria-hidden /> {libelleType(b.type)}</span>
        <button type="button" className={btnIcone} onClick={() => onMove(-1)} disabled={i === 0} aria-label={`Monter le bloc ${numeroRubrique(i)}`}><ArrowUp className="w-4 h-4" aria-hidden /></button>
        <button type="button" className={btnIcone} onClick={() => onMove(1)} disabled={i === total - 1} aria-label={`Descendre le bloc ${numeroRubrique(i)}`}><ArrowDown className="w-4 h-4" aria-hidden /></button>
        <button type="button" className={btnIcone} onClick={onDelete} aria-label={`Supprimer le bloc ${numeroRubrique(i)}`}><Trash2 className="w-4 h-4" aria-hidden /></button>
      </div>
      <div className="p-4 space-y-4">
        <Champ id={`${pid}-rubrique`} label="Étiquette de rubrique" max={LIMITES_ONDE.rubrique} n={(b.rubrique || "").length} aide={`Affichée au-dessus du bloc : « ${numeroRubrique(i)} — ${b.rubrique || "…"} ».`}>
          <Input id={`${pid}-rubrique`} value={b.rubrique || ""} placeholder="Ex. : Le prochain atelier, À l'écoute, Le trimestre du collectif" onChange={(e) => onChange({ ...b, rubrique: e.target.value })} />
        </Champ>

        {(b.type === "texte" || b.type === "trimestre") && (
          <>
            <Champ id={`${pid}-titre`} label="Titre du bloc" max={LIMITES_ONDE.titreBloc} n={(b.titre || "").length}>
              <Input id={`${pid}-titre`} value={b.titre || ""} onChange={(e) => onChange({ ...b, titre: e.target.value })} />
            </Champ>
            <Champ id={`${pid}-texte`} label="Texte" max={LIMITES_ONDE.texte} n={(b.texte || "").length}>
              <ChampTexteRiche id={`${pid}-texte`} value={b.texte || ""} onChange={(v) => onChange({ ...b, texte: v })} />
            </Champ>
          </>
        )}

        {b.type === "images" && (
          <div className="space-y-3">
            {b.images.length > 0 && (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {b.images.map((img, k) => (
                  <li key={`${img.url}-${k}`} className="space-y-2">
                    <div className="relative">
                      <img src={resoudre(img.url)} alt="" className="w-full aspect-[4/3] object-cover border border-filet" />
                      <button
                        type="button"
                        className={`${btnIcone} absolute top-2 right-2`}
                        onClick={() => onChange({ ...b, images: b.images.filter((_, x) => x !== k) })}
                        aria-label={`Retirer la photo ${k + 1}`}
                      >
                        <X className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                    <Champ id={`${pid}-alt-${k}`} label={`Texte alternatif de la photo ${k + 1} *`} max={LIMITES_ONDE.alt} n={(img.alt || "").length}>
                      <Input
                        id={`${pid}-alt-${k}`}
                        value={img.alt || ""}
                        placeholder="Ce que montre la photo"
                        aria-invalid={!(img.alt || "").trim()}
                        onChange={(e) => onChange({ ...b, images: b.images.map((x, y) => (y === k ? { ...x, alt: e.target.value } : x)) })}
                      />
                    </Champ>
                  </li>
                ))}
              </ul>
            )}
            {b.images.length < LIMITES_ONDE.imagesMax && (
              <BoutonFichier
                label={b.images.length ? "Ajouter des photos" : "Envoyer des photos"}
                accept={IMAGE_TYPES.join(",")}
                multiple
                enCours={envoi === pid}
                onFiles={async (files) => {
                  const place = LIMITES_ONDE.imagesMax - b.images.length;
                  if (files.length > place) toast.error(`6 photos au maximum : seules les ${place} premières sont ajoutées.`);
                  const ajout: { url: string; alt: string }[] = [];
                  for (const f of files.slice(0, place)) {
                    await envoyer(pid, f, "image", (url) => ajout.push({ url, alt: "" }));
                  }
                  if (ajout.length) onChange({ ...b, images: [...b.images, ...ajout] });
                }}
              />
            )}
            <p className="text-xs text-muted-foreground">De 1 à 6 photos (JPG, PNG ou WebP), réduites automatiquement pour le web. Chaque photo a besoin d'un texte alternatif.</p>
          </div>
        )}

        {b.type === "audio" && (
          <>
            <div className="space-y-2">
              <Label>Fichier MP3 *</Label>
              {b.url && <audio controls preload="none" src={resoudre(b.url)} className="w-full max-w-xl" />}
              <BoutonFichier label={b.url ? "Remplacer le MP3" : "Envoyer un MP3"} accept="audio/mpeg,.mp3" enCours={envoi === pid} onFiles={(f) => f[0] && envoyer(pid, f[0], "audio", (url) => onChange({ ...b, url }))} />
              <p className="text-xs text-muted-foreground">MP3 de 20 Mo au maximum. Sur le site, il se lance dans le lecteur en bas de page.</p>
            </div>
            <Champ id={`${pid}-titre`} label="Titre de l'extrait *" max={LIMITES_ONDE.titreBloc} n={(b.titre || "").length}>
              <Input id={`${pid}-titre`} value={b.titre || ""} onChange={(e) => onChange({ ...b, titre: e.target.value })} />
            </Champ>
            <div className="grid sm:grid-cols-2 gap-4">
              <Champ id={`${pid}-podcast`} label="Nom du podcast">
                <Input id={`${pid}-podcast`} value={b.podcast || ""} onChange={(e) => onChange({ ...b, podcast: e.target.value })} />
              </Champ>
              <Champ id={`${pid}-createur`} label="Créateur·ice">
                <Input id={`${pid}-createur`} value={b.createur || ""} onChange={(e) => onChange({ ...b, createur: e.target.value })} />
              </Champ>
            </div>
            <Champ id={`${pid}-lien`} label="Lien vers l'épisode complet" aide="Une adresse qui commence par https://, ou une page du site comme /ecouter/…">
              <Input id={`${pid}-lien`} type="url" inputMode="url" placeholder="https://…" value={b.lien || ""} onChange={(e) => onChange({ ...b, lien: e.target.value })} />
            </Champ>
          </>
        )}

        {b.type === "bouton" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Champ id={`${pid}-libelle`} label="Libellé du bouton *" max={LIMITES_ONDE.libelleBouton} n={(b.libelle || "").length}>
              <Input id={`${pid}-libelle`} value={b.libelle || ""} placeholder="Ex. : Je m'inscris" onChange={(e) => onChange({ ...b, libelle: e.target.value })} />
            </Champ>
            <Champ id={`${pid}-lien`} label="Lien *" aide="https://… ou une page du site comme /agenda">
              <Input id={`${pid}-lien`} inputMode="url" placeholder="https://…" value={b.lien || ""} onChange={(e) => onChange({ ...b, lien: e.target.value })} />
            </Champ>
          </div>
        )}

        {b.type === "evenements" && <EditeurEvenements b={b} pid={pid} onChange={onChange} />}
        {b.type === "podcast" && <EditeurPodcast b={b} pid={pid} resoudre={resoudre} envoi={envoi} envoyer={envoyer} onChange={onChange} />}
        {b.type === "nouveaux_membres" && <EditeurNouveauxMembres b={b} pid={pid} numeroId={numeroId} onChange={onChange} />}

        {(b.type === "chiffres" || b.type === "trimestre") && (
          <div className="space-y-3">
            {b.chiffres.map((c, k) => (
              <div key={k} className="grid grid-cols-[110px_1fr_auto] gap-3 items-end">
                <Champ id={`${pid}-v-${k}`} label="Chiffre">
                  <Input id={`${pid}-v-${k}`} value={c.valeur} placeholder="40" maxLength={LIMITES_ONDE.valeur} onChange={(e) => onChange({ ...b, chiffres: b.chiffres.map((x, y) => (y === k ? { ...x, valeur: e.target.value } : x)) })} />
                </Champ>
                <Champ id={`${pid}-l-${k}`} label="Libellé">
                  <Input id={`${pid}-l-${k}`} value={c.libelle} placeholder="membres à jour" maxLength={LIMITES_ONDE.libelleChiffre} onChange={(e) => onChange({ ...b, chiffres: b.chiffres.map((x, y) => (y === k ? { ...x, libelle: e.target.value } : x)) })} />
                </Champ>
                <button
                  type="button"
                  className={btnIcone}
                  disabled={b.chiffres.length <= LIMITES_ONDE.chiffresMin}
                  onClick={() => onChange({ ...b, chiffres: b.chiffres.filter((_, y) => y !== k) })}
                  aria-label={`Retirer le chiffre ${k + 1}`}
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </div>
            ))}
            {b.chiffres.length < LIMITES_ONDE.chiffresMax && (
              <button type="button" className={btnSecondary} onClick={() => onChange({ ...b, chiffres: [...b.chiffres, { valeur: "", libelle: "" }] })}>
                <Plus className="w-4 h-4" aria-hidden /> Ajouter un chiffre
              </button>
            )}
            <p className="text-xs text-muted-foreground">De 2 à 4 chiffres.</p>
          </div>
        )}
      </div>
    </li>
  );
};

const AdminOndeNumero = () => {
  const { id } = useParams();
  const qc = useQueryClient();
  const { isAdmin, isEditeur } = useAdminAuth();
  const autorise = isAdmin || isEditeur;

  const { data: charge, isLoading, isError } = useQuery({
    queryKey: ["onde-equipe", id],
    enabled: autorise && !!id,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<NumeroOnde | null> => {
      const { data, error } = await supabase.from("onde_numeros").select(ONDE_COLUMNS_EQUIPE).eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as unknown as NumeroOnde) ?? null;
    },
  });

  const [n, setN] = useState<NumeroOnde | null>(null);
  const [etat, setEtat] = useState<Etat>({ t: "ok" });
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [manques, setManques] = useState<string[]>([]);
  const [confirmerRetrait, setConfirmerRetrait] = useState(false);
  const version = useRef(0);

  useEffect(() => { if (charge && !n) setN(charge); }, [charge, n]);

  const resoudre = useFichiersEquipe(n ? fichiersNumero(n) : []);
  const nom = useNomsEquipe(n ? [n.auteur_id, n.modifie_par] : []);

  const maj = (f: (x: NumeroOnde) => Partial<NumeroOnde>) => {
    setN((x) => (x ? { ...x, ...f(x) } : x));
    version.current += 1;
    setEtat({ t: "modifie" });
  };

  const enregistrer = async (statut?: "brouillon" | "publie"): Promise<boolean> => {
    if (!n) return false;
    const v = version.current;
    setEtat({ t: "encours" });
    const { data, error } = await supabase
      .from("onde_numeros")
      .update({
        numero: n.numero,
        mois: n.mois,
        titre: n.titre,
        chapeau: n.chapeau,
        couverture_url: n.couverture_url,
        couverture_alt: n.couverture_alt,
        audio_url: n.audio_url,
        audio_voix: n.audio_voix,
        blocs: n.blocs as unknown as Json,
        statut: statut ?? n.statut,
      })
      .eq("id", n.id)
      .select("slug, statut, publie_le, updated_at, modifie_par")
      .single();
    if (error) {
      setEtat({ t: "erreur", msg: messageOnde(error, "L'enregistrement a échoué. Vérifiez votre connexion et réessayez.") });
      return false;
    }
    setN((x) => (x ? { ...x, ...(data as Partial<NumeroOnde>) } : x));
    setEtat(version.current === v ? { t: "ok", quand: new Date() } : { t: "modifie" });
    qc.invalidateQueries({ queryKey: ["onde-equipe-liste"] });
    qc.invalidateQueries({ queryKey: ["onde-publies"] });
    qc.invalidateQueries({ queryKey: ["onde-numero"] });
    qc.invalidateQueries({ queryKey: ["onde-bilan"] });
    qc.invalidateQueries({ queryKey: ["onde-nouveaux-membres"] });
    return true;
  };

  // Brouillon : enregistrement automatique 1,5 s après la dernière modification
  useEffect(() => {
    if (!n || n.statut !== "brouillon" || etat.t !== "modifie") return;
    const t = setTimeout(() => { void enregistrer(); }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, etat.t]);

  // Avertit avant de quitter la page avec des modifications non enregistrées
  useEffect(() => {
    if (etat.t === "ok") return;
    const f = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [etat.t]);

  const envoyer: Envoi = async (cle, file, sorte, apres) => {
    if (!n) return;
    setEnvoi(cle);
    try {
      apres(await envoyerFichierOnde(n.id, file, sorte));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnvoi(null);
    }
  };

  const majBloc = (i: number, b: Bloc) => maj((x) => ({ blocs: x.blocs.map((y, k) => (k === i ? b : y)) }));

  const ajouterBloc = (type: TypeBloc) => {
    if (!n) return;
    if (n.blocs.length >= LIMITES_ONDE.blocsMax) { toast.error("30 blocs au maximum dans un numéro."); return; }
    const b = nouveauBloc(type, n.mois);
    maj((x) => ({ blocs: [...x.blocs, b] }));
    requestAnimationFrame(() => {
      document.getElementById(`bloc-${b.id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      (document.getElementById(`bloc-${b.id}-rubrique`) as HTMLInputElement | null)?.focus({ preventScroll: true });
    });
  };

  const supprimerBloc = (i: number) => {
    if (!n) return;
    const b = n.blocs[i];
    maj((x) => ({ blocs: x.blocs.filter((_, k) => k !== i) }));
    toast("Bloc supprimé", {
      action: { label: "Annuler", onClick: () => maj((x) => ({ blocs: [...x.blocs.slice(0, i), b, ...x.blocs.slice(i)] })) },
    });
  };

  const publier = async () => {
    if (!n) return;
    const m = manquesPublication(n);
    setManques(m);
    if (m.length) {
      requestAnimationFrame(() => document.getElementById("onde-manques")?.focus());
      return;
    }
    if (await enregistrer("publie")) toast.success("Numéro publié : il est en ligne sur le site.");
  };

  const enregistrerPublie = async () => {
    if (!n) return;
    const m = manquesPublication(n);
    setManques(m);
    if (m.length) { requestAnimationFrame(() => document.getElementById("onde-manques")?.focus()); return; }
    if (await enregistrer()) toast.success("Modifications enregistrées et en ligne.");
  };

  const retirer = async () => {
    setConfirmerRetrait(false);
    if (await enregistrer("brouillon")) toast.success("Numéro retiré du site : il redevient un brouillon.");
  };

  const publie = n?.statut === "publie";
  const adresse = n ? (n.publie_le ? n.slug : slugOnde(n.numero, n.mois)) : "";

  const etatTexte =
    etat.t === "encours" ? "Enregistrement…"
    : etat.t === "erreur" ? etat.msg
    : etat.t === "modifie" ? (publie ? "Modifications non enregistrées" : "Modifications en cours…")
    : etat.quand ? `Enregistré à ${etat.quand.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : publie ? "En ligne" : "Brouillon enregistré automatiquement";

  return (
    <AdminLayout
      acces="onde"
      titre={n ? `n°${n.numero} — ${n.titre || "Sans titre"}` : NOM_ONDE}
      description={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link to="/admin/onde" className="underline underline-offset-4">← Tous les numéros</Link>
          {n && <BadgeStatut statut={n.statut} />}
          {n && (
            <span role="status" aria-live="polite" className={`text-sm inline-flex items-center gap-1 ${etat.t === "erreur" ? "text-destructive font-bold" : ""}`}>
              {etat.t === "encours" && <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden />}
              {etat.t === "ok" && etat.quand && <Check className="w-3.5 h-3.5" aria-hidden />}
              {etat.t === "erreur" && <AlertTriangle className="w-3.5 h-3.5" aria-hidden />}
              {etatTexte}
            </span>
          )}
        </span>
      }
      actions={
        n && (
          <>
            <a
              href={`/admin/onde/${n.id}/apercu`}
              target="_blank"
              rel="noopener noreferrer"
              className={btnSecondary}
              onClick={async (e) => {
                // Brouillon modifié : on enregistre d'abord, puis l'aperçu s'ouvre sur la version à jour
                if (publie || (etat.t !== "modifie" && etat.t !== "encours")) return;
                e.preventDefault();
                const onglet = window.open("about:blank", "_blank");
                if (onglet) onglet.opener = null;
                await enregistrer();
                const adresse = `/admin/onde/${n.id}/apercu`;
                if (onglet) onglet.location.href = adresse;
                else window.open(adresse, "_blank", "noopener");
              }}
            >
              <Eye className="w-4 h-4" aria-hidden /> Aperçu<span className="sr-only"> (nouvel onglet)</span>
            </a>
            {publie ? (
              <>
                <button type="button" className={btnSecondary} onClick={() => setConfirmerRetrait(true)} disabled={etat.t === "encours"}>Retirer du site</button>
                <button type="button" className={btnPrimary} onClick={enregistrerPublie} disabled={etat.t === "encours" || etat.t === "ok"}>
                  Enregistrer les modifications
                </button>
              </>
            ) : (
              <button type="button" className={btnPrimary} onClick={publier} disabled={etat.t === "encours" || !!envoi}>Publier</button>
            )}
          </>
        )
      }
    >
      {isLoading || (!n && charge) ? (
        <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
      ) : isError || !n ? (
        <p>Ce numéro est introuvable. <Link to="/admin/onde" className="underline underline-offset-4">Revenir à la liste</Link></p>
      ) : (
        <div className="max-w-4xl space-y-12 pb-16">
          {manques.length > 0 && (
            <div id="onde-manques" tabIndex={-1} role="alert" className="border-2 border-destructive bg-surface p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <p className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" aria-hidden /> Avant de publier, il manque :</p>
              <ul className="list-disc pl-6 mt-2 text-[15px] space-y-0.5">{manques.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}

          <section aria-labelledby="s-numero" className="space-y-5">
            <h2 id="s-numero" className="font-bold text-xl border-b-2 border-encre pb-2">Le numéro</h2>
            <div className="grid sm:grid-cols-[140px_220px] gap-4">
              <Champ id="o-numero" label="Numéro">
                <Input id="o-numero" type="number" min={1} max={9999} value={n.numero} onChange={(e) => maj(() => ({ numero: Math.max(1, Math.floor(Number(e.target.value) || 1)) }))} />
              </Champ>
              <Champ id="o-mois" label="Mois">
                <Input id="o-mois" type="month" value={n.mois.slice(0, 7)} onChange={(e) => e.target.value && maj(() => ({ mois: `${e.target.value}-01` }))} />
              </Champ>
            </div>
            <p className="text-sm text-muted-foreground">
              Adresse sur le site : <span className="font-mono text-foreground">{ondeHref(adresse)}</span>
              {n.publie_le ? " (fixée depuis la première publication, pour ne casser aucun lien partagé)" : ""}
            </p>
            <Champ id="o-titre" label="Titre *" max={LIMITES_ONDE.titre} n={n.titre.length}>
              <Input id="o-titre" value={n.titre} onChange={(e) => maj(() => ({ titre: e.target.value }))} />
            </Champ>
            <Champ id="o-chapeau" label="Chapeau *" max={LIMITES_ONDE.chapeau} n={n.chapeau.length} aide="Deux lignes qui donnent envie de lire. Reprises dans les archives et sur les moteurs de recherche.">
              <Textarea id="o-chapeau" rows={2} value={n.chapeau} onChange={(e) => maj(() => ({ chapeau: e.target.value.replace(/\n/g, " ") }))} />
            </Champ>
          </section>

          <section aria-labelledby="s-couverture" className="space-y-4">
            <h2 id="s-couverture" className="font-bold text-xl border-b-2 border-encre pb-2">Photo de couverture *</h2>
            <div className="flex flex-wrap items-start gap-4">
              {n.couverture_url ? (
                <img src={resoudre(n.couverture_url)} alt="" className="w-64 aspect-[16/9] object-cover border border-filet" />
              ) : (
                <div className="w-64 aspect-[16/9] border-2 border-dashed border-filet flex items-center justify-center text-sm text-muted-foreground" aria-hidden>Pas encore de photo</div>
              )}
              <div className="flex flex-col gap-2">
                <BoutonFichier label={n.couverture_url ? "Changer la photo" : "Envoyer une photo"} accept={IMAGE_TYPES.join(",")} enCours={envoi === "couverture"} onFiles={(f) => f[0] && envoyer("couverture", f[0], "image", (url) => maj(() => ({ couverture_url: url })))} />
                {n.couverture_url && (
                  <button type="button" className="text-sm underline underline-offset-4 inline-flex items-center gap-1 self-start min-h-[44px]" onClick={() => maj(() => ({ couverture_url: null }))}>
                    <X className="w-3 h-3" aria-hidden /> Retirer la photo
                  </button>
                )}
                <p className="text-xs text-muted-foreground max-w-xs">JPG, PNG ou WebP, réduite automatiquement pour le web. Un format paysage rend mieux.</p>
              </div>
            </div>
            <Champ id="o-alt" label="Texte alternatif de la couverture *" max={LIMITES_ONDE.alt} n={(n.couverture_alt || "").length} aide="Décrivez la photo en une phrase, pour les personnes qui ne la voient pas.">
              <Input id="o-alt" value={n.couverture_alt || ""} placeholder="Ex. : Trois membres au micro pendant l'atelier-écoute de novembre" onChange={(e) => maj(() => ({ couverture_alt: e.target.value }))} />
            </Champ>
          </section>

          <section aria-labelledby="s-audio" className="space-y-4">
            <h2 id="s-audio" className="font-bold text-xl border-b-2 border-encre pb-2">Version audio du numéro</h2>
            {n.audio_url && <audio controls preload="none" src={resoudre(n.audio_url)} className="w-full max-w-xl" />}
            <div className="flex flex-wrap items-center gap-3">
              <BoutonFichier label={n.audio_url ? "Remplacer le MP3" : "Envoyer le MP3"} accept="audio/mpeg,.mp3" enCours={envoi === "audio"} onFiles={(f) => f[0] && envoyer("audio", f[0], "audio", (url) => maj(() => ({ audio_url: url })))} />
              {n.audio_url && (
                <button type="button" className="text-sm underline underline-offset-4 inline-flex items-center gap-1 min-h-[44px]" onClick={() => maj(() => ({ audio_url: null }))}>
                  <X className="w-3 h-3" aria-hidden /> Retirer la version audio
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">MP3 de 20 Mo au maximum. Sur le site, le bandeau « Écouter ce numéro » le lance dans le lecteur en bas de page.</p>
            <Champ id="o-voix" label="Voix du mois" max={LIMITES_ONDE.voix} n={(n.audio_voix || "").length} aide="Le nom de la personne qui lit ce numéro.">
              <Input id="o-voix" value={n.audio_voix || ""} onChange={(e) => maj(() => ({ audio_voix: e.target.value }))} />
            </Champ>
          </section>

          <section aria-labelledby="s-blocs" className="space-y-4">
            <h2 id="s-blocs" className="font-bold text-xl border-b-2 border-encre pb-2">Blocs</h2>
            {n.blocs.length === 0 ? (
              <p className="text-muted-foreground">Pas encore de bloc. Choisissez un type ci-dessous pour commencer.</p>
            ) : (
              <ol className="space-y-4">
                {n.blocs.map((b, i) => (
                  <EditeurBloc
                    key={b.id}
                    b={b}
                    i={i}
                    total={n.blocs.length}
                    numeroId={n.id}
                    resoudre={resoudre}
                    envoi={envoi}
                    envoyer={envoyer}
                    onChange={(nb) => majBloc(i, nb)}
                    onMove={(sens) => maj((x) => ({ blocs: deplacer(x.blocs, i, sens) }))}
                    onDelete={() => supprimerBloc(i)}
                  />
                ))}
              </ol>
            )}

            <div className="border-2 border-dashed border-encre p-4">
              <p className="font-bold mb-3">Ajouter un bloc</p>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TYPES_BLOCS.map((t) => {
                  const Icone = ICONES[t.type];
                  return (
                    <li key={t.type}>
                      <button
                        type="button"
                        onClick={() => ajouterBloc(t.type)}
                        className="w-full h-full text-left border-2 border-encre bg-background px-4 py-3 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <span className="flex items-center gap-2 font-bold">
                          <Icone className="w-4 h-4 shrink-0" aria-hidden /> {t.label}
                        </span>
                        {t.mention && <span className="inline-block mt-1 font-mono text-[11px] uppercase tracking-wider border border-encre px-1.5 whitespace-nowrap">{t.mention}</span>}
                        <span className="block text-sm text-muted-foreground mt-0.5">{t.aide}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <p className="text-xs text-muted-foreground border-t border-filet pt-4">
            {etiquetteNumero(n)}
            {n.created_at ? ` · créé le ${dateHeure(n.created_at)}${nom(n.auteur_id) ? ` par ${nom(n.auteur_id)}` : ""}` : ""}
            {` · modifié le ${dateHeure(n.updated_at)}${nom(n.modifie_par) ? ` par ${nom(n.modifie_par)}` : ""}`}
            {n.publie_le ? ` · publié le ${dateHeure(n.publie_le)}` : ""}
          </p>
        </div>
      )}

      <AlertDialog open={confirmerRetrait} onOpenChange={setConfirmerRetrait}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce numéro du site ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il redevient un brouillon : il n'apparaît plus dans les archives et sa page n'est plus visible. Vous pourrez le republier à la même adresse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={retirer}>Retirer du site</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminOndeNumero;
