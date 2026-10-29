import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { messageServeur } from "@/lib/inscription";
import { field, hintCls, labelCls, Req } from "@/components/adherer/fields";
import { btnPrimary, container, h1Ligne } from "@/lib/pds";

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

const VIDE = { profil: "", objet: "", message: "", prenom: "", nom: "", structure: "", email: "" };

/** Formulaire « Nous écrire » : le message est enregistré pour l'équipe (contrôlé et limité côté serveur). */
const ContactSection = () => {
  const [formData, setFormData] = useState(VIDE);
  const [submitting, setSubmitting] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      toast.error(messageServeur(error, "Le message n'a pas pu être envoyé. Réessayez."));
      return;
    }
    setFormData(VIDE);
    setEnvoye(true);
  };

  return (
    <section id="contact" className={`${container} pt-10 md:pt-14 pb-20 md:pb-28`}>
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16">
        <div>
          <h1 className="title-page text-[56px] sm:text-[88px]">
            <span className="block">Nous écrire</span>
            <span className={h1Ligne}>à l'équipe des Podcasteur·euses du Sud</span>
          </h1>
          <p className="mt-5 text-lg max-w-[44ch]">
            Un projet, une idée, une question sur l'adhésion, un partenariat ou une demande presse : l'équipe vous répond directement à votre adresse.
          </p>
          <p className={`${hintCls} mt-4 max-w-[44ch]`}>
            Pour écrire à un·e membre en particulier, passez par sa fiche dans l'annuaire.
          </p>
        </div>

        {envoye ? (
          <div className="border-2 border-encre bg-surface p-6 sm:p-8 self-start" role="status">
            <h2 className="title-section text-[32px]">Message envoyé</h2>
            <p className="mt-3 text-[17px]">Merci. L'équipe l'a bien reçu et vous répond par e-mail.</p>
            <button type="button" onClick={() => setEnvoye(false)} className={`${btnPrimary} mt-6`}>
              Écrire un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border-2 border-encre bg-surface p-6 sm:p-8 space-y-6" noValidate>
            <fieldset className="space-y-5">
              <legend className="title-section text-[26px] mb-1">Votre message</legend>
              <div>
                <label htmlFor="contact-profil" className={labelCls}>Vous êtes<Req /></label>
                <select id="contact-profil" name="profil" value={formData.profil} onChange={handleChange} className={field} required>
                  <option value="">Choisir</option>
                  {profils.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="contact-objet" className={labelCls}>Objet<Req /></label>
                <select id="contact-objet" name="objet" value={formData.objet} onChange={handleChange} className={field} required>
                  <option value="">Choisir</option>
                  {objets.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="contact-message" className={labelCls}>Message<Req /></label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className={`${field} min-h-[160px] py-3 resize-y`}
                  placeholder="Votre projet, votre besoin, votre question"
                  required
                />
              </div>
            </fieldset>

            <div aria-hidden className="border-t border-filet" />
            <fieldset className="space-y-5">
              <legend className="title-section text-[26px] mb-1">Vos coordonnées</legend>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-prenom" className={labelCls}>Prénom<Req /></label>
                  <input id="contact-prenom" name="prenom" value={formData.prenom} onChange={handleChange} className={field} autoComplete="given-name" required />
                </div>
                <div>
                  <label htmlFor="contact-nom" className={labelCls}>Nom<Req /></label>
                  <input id="contact-nom" name="nom" value={formData.nom} onChange={handleChange} className={field} autoComplete="family-name" required />
                </div>
              </div>
              <div>
                <label htmlFor="contact-structure" className={labelCls}>Structure ou projet</label>
                <input id="contact-structure" name="structure" value={formData.structure} onChange={handleChange} className={field} autoComplete="organization" />
              </div>
              <div>
                <label htmlFor="contact-email" className={labelCls}>Adresse e-mail<Req /></label>
                <input id="contact-email" name="email" type="email" value={formData.email} onChange={handleChange} className={field} autoComplete="email" placeholder="vous@exemple.com" required />
                <p className={hintCls}>Seulement pour vous répondre.</p>
              </div>
            </fieldset>

            <p className="text-sm text-muted-foreground"><span aria-hidden>*</span> Champs obligatoires</p>
            <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
              {submitting ? "Envoi en cours…" : "Envoyer le message"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ContactSection;
