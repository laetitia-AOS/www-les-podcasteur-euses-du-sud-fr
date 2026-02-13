import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send } from "lucide-react";

const thematiques = [
  "Culture & Arts", "Société & Politique", "Économie & Entrepreneuriat",
  "Science & Technologie", "Sport", "Bien-être & Santé", "Éducation",
  "Histoire & Patrimoine", "Humour & Divertissement", "Musique",
  "Environnement", "Autre",
];

const villes = [
  "Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon",
  "Montpellier", "Cannes", "Arles", "Gap", "Digne-les-Bains", "Autre",
];

const besoins = [
  "Gagner en visibilité", "Trouver des collaborations",
  "Monétiser mon podcast", "Me former / progresser", "Trouver un studio", "Autre",
];

const FormSection = () => {
  const [formData, setFormData] = useState({
    nomPodcast: "", lienEcoute: "", description: "", thematique: "",
    ville: "", typePodcast: "", monetise: "", besoin: "",
    prenom: "", nom: "", structure: "", email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomPodcast || !formData.lienEcoute || !formData.description || !formData.email) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    toast.success("Merci ! Votre podcast a bien été référencé.");
    setFormData({
      nomPodcast: "", lienEcoute: "", description: "", thematique: "",
      ville: "", typePodcast: "", monetise: "", besoin: "",
      prenom: "", nom: "", structure: "", email: "",
    });
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all";
  const selectClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all appearance-none";
  const labelClass = "block text-sm font-medium text-foreground mb-2";

  return (
    <section id="formulaire" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px w-8 bg-primary/30" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Référencement</span>
            <div className="h-px w-8 bg-primary/30" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-5">
            Référencer son podcast
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Votre podcast participe à la vitalité créative du territoire.
            Intégrez la cartographie des voix audio de la Région Sud.
          </p>
          <span className="inline-block mt-4 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
            Gratuit
          </span>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="bg-background border border-border rounded-3xl p-7 sm:p-10 shadow-sm space-y-6"
        >
          {/* Podcast info */}
          <div className="space-y-5">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-sans font-bold">1</span>
              Votre podcast
            </h3>

            <div>
              <label className={labelClass}>Nom du podcast <span className="text-primary">*</span></label>
              <input name="nomPodcast" value={formData.nomPodcast} onChange={handleChange} className={inputClass} placeholder="Ex : Les Voix de la Canebière" required />
            </div>

            <div>
              <label className={labelClass}>Lien d'écoute principal <span className="text-primary">*</span></label>
              <input name="lienEcoute" value={formData.lienEcoute} onChange={handleChange} className={inputClass} placeholder="https://..." required />
            </div>

            <div>
              <label className={labelClass}>Description courte <span className="text-primary">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleChange} className={inputClass + " min-h-[100px] resize-y"} placeholder="En quelques lignes, de quoi parle votre podcast ?" required />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Thématique</label>
                <select name="thematique" value={formData.thematique} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  {thematiques.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Ville de production</label>
                <select name="ville" value={formData.ville} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  {villes.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type de podcast</label>
                <select name="typePodcast" value={formData.typePodcast} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  <option value="Indépendant">Indépendant</option>
                  <option value="Média">Média</option>
                  <option value="Institution">Institution</option>
                  <option value="Marque">Marque</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Podcast monétisé ?</label>
                <select name="monetise" value={formData.monetise} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Besoin principal</label>
              <select name="besoin" value={formData.besoin} onChange={handleChange} className={selectClass}>
                <option value="">Sélectionner</option>
                {besoins.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Contact info */}
          <div className="space-y-5">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-sans font-bold">2</span>
              Vos coordonnées
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom</label>
                <input name="prenom" value={formData.prenom} onChange={handleChange} className={inputClass} placeholder="Votre prénom" />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input name="nom" value={formData.nom} onChange={handleChange} className={inputClass} placeholder="Votre nom" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Structure / Studio</label>
              <input name="structure" value={formData.structure} onChange={handleChange} className={inputClass} placeholder="Si applicable" />
            </div>

            <div>
              <label className={labelClass}>Email <span className="text-primary">*</span></label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="vous@exemple.com" required />
            </div>
          </div>

          <button
            type="submit"
            className="group w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg mt-2"
          >
            Je référence mon podcast
            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default FormSection;
