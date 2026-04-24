import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  evenementId: string;
  titre: string;
  date_debut: string;
  lieu?: string | null;
  adresse?: string | null;
  slug?: string | null;
}

const schema = z.object({
  prenom: z.string().trim().min(1, "Prénom requis").max(80),
  nom: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().email("Email invalide").max(255),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),
  structure: z.string().trim().max(150).optional().or(z.literal("")),
});

const EvenementInscriptionForm = ({ evenementId, titre, date_debut, lieu, adresse, slug }: Props) => {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", telephone: "", structure: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
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
        if (error.code === "23505") {
          toast.error("Cet email est déjà inscrit à cet événement.");
        } else {
          console.error(error);
          toast.error("Erreur lors de l'inscription. Merci de réessayer.");
        }
        setSubmitting(false);
        return;
      }

      // Envoi email de confirmation (non bloquant)
      supabase.functions.invoke("evenement-inscription-confirmation", {
        body: {
          email: parsed.data.email,
          prenom: parsed.data.prenom,
          nom: parsed.data.nom,
          titre,
          date_debut,
          lieu,
          adresse,
          slug,
        },
      }).catch((err) => console.error("Email confirmation error", err));

      setSuccess(true);
      toast.success("Inscription confirmée ! Un email vous a été envoyé.");
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-bleu/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-bleu" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-1">Inscription confirmée !</h3>
        <p className="text-sm text-muted-foreground">
          Un email de confirmation vient d'être envoyé à <strong>{form.email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="w-5 h-5 text-bleu" />
        <h3 className="font-display font-bold text-lg text-foreground">S'inscrire à cet événement</h3>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Remplissez ce formulaire pour réserver votre place. Un email de confirmation vous sera envoyé.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Prénom *</label>
          <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required maxLength={80} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Nom *</label>
          <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required maxLength={80} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Téléphone</label>
          <Input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} maxLength={30} placeholder="Optionnel" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Structure / podcast</label>
          <Input value={form.structure} onChange={(e) => setForm({ ...form, structure: e.target.value })} maxLength={150} placeholder="Optionnel" />
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full rounded-pill bg-bleu text-white hover:bg-bleu-dark font-bold">
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Envoi…</> : "Confirmer mon inscription"}
      </Button>
    </form>
  );
};

export default EvenementInscriptionForm;
