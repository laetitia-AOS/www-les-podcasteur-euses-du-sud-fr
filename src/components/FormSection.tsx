import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, X, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CityAutocomplete, { type CityResult } from "./CityAutocomplete";
import BesoinsMultiSelect from "./BesoinsMultiSelect";
import PrioriteSelect from "./PrioriteSelect";

const thematiques = [
  "Conversations & société",
  "Business & parcours de vie",
  "Culture, création & récits",
  "Sport & dépassement",
  "Santé, mental & équilibre",
  "Transmission & éducation",
  "Tech, médias & nouveaux usages",
  "Territoires, initiatives & regards",
  "Autre",
];

const departements = [
  { code: "04", label: "04 — Alpes-de-Haute-Provence" },
  { code: "05", label: "05 — Hautes-Alpes" },
  { code: "06", label: "06 — Alpes-Maritimes" },
  { code: "13", label: "13 — Bouches-du-Rhône" },
  { code: "83", label: "83 — Var" },
  { code: "84", label: "84 — Vaucluse" },
];

const SectionHeader = ({ number, title }: { number: number; title: string }) => (
  <h3 className="font-serif text-lg text-foreground flex items-center gap-2 mb-1">
    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-sans font-bold">
      {number}
    </span>
    {title}
  </h3>
);

const FormSection = () => {
  const [formData, setFormData] = useState({
    prenom: "", nom: "", email: "", telephone: "",
    nomPodcast: "", lienEcoute: "", description: "",
    thematique: "", departementCode: "",
    typePodcast: "", niveauAvancement: "", frequencePublication: "", monetise: "",
  });
  const [selectedBesoins, setSelectedBesoins] = useState<string[]>([]);
  const [prioriteActuelle, setPrioriteActuelle] = useState("");
  const [consentContact, setConsentContact] = useState(false);
  const [consentMiseEnRelation, setConsentMiseEnRelation] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [cityError, setCityError] = useState("");
  const [vignette, setVignette] = useState<File | null>(null);
  const [vignettePreview, setVignettePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setVignette(file);
    setVignettePreview(URL.createObjectURL(file));
  };

  const removeVignette = () => {
    setVignette(null);
    setVignettePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "departementCode") {
      setSelectedCity(null);
      setCityError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prenom || !formData.nom || !formData.email) {
      toast.error("Veuillez remplir vos coordonnées.");
      return;
    }
    if (!formData.nomPodcast || !formData.lienEcoute || !formData.description) {
      toast.error("Veuillez remplir les informations de votre podcast.");
      return;
    }
    try { new URL(formData.lienEcoute); } catch {
      toast.error("Veuillez entrer un lien d'écoute valide (ex: https://...)");
      return;
    }
    if (!formData.departementCode) {
      toast.error("Veuillez sélectionner un département.");
      return;
    }
    if (!selectedCity?.city_insee_code) {
      setCityError("Veuillez sélectionner une ville dans la liste.");
      toast.error("Veuillez sélectionner une ville dans la liste.");
      return;
    }
    if (!consentContact) {
      setConsentError("Consentement requis");
      toast.error("Veuillez accepter d'être contacté(e).");
      return;
    }

    const dept = departements.find((d) => d.code === formData.departementCode);

    let vignetteUrl = "";
    if (vignette) {
      setUploading(true);
      const ext = vignette.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("podcast-thumbnails")
        .upload(fileName, vignette, { contentType: vignette.type });
      setUploading(false);
      if (error) {
        toast.error("Erreur lors de l'envoi de la vignette.");
        console.error(error);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("podcast-thumbnails")
        .getPublicUrl(fileName);
      vignetteUrl = urlData.publicUrl;
    }

    setUploading(true);
    const { error: dbError } = await supabase.from("podcasts").insert({
      prenom: formData.prenom,
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone || null,
      nom_podcast: formData.nomPodcast,
      lien_ecoute: formData.lienEcoute,
      description: formData.description,
      vignette_url: vignetteUrl || null,
      thematique: formData.thematique || null,
      department_code: formData.departementCode,
      department_label: dept?.label || null,
      city_name: selectedCity.city_name,
      city_insee_code: selectedCity.city_insee_code,
      city_postcode: selectedCity.city_postcode,
      ville: `${selectedCity.city_name}, ${dept?.label || formData.departementCode}`,
      type_podcast: formData.typePodcast || null,
      niveau_avancement: formData.niveauAvancement || null,
      frequence_publication: formData.frequencePublication || null,
      monetise: formData.monetise || null,
      besoins_podcast: selectedBesoins.length > 0 ? selectedBesoins : ["non_specifie"],
      besoin: selectedBesoins.length > 0 ? selectedBesoins.join(", ") : "non_specifié",
      priorite_actuelle: prioriteActuelle || null,
      consent_contact: consentContact,
      consent_mise_en_relation: consentMiseEnRelation,
      structure: null,
    } as any);
    setUploading(false);

    if (dbError) {
      toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.");
      console.error(dbError);
      return;
    }

    toast.success("Merci ! Votre podcast a bien été référencé.");
    setFormData({
      prenom: "", nom: "", email: "", telephone: "",
      nomPodcast: "", lienEcoute: "", description: "",
      thematique: "", departementCode: "",
      typePodcast: "", niveauAvancement: "", frequencePublication: "", monetise: "",
    });
    setSelectedBesoins([]);
    setPrioriteActuelle("");
    setConsentContact(false);
    setConsentMiseEnRelation(false);
    setConsentError("");
    setSelectedCity(null);
    setCityError("");
    removeVignette();
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
            Référencer mon podcast
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
          className="bg-background border border-border rounded-3xl p-7 sm:p-10 space-y-8"
        >
          {/* SECTION 1 — Coordonnées */}
          <div className="space-y-5">
            <SectionHeader number={1} title="Vos coordonnées" />
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
              <label className={labelClass}>Email <span className="text-primary">*</span></label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="vous@exemple.com" required />
            </div>
            <div>
              <label className={labelClass}>Téléphone / WhatsApp</label>
              <p className="text-xs text-muted-foreground mb-2">Utile si vous souhaitez être contacté(e) rapidement</p>
              <input name="telephone" value={formData.telephone} onChange={handleChange} className={inputClass} placeholder="06 00 00 00 00" />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* SECTION 2 — Podcast */}
          <div className="space-y-5">
            <SectionHeader number={2} title="Votre podcast" />
            <div>
              <label className={labelClass}>Nom du podcast <span className="text-primary">*</span></label>
              <input name="nomPodcast" value={formData.nomPodcast} onChange={handleChange} className={inputClass} placeholder="Ex : Les Voix de la Canebière" required />
            </div>
            <div>
              <label className={labelClass}>Lien d'écoute principal <span className="text-primary">*</span></label>
              <p className="text-xs text-muted-foreground mb-2">Spotify, Apple Podcasts, site, etc.</p>
              <input name="lienEcoute" value={formData.lienEcoute} onChange={handleChange} className={inputClass} placeholder="https://..." required />
            </div>
            <div>
              <label className={labelClass}>Description courte <span className="text-primary">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleChange} className={inputClass + " min-h-[100px] resize-y"} placeholder="En 1 ou 2 phrases, de quoi parle votre podcast ?" required />
            </div>
            <div>
              <label className={labelClass}>Vignette du podcast</label>
              <p className="text-xs text-muted-foreground mb-1">Format carré recommandé (1400×1400 px). JPG, PNG ou WebP.</p>
              <p className="text-xs text-muted-foreground/70 mb-3">Optionnel — vous pourrez l'ajouter plus tard</p>
              {vignettePreview ? (
                <div className="relative inline-block">
                  <img src={vignettePreview} alt="Aperçu vignette" className="w-32 h-32 object-cover rounded-xl border border-border shadow-sm" />
                  <button type="button" onClick={removeVignette} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:brightness-110 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground w-full">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm">Ajouter la vignette de votre podcast</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* SECTION 3 — Ligne éditoriale */}
          <div className="space-y-5">
            <SectionHeader number={3} title="Ligne éditoriale" />
            <div>
              <label className={labelClass}>Thématique principale</label>
              <select name="thematique" value={formData.thematique} onChange={handleChange} className={selectClass}>
                <option value="">Sélectionner</option>
                {thematiques.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* SECTION 4 — Localisation */}
          <div className="space-y-5">
            <SectionHeader number={4} title="Localisation" />
            <div>
              <label className={labelClass}>Département <span className="text-primary">*</span></label>
              <select name="departementCode" value={formData.departementCode} onChange={handleChange} className={selectClass} required>
                <option value="">Sélectionner un département</option>
                {departements.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            </div>
            <CityAutocomplete
              departmentCode={formData.departementCode}
              value={selectedCity}
              onChange={(city) => { setSelectedCity(city); setCityError(""); }}
              inputClass={inputClass}
              labelClass={labelClass}
              required
              error={cityError}
            />
          </div>

          <div className="h-px bg-border" />

          {/* SECTION 5 — Profil du podcast */}
          <div className="space-y-5">
            <SectionHeader number={5} title="Profil du podcast" />
            <div>
              <label className={labelClass}>Type de podcast</label>
              <select name="typePodcast" value={formData.typePodcast} onChange={handleChange} className={selectClass}>
                <option value="">Sélectionner</option>
                <option value="Indépendant">Indépendant</option>
                <option value="Média">Média</option>
                <option value="Marque / Entreprise">Marque / Entreprise</option>
                <option value="Éducatif / Académique">Éducatif / Académique</option>
                <option value="Narratif / Créatif">Narratif / Créatif</option>
                <option value="Expert / Personal brand">Expert / Personal brand</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* SECTION 6 — Structuration du projet */}
          <div className="space-y-5">
            <SectionHeader number={6} title="Structuration du projet" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Niveau d'avancement</label>
                <select name="niveauAvancement" value={formData.niveauAvancement} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  <option value="lancement">Lancement (0–10 épisodes)</option>
                  <option value="croissance">En croissance (10–50)</option>
                  <option value="installe">Installé (50+)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Fréquence de publication</label>
                <select name="frequencePublication" value={formData.frequencePublication} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  <option value="hebdomadaire">Hebdomadaire</option>
                  <option value="bimensuel">Deux fois par mois</option>
                  <option value="mensuel">Mensuel</option>
                  <option value="irregulier">Irrégulier</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Podcast monétisé ?</label>
              <select name="monetise" value={formData.monetise} onChange={handleChange} className={selectClass}>
                <option value="">Sélectionner</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
                <option value="En cours">En cours / expérimentation</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* SECTION 7 — Besoins */}
          <div className="space-y-5">
            <SectionHeader number={7} title="Vos besoins" />
            <BesoinsMultiSelect
              selected={selectedBesoins}
              onChange={setSelectedBesoins}
              labelClass="sr-only"
            />
          </div>

          <div className="h-px bg-border" />

          {/* SECTION 8 — Priorité actuelle */}
          <div className="space-y-5">
            <SectionHeader number={8} title="Priorité actuelle" />
            <PrioriteSelect
              value={prioriteActuelle}
              onChange={setPrioriteActuelle}
              labelClass="sr-only"
            />
          </div>

          <div className="h-px bg-border" />

          {/* SECTION 9 — Consentement */}
          <div className="space-y-4">
            <SectionHeader number={9} title="Consentement" />
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentContact}
                onChange={(e) => { setConsentContact(e.target.checked); if (e.target.checked) setConsentError(""); }}
                className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
              />
              <span className="text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                J'accepte d'être contacté(e) par Les Podcasteur·euses du Sud <span className="text-primary">*</span>
              </span>
            </label>
            {consentError && <p className="text-xs text-destructive ml-7">{consentError}</p>}

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentMiseEnRelation}
                onChange={(e) => setConsentMiseEnRelation(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
              />
              <span className="text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                J'accepte d'être mis(e) en relation avec d'autres créateurs / studios
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="group w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? "Envoi en cours…" : "Référencer mon podcast"}
            {!uploading && <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default FormSection;
