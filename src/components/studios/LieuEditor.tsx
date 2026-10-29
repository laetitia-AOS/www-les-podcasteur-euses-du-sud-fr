import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChoiceList, field, hintCls, labelCls } from "@/components/adherer/fields";
import { checkImage, messageServeur, uploadImages } from "@/lib/inscription";
import { btnPrimary, btnSecondary, fullName } from "@/lib/pds";
import { ACCROCHE_MAX, SERVICES_STUDIO, TARIF_UNITES, ficheVide, type FicheLieu, type TarifTaxe, type TarifUnite } from "@/lib/lieux";

type Props = { podcastId: string; type: "studio" | "structure_eco"; nom: string };

const MAX = { photos: 5, faq: 3, liens: 6, propositions: 3, presse: 10, lies: 12 };
const small = "w-full min-h-[44px] px-3 bg-surface border-2 border-encre text-[15px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

/** Formulaire des informations détaillées d'un studio ou d'une structure (espace membre et administration). */
const LieuEditor = ({ podcastId, type, nom }: Props) => {
  const qc = useQueryClient();
  const isStudio = type === "studio";
  const [f, setF] = useState<FicheLieu>(ficheVide(podcastId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pick, setPick] = useState("");

  const { data: initial, isLoading } = useQuery({
    queryKey: ["fiche-lieu-edit", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase.from("fiches_lieux").select("*").eq("podcast_id", podcastId).maybeSingle();
      if (error) throw error;
      return (data as unknown as FicheLieu) || ficheVide(podcastId);
    },
  });
  useEffect(() => { if (initial) setF({ ...ficheVide(podcastId), ...initial }); }, [initial, podcastId]);
  // Une accroche déjà enregistrée plus longue que 160 caractères reste telle quelle : on peut seulement la raccourcir
  const accrocheInitiale = initial?.accroche?.length || 0;
  const accrocheLimite = Math.max(ACCROCHE_MAX, accrocheInitiale);
  const accrocheTrop = (f.accroche?.length || 0) > ACCROCHE_MAX;

  // Podcasts visibles, pour « Enregistrés ici » / « Membres accompagnés »
  const { data: podcasts = [] } = useQuery({
    queryKey: ["podcasts-visibles-choix"],
    queryFn: async () => {
      const { data } = await supabase.from("podcasts").select("id, nom_podcast, prenom, nom, type_profil")
        .eq("valide", true).in("type_profil", ["podcasteur", "pro_podcast"]).order("nom_podcast");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
  const labelPodcast = (id: string) => {
    const p = podcasts.find((x) => x.id === id);
    if (!p) return "Fiche";
    return p.type_profil === "podcasteur" && p.nom_podcast !== "—" ? `${p.nom_podcast} (${fullName(p.prenom, p.nom)})` : fullName(p.prenom, p.nom) || p.nom_podcast;
  };

  const set = <K extends keyof FicheLieu>(k: K, v: FicheLieu[K]) => setF((x) => ({ ...x, [k]: v }));
  const setItem = <K extends "faq" | "liens" | "propositions" | "presse" | "podcasts_lies">(k: K, i: number, patch: Partial<FicheLieu[K][number]>) =>
    setF((x) => ({ ...x, [k]: (x[k] as unknown[]).map((it, j) => (j === i ? { ...(it as object), ...patch } : it)) }));
  const removeItem = (k: "faq" | "liens" | "propositions" | "presse" | "podcasts_lies" | "photos", i: number) =>
    setF((x) => ({ ...x, [k]: (x[k] as unknown[]).filter((_, j) => j !== i) }));

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, MAX.photos - f.photos.length);
    for (const file of list) { const p = checkImage(file); if (p) { toast.error(p); return; } }
    setUploading(true);
    try {
      const urls = await uploadImages(list, "", isStudio ? "studio-galleries" : "podcast-thumbnails");
      set("photos", [...f.photos, ...urls].slice(0, MAX.photos));
    } catch (err) {
      toast.error(messageServeur(err as { code?: string; message?: string }, "Les photos n'ont pas pu être envoyées."));
    } finally { setUploading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const montant = f.tarif_heure === null || (f.tarif_heure as unknown) === "" ? null : Number(f.tarif_heure);
    const payload = {
      podcast_id: podcastId,
      accroche: f.accroche?.trim() || null,
      description_longue: f.description_longue?.trim() || null,
      tarif_heure: montant,
      tarif_unite: montant === null ? null : f.tarif_unite || "heure",
      tarif_taxe: montant === null ? null : f.tarif_taxe || "TTC",
      capacite_voix: f.capacite_voix === null || (f.capacite_voix as unknown) === "" ? null : Number(f.capacite_voix),
      acces_transports: f.acces_transports || null,
      services: f.services,
      photos: f.photos,
      equipement: f.equipement,
      accessibilite: f.accessibilite || null,
      faq: f.faq.filter((x) => x.q.trim()),
      liens: f.liens.filter((x) => x.url.trim()),
      propositions: f.propositions.filter((x) => x.titre.trim()),
      presse: f.presse.filter((x) => x.url.trim()),
      podcasts_lies: f.podcasts_lies,
      intitule_membres: f.intitule_membres,
    };
    const { error } = await supabase.from("fiches_lieux").upsert(payload as never, { onConflict: "podcast_id" });
    setSaving(false);
    if (error) { toast.error(messageServeur(error, "L'enregistrement n'a pas abouti.")); return; }
    toast.success("Fiche enregistrée.");
    qc.invalidateQueries({ queryKey: ["fiche-lieu-edit", podcastId] });
    qc.invalidateQueries({ queryKey: ["fiches-lieux"] });
  };

  if (isLoading) return <p className="py-4 font-mono text-sm text-muted-foreground">Chargement…</p>;
  const id = (k: string) => `lieu-${podcastId.slice(0, 8)}-${k}`;

  return (
    <form onSubmit={save} className="space-y-7" noValidate>
      <div>
        <label htmlFor={id("accroche")} className={labelCls}>Accroche</label>
        <textarea id={id("accroche")} rows={2} value={f.accroche ?? ""} maxLength={accrocheLimite}
          onChange={(e) => {
            const v = e.target.value;
            // Au-delà de 160 caractères, on peut seulement raccourcir
            if (v.length > ACCROCHE_MAX && v.length > (f.accroche?.length || 0)) return;
            set("accroche", v);
          }}
          className={`${field} py-2`} aria-describedby={`${id("accroche")}-aide`} />
        <p id={`${id("accroche")}-aide`} className={`${hintCls} font-mono ${accrocheTrop ? "!text-destructive font-bold" : ""}`}>
          {f.accroche?.length || 0}/{ACCROCHE_MAX} caractères{accrocheTrop ? " : trop long, raccourcissez ce texte pour le modifier" : ""}
        </p>
        <p className={hintCls}>Une phrase sous le nom, sans tarif ni capacité : ils s'affichent dans « En pratique ».</p>
      </div>
      <div>
        <label htmlFor={id("description")} className={labelCls}>{isStudio ? "Le studio (description longue)" : "Présentation (description longue)"}</label>
        <textarea id={id("description")} rows={6} maxLength={3000} value={f.description_longue ?? ""} onChange={(e) => set("description_longue", e.target.value)} className={`${field} py-2`} />
        <div className="flex flex-wrap justify-between gap-x-4">
          <p className={hintCls}>
            {isStudio ? "Laissée vide, la section « Le studio » n'apparaît pas." : "Pas de dates ici : vos événements viennent de l'agenda. Laissée vide, la section « Présentation » n'apparaît pas."}
          </p>
          <p className={`${hintCls} font-mono`}>{f.description_longue?.length || 0}/3000</p>
        </div>
      </div>
      {isStudio && (
        <fieldset className="grid sm:grid-cols-[1fr_1fr_1fr] gap-4">
          <legend className={`${labelCls} sm:col-span-3`}>Tarif « à partir de »</legend>
          <div>
            <label htmlFor={id("tarif")} className="block text-sm mb-1">Montant (€)</label>
            <input id={id("tarif")} type="number" min={0} max={100000} step="1" inputMode="decimal" value={f.tarif_heure ?? ""}
              onChange={(e) => set("tarif_heure", (e.target.value === "" ? null : Number(e.target.value)) as number | null)} className={field} />
          </div>
          <div>
            <label htmlFor={id("tarif-unite")} className="block text-sm mb-1">Par</label>
            <select id={id("tarif-unite")} value={f.tarif_unite || "heure"} onChange={(e) => set("tarif_unite", e.target.value as TarifUnite)} className={field}>
              {TARIF_UNITES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={id("tarif-taxe")} className="block text-sm mb-1">Taxes</label>
            <select id={id("tarif-taxe")} value={f.tarif_taxe || "TTC"} onChange={(e) => set("tarif_taxe", e.target.value as TarifTaxe)} className={field}>
              <option value="TTC">TTC</option>
              <option value="HT">HT</option>
            </select>
          </div>
          <p className={`${hintCls} sm:col-span-3 mt-0`}>Affiché « à partir de 48 € TTC / h ». Sans montant, la fiche affiche « Sur devis ».</p>
        </fieldset>
      )}
      {isStudio && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={id("capacite")} className={labelCls}>Capacité (nombre de voix)</label>
            <input id={id("capacite")} type="number" min={1} max={50} value={f.capacite_voix ?? ""}
              onChange={(e) => set("capacite_voix", (e.target.value === "" ? null : Number(e.target.value)) as number | null)} className={field} />
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={id("acces")} className={labelCls}>Accès en transports en commun</label>
          <input id={id("acces")} maxLength={200} value={f.acces_transports ?? ""} onChange={(e) => set("acces_transports", e.target.value)} className={field} placeholder="Métro Vieux-Port, 5 min à pied" />
        </div>
        <div>
          <label htmlFor={id("accessibilite")} className={labelCls}>Accessibilité</label>
          <input id={id("accessibilite")} maxLength={300} value={f.accessibilite ?? ""} onChange={(e) => set("accessibilite", e.target.value)} className={field} placeholder="Rez-de-chaussée, accès fauteuil" />
        </div>
      </div>

      {isStudio && <ChoiceList legend="Services proposés" options={SERVICES_STUDIO} selected={f.services} onChange={(v) => set("services", v)} />}

      <fieldset>
        <legend className={labelCls}>Photos ({f.photos.length}/{MAX.photos})</legend>
        <ul className="flex flex-wrap gap-3">
          {f.photos.map((src, i) => (
            <li key={src} className="relative">
              <img src={src} alt={`Photo ${i + 1}`} className="w-28 h-20 object-cover border border-filet" />
              <button type="button" onClick={() => removeItem("photos", i)} className="absolute -top-2 -right-2 w-8 h-8 bg-encre text-surface inline-flex items-center justify-center" aria-label={`Retirer la photo ${i + 1}`}><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
        {f.photos.length < MAX.photos && (
          <label className={`${btnSecondary} mt-3 cursor-pointer`}>
            {uploading ? "Envoi…" : "Ajouter des photos"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading} onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        <p className={hintCls}>JPG, PNG ou WebP, 5 Mo maximum chacune. Les 3 premières s'affichent en haut de la fiche.</p>
      </fieldset>

      {isStudio && (
        <fieldset className="grid sm:grid-cols-2 gap-4">
          <legend className={`${labelCls} sm:col-span-2`}>Équipement</legend>
          <div className="sm:col-span-2">
            <label htmlFor={id("materiel")} className="block text-sm mb-1">Matériel</label>
            <textarea id={id("materiel")} rows={3} maxLength={600} value={f.equipement.materiel ?? ""} onChange={(e) => set("equipement", { ...f.equipement, materiel: e.target.value })} className={`${small} py-2`} placeholder="Micros, caméras, console, logiciels…" />
          </div>
          <div>
            <label htmlFor={id("lumieres_decor")} className="block text-sm mb-1">Lumières et décor</label>
            <input id={id("lumieres_decor")} maxLength={200} value={f.equipement.lumieres_decor ?? ""} onChange={(e) => set("equipement", { ...f.equipement, lumieres_decor: e.target.value })} className={small} />
          </div>
          <label className="flex items-center gap-3 min-h-[44px] cursor-pointer self-end">
            <input type="checkbox" className="w-5 h-5 accent-primary" checked={!!f.equipement.technicien} onChange={(e) => set("equipement", { ...f.equipement, technicien: e.target.checked })} />
            Technicien·ne sur place
          </label>
        </fieldset>
      )}

      {!isStudio && (
        <fieldset className="space-y-3">
          <legend className={labelCls}>Ce que {nom} propose aux podcasteur·euses ({f.propositions.length}/{MAX.propositions})</legend>
          {f.propositions.map((p, i) => (
            <div key={i} className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-start">
              <input aria-label={`Titre ${i + 1}`} maxLength={80} value={p.titre} onChange={(e) => setItem("propositions", i, { titre: e.target.value })} className={small} placeholder="Titre" />
              <input aria-label={`Texte ${i + 1}`} maxLength={400} value={p.texte} onChange={(e) => setItem("propositions", i, { texte: e.target.value })} className={small} placeholder="En une phrase" />
              <button type="button" onClick={() => removeItem("propositions", i)} className="min-h-[44px] px-3 underline" aria-label={`Retirer la proposition ${i + 1}`}>Retirer</button>
            </div>
          ))}
          {f.propositions.length < MAX.propositions && <button type="button" onClick={() => set("propositions", [...f.propositions, { titre: "", texte: "" }])} className="underline font-bold min-h-[44px]">Ajouter une proposition</button>}
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className={labelCls}>
          {isStudio ? "Enregistrés ici" : f.intitule_membres === "antenne" ? "Membres passés à l'antenne" : "Membres accompagnés"} ({f.podcasts_lies.length}/{MAX.lies})
        </legend>
        {!isStudio && (
          <div className="flex flex-wrap gap-4">
            {([["accompagnes", "Membres accompagnés"], ["antenne", "Membres passés à l'antenne"]] as const).map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                <input type="radio" name={id("intitule")} className="w-4 h-4 accent-primary" checked={f.intitule_membres === v} onChange={() => set("intitule_membres", v)} />{l}
              </label>
            ))}
          </div>
        )}
        {f.podcasts_lies.map((l, i) => (
          <div key={l.id} className="grid sm:grid-cols-[2fr_150px_1fr_auto] gap-2 items-center">
            <span className="font-semibold">{labelPodcast(l.id)}</span>
            <input aria-label={`Date pour ${labelPodcast(l.id)}`} type="month" value={l.date?.slice(0, 7) ?? ""} onChange={(e) => setItem("podcasts_lies", i, { date: e.target.value || undefined })} className={small} />
            <input aria-label={`Lien de l'épisode pour ${labelPodcast(l.id)}`} value={l.url ?? ""} onChange={(e) => setItem("podcasts_lies", i, { url: e.target.value || undefined })} className={small} placeholder="Lien de l'épisode (facultatif)" />
            <button type="button" onClick={() => removeItem("podcasts_lies", i)} className="min-h-[44px] px-3 underline">Retirer</button>
          </div>
        ))}
        {f.podcasts_lies.length < MAX.lies && (
          <div className="flex flex-wrap gap-2">
            <label htmlFor={id("pick")} className="sr-only">Choisir une fiche membre</label>
            <select id={id("pick")} value={pick} onChange={(e) => setPick(e.target.value)} className={`${small} max-w-md`}>
              <option value="">Choisir une fiche membre</option>
              {podcasts.filter((p) => !f.podcasts_lies.some((l) => l.id === p.id) && p.id !== podcastId).map((p) => <option key={p.id} value={p.id}>{labelPodcast(p.id)}</option>)}
            </select>
            <button type="button" disabled={!pick} onClick={() => { set("podcasts_lies", [...f.podcasts_lies, { id: pick }]); setPick(""); }} className={btnSecondary}>Ajouter</button>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className={labelCls}>Questions fréquentes ({f.faq.length}/{MAX.faq})</legend>
        {f.faq.map((q, i) => (
          <div key={i} className="grid gap-2 border-l-[3px] border-filet pl-3">
            <input aria-label={`Question ${i + 1}`} maxLength={200} value={q.q} onChange={(e) => setItem("faq", i, { q: e.target.value })} className={small} placeholder="La question" />
            <textarea aria-label={`Réponse ${i + 1}`} maxLength={800} rows={2} value={q.r} onChange={(e) => setItem("faq", i, { r: e.target.value })} className={`${small} py-2`} placeholder="La réponse" />
            <button type="button" onClick={() => removeItem("faq", i)} className="justify-self-start underline min-h-[44px]">Retirer</button>
          </div>
        ))}
        {f.faq.length < MAX.faq && <button type="button" onClick={() => set("faq", [...f.faq, { q: "", r: "" }])} className="underline font-bold min-h-[44px]">Ajouter une question</button>}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className={labelCls}>Liens : site et réseaux ({f.liens.length}/{MAX.liens})</legend>
        {f.liens.map((l, i) => (
          <div key={i} className="grid sm:grid-cols-[160px_1fr_auto] gap-2">
            <input aria-label={`Nom du lien ${i + 1}`} maxLength={40} value={l.label} onChange={(e) => setItem("liens", i, { label: e.target.value })} className={small} placeholder="Instagram" />
            <input aria-label={`Adresse du lien ${i + 1}`} value={l.url} onChange={(e) => setItem("liens", i, { url: e.target.value })} className={small} placeholder="https://…" />
            <button type="button" onClick={() => removeItem("liens", i)} className="min-h-[44px] px-3 underline">Retirer</button>
          </div>
        ))}
        {f.liens.length < MAX.liens && <button type="button" onClick={() => set("liens", [...f.liens, { label: "", url: "" }])} className="underline font-bold min-h-[44px]">Ajouter un lien</button>}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className={labelCls}>Dans la presse ({f.presse.length}/{MAX.presse})</legend>
        {f.presse.map((p, i) => (
          <div key={i} className="grid sm:grid-cols-[1fr_1fr_150px_auto] gap-2">
            <input aria-label={`Titre de l'article ${i + 1}`} maxLength={150} value={p.titre} onChange={(e) => setItem("presse", i, { titre: e.target.value })} className={small} placeholder="Titre" />
            <input aria-label={`Lien de l'article ${i + 1}`} value={p.url} onChange={(e) => setItem("presse", i, { url: e.target.value })} className={small} placeholder="https://…" />
            <input aria-label={`Date de l'article ${i + 1}`} type="date" value={p.date ?? ""} onChange={(e) => setItem("presse", i, { date: e.target.value || undefined })} className={small} />
            <button type="button" onClick={() => removeItem("presse", i)} className="min-h-[44px] px-3 underline">Retirer</button>
          </div>
        ))}
        {f.presse.length < MAX.presse && <button type="button" onClick={() => set("presse", [...f.presse, { titre: "", url: "" }])} className="underline font-bold min-h-[44px]">Ajouter un article</button>}
      </fieldset>

      <button type="submit" disabled={saving || uploading} className={btnPrimary}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
        {saving ? "Enregistrement…" : "Enregistrer la fiche"}
      </button>
    </form>
  );
};

export default LieuEditor;
