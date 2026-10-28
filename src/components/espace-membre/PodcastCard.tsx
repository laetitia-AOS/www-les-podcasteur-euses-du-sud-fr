import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ImagePicker, field, hintCls, labelCls } from "@/components/adherer/fields";
import { THEMATIQUES, TYPES_PODCAST, isHttpsUrl, uploadImage } from "@/lib/inscription";
import { btnPrimary, btnSecondary, linkUnderline } from "@/lib/pds";
import type { FicheMembre } from "./types";

type Props = {
  fiche: FicheMembre;
  onSaved: (patch: Partial<FicheMembre>) => void;
  onDeleted: () => void;
};

const Badge = ({ visible }: { visible: boolean }) => (
  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold border ${visible ? "bg-primary text-primary-foreground border-primary" : "border-encre"}`}>
    {visible ? "Visible" : "En relecture"}
  </span>
);

const PodcastCard = ({ fiche, onSaved, onDeleted }: Props) => {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    nom_podcast: fiche.nom_podcast || "",
    lien_ecoute: fiche.lien_ecoute || "",
    flux_rss: fiche.flux_rss || "",
    description: fiche.description || "",
    thematique: fiche.thematique || "",
    type_podcast: fiche.type_podcast || "",
    niveau_avancement: fiche.niveau_avancement || "",
    frequence_publication: fiche.frequence_publication || "",
    monetise: fiche.monetise || "",
  });
  const [cover, setCover] = useState<string | null>(fiche.vignette_url);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.nom_podcast.trim().length < 2) { toast.error("Indiquez le nom du podcast."); return; }
    if (!isHttpsUrl(f.lien_ecoute.trim())) { toast.error("Le lien d'écoute doit commencer par https://"); return; }
    if (f.flux_rss.trim() && !isHttpsUrl(f.flux_rss.trim())) { toast.error("Le flux RSS doit commencer par https://"); return; }
    setSaving(true);
    try {
      let url = cover;
      if (coverFile) url = await uploadImage(coverFile);
      const patch: Partial<FicheMembre> = {
        nom_podcast: f.nom_podcast.trim(),
        lien_ecoute: f.lien_ecoute.trim(),
        flux_rss: f.flux_rss.trim() || null,
        description: f.description.trim(),
        thematique: f.thematique || null,
        type_podcast: f.type_podcast || null,
        niveau_avancement: f.niveau_avancement || null,
        frequence_publication: f.frequence_publication || null,
        monetise: f.monetise || null,
        vignette_url: url,
      };
      const { error } = await supabase.from("podcasts").update(patch).eq("id", fiche.id);
      if (error) throw error;
      setCover(url);
      setCoverFile(null);
      onSaved(patch);
      toast.success("Podcast enregistré.");
    } catch (err) {
      console.error(err);
      toast.error("L'enregistrement n'a pas abouti. Réessayez dans un instant.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    const { error } = await supabase.from("podcasts").delete().eq("id", fiche.id);
    setDeleting(false);
    if (error) { toast.error("La suppression n'a pas abouti."); return; }
    toast.success("Podcast supprimé.");
    onDeleted();
  };

  const formId = `pc-${fiche.id}`;

  return (
    <li className="border-b border-filet">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <div className="w-16 h-16 bg-primary p-[4px] shrink-0">
          {cover ? (
            <img src={cover} alt={`Pochette du podcast ${fiche.nom_podcast}`} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span aria-hidden className="block w-full h-full bg-surface" />
          )}
        </div>
        <div className="flex-1 min-w-[160px]">
          <p className="font-bold text-[17px] leading-tight">{fiche.nom_podcast}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <Badge visible={fiche.valide} />
            {fiche.valide && fiche.slug && (
              <Link to={`/podcasteur/${fiche.slug}`} className={`${linkUnderline} text-sm`}>Voir la fiche</Link>
            )}
          </div>
        </div>
        <button type="button" className={btnSecondary} aria-expanded={open} aria-controls={formId} onClick={() => setOpen((o) => !o)}>
          {open ? "Fermer" : "Modifier"}
        </button>
      </div>

      {open && (
        <form id={formId} onSubmit={save} className="pb-6 space-y-5" noValidate>
          <ImagePicker
            id={`${formId}-cover`}
            label="Pochette"
            preview={cover}
            onPick={(file, url) => { setCoverFile(file); setCover(url); }}
            onClear={() => { setCoverFile(null); setCover(null); }}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-nom`} className={labelCls}>Nom du podcast</label>
              <input id={`${formId}-nom`} value={f.nom_podcast} onChange={set("nom_podcast")} className={field} />
            </div>
            <div>
              <label htmlFor={`${formId}-lien`} className={labelCls}>Lien d'écoute principal</label>
              <input id={`${formId}-lien`} type="url" value={f.lien_ecoute} onChange={set("lien_ecoute")} className={field} placeholder="https://…" />
            </div>
          </div>
          <div>
            <label htmlFor={`${formId}-rss`} className={labelCls}>Flux RSS (facultatif)</label>
            <input id={`${formId}-rss`} type="url" value={f.flux_rss} onChange={set("flux_rss")} className={field} placeholder="https://feed.ausha.co/…" />
            <p className={hintCls}>Il permet d'afficher vos derniers épisodes et de les écouter sur le site. Vous le trouvez chez votre hébergeur (Ausha, Acast, Spotify for Creators…).</p>
          </div>
          <div>
            <label htmlFor={`${formId}-desc`} className={labelCls}>Description courte</label>
            <textarea id={`${formId}-desc`} value={f.description} onChange={set("description")} rows={3} className={`${field} py-2`} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${formId}-theme`} className={labelCls}>Thématique</label>
              <select id={`${formId}-theme`} value={f.thematique} onChange={set("thematique")} className={field}>
                <option value="">Choisir</option>
                {THEMATIQUES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-type`} className={labelCls}>Type de podcast</label>
              <select id={`${formId}-type`} value={f.type_podcast} onChange={set("type_podcast")} className={field}>
                <option value="">Choisir</option>
                {TYPES_PODCAST.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-niveau`} className={labelCls}>Avancement</label>
              <select id={`${formId}-niveau`} value={f.niveau_avancement} onChange={set("niveau_avancement")} className={field}>
                <option value="">Choisir</option>
                <option value="lancement">Lancement (0 à 10 épisodes)</option>
                <option value="croissance">En croissance (10 à 50)</option>
                <option value="installe">Installé (plus de 50)</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-freq`} className={labelCls}>Fréquence de publication</label>
              <select id={`${formId}-freq`} value={f.frequence_publication} onChange={set("frequence_publication")} className={field}>
                <option value="">Choisir</option>
                <option value="hebdomadaire">Chaque semaine</option>
                <option value="bimensuel">Deux fois par mois</option>
                <option value="mensuel">Chaque mois</option>
                <option value="irregulier">Irrégulière</option>
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-monet`} className={labelCls}>Monétisé ?</label>
              <select id={`${formId}-monet`} value={f.monetise} onChange={set("monetise")} className={field}>
                <option value="">Choisir</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
                <option value="En cours">En cours, à l'essai</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              {saving ? "Enregistrement…" : "Enregistrer ce podcast"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(true)} className={`${linkUnderline} text-destructive min-h-[44px]`}>
              Supprimer ce podcast
            </button>
          </div>

          {confirmDelete && (
            <div role="alertdialog" aria-labelledby={`${formId}-del`} className="border-2 border-destructive p-4 space-y-3">
              <p id={`${formId}-del`} className="font-bold">Supprimer « {fiche.nom_podcast} » ? Cette action est définitive.</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={remove} disabled={deleting} className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 font-bold bg-destructive text-destructive-foreground">
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                  Oui, supprimer
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={btnSecondary}>Annuler</button>
              </div>
            </div>
          )}
        </form>
      )}
    </li>
  );
};

export default PodcastCard;
