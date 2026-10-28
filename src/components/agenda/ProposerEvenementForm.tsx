import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, btnSecondary } from "@/lib/pds";

const TYPE_OPTIONS = [
  { value: "rencontre", label: "Rencontre / Session d'écoute" },
  { value: "atelier", label: "Atelier pratique" },
  { value: "evenement", label: "Événement" },
  { value: "partenaire", label: "Événement partenaire" },
];

const field = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";
const label = "block text-sm font-bold mb-1.5";

/**
 * Formulaire « Proposer un événement » : même fonctionnement qu'avant
 * (événement enregistré non publié, relu par l'équipe), seul le style change.
 */
const ProposerEvenementForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    titre: "",
    sous_titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
    lieu: "",
    adresse: "",
    type: "evenement",
    lien_externe: "",
    image_url: "",
    places: "",
    proposeur_nom: "",
    proposeur_email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Sélectionnez une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image doit faire moins de 5 Mo."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(fileName, file, { contentType: file.type });
    if (error) { toast.error("L'image n'a pas pu être envoyée."); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image ajoutée.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.date_debut) { toast.error("Le titre et la date de début sont obligatoires."); return; }
    if (!form.proposeur_nom || !form.proposeur_email) { toast.error("Indiquez votre nom et votre e-mail."); return; }

    setUploading(true);
    const { error } = await supabase.from("evenements").insert({
      titre: form.titre,
      sous_titre: form.sous_titre || null,
      description: form.description
        ? `${form.description}\n\n---\nProposé par : ${form.proposeur_nom} (${form.proposeur_email})`
        : `Proposé par : ${form.proposeur_nom} (${form.proposeur_email})`,
      date_debut: new Date(form.date_debut).toISOString(),
      date_fin: form.date_fin ? new Date(form.date_fin).toISOString() : null,
      lieu: form.lieu || null,
      adresse: form.adresse || null,
      type: form.type,
      lien_externe: form.lien_externe || null,
      image_url: form.image_url || null,
      places: form.places ? parseInt(form.places) : null,
      publie: false, // En attente de validation admin
    });
    setUploading(false);
    if (error) { toast.error("L'envoi n'a pas abouti. Réessayez."); console.error(error); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div role="status" className="border-2 border-encre bg-surface p-6 sm:p-8">
        <p className="title-section text-[30px]">Merci pour votre proposition.</p>
        <p className="mt-3 text-[17px]">Votre événement est bien reçu. Il apparaîtra dans l'agenda après relecture par l'équipe, sous 48 à 72 heures.</p>
        <Link to="/agenda" className={`${btnSecondary} mt-6`}>Voir l'agenda</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-x-4 gap-y-5">
      <div className="sm:col-span-2">
        <label htmlFor="pe-titre" className={label}>Titre <span aria-hidden>*</span></label>
        <input id="pe-titre" name="titre" value={form.titre} onChange={handleChange} className={field} required />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="pe-sous-titre" className={label}>Sous-titre</label>
        <input id="pe-sous-titre" name="sous_titre" value={form.sous_titre} onChange={handleChange} className={field} placeholder="Une phrase qui résume la soirée" />
      </div>
      <div>
        <label htmlFor="pe-type" className={label}>Type <span aria-hidden>*</span></label>
        <select id="pe-type" name="type" value={form.type} onChange={handleChange} className={field}>
          {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="pe-debut" className={label}>Date et heure de début <span aria-hidden>*</span></label>
        <input id="pe-debut" type="datetime-local" name="date_debut" value={form.date_debut} onChange={handleChange} className={field} required />
      </div>
      <div>
        <label htmlFor="pe-fin" className={label}>Date et heure de fin</label>
        <input id="pe-fin" type="datetime-local" name="date_fin" value={form.date_fin} onChange={handleChange} className={field} />
      </div>
      <div>
        <label htmlFor="pe-lieu" className={label}>Lieu (ou « En ligne »)</label>
        <input id="pe-lieu" name="lieu" value={form.lieu} onChange={handleChange} className={field} placeholder="Ex : La Friche Belle de Mai" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="pe-adresse" className={label}>Adresse (ou lien de connexion si en ligne)</label>
        <input id="pe-adresse" name="adresse" value={form.adresse} onChange={handleChange} className={field} />
      </div>
      <div>
        <label htmlFor="pe-places" className={label}>Nombre de places</label>
        <input id="pe-places" type="number" min="0" name="places" value={form.places} onChange={handleChange} className={field} placeholder="Vide si illimité" />
      </div>
      <div>
        <label htmlFor="pe-lien" className={label}>Lien d'inscription (facultatif)</label>
        <input id="pe-lien" name="lien_externe" value={form.lien_externe} onChange={handleChange} className={field} placeholder="https://…" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="pe-description" className={label}>Description</label>
        <textarea id="pe-description" name="description" rows={4} value={form.description} onChange={handleChange} className={`${field} py-2 resize-y`} placeholder="À qui s'adresse l'événement, ce qu'on y fait, ce qu'on en retire. Indiquez aussi le tarif." />
      </div>
      <div className="sm:col-span-2">
        <p className={label}>Visuel (facultatif, format paysage)</p>
        {form.image_url ? (
          <div className="relative inline-block">
            <img src={form.image_url} alt="Aperçu du visuel choisi" className="w-full max-w-sm h-40 object-cover border-2 border-encre" />
            <button type="button" onClick={() => setForm((p) => ({ ...p, image_url: "" }))} className="absolute top-2 right-2 w-11 h-11 bg-encre text-surface inline-flex items-center justify-center" aria-label="Retirer le visuel">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={btnSecondary}>
            {uploading ? "Envoi en cours…" : "Choisir un fichier"}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" aria-label="Choisir un visuel" />
        <p className="mt-1.5 text-sm text-muted-foreground">JPG, PNG ou WebP, 5 Mo maximum.</p>
      </div>

      <fieldset className="sm:col-span-2 border-t border-filet pt-5 grid sm:grid-cols-2 gap-4">
        <legend className="text-sm font-bold pr-2">Vos coordonnées (non publiées)</legend>
        <div>
          <label htmlFor="pe-nom" className={label}>Votre nom <span aria-hidden>*</span></label>
          <input id="pe-nom" name="proposeur_nom" value={form.proposeur_nom} onChange={handleChange} autoComplete="name" className={field} required />
        </div>
        <div>
          <label htmlFor="pe-email" className={label}>Votre e-mail <span aria-hidden>*</span></label>
          <input id="pe-email" type="email" name="proposeur_email" value={form.proposeur_email} onChange={handleChange} autoComplete="email" className={field} required />
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <button type="submit" disabled={uploading} className={`${btnPrimary} px-8`}>
          {uploading ? "Envoi en cours…" : "Envoyer pour relecture"}
        </button>
      </div>
    </form>
  );
};

export default ProposerEvenementForm;
