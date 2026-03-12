import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const profils = [
  "Podcasteur / Podcasteuse",
  "Studio / Producteur",
  "Marque / Entreprise",
  "Média",
  "Institution / Organisation",
  "Porteur de projet audio",
  "Autre",
];

const objets = [
  "Collaboration / partenariat",
  "Production / studio / enregistrement",
  "Participation à un événement",
  "Intervention / échange / conférence",
  "Projet podcast en réflexion",
  "Média / presse",
  "Autre",
];

const ContactSection = () => {
  const [formData, setFormData] = useState({
    profil: "",
    objet: "",
    message: "",
    prenom: "",
    nom: "",
    structure: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profil || !formData.objet || !formData.message || !formData.prenom || !formData.nom || !formData.email) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("contacts").insert({
      profil: formData.profil,
      objet: formData.objet,
      message: formData.message,
      prenom: formData.prenom,
      nom: formData.nom,
      structure: formData.structure || null,
      email: formData.email,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
      console.error(error);
      return;
    }

    toast.success("Merci ! Votre demande a bien été envoyée.");
    setFormData({ profil: "", objet: "", message: "", prenom: "", nom: "", structure: "", email: "" });
  };

  const inputClass =
    "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary/40 transition-all shadow-sm";
  const selectClass =
    "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary/40 transition-all appearance-none shadow-sm";
  const labelClass = "block text-sm font-semibold text-foreground/80 mb-2";
  const sectionCardClass = "bg-card/50 border border-border/40 rounded-2xl p-6 space-y-5";

  return (
    <section id="contact" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px w-8 bg-secondary/30" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary/70">
              Écosystème
            </span>
            <div className="h-px w-8 bg-secondary/30" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-5">
            Entrer en relation avec l'écosystème
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Vous développez un projet, une idée ou une initiative en lien avec le podcast
            ou la création audio ? Les Podcasteur·euses du Sud facilite les connexions, échanges
            et opportunités entre acteurs de l'audio et du territoire.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="bg-card border border-border rounded-3xl p-7 sm:p-10 shadow-sm space-y-6"
        >
          {/* Intention */}
          <div className="space-y-5">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-xs flex items-center justify-center font-sans font-bold">1</span>
              Votre intention
            </h3>

            <div>
              <label className={labelClass}>
                Vous êtes <span className="text-primary">*</span>
              </label>
              <select name="profil" value={formData.profil} onChange={handleChange} className={selectClass} required>
                <option value="">Sélectionner votre profil</option>
                {profils.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Objet de la prise de contact <span className="text-primary">*</span>
              </label>
              <select name="objet" value={formData.objet} onChange={handleChange} className={selectClass} required>
                <option value="">Sélectionner l'objet</option>
                {objets.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Votre message <span className="text-primary">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={inputClass + " min-h-[120px] resize-y"}
                placeholder="Décrivez votre projet, besoin ou intention…"
                required
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Coordonnées */}
          <div className="space-y-5">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-xs flex items-center justify-center font-sans font-bold">2</span>
              Vos coordonnées
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom <span className="text-primary">*</span></label>
                <input name="prenom" value={formData.prenom} onChange={handleChange} className={inputClass} placeholder="Votre prénom" required />
              </div>
              <div>
                <label className={labelClass}>Nom <span className="text-primary">*</span></label>
                <input name="nom" value={formData.nom} onChange={handleChange} className={inputClass} placeholder="Votre nom" required />
              </div>
            </div>

            <div>
              <label className={labelClass}>Structure / Projet</label>
              <input name="structure" value={formData.structure} onChange={handleChange} className={inputClass} placeholder="Si applicable" />
            </div>

            <div>
              <label className={labelClass}>Email <span className="text-primary">*</span></label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="vous@exemple.com" required />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="group w-full flex items-center justify-center gap-3 bg-secondary text-secondary-foreground py-4 rounded-xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Envoi en cours…" : "Envoyer la demande"}
            {!submitting && <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
