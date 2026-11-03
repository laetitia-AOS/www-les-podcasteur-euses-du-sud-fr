import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import LogoPartenaire from "@/components/LogoPartenaire";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import { messageServeur } from "@/lib/inscription";
import {
  LIMITES_PARTENAIRE, LOGO_MAX_OCTETS, LOGO_TYPES, PARTENAIRE_COLUMNS, domaineAffiche, lienSite, trierPartenaires,
  type Partenaire,
} from "@/lib/partenaires";

type Formulaire = { nom: string; site_url: string; logo_url: string; accroche: string; description: string; publie: boolean };
const VIDE: Formulaire = { nom: "", site_url: "", logo_url: "", accroche: "", description: "", publie: true };

const BUCKET = "studio-galleries";
const btnIcone =
  "inline-flex items-center justify-center w-10 h-10 border-2 border-encre bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const Compteur = ({ n, max }: { n: number; max: number }) => (
  <span className={`font-mono text-xs ${n > max ? "text-destructive font-bold" : "text-muted-foreground"}`}>{n} / {max}</span>
);

const AdminPartenaires = () => {
  const { isAdmin } = useAdminAuth();
  const qc = useQueryClient();
  const [edition, setEdition] = useState<{ id: string | null; form: Formulaire } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Partenaire | null>(null);
  const [envoiLogo, setEnvoiLogo] = useState(false);

  const { data: liste = [], isLoading } = useQuery({
    queryKey: ["admin-partenaires"],
    enabled: isAdmin,
    queryFn: async (): Promise<Partenaire[]> => {
      const { data, error } = await supabase.from("partenaires").select(PARTENAIRE_COLUMNS).order("ordre").order("nom");
      if (error) throw error;
      return trierPartenaires((data || []) as Partenaire[]);
    },
  });

  const rafraichir = () => {
    qc.invalidateQueries({ queryKey: ["admin-partenaires"] });
    qc.invalidateQueries({ queryKey: ["partenaires-publics"] });
  };

  const enregistrer = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: Formulaire }) => {
      const valeurs = {
        nom: form.nom,
        site_url: lienSite(form.site_url),
        logo_url: form.logo_url || null,
        accroche: form.accroche || null,
        description: form.description || null,
        publie: form.publie,
      };
      if (id) {
        const { error } = await supabase.from("partenaires").update(valeurs).eq("id", id);
        if (error) throw error;
      } else {
        const ordre = liste.length ? Math.max(...liste.map((p) => p.ordre)) + 1 : 1;
        const { error } = await supabase.from("partenaires").insert({ ...valeurs, ordre });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      rafraichir();
      setEdition(null);
      toast.success(v.id ? "Partenaire mis à jour" : "Partenaire ajouté");
    },
    onError: (e: { code?: string; message?: string }) => toast.error(messageServeur(e, "Enregistrement impossible. Réessayez.")),
  });

  const basculer = useMutation({
    mutationFn: async (p: Partenaire) => {
      const { error } = await supabase.from("partenaires").update({ publie: !p.publie }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, p) => { rafraichir(); toast.success(p.publie ? "Partenaire masqué du site" : "Partenaire affiché sur le site"); },
    onError: (e: { code?: string; message?: string }) => toast.error(messageServeur(e, "Modification impossible.")),
  });

  const deplacer = useMutation({
    mutationFn: async ({ index, sens }: { index: number; sens: -1 | 1 }) => {
      // On renumérote toute la liste pour que l'ordre reste propre (1, 2, 3…)
      const ordre = [...liste];
      const cible = index + sens;
      [ordre[index], ordre[cible]] = [ordre[cible], ordre[index]];
      for (let i = 0; i < ordre.length; i++) {
        if (ordre[i].ordre === i + 1) continue;
        const { error } = await supabase.from("partenaires").update({ ordre: i + 1 }).eq("id", ordre[i].id);
        if (error) throw error;
      }
    },
    onSuccess: rafraichir,
    onError: (e: { code?: string; message?: string }) => toast.error(messageServeur(e, "Déplacement impossible.")),
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partenaires").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { rafraichir(); setASupprimer(null); toast.success("Partenaire supprimé"); },
    onError: (e: { code?: string; message?: string }) => toast.error(messageServeur(e, "Suppression impossible.")),
  });

  const envoyerLogo = async (file: File | undefined) => {
    if (!file || !edition) return;
    if (!LOGO_TYPES.includes(file.type)) { toast.error("Logo au format JPG, PNG ou WebP."); return; }
    if (file.size > LOGO_MAX_OCTETS) { toast.error("Logo trop lourd : 2 Mo au maximum."); return; }
    setEnvoiLogo(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const chemin = `partenaires/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(chemin, file, { contentType: file.type });
    setEnvoiLogo(false);
    if (error) { toast.error("Le logo n'a pas pu être envoyé. Réessayez."); return; }
    const url = supabase.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
    setEdition((e) => (e ? { ...e, form: { ...e.form, logo_url: url } } : e));
  };

  const ouvrir = (p?: Partenaire) =>
    setEdition(
      p
        ? { id: p.id, form: { nom: p.nom, site_url: p.site_url || "", logo_url: p.logo_url || "", accroche: p.accroche || "", description: p.description || "", publie: p.publie } }
        : { id: null, form: VIDE },
    );

  const maj = (champ: keyof Formulaire, valeur: string | boolean) =>
    setEdition((e) => (e ? { ...e, form: { ...e.form, [champ]: valeur } } : e));

  const f = edition?.form;
  const tropLong =
    !!f && (f.nom.length > LIMITES_PARTENAIRE.nom || f.accroche.length > LIMITES_PARTENAIRE.accroche || f.description.length > LIMITES_PARTENAIRE.description);

  return (
    <AdminLayout
      titre="Partenaires"
      description={<>Logo, lien vers le site et description du partenariat. Affichés sur la page <Link to="/partenaires" className="underline underline-offset-4">Partenaires</Link> et sur l'accueil.</>}
      actions={
        <button type="button" className={btnPrimary} onClick={() => ouvrir()}>
          <Plus className="w-4 h-4" aria-hidden /> Ajouter un partenaire
        </button>
      }
    >
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
      ) : liste.length === 0 ? (
        <p className="text-muted-foreground">Aucun partenaire pour le moment.</p>
      ) : (
        <ol className="border-t-2 border-encre divide-y divide-filet">
          {liste.map((p, i) => (
            <li key={p.id} className={`grid grid-cols-[64px_1fr] md:grid-cols-[64px_1fr_auto] gap-4 py-4 items-start ${p.publie ? "" : "opacity-60"}`}>
              <LogoPartenaire src={p.logo_url} nom={p.nom} className="w-16 h-16 text-[12px]" />
              <div className="min-w-0">
                <p className="font-bold text-lg leading-tight flex flex-wrap items-center gap-2">
                  {p.nom}
                  {!p.publie && <span className="font-mono text-[11px] uppercase tracking-wider border border-encre px-1.5">Masqué</span>}
                </p>
                {p.accroche && <p className="text-sm text-primary font-mono mt-1">{p.accroche}</p>}
                {p.site_url ? (
                  <a href={lienSite(p.site_url)!} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline break-all">
                    {domaineAffiche(p.site_url)} <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Pas de site renseigné : le nom ne sera pas cliquable.</p>
                )}
                {p.description ? (
                  <p className="text-sm mt-2 line-clamp-2 max-w-[70ch]">{p.description}</p>
                ) : (
                  <p className="text-sm mt-2 text-accent-foreground bg-accent/20 inline-block px-1.5">Description du partenariat à écrire</p>
                )}
              </div>
              <div className="col-span-2 md:col-span-1 flex flex-wrap gap-2 md:justify-end">
                <button type="button" className={btnIcone} onClick={() => deplacer.mutate({ index: i, sens: -1 })} disabled={i === 0 || deplacer.isPending} aria-label={`Monter ${p.nom}`}>
                  <ArrowUp className="w-4 h-4" aria-hidden />
                </button>
                <button type="button" className={btnIcone} onClick={() => deplacer.mutate({ index: i, sens: 1 })} disabled={i === liste.length - 1 || deplacer.isPending} aria-label={`Descendre ${p.nom}`}>
                  <ArrowDown className="w-4 h-4" aria-hidden />
                </button>
                <button type="button" className={btnIcone} onClick={() => basculer.mutate(p)} aria-label={p.publie ? `Masquer ${p.nom} du site` : `Afficher ${p.nom} sur le site`}>
                  {p.publie ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                </button>
                <button type="button" className={btnIcone} onClick={() => ouvrir(p)} aria-label={`Modifier ${p.nom}`}>
                  <Pencil className="w-4 h-4" aria-hidden />
                </button>
                <button type="button" className={btnIcone} onClick={() => setASupprimer(p)} aria-label={`Supprimer ${p.nom}`}>
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={!!edition} onOpenChange={(o) => !o && setEdition(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle>{edition?.id ? "Modifier le partenaire" : "Ajouter un partenaire"}</DialogTitle>
            <DialogDescription>Le nom renvoie vers le site du partenaire quand un lien est renseigné.</DialogDescription>
          </DialogHeader>
          {f && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!f.nom.trim()) { toast.error("Indiquez le nom du partenaire."); return; }
                if (tropLong) { toast.error("Un des textes est trop long."); return; }
                enregistrer.mutate({ id: edition!.id, form: f });
              }}
            >
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <LogoPartenaire src={f.logo_url} nom={f.nom || "?"} className="w-20 h-20 text-[14px]" />
                  <div className="flex flex-col gap-2">
                    <label className={`${btnSecondary} cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary`}>
                      {envoiLogo ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Upload className="w-4 h-4" aria-hidden />}
                      {f.logo_url ? "Changer le logo" : "Envoyer un logo"}
                      <input type="file" accept={LOGO_TYPES.join(",")} className="sr-only" disabled={envoiLogo} onChange={(e) => { envoyerLogo(e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                    {f.logo_url && (
                      <button type="button" className="text-sm underline underline-offset-4 inline-flex items-center gap-1 self-start" onClick={() => maj("logo_url", "")}>
                        <X className="w-3 h-3" aria-hidden /> Retirer le logo
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, 2 Mo maximum. Un fond transparent ou blanc rend mieux.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline"><Label htmlFor="p-nom">Nom *</Label><Compteur n={f.nom.length} max={LIMITES_PARTENAIRE.nom} /></div>
                <Input id="p-nom" value={f.nom} onChange={(e) => maj("nom", e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-site">Site internet</Label>
                <Input id="p-site" type="url" inputMode="url" placeholder="https://…" value={f.site_url} onChange={(e) => maj("site_url", e.target.value)} onBlur={(e) => e.target.value && maj("site_url", lienSite(e.target.value) || "")} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline"><Label htmlFor="p-accroche">Accroche</Label><Compteur n={f.accroche.length} max={LIMITES_PARTENAIRE.accroche} /></div>
                <Input id="p-accroche" placeholder="Ex. : Radio · des membres invités à l'antenne" value={f.accroche} onChange={(e) => maj("accroche", e.target.value)} />
                <p className="text-xs text-muted-foreground">Une ligne, affichée sous le nom (accueil et page Partenaires).</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline"><Label htmlFor="p-desc">Description du partenariat</Label><Compteur n={f.description.length} max={LIMITES_PARTENAIRE.description} /></div>
                <Textarea id="p-desc" rows={6} placeholder="Ce que vous faites ensemble, depuis quand, ce que ça apporte aux membres…" value={f.description} onChange={(e) => maj("description", e.target.value)} />
                <p className="text-xs text-muted-foreground">Affichée sur la page Partenaires.</p>
              </div>

              <div className="flex items-center gap-3">
                <Switch id="p-publie" checked={f.publie} onCheckedChange={(v) => maj("publie", v)} />
                <Label htmlFor="p-publie">Affiché sur le site</Label>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" className={btnSecondary} onClick={() => setEdition(null)}>Annuler</button>
                <button type="submit" className={btnPrimary} disabled={enregistrer.isPending || envoiLogo || tropLong}>
                  {enregistrer.isPending && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
                  Enregistrer
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {aSupprimer?.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>Le partenaire disparaît du site et de cette liste. Pour le retirer seulement du site, utilisez plutôt le bouton « Masquer ».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => aSupprimer && supprimer.mutate(aSupprimer.id)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPartenaires;
