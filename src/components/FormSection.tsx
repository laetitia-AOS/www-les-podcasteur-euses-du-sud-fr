import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, X, Image, Check, Users, Sun, ArrowRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StudioFormSection from "./StudioFormSection";
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

const servicesOptions = [
  "Studio / enregistrement",
  "Montage / mixage",
  "Réalisation / production",
  "Sound design / composition",
  "Voix off",
  "Vidéo / teasers / motion",
  "Identité sonore / branding",
  "Copywriting / éditorial",
  "Diffusion / marketing / RP",
  "Stratégie / monétisation",
  "Formation / coaching",
  "Régie pub / partenariats",
  "Autre",
];

const chercheCollaborationOptions = [
  "Un·e podcasteur·euse pour co-production",
  "Un·e monteur·euse / ingénieur son",
  "Un·e studio d'enregistrement",
  "Un·e voix off",
  "Un·e expert·e en stratégie podcast",
  "Un·e graphiste / motion designer",
  "Des invité·es pour mon podcast",
  "Un·e partenaire pour un événement",
  "Des sponsors / partenaires commerciaux",
  "Un·e coach ou mentor·e",
];

const peutApporterOptions = [
  "Participer à un podcast en tant qu'invité·e",
  "Proposer mes compétences techniques (son, montage)",
  "Mettre à disposition un studio",
  "Faire de la voix off",
  "Partager mon expertise stratégique",
  "Créer des visuels / motion",
  "Co-produire un format",
  "Organiser ou co-organiser un événement",
  "Proposer un partenariat commercial",
  "Mentorer un·e podcasteur·euse débutant·e",
];

const formatCollaborationOptions = [
  "En présentiel (Marseille / région)",
  "À distance",
  "Présentiel et à distance",
  "À définir",
];

const disponibiliteOptions = [
  "Disponible pour missions freelance",
  "Disponible pour collaborations bénévoles",
  "Disponible pour missions freelance et collaborations bénévoles",
  "Non disponible actuellement",
  "Me contacter pour en discuter",
];

const toSlug = (str: string) =>
  str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SectionHeader = ({ number, title, icon }: { number: number; title: string; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-2">
    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm flex items-center justify-center font-sans font-bold shadow-sm">
      {number}
    </span>
    <h3 className="font-serif text-xl text-foreground">{title}</h3>
    {icon && <span className="text-primary/50">{icon}</span>}
  </div>
);

const CheckboxMultiSelect = ({
  options,
  selected,
  onChange,
  max,
  label,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  max: number;
  label: string;
}) => (
  <div>
    <p className="text-xs text-muted-foreground mb-3">{label} (max {max})</p>
    <div className="grid gap-2">
      {options.map((opt) => {
        const isChecked = selected.includes(opt);
        const isDisabled = !isChecked && selected.length >= max;
        return (
          <label
            key={opt}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
              isChecked
                ? "border-primary/40 bg-primary/5 text-foreground shadow-sm"
                : isDisabled
                ? "border-transparent bg-muted/20 text-muted-foreground cursor-not-allowed opacity-40"
                : "border-transparent bg-background text-foreground hover:border-primary/20 hover:bg-primary/[0.02]"
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isDisabled}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selected, opt]);
                } else {
                  onChange(selected.filter((s) => s !== opt));
                }
              }}
              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
            />
            {opt}
          </label>
        );
      })}
    </div>
  </div>
);

const FormSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    prenom: "", nom: "", email: "", telephone: "",
    nomPodcast: "", lienEcoute: "", description: "",
    thematique: "", departementCode: "",
    typePodcast: "", niveauAvancement: "", frequencePublication: "", monetise: "",
    typeProfil: "podcasteur", bio750: "", lienPrincipal: "", lienLinkedin: "",
    metierPrincipal: "", disponibilite: "",
    formatCollaboration: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBesoins, setSelectedBesoins] = useState<string[]>([]);
  const [prioriteActuelle, setPrioriteActuelle] = useState("");
  const [chercheCollab, setChercheCollab] = useState<string[]>([]);
  const [peutApporter, setPeutApporter] = useState<string[]>([]);
  const [consentContact, setConsentContact] = useState(false);
  const [consentMiseEnRelation, setConsentMiseEnRelation] = useState(false);
  const [consentPublicationPodcast, setConsentPublicationPodcast] = useState(false);
  const [consentAnnuaire, setConsentAnnuaire] = useState(false);
  const [consentCGU, setConsentCGU] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [cityError, setCityError] = useState("");
  const [vignette, setVignette] = useState<File | null>(null);
  const [vignettePreview, setVignettePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cropToSquare = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const size = Math.min(img.width, img.height);
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            resolve(file);
          }
        }, file.type, 0.92);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const croppedFile = await cropToSquare(file);
    setVignette(croppedFile);
    setVignettePreview(URL.createObjectURL(croppedFile));
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

  // Compute section numbers based on type
  const getSectionNumbers = () => {
    if (formData.typeProfil === "podcasteur") {
      return {
        coordonnees: 1, profil: 2, podcast: 3, ligneEditoriale: 4,
        structuration: 5, besoins: 6,
        localisation: 7, matching: 8, consentements: 9,
      };
    } else if (formData.typeProfil === "pro_podcast") {
      return {
        coordonnees: 1, profil: 2, metier: 3, photo: 4,
        localisation: 5, matching: 6, consentements: 7,
      };
    } else {
      return {
        coordonnees: 1, profil: 2, photo: 3,
        localisation: 4, matching: 5, consentements: 6,
      };
    }
  };

  const sn = getSectionNumbers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prenom || !formData.nom || !formData.email) {
      toast.error("Veuillez remplir vos coordonnées.");
      return;
    }
    if (!formData.bio750 || formData.bio750.length < 10) {
      toast.error("Veuillez remplir votre présentation (min. 10 caractères).");
      return;
    }
    if (formData.lienPrincipal && !formData.lienPrincipal.startsWith("https://")) {
      toast.error("Le lien site internet doit commencer par https://");
      return;
    }
    if (formData.lienLinkedin && !formData.lienLinkedin.startsWith("https://")) {
      toast.error("Le lien réseau social doit commencer par https://");
      return;
    }
    if (formData.typeProfil === "podcasteur" && (!formData.nomPodcast || !formData.lienEcoute || !formData.description)) {
      toast.error("Veuillez remplir les informations de votre podcast.");
      return;
    }
    if (formData.typeProfil === "pro_podcast" && !formData.metierPrincipal) {
      toast.error("Veuillez sélectionner votre métier principal.");
      return;
    }
    if (formData.typeProfil === "podcasteur") {
      try { new URL(formData.lienEcoute); } catch {
        toast.error("Veuillez entrer un lien d'écoute valide (ex: https://...)");
        return;
      }
    }
    if (!vignette) {
      toast.error("Veuillez ajouter une photo.");
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
    if (!consentCGU) {
      toast.error("Veuillez accepter les conditions générales d'utilisation et la politique de confidentialité.");
      return;
    }
    if (formData.typeProfil === "podcasteur" && !consentPublicationPodcast) {
      toast.error("Veuillez accepter la publication de votre podcast.");
      return;
    }
    if (!consentAnnuaire) {
      toast.error("Veuillez accepter d'apparaître dans l'annuaire.");
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
      nom_podcast: formData.nomPodcast || "—",
      lien_ecoute: formData.lienEcoute || "https://les-podcasteur-euses-du-sud.fr",
      description: formData.description || formData.bio750,
      vignette_url: vignetteUrl || null,
      thematique: formData.thematique || null,
      department_code: formData.departementCode || null,
      department_label: dept?.label || null,
      city_name: selectedCity?.city_name || null,
      city_insee_code: selectedCity?.city_insee_code || null,
      city_postcode: selectedCity?.city_postcode || null,
      ville: selectedCity ? `${selectedCity.city_name}, ${dept?.label || formData.departementCode}` : null,
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
      type_profil: formData.typeProfil,
      bio_750: formData.bio750 || null,
      lien_principal: formData.lienPrincipal || null,
      lien_linkedin: formData.lienLinkedin || null,
      metier_principal: formData.typeProfil === "pro_podcast" ? formData.metierPrincipal : null,
      services_3: formData.typeProfil === "pro_podcast" ? selectedServices : null,
      disponibilite: formData.typeProfil === "pro_podcast" ? formData.disponibilite : null,
      cherche_collaboration: chercheCollab.length > 0 ? chercheCollab : null,
      peut_apporter: peutApporter.length > 0 ? peutApporter : null,
      format_collaboration: formData.formatCollaboration || null,
      slug: toSlug(`${formData.nomPodcast || formData.prenom}-${formData.prenom}-${selectedCity?.city_name || ""}`),
    } as any);
    setUploading(false);

    if (dbError) {
      toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.");
      console.error(dbError);
      return;
    }

    setSubmitted(true);
    window.scrollTo({ top: document.getElementById("formulaire")?.offsetTop || 0, behavior: "smooth" });
  };

  const inputClass =
    "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm";
  const selectClass =
    "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none shadow-sm";
  const labelClass = "block text-sm font-semibold text-foreground/80 mb-2";
  const sectionCardClass = "bg-card/50 border border-border/40 rounded-2xl p-6 space-y-5";

  return (
    <section id="formulaire" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="bg-background border border-border rounded-3xl p-7 sm:p-10 space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl">🎙 Merci pour votre inscription</h2>
              <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Votre podcast a bien été enregistré dans notre base de données.
              </p>
              <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Il fait désormais partie du répertoire des podcasts et créateurs audio référencés par <span className="text-foreground font-medium">Les podcasteur·euses du Sud</span>.
              </p>
            </div>

            {/* Moderation notice */}
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Vérification en cours</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Votre profil est en cours de vérification par notre équipe. Il apparaîtra dans l'annuaire sous 48–72h après validation.
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Visibilité */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-foreground">✨ À propos de la visibilité dans l'annuaire</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Votre profil sera publié dans l'annuaire après validation manuelle par notre équipe (48 à 72h). Les membres à jour de leur cotisation associative sont mis en avant en priorité — mais ce n'est pas une condition obligatoire pour apparaître.
              </p>
              <p className="text-muted-foreground text-sm">Cette logique permet de :</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> préserver une ligne éditoriale cohérente</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> valoriser les créateurs engagés dans la dynamique collective</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> soutenir le développement de l'écosystème podcast en Région Sud</li>
              </ul>
            </div>

            <div className="h-px bg-border" />

            {/* Rejoindre */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Rejoindre Les podcasteur·euses du Sud
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">En devenant membre, vous pouvez notamment :</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> bénéficier d'une visibilité sur le flux</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> intégrer un réseau de créateurs et d'acteurs audio</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> accéder aux rencontres et initiatives du collectif</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> contribuer à la dynamique régionale</li>
              </ul>
              <a
                href="/adhesion"
                className="text-primary hover:underline text-sm"
              >
                Découvrir l'adhésion au collectif →
              </a>
            </div>

            <div className="h-px bg-border" />

            {/* Dynamique */}
            <div className="space-y-3 text-center">
              <h3 className="font-serif text-xl text-foreground flex items-center gap-2 justify-center">
                <Sun className="w-5 h-5 text-accent" /> Une dynamique construite par ses membres
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
                Les podcasteur·euses du Sud est un espace vivant de connexions, de circulation des voix et de collaborations.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
                Chaque nouvelle adhésion renforce cette énergie.
              </p>
              <p className="text-foreground font-medium mt-4">À très bientôt.</p>
            </div>
          </motion.div>
        ) : (
          <>
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
                Rejoindre le collectif
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Podcasteur·euse, acteur·ice de l'écosystème ou simplement curieux·se :
                intégrez l'écosystème audio de la Région Sud.
              </p>

              <div className="mt-8 bg-secondary/10 border border-secondary/20 rounded-2xl p-5 text-left max-w-lg mx-auto">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Visibilité dans l'annuaire et sur le flux
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Créer votre profil est ouvert à toustes.
                      La publication dans l'annuaire est validée manuellement par notre équipe.
                      Les membres à jour de leur cotisation associative sont prioritairement mis en avant
                      dans l'annuaire et sur le flux du site.{" "}
                      <a
                        href="/adhesion"
                        className="text-primary font-medium hover:underline"
                      >
                        En savoir plus sur l'adhésion →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="space-y-6"
            >
              {/* SECTION 1 — Coordonnées */}
              <div className={sectionCardClass}>
                <SectionHeader number={sn.coordonnees} title="Vos coordonnées" />
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
                  <p className="text-xs text-muted-foreground mb-2">Si vous cochez le consentement de mise en relation ci-dessous, votre disponibilité téléphonique sera indiquée sur votre profil public (sans afficher le numéro).</p>
                  <input name="telephone" value={formData.telephone} onChange={handleChange} className={inputClass} placeholder="06 00 00 00 00" />
                </div>
              </div>

              {/* SECTION 2 — Type de profil */}
              <div className={sectionCardClass}>
                <SectionHeader number={sn.profil} title="Votre profil" />
                <div>
                  <label className={labelClass}>Je rejoins le collectif en tant que : <span className="text-primary">*</span></label>
                <select name="typeProfil" value={formData.typeProfil} onChange={handleChange} className={selectClass} required>
                    <option value="podcasteur">Podcasteur·euse (j'ai un podcast)</option>
                    <option value="pro_podcast">Acteur·ice de l'écosystème (je propose des compétences)</option>
                    <option value="soutien">Soutien / curieux (je veux suivre et contribuer)</option>
                    <option value="studio">Studio podcast / lieu d'enregistrement</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Présentation (max 750 caractères) <span className="text-primary">*</span></label>
                  <p className="text-xs text-muted-foreground mb-2">Présente-toi en 3–6 lignes : qui tu es, ton lien avec le podcast, ce que tu fais / proposes, et ce que tu cherches aujourd'hui.</p>
                  <textarea
                    name="bio750"
                    value={formData.bio750}
                    onChange={(e) => { if (e.target.value.length <= 750) handleChange(e); }}
                    className={inputClass + " min-h-[120px] resize-y"}
                    placeholder="Quelques mots sur vous…"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{formData.bio750.length}/750</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>LinkedIn / réseau social</label>
                    <input name="lienLinkedin" value={formData.lienLinkedin} onChange={handleChange} className={inputClass} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <label className={labelClass}>Site internet / portfolio</label>
                    <input name="lienPrincipal" value={formData.lienPrincipal} onChange={handleChange} className={inputClass} placeholder="https://..." />
                  </div>
                </div>
              </div>

              {formData.typeProfil !== "studio" && (
              <>

              {/* SECTION Pro — Métier (conditionnel) */}
              {formData.typeProfil === "pro_podcast" && (
                <div className={sectionCardClass}>
                  <SectionHeader number={sn.metier!} title="Votre métier" />
                  <div>
                    <label className={labelClass}>Métier principal <span className="text-primary">*</span></label>
                    <select name="metierPrincipal" value={formData.metierPrincipal} onChange={handleChange} className={selectClass} required>
                      <option value="">Sélectionner</option>
                      {servicesOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Services proposés (max 5) <span className="text-primary">*</span></label>
                    <CheckboxMultiSelect
                      options={servicesOptions}
                      selected={selectedServices}
                      onChange={setSelectedServices}
                      max={5}
                      label="Sélectionnez vos services"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Disponibilité</label>
                    <select name="disponibilite" value={formData.disponibilite} onChange={handleChange} className={selectClass}>
                      <option value="">Sélectionner</option>
                      {disponibiliteOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Photo section for non-podcasteurs */}
              {formData.typeProfil !== "podcasteur" && (
                <div className={sectionCardClass}>
                  <SectionHeader number={sn.photo!} title="Votre photo" />
                  <div>
                    <label className={labelClass}>Photo de profil <span className="text-primary">*</span></label>
                    <p className="text-xs text-muted-foreground mb-1">JPG, PNG ou WebP. Max 5 Mo. L'image sera recadrée au format carré.</p>
                    {vignettePreview ? (
                      <div className="relative inline-block">
                        <img src={vignettePreview} alt="Aperçu photo" className="w-32 h-32 object-cover rounded-xl border-2 border-border/40 shadow-md" />
                        <button type="button" onClick={removeVignette} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:brightness-110 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-5 py-5 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 bg-background hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground w-full">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Image className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Ajouter votre photo de profil</span>
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                  </div>
                </div>
              )}

              {/* SECTION — Podcast (conditionnel pour podcasteurs) */}
              {formData.typeProfil === "podcasteur" && (
              <>
              <div className={sectionCardClass}>
                <SectionHeader number={sn.podcast!} title="Votre podcast" />
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
                  <label className={labelClass}>Vignette du podcast <span className="text-primary">*</span></label>
                  <p className="text-xs text-muted-foreground mb-1">JPG, PNG ou WebP. Max 5 Mo. L'image sera recadrée au format carré.</p>
                  {vignettePreview ? (
                    <div className="relative inline-block">
                      <img src={vignettePreview} alt="Aperçu vignette" className="w-32 h-32 object-cover rounded-xl border-2 border-border/40 shadow-md" />
                      <button type="button" onClick={removeVignette} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:brightness-110 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-5 py-5 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 bg-background hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground w-full">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Image className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">Ajouter la vignette de votre podcast</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                </div>
              </div>

              {/* SECTION — Ligne éditoriale + Profil du podcast (regroupés) */}
              <div className={sectionCardClass}>
                <SectionHeader number={sn.ligneEditoriale!} title="Ligne éditoriale & profil" />
                <div>
                  <label className={labelClass}>Thématique principale</label>
                  <select name="thematique" value={formData.thematique} onChange={handleChange} className={selectClass}>
                    <option value="">Sélectionner</option>
                    {thematiques.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
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

              {/* SECTION — Structuration */}
              <div className={sectionCardClass}>
                <SectionHeader number={sn.structuration!} title="Structuration du projet" />
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

              {/* SECTION — Besoins & Priorité (regroupés) */}
              <div className={sectionCardClass}>
                <SectionHeader number={sn.besoins!} title="Vos besoins & priorité" />
                <BesoinsMultiSelect
                  selected={selectedBesoins}
                  onChange={setSelectedBesoins}
                  labelClass="sr-only"
                />
                <div className="pt-2">
                  <p className="text-sm font-semibold text-foreground/80 mb-3">Priorité actuelle</p>
                  <PrioriteSelect
                    value={prioriteActuelle}
                    onChange={setPrioriteActuelle}
                    labelClass="sr-only"
                  />
                </div>
              </div>
              </>
              )}

              {/* Localisation (all profiles) */}
              <div className={sectionCardClass}>
                <SectionHeader number={sn.localisation} title="Localisation" />
                <div>
                  <label className={labelClass}>Département</label>
                  <select name="departementCode" value={formData.departementCode} onChange={handleChange} className={selectClass}>
                    <option value="">Sélectionner un département</option>
                    {departements.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
                  </select>
                </div>
                {formData.departementCode && (
                  <CityAutocomplete
                    departmentCode={formData.departementCode}
                    value={selectedCity}
                    onChange={(city) => { setSelectedCity(city); setCityError(""); }}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    required={false}
                    error={cityError}
                  />
                )}
              </div>

              {/* SECTION — Mise en réseau & collaborations */}
              <div className={sectionCardClass}>
                <SectionHeader number={sn.matching} title="Mise en réseau & collaborations" />

                <CheckboxMultiSelect
                  options={chercheCollaborationOptions}
                  selected={chercheCollab}
                  onChange={setChercheCollab}
                  max={3}
                  label="Je cherche à collaborer avec"
                />

                <CheckboxMultiSelect
                  options={peutApporterOptions}
                  selected={peutApporter}
                  onChange={setPeutApporter}
                  max={3}
                  label="Ce que je peux apporter au réseau"
                />

                <div>
                  <label className={labelClass}>Format de collaboration préféré</label>
                  <select name="formatCollaboration" value={formData.formatCollaboration} onChange={handleChange} className={selectClass}>
                    <option value="">Sélectionner</option>
                    {formatCollaborationOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION — Consentements */}
              <div className={sectionCardClass}>
                <SectionHeader number={sn.consentements} title="Consentements" />
                
                <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={consentCGU}
                    onChange={(e) => setConsentCGU(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                  />
                  <span className="text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                    J'accepte les <a href="/conditions-utilisation" target="_blank" className="text-primary hover:underline">conditions générales d'utilisation</a> et la <a href="/politique-de-confidentialite" target="_blank" className="text-primary hover:underline">politique de confidentialité</a> <span className="text-primary">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={consentAnnuaire}
                    onChange={(e) => setConsentAnnuaire(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                  />
                  <span className="text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                    J'accepte d'apparaître dans l'annuaire des Podcasteur·euses du Sud <span className="text-primary">*</span>
                  </span>
                </label>

                {formData.typeProfil === "podcasteur" && (
                  <>
                    <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={consentPublicationPodcast}
                        onChange={(e) => setConsentPublicationPodcast(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                      />
                      <span className="text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                        J'accepte la publication de mon podcast sur le flux du site <span className="text-primary">*</span>
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground ml-10 -mt-2 leading-relaxed">
                      Le flux référence votre podcast via son lien d'écoute (hébergeur externe).
                      Votre profil sera accessible à l'URL :
                      /annuaire/[nom-du-podcast]-[prenom]-[ville]
                    </p>
                  </>
                )}

                <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
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
                {consentError && <p className="text-xs text-destructive ml-10">{consentError}</p>}

                <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
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
                className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground py-4.5 rounded-2xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading ? "Envoi en cours…" : "Rejoindre le collectif"}
                {!uploading && <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
              </button>
            </motion.form>
          </>
        )}
      </div>
    </section>
  );
};

export default FormSection;
