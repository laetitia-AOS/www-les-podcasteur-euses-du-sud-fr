import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { CalendarDays, Send, Check, Image, X, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TYPE_OPTIONS = [
  { value: "rencontre", label: "Rencontre / Session d'écoute" },
  { value: "atelier", label: "Atelier pratique" },
  { value: "evenement", label: "Événement" },
  { value: "partenaire", label: "Événement partenaire" },
];

const ProposerEvenement = () => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Sélectionnez une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 Mo."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(fileName, file, { contentType: file.type });
    if (error) { toast.error("Erreur lors de l'envoi de l'image."); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image ajoutée !");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.date_debut) {
      toast.error("Le titre et la date de début sont obligatoires."); return;
    }
    if (!form.proposeur_nom || !form.proposeur_email) {
      toast.error("Merci d'indiquer votre nom et email."); return;
    }

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

    if (error) {
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
      console.error(error);
      return;
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inputClass = "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm";
  const selectClass = "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none shadow-sm";
  const labelClass = "block text-sm font-semibold text-foreground/80 mb-2";
  const sectionCardClass = "bg-card/50 border border-border/40 rounded-2xl p-6 space-y-5";

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Événement proposé — Les Podcasteur·euses du Sud" description="Votre événement a été soumis avec succès." path="/proposer-evenement-podcast" />
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-6 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-7 sm:p-10 space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display font-bold text-3xl">🎉 Merci pour votre proposition !</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Votre événement a bien été soumis. Il sera visible sur le site après validation par notre équipe (sous 48–72h).
              </p>
              <Link to="/evenements-podcast" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                Voir l'agenda →
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Proposer un événement — Les Podcasteur·euses du Sud"
        description="Proposez un événement podcast en Région Sud : rencontre, atelier, session d'écoute. Soumettez votre événement pour qu'il soit référencé sur l'agenda."
        path="/proposer-evenement-podcast"
      />
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Proposer
            </span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-3">
              Proposer un événement
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Vous organisez un événement lié au podcast en Région Sud ? Soumettez-le pour qu'il apparaisse dans notre agenda après validation.
            </p>
            <div className="mt-5 bg-muted/50 border border-border rounded-xl px-5 py-4 text-left max-w-lg mx-auto">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">À noter :</strong> l'association n'a aucune obligation de publier les événements soumis. La priorité de diffusion est accordée aux membres à jour de leur cotisation.
              </p>
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Section 1: Votre événement */}
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm flex items-center justify-center font-sans font-bold shadow-sm">1</span>
                <h3 className="font-display font-bold text-xl text-foreground">Votre événement</h3>
              </div>
              <div>
                <label className={labelClass}>Titre de l'événement <span className="text-primary">*</span></label>
                <input name="titre" value={form.titre} onChange={handleChange} className={inputClass} placeholder="Ex : Session d'écoute #5 — Podcasts narratifs" required />
              </div>
              <div>
                <label className={labelClass}>Sous-titre</label>
                <input name="sous_titre" value={form.sous_titre} onChange={handleChange} className={inputClass} placeholder="Ex : Soirée spéciale documentaire sonore" />
              </div>
              <div>
                <label className={labelClass}>Type d'événement <span className="text-primary">*</span></label>
                <select name="type" value={form.type} onChange={handleChange} className={selectClass}>
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className={inputClass + " min-h-[120px] resize-y"} placeholder="Décrivez votre événement : programme, intervenants, public visé…" />
              </div>
            </div>

            {/* Section 2: Date & lieu */}
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm flex items-center justify-center font-sans font-bold shadow-sm">2</span>
                <h3 className="font-display font-bold text-xl text-foreground">Date & lieu</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date et heure de début <span className="text-primary">*</span></label>
                  <input type="datetime-local" name="date_debut" value={form.date_debut} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Date et heure de fin</label>
                  <input type="datetime-local" name="date_fin" value={form.date_fin} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Lieu</label>
                  <input name="lieu" value={form.lieu} onChange={handleChange} className={inputClass} placeholder="Ex : La Friche Belle de Mai" />
                </div>
                <div>
                  <label className={labelClass}>Adresse</label>
                  <input name="adresse" value={form.adresse} onChange={handleChange} className={inputClass} placeholder="Ex : Marseille" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre de places</label>
                  <input type="number" name="places" value={form.places} onChange={handleChange} className={inputClass} placeholder="Laisser vide si illimité" min="0" />
                </div>
                <div>
                  <label className={labelClass}>Lien externe (billetterie, inscription…)</label>
                  <input name="lien_externe" value={form.lien_externe} onChange={handleChange} className={inputClass} placeholder="https://…" />
                </div>
              </div>
            </div>

            {/* Section 3: Visuel */}
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm flex items-center justify-center font-sans font-bold shadow-sm">3</span>
                <h3 className="font-display font-bold text-xl text-foreground">Visuel</h3>
              </div>
              <div>
                <label className={labelClass}>Image de couverture</label>
                <p className="text-xs text-muted-foreground mb-3">JPG, PNG ou WebP. Max 5 Mo. Format paysage recommandé.</p>
                {form.image_url ? (
                  <div className="relative inline-block">
                    <img src={form.image_url} alt="Aperçu" className="w-full max-w-sm h-40 object-cover rounded-xl border-2 border-border/40 shadow-md" />
                    <button type="button" onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-3 px-5 py-5 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 bg-background hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground w-full disabled:opacity-50">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{uploading ? "Envoi en cours…" : "Ajouter une image de couverture"}</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
              </div>
            </div>

            {/* Section 4: Vos coordonnées */}
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm flex items-center justify-center font-sans font-bold shadow-sm">4</span>
                <h3 className="font-display font-bold text-xl text-foreground">Vos coordonnées</h3>
              </div>
              <p className="text-xs text-muted-foreground">Ces informations ne seront pas publiées. Elles servent uniquement à vous contacter en cas de besoin.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Votre nom <span className="text-primary">*</span></label>
                  <input name="proposeur_nom" value={form.proposeur_nom} onChange={handleChange} className={inputClass} placeholder="Prénom Nom" required />
                </div>
                <div>
                  <label className={labelClass}>Votre email <span className="text-primary">*</span></label>
                  <input type="email" name="proposeur_email" value={form.proposeur_email} onChange={handleChange} className={inputClass} placeholder="vous@email.fr" required />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 border border-border/40 rounded-2xl p-5 text-sm text-muted-foreground">
              <CalendarDays className="w-5 h-5 text-primary/60 inline mr-2" />
              Votre événement sera relu par notre équipe avant publication sur le site (sous 48–72h).
            </div>

            <button type="submit" disabled={uploading} className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground py-4.5 rounded-2xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed">
              {uploading ? "Envoi en cours…" : "Soumettre l'événement"}
              {!uploading && <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
            </button>
          </motion.form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProposerEvenement;
