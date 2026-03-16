import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, X, Image, Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CityAutocomplete, { type CityResult } from "./CityAutocomplete";

const departements = [
  { code: "04", label: "04 — Alpes-de-Haute-Provence" },
  { code: "05", label: "05 — Hautes-Alpes" },
  { code: "06", label: "06 — Alpes-Maritimes" },
  { code: "13", label: "13 — Bouches-du-Rhône" },
  { code: "83", label: "83 — Var" },
  { code: "84", label: "84 — Vaucluse" },
];

const typeStructureOptions = [
  "Incubateur / accélérateur",
  "Radio",
  "Festival",
  "Institution / collectivité",
  "Média",
  "Réseau professionnel",
  "École / université",
  "Association",
  "Fondation",
  "Autre",
];

const domainesActionOptions = [
  "Accompagnement de projets podcast",
  "Diffusion / distribution",
  "Formation",
  "Événementiel",
  "Production",
  "Financement / subventions",
  "Mise en réseau",
  "Recherche / innovation",
  "Communication / promotion",
  "Autre",
];

const publicCibleOptions = [
  "Podcasteur·euses indépendant·es",
  "Entreprises",
  "Associations",
  "Étudiant·es",
  "Créateur·rices de contenu",
  "Professionnel·les du son",
  "Médias",
  "Grand public",
  "Autre",
];

const collaborationOptions = [
  "Partenariats avec Les Podcasteur·euses du Sud",
  "Accueil d'événements / rencontres",
  "Mise à disposition de ressources",
  "Co-production de contenus",
  "Financement ou soutien de projets",
  "Diffusion de podcasts locaux",
  "Mentorat / accompagnement",
  "Autre",
];

const toSlug = (str: string) =>
  str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SectionHeader = ({ number, title }: { number: number; title: string }) => (
  <div className="flex items-center gap-3 mb-2">
    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm flex items-center justify-center font-sans font-bold shadow-sm">
      {number}
    </span>
    <h3 className="font-serif text-xl text-foreground">{title}</h3>
  </div>
);

const CheckboxMultiSelect = ({
  options, selected, onChange, max, label,
}: {
  options: string[]; selected: string[]; onChange: (val: string[]) => void; max: number; label: string;
}) => (
  <div>
    <p className="text-xs text-muted-foreground mb-3">{label} (max {max})</p>
    <div className="grid gap-2">
      {options.map((opt) => {
        const isChecked = selected.includes(opt);
        const isDisabled = !isChecked && selected.length >= max;
        return (
          <label key={opt} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
            isChecked ? "border-primary/40 bg-primary/5 text-foreground shadow-sm"
              : isDisabled ? "border-transparent bg-muted/20 text-muted-foreground cursor-not-allowed opacity-40"
              : "border-transparent bg-background text-foreground hover:border-primary/20 hover:bg-primary/[0.02]"
          }`}>
            <input type="checkbox" checked={isChecked} disabled={isDisabled}
              onChange={(e) => e.target.checked ? onChange([...selected, opt]) : onChange(selected.filter((s) => s !== opt))}
              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30" />
            {opt}
          </label>
        );
      })}
    </div>
  </div>
);

interface Props {
  onBack: () => void;
}

const StructureEcoFormSection = ({ onBack }: Props) => {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nomStructure: "", typeStructure: "", siteWeb: "",
    contactNom: "", contactFonction: "", email: "", telephone: "",
    lienLinkedin: "", lienSecondaire: "",
    bio750: "", phraseAccroche: "",
    departementCode: "",
  });
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [cityError, setCityError] = useState("");
  const [domainesAction, setDomainesAction] = useState<string[]>([]);
  const [publicCible, setPublicCible] = useState<string[]>([]);
  const [collaborations, setCollaborations] = useState<string[]>([]);
  const [vignette, setVignette] = useState<File | null>(null);
  const [vignettePreview, setVignettePreview] = useState<string | null>(null);
  const [consentCGU, setConsentCGU] = useState(false);
  const [consentAnnuaire, setConsentAnnuaire] = useState(false);
  const [consentContact, setConsentContact] = useState(false);
  const [consentMiseEnRelation, setConsentMiseEnRelation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "departementCode") { setSelectedCity(null); setCityError(""); }
  };

  const cropToSquare = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const size = Math.min(img.width, img.height);
        const ox = (img.width - size) / 2, oy = (img.height - size) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        canvas.getContext("2d")!.drawImage(img, ox, oy, size, size, 0, 0, size, size);
        canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name, { type: file.type }) : file), file.type, 0.92);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo."); return; }
    const cropped = await cropToSquare(file);
    setVignette(cropped);
    setVignettePreview(URL.createObjectURL(cropped));
  };

  const removeVignette = () => {
    setVignette(null); setVignettePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomStructure || !form.typeStructure || !form.email || !form.contactNom) {
      toast.error("Veuillez remplir les champs obligatoires."); return;
    }
    if (!form.bio750 || form.bio750.length < 10) {
      toast.error("Veuillez remplir la présentation (min. 10 caractères)."); return;
    }
    if (!vignette) { toast.error("Veuillez ajouter un logo ou une photo."); return; }
    if (!form.departementCode || !selectedCity?.city_insee_code) {
      toast.error("Veuillez sélectionner un département et une ville."); return;
    }
    if (!consentCGU || !consentAnnuaire || !consentContact) {
      toast.error("Veuillez accepter les consentements obligatoires."); return;
    }

    const dept = departements.find((d) => d.code === form.departementCode);
    let vignetteUrl = "";
    if (vignette) {
      setUploading(true);
      const ext = vignette.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("podcast-thumbnails").upload(fileName, vignette, { contentType: vignette.type });
      setUploading(false);
      if (error) { toast.error("Erreur lors de l'envoi de l'image."); return; }
      const { data: urlData } = supabase.storage.from("podcast-thumbnails").getPublicUrl(fileName);
      vignetteUrl = urlData.publicUrl;
    }

    setUploading(true);
    const { error: dbError } = await supabase.from("podcasts").insert({
      type_profil: "structure_eco",
      nom_podcast: form.nomStructure,
      structure: form.nomStructure,
      email: form.email,
      telephone: form.telephone || null,
      prenom: form.contactNom.split(" ")[0] || form.contactNom,
      nom: form.contactNom.split(" ").slice(1).join(" ") || null,
      description: form.bio750,
      bio_750: form.bio750,
      lien_ecoute: form.siteWeb || "https://les-podcasteur-euses-du-sud.fr",
      lien_principal: form.siteWeb || null,
      lien_linkedin: form.lienLinkedin || null,
      vignette_url: vignetteUrl || null,
      metier_principal: form.typeStructure,
      services_3: domainesAction.length > 0 ? domainesAction : null,
      department_code: form.departementCode || null,
      department_label: dept?.label || null,
      city_name: selectedCity?.city_name || null,
      city_insee_code: selectedCity?.city_insee_code || null,
      city_postcode: selectedCity?.city_postcode || null,
      ville: selectedCity ? `${selectedCity.city_name}, ${dept?.label || form.departementCode}` : null,
      consent_contact: consentContact,
      consent_mise_en_relation: consentMiseEnRelation,
      cherche_collaboration: collaborations.length > 0 ? collaborations : null,
      peut_apporter: publicCible.length > 0 ? publicCible : null,
      disponibilite: null,
      studio_data: {
        type_structure: form.typeStructure,
        contact_nom: form.contactNom,
        contact_fonction: form.contactFonction || null,
        phrase_accroche: form.phraseAccroche || null,
        lien_secondaire: form.lienSecondaire || null,
        domaines_action: domainesAction,
        public_cible: publicCible,
        collaborations: collaborations,
      },
      slug: toSlug(`${form.nomStructure}-${form.typeStructure}-${selectedCity?.city_name || ""}`),
    } as any);
    setUploading(false);

    if (dbError) { toast.error("Erreur lors de l'enregistrement."); console.error(dbError); return; }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inputClass = "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm";
  const selectClass = "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none shadow-sm";
  const labelClass = "block text-sm font-semibold text-foreground/80 mb-2";
  const sectionCardClass = "bg-card/50 border border-border/40 rounded-2xl p-6 space-y-5";

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-background border border-border rounded-3xl p-7 sm:p-10 space-y-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Check className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-serif text-3xl">🏛 Merci pour votre inscription</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">Votre structure a bien été enregistrée. Elle sera visible dans l'annuaire après validation par notre équipe (48–72h).</p>
        <a href="/annuaire" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">Voir l'annuaire →</a>
      </motion.div>
    );
  }

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="space-y-6">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Changer de profil
      </button>

      {/* 1 — Structure */}
      <div className={sectionCardClass}>
        <SectionHeader number={1} title="Votre structure" />
        <div>
          <label className={labelClass}>Nom de la structure <span className="text-primary">*</span></label>
          <input name="nomStructure" value={form.nomStructure} onChange={handleChange} className={inputClass} placeholder="Ex : Radio Grenouille, Festival Longueur d'Ondes…" required />
        </div>
        <div>
          <label className={labelClass}>Type de structure <span className="text-primary">*</span></label>
          <select name="typeStructure" value={form.typeStructure} onChange={handleChange} className={selectClass} required>
            <option value="">Sélectionner</option>
            {typeStructureOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Site web</label>
          <input name="siteWeb" value={form.siteWeb} onChange={handleChange} className={inputClass} placeholder="https://..." />
        </div>
      </div>

      {/* 2 — Contact */}
      <div className={sectionCardClass}>
        <SectionHeader number={2} title="Contact référent" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom du contact <span className="text-primary">*</span></label>
            <input name="contactNom" value={form.contactNom} onChange={handleChange} className={inputClass} placeholder="Prénom Nom" required />
          </div>
          <div>
            <label className={labelClass}>Fonction</label>
            <input name="contactFonction" value={form.contactFonction} onChange={handleChange} className={inputClass} placeholder="Ex : Directeur·rice, chargé·e de projet…" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email <span className="text-primary">*</span></label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="contact@structure.fr" required />
        </div>
        <div>
          <label className={labelClass}>Téléphone</label>
          <input name="telephone" value={form.telephone} onChange={handleChange} className={inputClass} placeholder="06 00 00 00 00" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input name="lienLinkedin" value={form.lienLinkedin} onChange={handleChange} className={inputClass} placeholder="https://linkedin.com/..." />
          </div>
          <div>
            <label className={labelClass}>Autre lien</label>
            <input name="lienSecondaire" value={form.lienSecondaire} onChange={handleChange} className={inputClass} placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* 3 — Présentation */}
      <div className={sectionCardClass}>
        <SectionHeader number={3} title="Présentation" />
        <div>
          <label className={labelClass}>Phrase d'accroche</label>
          <input name="phraseAccroche" value={form.phraseAccroche} onChange={handleChange} className={inputClass} placeholder="Ex : L'incubateur qui fait émerger les voix du Sud" />
        </div>
        <div>
          <label className={labelClass}>Présentation de la structure (max 750 caractères) <span className="text-primary">*</span></label>
          <p className="text-xs text-muted-foreground mb-2">Présentez votre structure : missions, lien avec le podcast, actions menées, publics concernés.</p>
          <textarea name="bio750" value={form.bio750} onChange={(e) => { if (e.target.value.length <= 750) handleChange(e); }} className={inputClass + " min-h-[120px] resize-y"} placeholder="Décrivez votre structure…" required />
          <p className="text-xs text-muted-foreground mt-1 text-right">{form.bio750.length}/750</p>
        </div>
        <div>
          <label className={labelClass}>Logo ou photo <span className="text-primary">*</span></label>
          <p className="text-xs text-muted-foreground mb-1">JPG, PNG ou WebP. Max 5 Mo.</p>
          {vignettePreview ? (
            <div className="relative inline-block">
              <img src={vignettePreview} alt="Aperçu" className="w-32 h-32 object-cover rounded-xl border-2 border-border/40 shadow-md" />
              <button type="button" onClick={removeVignette} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-5 py-5 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 bg-background hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground w-full">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium">Ajouter un logo ou une photo</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      {/* 4 — Localisation */}
      <div className={sectionCardClass}>
        <SectionHeader number={4} title="Localisation" />
        <div>
          <label className={labelClass}>Département <span className="text-primary">*</span></label>
          <select name="departementCode" value={form.departementCode} onChange={handleChange} className={selectClass} required>
            <option value="">Sélectionner</option>
            {departements.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
          </select>
        </div>
        {form.departementCode && (
          <CityAutocomplete departmentCode={form.departementCode} value={selectedCity} onChange={(city) => { setSelectedCity(city); setCityError(""); }} inputClass={inputClass} labelClass={labelClass} required={false} error={cityError} />
        )}
      </div>

      {/* 5 — Domaines d'action */}
      <div className={sectionCardClass}>
        <SectionHeader number={5} title="Domaines d'action" />
        <CheckboxMultiSelect options={domainesActionOptions} selected={domainesAction} onChange={setDomainesAction} max={5} label="Dans quels domaines votre structure intervient-elle ?" />
      </div>

      {/* 6 — Public cible */}
      <div className={sectionCardClass}>
        <SectionHeader number={6} title="Public cible" />
        <CheckboxMultiSelect options={publicCibleOptions} selected={publicCible} onChange={setPublicCible} max={5} label="À qui s'adresse votre structure ?" />
      </div>

      {/* 7 — Collaboration */}
      <div className={sectionCardClass}>
        <SectionHeader number={7} title="Collaboration & mise en relation" />
        <CheckboxMultiSelect options={collaborationOptions} selected={collaborations} onChange={setCollaborations} max={5} label="Votre structure est ouverte à" />
      </div>

      {/* 8 — Consentements */}
      <div className={sectionCardClass}>
        <SectionHeader number={8} title="Consentements" />
        <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
          <input type="checkbox" checked={consentCGU} onChange={(e) => setConsentCGU(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary" />
          <span className="text-sm text-foreground">J'accepte les <a href="/conditions-utilisation" target="_blank" className="text-primary hover:underline">CGU</a> et la <a href="/politique-de-confidentialite" target="_blank" className="text-primary hover:underline">politique de confidentialité</a> <span className="text-primary">*</span></span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
          <input type="checkbox" checked={consentAnnuaire} onChange={(e) => setConsentAnnuaire(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary" />
          <span className="text-sm text-foreground">J'accepte d'apparaître dans l'annuaire <span className="text-primary">*</span></span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
          <input type="checkbox" checked={consentContact} onChange={(e) => setConsentContact(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary" />
          <span className="text-sm text-foreground">J'accepte d'être contacté·e par Les Podcasteur·euses du Sud <span className="text-primary">*</span></span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
          <input type="checkbox" checked={consentMiseEnRelation} onChange={(e) => setConsentMiseEnRelation(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary" />
          <span className="text-sm text-foreground">J'accepte d'être mis·e en relation avec d'autres membres</span>
        </label>
      </div>

      <button type="submit" disabled={uploading} className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground py-4.5 rounded-2xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
        {uploading ? "Envoi en cours…" : "Référencer ma structure"}
        {!uploading && <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
      </button>
    </motion.form>
  );
};

export default StructureEcoFormSection;
