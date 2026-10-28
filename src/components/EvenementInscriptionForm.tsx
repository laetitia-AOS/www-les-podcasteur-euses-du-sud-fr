import { useState } from "react";
import { messageServeur } from "@/lib/inscription";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { btnPrimary } from "@/lib/pds";

interface Props {
  evenementId: string;
  titre: string;
  date_debut: string;
  lieu?: string | null;
  adresse?: string | null;
  slug?: string | null;
}

const schema = z.object({
  prenom: z.string().trim().min(1, "Indiquez votre prénom.").max(80),
  nom: z.string().trim().min(1, "Indiquez votre nom.").max(80),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),
  structure: z.string().trim().max(150).optional().or(z.literal("")),
});

const field = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";
const label = "block text-sm font-bold mb-1.5";

/** Inscription à un événement : même fonctionnement qu'avant, nouveau style. Téléphone et structure restent facultatifs. */
const EvenementInscriptionForm = ({ evenementId, titre, date_debut, lieu, adresse, slug }: Props) => {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", telephone: "", structure: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("evenement_inscriptions").insert({
        evenement_id: evenementId,
        prenom: parsed.data.prenom,
        nom: parsed.data.nom,
        email: parsed.data.email,
        telephone: parsed.data.telephone || null,
        structure: parsed.data.structure || null,
      });
      if (error) {
        toast.error(error.code === "23505" ? "Cette adresse est déjà inscrite à cet événement." : messageServeur(error, "L'inscription n'a pas abouti. Réessayez."));
        if (error.code !== "23505") console.error(error);
        setSubmitting(false);
        return;
      }
      // E-mail de confirmation : envoyé si possible, sans bloquer l'inscription
      supabase.functions
        .invoke("evenement-inscription-confirmation", { body: { email: parsed.data.email, prenom: parsed.data.prenom, nom: parsed.data.nom, titre, date_debut, lieu, adresse, slug } })
        .catch(() => {});
      setSuccess(true);
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div role="status" className="border-2 border-encre bg-surface p-6">
        <p className="title-section text-[26px]">C'est noté, {form.prenom}.</p>
        <p className="mt-2 text-[17px]">Votre inscription est enregistrée. À bientôt.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-encre bg-surface p-6 grid sm:grid-cols-2 gap-4" aria-labelledby="inscription-title">
      <div className="sm:col-span-2">
        <h2 id="inscription-title" className="title-section text-[28px]">Je m'inscris</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">Pour qu'on prévoie votre place. Seuls le prénom, le nom et l'e-mail sont demandés.</p>
      </div>
      <div>
        <label htmlFor="ins-prenom" className={label}>Prénom</label>
        <input id="ins-prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} autoComplete="given-name" required maxLength={80} className={field} />
      </div>
      <div>
        <label htmlFor="ins-nom" className={label}>Nom</label>
        <input id="ins-nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} autoComplete="family-name" required maxLength={80} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="ins-email" className={label}>E-mail</label>
        <input id="ins-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required maxLength={255} className={field} />
      </div>
      <div>
        <label htmlFor="ins-tel" className={label}>Téléphone (facultatif)</label>
        <input id="ins-tel" type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} autoComplete="tel" maxLength={30} className={field} />
      </div>
      <div>
        <label htmlFor="ins-structure" className={label}>Structure ou podcast (facultatif)</label>
        <input id="ins-structure" value={form.structure} onChange={(e) => setForm({ ...form, structure: e.target.value })} maxLength={150} className={field} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={submitting} className={`${btnPrimary} px-7`}>
          {submitting ? "Envoi…" : "Confirmer mon inscription"}
        </button>
      </div>
    </form>
  );
};

export default EvenementInscriptionForm;
