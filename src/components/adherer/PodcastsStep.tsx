import { useState } from "react";
import { messageServeur } from "@/lib/inscription";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BesoinsMultiSelect from "@/components/BesoinsMultiSelect";
import PrioriteSelect from "@/components/PrioriteSelect";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import { THEMATIQUES, TYPES_PODCAST, isHttpsUrl, uploadImages } from "@/lib/inscription";
import { ImagePicker, Req, field, hintCls, labelCls } from "./fields";
import { Check } from "./ProfilStep";

type Entry = {
  key: number;
  nom: string;
  lien: string;
  rss: string;
  description: string;
  cover: { file: File; preview: string } | null;
  thematique: string;
  typePodcast: string;
  niveau: string;
  frequence: string;
  monetise: string;
};

const MAX_PODCASTS = 5;
let nextKey = 1;
const emptyEntry = (): Entry => ({ key: nextKey++, nom: "", lien: "", rss: "", description: "", cover: null, thematique: "", typePodcast: "", niveau: "", frequence: "", monetise: "" });

/**
 * Étape 2 pour les podcasteur·euses : un ou plusieurs podcasts.
 * Chaque podcast devient une fiche, avec les informations de la fiche annuaire (`base`).
 */
const PodcastsStep = ({
  base,
  onDone,
  onBack,
  submitLabel = "Enregistrer et continuer vers l'adhésion",
}: {
  base: Record<string, unknown>;
  onDone: (count: number) => void;
  onBack?: () => void;
  submitLabel?: string;
}) => {
  const [entries, setEntries] = useState<Entry[]>(() => [emptyEntry()]);
  const [besoins, setBesoins] = useState<string[]>([]);
  const [priorite, setPriorite] = useState("");
  const [consentPublication, setConsentPublication] = useState(false);
  const [sending, setSending] = useState(false);

  const update = (key: number, patch: Partial<Entry>) => setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...patch } : e)));

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    for (const [i, e] of entries.entries()) {
      const n = entries.length > 1 ? ` (podcast ${i + 1})` : "";
      if (e.nom.trim().length < 2) return toast.error(`Indiquez le nom du podcast${n}.`);
      if (!isHttpsUrl(e.lien.trim())) return toast.error(`Indiquez un lien d'écoute valide, qui commence par https://${n}.`);
      if (e.rss.trim() && !isHttpsUrl(e.rss.trim())) return toast.error(`Le flux RSS doit commencer par https://${n}.`);
      if (e.description.trim().length < 20) return toast.error(`Décrivez le podcast en une ou deux phrases, 20 caractères minimum${n}.`);
      if (!e.cover) return toast.error(`Ajoutez la pochette du podcast${n}.`);
    }
    if (!consentPublication) return toast.error("Acceptez la publication de vos podcasts sur le site.");

    setSending(true);
    try {
      const rows = [];
      // Toutes les pochettes partent en un seul envoi
      const covers = await uploadImages(entries.map((e) => e.cover!.file), String(base.email || ""));
      for (const [i, e] of entries.entries()) {
        const vignette_url = covers[i];
        rows.push({
          ...base,
          type_profil: "podcasteur",
          nom_podcast: e.nom.trim(),
          lien_ecoute: e.lien.trim(),
          flux_rss: e.rss.trim() || null,
          description: e.description.trim(),
          vignette_url,
          thematique: e.thematique || null,
          type_podcast: e.typePodcast || null,
          niveau_avancement: e.niveau || null,
          frequence_publication: e.frequence || null,
          monetise: e.monetise || null,
          besoins_podcast: besoins.length ? besoins : ["non_specifie"],
          besoin: besoins.length ? besoins.join(", ") : "non_specifié",
          priorite_actuelle: priorite || null,
        });
      }
      const { error } = await supabase.from("podcasts").insert(rows as never);
      if (error) throw error;
      onDone(rows.length);
    } catch (err) {
      console.error(err);
      toast.error(messageServeur(err as { code?: string; message?: string }, "L'enregistrement n'a pas abouti. Réessayez."));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <ol className="space-y-8">
        {entries.map((e, i) => (
          <li key={e.key} className="border-2 border-encre bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="title-section text-[26px]">Podcast {i + 1}</h3>
              {entries.length > 1 && (
                <button type="button" onClick={() => setEntries((l) => l.filter((x) => x.key !== e.key))} className="inline-flex items-center gap-2 min-h-[44px] px-3 text-sm font-bold hover:underline">
                  <Trash2 className="w-4 h-4" aria-hidden /> Retirer
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
              <div className="sm:col-span-2">
                <label htmlFor={`pc-nom-${e.key}`} className={labelCls}>Nom du podcast<Req /></label>
                <input id={`pc-nom-${e.key}`} value={e.nom} onChange={(x) => update(e.key, { nom: x.target.value })} className={field} required />
              </div>
              <div>
                <label htmlFor={`pc-lien-${e.key}`} className={labelCls}>Lien d'écoute<Req /></label>
                <input id={`pc-lien-${e.key}`} value={e.lien} onChange={(x) => update(e.key, { lien: x.target.value })} className={field} placeholder="https://" required />
                <p className={hintCls}>Spotify, Apple Podcasts, Ausha, Deezer, YouTube…</p>
              </div>
              <div>
                <label htmlFor={`pc-rss-${e.key}`} className={labelCls}>Flux RSS</label>
                <input id={`pc-rss-${e.key}`} value={e.rss} onChange={(x) => update(e.key, { rss: x.target.value })} className={field} placeholder="https://" />
                <p className={hintCls}>Facultatif. Vos épisodes s'afficheront automatiquement sur le site.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`pc-desc-${e.key}`} className={labelCls}>Description courte<Req /></label>
                <textarea id={`pc-desc-${e.key}`} rows={3} value={e.description} onChange={(x) => update(e.key, { description: x.target.value })} className={`${field} py-2 resize-y`} placeholder="En une ou deux phrases, de quoi parle ce podcast ?" required />
              </div>
              <div className="sm:col-span-2">
                <ImagePicker
                  id={`pc-cover-${e.key}`}
                  label="Pochette du podcast"
                  preview={e.cover?.preview || null}
                  onPick={(file, preview) => update(e.key, { cover: { file, preview } })}
                  onClear={() => update(e.key, { cover: null })}
                  required
                />
              </div>
              <div>
                <label htmlFor={`pc-them-${e.key}`} className={labelCls}>Thématique</label>
                <select id={`pc-them-${e.key}`} value={e.thematique} onChange={(x) => update(e.key, { thematique: x.target.value })} className={field}>
                  <option value="">Choisir</option>
                  {THEMATIQUES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`pc-type-${e.key}`} className={labelCls}>Type de podcast</label>
                <select id={`pc-type-${e.key}`} value={e.typePodcast} onChange={(x) => update(e.key, { typePodcast: x.target.value })} className={field}>
                  <option value="">Choisir</option>
                  {TYPES_PODCAST.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`pc-niv-${e.key}`} className={labelCls}>Nombre d'épisodes</label>
                <select id={`pc-niv-${e.key}`} value={e.niveau} onChange={(x) => update(e.key, { niveau: x.target.value })} className={field}>
                  <option value="">Choisir</option>
                  <option value="lancement">Lancement (0 à 10 épisodes)</option>
                  <option value="croissance">En croissance (10 à 50)</option>
                  <option value="installe">Installé (plus de 50)</option>
                </select>
              </div>
              <div>
                <label htmlFor={`pc-freq-${e.key}`} className={labelCls}>Rythme de publication</label>
                <select id={`pc-freq-${e.key}`} value={e.frequence} onChange={(x) => update(e.key, { frequence: x.target.value })} className={field}>
                  <option value="">Choisir</option>
                  <option value="hebdomadaire">Chaque semaine</option>
                  <option value="bimensuel">Deux fois par mois</option>
                  <option value="mensuel">Chaque mois</option>
                  <option value="irregulier">Irrégulier</option>
                </select>
              </div>
              <div>
                <label htmlFor={`pc-mon-${e.key}`} className={labelCls}>Podcast monétisé ?</label>
                <select id={`pc-mon-${e.key}`} value={e.monetise} onChange={(x) => update(e.key, { monetise: x.target.value })} className={field}>
                  <option value="">Choisir</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                  <option value="En cours">En cours, en test</option>
                </select>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {entries.length < MAX_PODCASTS && (
        <button type="button" onClick={() => setEntries((l) => [...l, emptyEntry()])} className={`${btnSecondary} mt-6`}>
          <Plus className="w-4 h-4" aria-hidden /> Ajouter un autre podcast
        </button>
      )}

      <div className="mt-10 border-t border-filet pt-6 space-y-6">
        <BesoinsMultiSelect selected={besoins} onChange={setBesoins} labelClass={labelCls} />
        <div>
          <p className={labelCls}>Votre priorité du moment</p>
          <PrioriteSelect value={priorite} onChange={setPriorite} labelClass="sr-only" />
        </div>
        <Check checked={consentPublication} onChange={setConsentPublication} required>
          J'accepte la publication de mes podcasts sur le site (via leur lien d'écoute et leur flux)
        </Check>
      </div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
        {onBack ? <button type="button" onClick={onBack} className={btnSecondary}>Revenir au profil</button> : <span />}
        <button type="submit" disabled={sending} className={`${btnPrimary} px-8`}>
          {sending ? "Envoi en cours…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default PodcastsStep;
