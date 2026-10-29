import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkImage, messageServeur, uploadImage } from "@/lib/inscription";
import { btnPrimary, btnSecondary, linkUnderline } from "@/lib/pds";
import { EVENT_TYPES } from "@/components/home/useHomeData";
import { sansEmojis } from "@/lib/events";

// Types proposés aux membres, dans cet ordre
const TYPES_PROPOSITION = ["apero_ecoute", "atelier", "live", "ecoute", "rencontre", "autre"]
  .map((v) => EVENT_TYPES.find((t) => t.value === v)!)
  .filter(Boolean);

const field = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";
const label = "block text-sm font-bold mb-1.5";

/** Date UTC → valeur locale pour un champ « datetime-local ». */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

export type PropositionInitiale = {
  id: string;
  titre: string;
  sous_titre: string | null;
  description: string | null;
  date_debut: string;
  date_fin: string | null;
  lieu: string | null;
  adresse: string | null;
  type: string;
  format: string | null;
  lien_connexion: string | null;
  lien_externe: string | null;
  tarif: string | null;
  places: number | null;
  image_url: string | null;
};

type Props = { initial?: PropositionInitiale; onDone?: () => void };

/**
 * « Proposer un événement » : réservé aux membres connectés et à jour (vérifié aussi par le serveur).
 * La proposition arrive « en relecture » ; en mode modification, le membre la corrige tant qu'elle n'est pas relue.
 */
const ProposerEvenementForm = ({ initial, onDone }: Props) => {
  const edit = !!initial;
  const [acces, setAcces] = useState<"chargement" | "visiteur" | "pas_a_jour" | "ok">(edit ? "ok" : "chargement");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    titre: initial?.titre || "",
    sous_titre: initial?.sous_titre || "",
    description: initial?.description || "",
    date_debut: toLocalInput(initial?.date_debut),
    date_fin: toLocalInput(initial?.date_fin),
    lieu: initial?.lieu || "",
    adresse: initial?.adresse || "",
    type: initial?.type || "rencontre",
    format: initial?.format || "sur_place",
    lien_connexion: initial?.lien_connexion || "",
    lien_externe: initial?.lien_externe || "",
    tarif: initial?.tarif || "",
    places: initial?.places ? String(initial.places) : "",
    image_url: initial?.image_url || "",
  });

  useEffect(() => {
    if (edit) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setAcces("visiteur"); return; }
      const { data } = await supabase.rpc("peut_proposer_evenement");
      setAcces(data ? "ok" : "pas_a_jour");
    })();
  }, [edit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = checkImage(file);
    if (problem) { toast.error(problem); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.height > img.width) toast.warning("Ce visuel est en hauteur : un format paysage s'affiche mieux.");
      if (form.image_url.startsWith("blob:")) URL.revokeObjectURL(form.image_url);
      setImageFile(file);
      setForm((p) => ({ ...p, image_url: url }));
    };
    img.src = url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.date_debut) { toast.error("Le titre et la date de début sont obligatoires."); return; }
    if (form.format === "en_ligne" && form.lien_connexion && !/^https:\/\//i.test(form.lien_connexion)) { toast.error("Le lien de connexion doit commencer par https://"); return; }
    if (form.lien_externe && !/^https:\/\//i.test(form.lien_externe)) { toast.error("Le lien d'inscription doit commencer par https://"); return; }
    setSending(true);
    let imageUrl: string | null = form.image_url && !form.image_url.startsWith("blob:") ? form.image_url : null;
    if (imageFile) {
      try { imageUrl = await uploadImage(imageFile, "", "event-images"); }
      catch (err) { setSending(false); toast.error(messageServeur(err as { code?: string; message?: string }, "L'image n'a pas pu être envoyée.")); return; }
    }
    // Émojis retirés à l'enregistrement (titre, sous-titre, description)
    const payload = {
      titre: sansEmojis(form.titre),
      sous_titre: sansEmojis(form.sous_titre) || null,
      description: sansEmojis(form.description) || null,
      date_debut: new Date(form.date_debut).toISOString(),
      date_fin: form.date_fin ? new Date(form.date_fin).toISOString() : null,
      type: form.type,
      format: form.format,
      lieu: form.format === "sur_place" ? form.lieu || null : null,
      adresse: form.format === "sur_place" ? form.adresse || null : null,
      lien_connexion: form.format === "en_ligne" ? form.lien_connexion || null : null,
      lien_externe: form.lien_externe || null,
      tarif: form.tarif || null,
      places: form.places ? parseInt(form.places, 10) : null,
      image_url: imageUrl,
    };
    const { error } = edit
      ? await supabase.from("evenements").update(payload).eq("id", initial!.id)
      : await supabase.from("evenements").insert(payload);
    setSending(false);
    if (error) { toast.error(messageServeur(error, "L'envoi n'a pas abouti. Réessayez.")); console.error(error); return; }
    if (edit) { toast.success("Proposition modifiée."); onDone?.(); return; }
    setSubmitted(true);
  };

  if (acces === "chargement") return <p className="font-mono text-sm text-muted-foreground">Chargement…</p>;
  if (acces === "visiteur" || acces === "pas_a_jour") {
    return (
      <div className="border-2 border-encre bg-surface p-6 sm:p-8">
        <p className="title-section text-[26px]">Réservé aux membres à jour de cotisation</p>
        <p className="mt-3 text-[17px] max-w-[60ch]">
          {acces === "visiteur"
            ? "Connectez-vous à votre espace membre pour proposer un rendez-vous : il sera relu par l'équipe avant d'apparaître dans l'agenda."
            : "Votre adhésion n'est pas à jour. Renouvelez-la pour proposer un rendez-vous dans l'agenda."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {acces === "visiteur" && <Link to="/espace-membre?retour=/proposer-evenement-podcast" className={btnPrimary}>Me connecter</Link>}
          <Link to="/adherer?etape=adhesion" className={btnSecondary}>Adhérer</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div role="status" className="border-2 border-encre bg-surface p-6 sm:p-8">
        <p className="title-section text-[30px]">Merci pour votre proposition.</p>
        <p className="mt-3 text-[17px]">Elle est « en relecture ». Vous suivez son statut dans votre espace membre, où vous pouvez encore la modifier tant qu'elle n'est pas relue.</p>
        <Link to="/mon-espace#evenements" className={`${linkUnderline} mt-5 inline-flex min-h-[44px] items-center`}>Voir mes événements</Link>
      </div>
    );
  }

  const p = edit ? `ed-${initial!.id.slice(0, 6)}` : "pe";
  return (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
      <div className="sm:col-span-2">
        <label htmlFor={`${p}-titre`} className={label}>Titre <span aria-hidden>*</span></label>
        <input id={`${p}-titre`} name="titre" maxLength={150} value={form.titre} onChange={handleChange} className={field} required />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${p}-sous-titre`} className={label}>Sous-titre</label>
        <input id={`${p}-sous-titre`} name="sous_titre" maxLength={200} value={form.sous_titre} onChange={handleChange} className={field} placeholder="Une phrase qui résume le rendez-vous" />
      </div>
      <div>
        <label htmlFor={`${p}-type`} className={label}>Type <span aria-hidden>*</span></label>
        <select id={`${p}-type`} name="type" value={form.type} onChange={handleChange} className={field}>
          {TYPES_PROPOSITION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <fieldset>
        <legend className={label}>Format <span aria-hidden>*</span></legend>
        <div className="flex gap-4 min-h-[48px] items-center">
          {[["sur_place", "Sur place"], ["en_ligne", "En ligne"]].map(([v, l]) => (
            <label key={v} className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="format" value={v} checked={form.format === v} onChange={handleChange} className="w-5 h-5 accent-primary" />{l}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${p}-debut`} className={label}>Début <span aria-hidden>*</span></label>
        <input id={`${p}-debut`} type="datetime-local" name="date_debut" value={form.date_debut} onChange={handleChange} className={field} required />
      </div>
      <div>
        <label htmlFor={`${p}-fin`} className={label}>Fin</label>
        <input id={`${p}-fin`} type="datetime-local" name="date_fin" value={form.date_fin} onChange={handleChange} className={field} />
      </div>
      {form.format === "sur_place" ? (
        <>
          <div>
            <label htmlFor={`${p}-lieu`} className={label}>Lieu</label>
            <input id={`${p}-lieu`} name="lieu" maxLength={200} value={form.lieu} onChange={handleChange} className={field} placeholder="La Friche Belle de Mai" />
          </div>
          <div>
            <label htmlFor={`${p}-adresse`} className={label}>Adresse</label>
            <input id={`${p}-adresse`} name="adresse" maxLength={250} value={form.adresse} onChange={handleChange} className={field} />
          </div>
        </>
      ) : (
        <div className="sm:col-span-2">
          <label htmlFor={`${p}-connexion`} className={label}>Lien de connexion</label>
          <input id={`${p}-connexion`} name="lien_connexion" value={form.lien_connexion} onChange={handleChange} className={field} placeholder="https://…" />
        </div>
      )}
      <div>
        <label htmlFor={`${p}-tarif`} className={label}>Tarif</label>
        <input id={`${p}-tarif`} name="tarif" maxLength={80} value={form.tarif} onChange={handleChange} className={field} placeholder="5 €, Prix libre…" />
      </div>
      <div>
        <label htmlFor={`${p}-places`} className={label}>Nombre de places</label>
        <input id={`${p}-places`} type="number" min="1" name="places" value={form.places} onChange={handleChange} className={field} placeholder="Vide si illimité" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${p}-lien`} className={label}>Lien d'inscription externe (facultatif)</label>
        <input id={`${p}-lien`} name="lien_externe" value={form.lien_externe} onChange={handleChange} className={field} placeholder="https://…" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${p}-description`} className={label}>Description</label>
        <textarea id={`${p}-description`} name="description" rows={4} maxLength={6000} value={form.description} onChange={handleChange} className={`${field} py-2 resize-y`} placeholder="À qui s'adresse le rendez-vous, ce qu'on y fait, ce qu'on en retire." aria-describedby={`${p}-description-aide`} />
        <p id={`${p}-description-aide`} className="mt-1.5 text-sm text-muted-foreground">Pas la date, l'heure ni le lieu ici : ils s'affichent automatiquement au-dessus. Pas d'émojis.</p>
      </div>
      <div className="sm:col-span-2">
        <p className={label}>Visuel (facultatif, format paysage)</p>
        {form.image_url ? (
          <div className="relative inline-block">
            <img src={form.image_url} alt="Aperçu du visuel choisi" className="w-full max-w-sm aspect-[16/9] object-cover border-2 border-encre" />
            <button type="button" onClick={() => { setImageFile(null); setForm((x) => ({ ...x, image_url: "" })); }} className="absolute top-2 right-2 w-11 h-11 bg-encre text-surface inline-flex items-center justify-center" aria-label="Retirer le visuel">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} className={btnSecondary}>Choisir un fichier</button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} className="hidden" aria-label="Choisir un visuel" />
        <p className="mt-1.5 text-sm text-muted-foreground">JPG, PNG ou WebP, 5 Mo maximum, de préférence en largeur (16/9).</p>
      </div>
      <div className="sm:col-span-2 flex flex-wrap gap-3">
        <button type="submit" disabled={sending} className={`${btnPrimary} px-8`}>
          {sending ? "Envoi en cours…" : edit ? "Enregistrer les modifications" : "Envoyer pour relecture"}
        </button>
        {edit && <button type="button" onClick={onDone} className={btnSecondary}>Annuler</button>}
      </div>
    </form>
  );
};

export default ProposerEvenementForm;
