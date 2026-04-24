import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, X, Image, Check, Users, Sun, Clock, Plus, Building2, Mic, ArrowRight } from "lucide-react";
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

const statutOptions = [
  "Studio indépendant",
  "Agence / société de production",
  "Association",
  "Média",
  "Tiers-lieu / coworking",
  "Collectivité / lieu public",
  "Autre",
];

const typeLieuOptions = [
  "Studio podcast équipé",
  "Studio audio polyvalent",
  "Plateau vidéo podcast",
  "Cabine voix off",
  "Lieu d'enregistrement mobile",
  "Salle de formation / atelier",
  "Lieu événementiel avec captation possible",
  "Autre",
];

const usagesOptions = [
  "Enregistrement solo",
  "Interview à deux",
  "Table ronde / émission à plusieurs",
  "Vidéo podcast",
  "Voix off",
  "Formation",
  "Écoutes / rencontres",
  "Livestream",
  "Captation événementielle",
  "Autre",
];

const equipementsOptions = [
  "Micros",
  "Casques",
  "Table de mixage",
  "Interface audio",
  "Enregistreur",
  "Caméras",
  "Éclairage",
  "Fonds / décor",
  "Écran de contrôle",
  "Logiciels de montage",
  "Connexion internet",
  "Traitement acoustique",
  "Climatisation / chauffage",
  "Espace attente",
  "Café / boissons",
  "Autre",
];

const servicesStudioOptions = [
  "Mise à disposition du studio",
  "Enregistrement audio",
  "Enregistrement vidéo podcast",
  "Réalisation",
  "Régie technique",
  "Montage",
  "Mixage",
  "Sound design",
  "Habillage sonore",
  "Diffusion / mise en ligne",
  "Coaching prise de parole",
  "Accompagnement éditorial",
  "Formation",
  "Location sèche du lieu",
  "Captation événementielle",
  "Autre",
];

const publicCibleOptions = [
  "Podcasteur·euses indépendant·es",
  "Entreprises",
  "Associations",
  "Médias",
  "Institutions",
  "Débutant·es",
  "Professionnel·les confirmé·es",
  "Étudiant·es",
  "Créateur·rices de contenu",
  "Autre",
];

const accessibiliteOptions = [
  "Centre-ville",
  "Proche transports en commun",
  "Parking à proximité",
  "Accès PMR",
  "Rez-de-chaussée",
  "Ascenseur",
  "Autre",
];

const disponibiliteOptions = [
  "Toute l'année",
  "Certains jours uniquement",
  "Sur demande",
  "Ponctuellement",
  "Non disponible actuellement",
];

const modeReservationOptions = [
  "Par mail",
  "Par téléphone",
  "Via formulaire",
  "Via site web",
  "Sur devis",
  "Autre",
];

const tarificationOptions = [
  "À l'heure",
  "À la demi-journée",
  "À la journée",
  "Sur devis uniquement",
  "Tarif adhérent / membre",
  "Autre",
];

const ouvertAOptions = [
  "Accueil de podcasteur·euses du collectif",
  "Partenariats avec Les Podcasteur·euses du Sud",
  "Ateliers / rencontres / écoutes",
  "Accueil de formations",
  "Collaboration avec d'autres pros du territoire",
  "Privatisation entreprise",
  "Résidences / accompagnements",
  "Autre",
];

const rechercheOptions = [
  "Plus de réservations",
  "Des partenaires",
  "Des intervenant·es",
  "Des podcasteur·euses à accueillir",
  "Des projets à accompagner",
  "De la visibilité",
  "Rien de précis pour le moment",
];

const lienTypeOptions = ["LinkedIn", "Instagram", "Facebook", "Site", "Linktree", "Autre"];

const SectionHeader = ({ number, title, icon }: { number: number; title: string; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-2">
    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm flex items-center justify-center font-sans font-bold shadow-sm">
      {number}
    </span>
    <h3 className="font-display font-bold text-xl text-foreground">{title}</h3>
    {icon && <span className="text-primary/50">{icon}</span>}
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
              type="checkbox" checked={isChecked} disabled={isDisabled}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt]);
                else onChange(selected.filter((s) => s !== opt));
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

const CheckboxGroup = ({
  options, selected, onChange, label,
}: {
  options: string[]; selected: string[]; onChange: (val: string[]) => void; label?: string;
}) => (
  <div>
    {label && <p className="text-xs text-muted-foreground mb-3">{label}</p>}
    <div className="grid gap-2">
      {options.map((opt) => {
        const isChecked = selected.includes(opt);
        return (
          <label
            key={opt}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
              isChecked
                ? "border-primary/40 bg-primary/5 text-foreground shadow-sm"
                : "border-transparent bg-background text-foreground hover:border-primary/20 hover:bg-primary/[0.02]"
            }`}
          >
            <input
              type="checkbox" checked={isChecked}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt]);
                else onChange(selected.filter((s) => s !== opt));
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

interface StudioFormSectionProps {
  onBack?: () => void;
}

const StudioFormSection = ({ onBack }: StudioFormSectionProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Step 1
  const [nomStudio, setNomStudio] = useState("");
  const [nomStructure, setNomStructure] = useState("");
  const [statutStructure, setStatutStructure] = useState("");
  const [contactNom, setContactNom] = useState("");
  const [contactFonction, setContactFonction] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [lienPrincipal, setLienPrincipal] = useState("");
  const [liensComplementaires, setLiensComplementaires] = useState<{ type: string; url: string }[]>([]);

  // Step 2
  const [accroche, setAccroche] = useState("");
  const [presentation, setPresentation] = useState("");
  const [photoMain, setPhotoMain] = useState<File | null>(null);
  const [photoMainPreview, setPhotoMainPreview] = useState<string | null>(null);
  const [galerieFiles, setGalerieFiles] = useState<File[]>([]);
  const [galeriePreviews, setGaleriePreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galerieInputRef = useRef<HTMLInputElement>(null);

  // Step 3
  const [adresseComplete, setAdresseComplete] = useState("");
  const [departementCode, setDepartementCode] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [cityError, setCityError] = useState("");
  const [accessibilite, setAccessibilite] = useState<string[]>([]);
  const [infosAcces, setInfosAcces] = useState("");

  // Step 4
  const [typeLieu, setTypeLieu] = useState("");
  const [usages, setUsages] = useState<string[]>([]);
  const [capacite, setCapacite] = useState("");

  // Step 5
  const [equipements, setEquipements] = useState<string[]>([]);
  const [precisionsMateriel, setPrecisionsMateriel] = useState("");
  const [accompagnementTechnique, setAccompagnementTechnique] = useState("");

  // Step 6
  const [servicesStudio, setServicesStudio] = useState<string[]>([]);
  const [publicCible, setPublicCible] = useState<string[]>([]);

  // Step 7
  const [disponibiliteLieu, setDisponibiliteLieu] = useState("");
  const [modeReservation, setModeReservation] = useState("");
  const [tarification, setTarification] = useState("");
  const [indicationTarifaire, setIndicationTarifaire] = useState("");
  const [accueilPetitBudget, setAccueilPetitBudget] = useState("");

  // Step 8
  const [ouvertA, setOuvertA] = useState<string[]>([]);
  const [rechercheActuellement, setRechercheActuellement] = useState<string[]>([]);

  // Step 9 — Visibility
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [showCityOnly, setShowCityOnly] = useState(true);
  const [showTarifs, setShowTarifs] = useState(false);
  const [showReservationLink, setShowReservationLink] = useState(true);
  const [consentContact, setConsentContact] = useState(false);
  const [consentMiseEnRelation, setConsentMiseEnRelation] = useState(false);

  // Step 10 — Consents
  const [consentCGU, setConsentCGU] = useState(false);
  const [consentAnnuaire, setConsentAnnuaire] = useState(false);
  const [consentContactPDS, setConsentContactPDS] = useState(false);

  const inputClass =
    "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm";
  const selectClass =
    "w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none shadow-sm";
  const labelClass = "block text-sm font-semibold text-foreground/80 mb-2";
  const sectionCardClass = "bg-card/50 border border-border/40 rounded-2xl p-6 space-y-5";

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Image uniquement (JPG, PNG, WebP)."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 Mo."); return; }
    setPhotoMain(file);
    setPhotoMainPreview(URL.createObjectURL(file));
  };

  const handleGalerieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (galerieFiles.length + files.length > 5) {
      toast.error("Maximum 5 photos dans la galerie.");
      return;
    }
    for (const f of files) {
      if (!f.type.startsWith("image/")) { toast.error("Images uniquement."); return; }
      if (f.size > 5 * 1024 * 1024) { toast.error("Max 5 Mo par image."); return; }
    }
    setGalerieFiles([...galerieFiles, ...files]);
    setGaleriePreviews([...galeriePreviews, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeGaleriePhoto = (index: number) => {
    setGalerieFiles(galerieFiles.filter((_, i) => i !== index));
    setGaleriePreviews(galeriePreviews.filter((_, i) => i !== index));
  };

  const addLienComplementaire = () => {
    if (liensComplementaires.length >= 3) return;
    setLiensComplementaires([...liensComplementaires, { type: "LinkedIn", url: "" }]);
  };

  const updateLien = (index: number, field: "type" | "url", value: string) => {
    const updated = [...liensComplementaires];
    updated[index][field] = value;
    setLiensComplementaires(updated);
  };

  const removeLien = (index: number) => {
    setLiensComplementaires(liensComplementaires.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, { contentType: file.type });
    if (error) { console.error(error); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!nomStudio) { toast.error("Le nom du studio est obligatoire."); return; }
    if (!nomStructure) { toast.error("Le nom de la structure est obligatoire."); return; }
    if (!statutStructure) { toast.error("Le statut de la structure est obligatoire."); return; }
    if (!contactNom) { toast.error("Le nom du contact référent est obligatoire."); return; }
    if (!email) { toast.error("L'email est obligatoire."); return; }
    if (!lienPrincipal) { toast.error("Le lien principal est obligatoire."); return; }
    if (lienPrincipal && !lienPrincipal.startsWith("https://")) { toast.error("Le lien principal doit commencer par https://"); return; }
    if (!presentation || presentation.length < 20) { toast.error("Présentation du lieu obligatoire (min 20 caractères)."); return; }
    if (!photoMain) { toast.error("La photo principale est obligatoire."); return; }
    if (!adresseComplete) { toast.error("L'adresse est obligatoire."); return; }
    if (!departementCode) { toast.error("Le département est obligatoire."); return; }
    if (!selectedCity) { toast.error("La ville est obligatoire."); setCityError("Sélectionnez une ville."); return; }
    if (!typeLieu) { toast.error("Le type de lieu est obligatoire."); return; }
    if (usages.length === 0) { toast.error("Sélectionnez au moins un usage."); return; }
    if (equipements.length === 0) { toast.error("Sélectionnez au moins un équipement."); return; }
    if (!accompagnementTechnique) { toast.error("Indiquez la présence d'accompagnement technique."); return; }
    if (servicesStudio.length === 0) { toast.error("Sélectionnez au moins un service."); return; }
    if (!disponibiliteLieu) { toast.error("La disponibilité est obligatoire."); return; }
    if (!modeReservation) { toast.error("Le mode de réservation est obligatoire."); return; }
    if (!consentCGU) { toast.error("Acceptez les CGU."); return; }
    if (!consentAnnuaire) { toast.error("Acceptez l'apparition dans l'annuaire."); return; }
    if (!consentContactPDS) { toast.error("Acceptez d'être contacté·e par le collectif."); return; }

    setUploading(true);

    // Upload main photo
    const photoUrl = await uploadFile(photoMain, "podcast-thumbnails");
    if (!photoUrl) { toast.error("Erreur upload photo principale."); setUploading(false); return; }

    // Upload gallery
    const galerieUrls: string[] = [];
    for (const f of galerieFiles) {
      const url = await uploadFile(f, "studio-galleries");
      if (url) galerieUrls.push(url);
    }

    const dept = departements.find((d) => d.code === departementCode);

    // Split contact name into prenom/nom
    const contactParts = contactNom.trim().split(/\s+/);
    const contactPrenom = contactParts[0] || "";
    const contactNomFamille = contactParts.slice(1).join(" ") || "";

    const studioData = {
      statut_structure: statutStructure,
      fonction_contact: contactFonction,
      accroche,
      adresse_complete: adresseComplete,
      accessibilite,
      infos_acces: infosAcces,
      type_lieu: typeLieu,
      usages,
      capacite,
      equipements,
      precisions_materiel: precisionsMateriel,
      accompagnement_technique: accompagnementTechnique,
      services_studio: servicesStudio,
      public_cible: publicCible,
      disponibilite_lieu: disponibiliteLieu,
      mode_reservation: modeReservation,
      tarification,
      indication_tarifaire: indicationTarifaire,
      accueil_petit_budget: accueilPetitBudget,
      ouvert_a: ouvertA,
      recherche_actuellement: rechercheActuellement,
      liens_complementaires: liensComplementaires.filter((l) => l.url),
      galerie_urls: galerieUrls,
      visibility: {
        show_email: showEmail,
        show_phone: showPhone,
        show_full_address: showFullAddress,
        show_city_only: showCityOnly,
        show_tarifs: showTarifs,
        show_reservation_link: showReservationLink,
      },
    };

    const { error } = await supabase.from("podcasts").insert({
      type_profil: "studio",
      nom_podcast: nomStudio,
      structure: nomStructure,
      description: presentation,
      bio_750: accroche || null,
      email,
      telephone: telephone || null,
      prenom: contactPrenom,
      nom: contactNomFamille,
      metier_principal: contactFonction || null,
      vignette_url: photoUrl,
      lien_principal: lienPrincipal,
      lien_ecoute: lienPrincipal, // Required field, reuse
      lien_linkedin: liensComplementaires[0]?.url || null,
      department_code: departementCode,
      department_label: dept?.label || null,
      city_name: selectedCity.city_name,
      city_insee_code: selectedCity.city_insee_code,
      city_postcode: selectedCity.city_postcode,
      ville: `${selectedCity.city_name}, ${dept?.label || departementCode}`,
      consent_contact: consentContact,
      consent_mise_en_relation: consentMiseEnRelation,
      services_3: servicesStudio.slice(0, 5),
      disponibilite: disponibiliteLieu,
      studio_data: studioData,
    } as any);

    setUploading(false);

    if (error) {
      toast.error("Erreur lors de l'enregistrement.");
      console.error(error);
      return;
    }

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="bg-background border border-border rounded-3xl p-7 sm:p-10 space-y-8"
          >
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-4xl">🏠 Lieu enregistré</h2>
              <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Votre studio / lieu d'enregistrement a bien été soumis.
              </p>
            </div>
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Vérification en cours</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Votre fiche sera vérifiée par notre équipe et publiée sous 48–72h.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA "Vous avez aussi un podcast ?" */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Mic className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">Votre studio a aussi un podcast ?</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Référencez-le pour qu'il apparaisse dans le flux des podcasts du Sud. Vos informations seront pré-remplies.
                  </p>
                  <a
                    href={`/referencer-mon-podcast?profil=podcasteur&ajout=1&email=${encodeURIComponent(email)}`}
                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline text-sm"
                  >
                    Référencer mon podcast <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-center">
              <h3 className="font-display font-bold text-xl text-foreground">✨ Visibilité dans l'annuaire</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
                Votre lieu sera visible dans l'annuaire comme une ressource territoriale de l'écosystème podcast. Les structures à jour de leur cotisation personne morale (100 €) sont mises en avant.
              </p>
              <a href="/rejoindre-association" className="text-primary hover:underline text-sm">
                Découvrir l'adhésion →
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px w-8 bg-primary/30" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Studio / Lieu</span>
            <div className="h-px w-8 bg-primary/30" />
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl mb-5">
            Référencer un studio podcast
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Rendez votre lieu visible dans l'annuaire de l'écosystème podcast en Région Sud.
          </p>

          {onBack && (
            <button onClick={onBack} className="mt-4 text-sm text-primary hover:underline">
              ← Changer de type de profil
            </button>
          )}

          <div className="mt-8 bg-secondary/10 border border-secondary/20 rounded-2xl p-5 text-left max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Cotisation personne morale</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ce profil est dédié aux structures qui soutiennent le collectif via l'adhésion personne morale (100 €).{" "}
                  <a href="/rejoindre-association" className="text-primary font-medium hover:underline">En savoir plus →</a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="space-y-6"
        >
          {/* 1 — Informations générales */}
          <div className={sectionCardClass}>
            <SectionHeader number={1} title="Informations générales" />
            <div>
              <label className={labelClass}>Nom du studio / lieu <span className="text-primary">*</span></label>
              <p className="text-xs text-muted-foreground mb-2">Nom visible sur la fiche publique de l'annuaire.</p>
              <input value={nomStudio} onChange={(e) => setNomStudio(e.target.value)} className={inputClass} placeholder="Ex : Studio Médiacast" required />
            </div>
            <div>
              <label className={labelClass}>Nom de la structure <span className="text-primary">*</span></label>
              <input value={nomStructure} onChange={(e) => setNomStructure(e.target.value)} className={inputClass} placeholder="Ex : Nom de l'agence, société, association ou média" required />
            </div>
            <div>
              <label className={labelClass}>Statut de la structure <span className="text-primary">*</span></label>
              <select value={statutStructure} onChange={(e) => setStatutStructure(e.target.value)} className={selectClass} required>
                <option value="">Sélectionner</option>
                {statutOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contact référent <span className="text-primary">*</span></label>
                <input value={contactNom} onChange={(e) => setContactNom(e.target.value)} className={inputClass} placeholder="Prénom Nom" required />
              </div>
              <div>
                <label className={labelClass}>Fonction du contact</label>
                <input value={contactFonction} onChange={(e) => setContactFonction(e.target.value)} className={inputClass} placeholder="Ex : Fondateur·rice, responsable studio" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email de contact <span className="text-primary">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="contact@studio.com" required />
            </div>
            <div>
              <label className={labelClass}>Téléphone / WhatsApp</label>
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className={inputClass} placeholder="06 00 00 00 00" />
            </div>
            <div>
              <label className={labelClass}>Lien principal <span className="text-primary">*</span></label>
              <p className="text-xs text-muted-foreground mb-2">Site, page de réservation, portfolio, Linktree…</p>
              <input value={lienPrincipal} onChange={(e) => setLienPrincipal(e.target.value)} className={inputClass} placeholder="https://..." required />
            </div>
            <div>
              <label className={labelClass}>Liens complémentaires (max 3)</label>
              {liensComplementaires.map((lien, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <select value={lien.type} onChange={(e) => updateLien(i, "type", e.target.value)} className={selectClass + " !w-40"}>
                    {lienTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={lien.url} onChange={(e) => updateLien(i, "url", e.target.value)} className={inputClass} placeholder="https://..." />
                  <button type="button" onClick={() => removeLien(i)} className="text-destructive hover:text-destructive/80 px-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {liensComplementaires.length < 3 && (
                <button type="button" onClick={addLienComplementaire} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" /> Ajouter un lien
                </button>
              )}
            </div>
          </div>

          {/* 2 — Présentation */}
          <div className={sectionCardClass}>
            <SectionHeader number={2} title="Présentation du lieu" />
            <div>
              <label className={labelClass}>Phrase d'accroche</label>
              <input value={accroche} onChange={(e) => setAccroche(e.target.value)} className={inputClass} placeholder="Ex : Studio podcast et vidéo au cœur de Marseille" />
            </div>
            <div>
              <label className={labelClass}>Présentation du lieu (max 750 caractères) <span className="text-primary">*</span></label>
              <p className="text-xs text-muted-foreground mb-2">Présentez votre lieu en 4 à 6 lignes : ce que c'est, à qui il s'adresse, ce qui le distingue, les services proposés et le type de projets accueillis.</p>
              <textarea
                value={presentation}
                onChange={(e) => { if (e.target.value.length <= 750) setPresentation(e.target.value); }}
                className={inputClass + " min-h-[140px] resize-y"}
                placeholder="Décrivez votre lieu…"
                required
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{presentation.length}/750</p>
            </div>
            <div>
              <label className={labelClass}>Photo principale du lieu <span className="text-primary">*</span></label>
              <p className="text-xs text-muted-foreground mb-1">JPG, PNG ou WebP. Max 5 Mo.</p>
              {photoMainPreview ? (
                <div className="relative inline-block">
                  <img src={photoMainPreview} alt="Photo principale" className="w-40 h-28 object-cover rounded-xl border-2 border-border/40 shadow-md" />
                  <button type="button" onClick={() => { setPhotoMain(null); setPhotoMainPreview(null); }} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => photoInputRef.current?.click()} className="flex items-center gap-3 px-5 py-5 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 bg-background hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground w-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Ajouter la photo principale</span>
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
            </div>
            <div>
              <label className={labelClass}>Galerie photos (max 5)</label>
              <div className="flex flex-wrap gap-3 mb-2">
                {galeriePreviews.map((preview, i) => (
                  <div key={i} className="relative">
                    <img src={preview} alt={`Galerie ${i + 1}`} className="w-24 h-18 object-cover rounded-lg border border-border/40" />
                    <button type="button" onClick={() => removeGaleriePhoto(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {galerieFiles.length < 5 && (
                <button type="button" onClick={() => galerieInputRef.current?.click()} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Ajouter des photos
                </button>
              )}
              <input ref={galerieInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleGalerieChange} className="hidden" />
            </div>
          </div>

          {/* 3 — Localisation */}
          <div className={sectionCardClass}>
            <SectionHeader number={3} title="Localisation" />
            <div>
              <label className={labelClass}>Adresse complète <span className="text-primary">*</span></label>
              <input value={adresseComplete} onChange={(e) => setAdresseComplete(e.target.value)} className={inputClass} placeholder="12 rue du Podcast, 13001 Marseille" required />
            </div>
            <div>
              <label className={labelClass}>Département <span className="text-primary">*</span></label>
              <select value={departementCode} onChange={(e) => { setDepartementCode(e.target.value); setSelectedCity(null); }} className={selectClass} required>
                <option value="">Sélectionner</option>
                {departements.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            </div>
            {departementCode && (
              <CityAutocomplete
                departmentCode={departementCode}
                value={selectedCity}
                onChange={(city) => { setSelectedCity(city); setCityError(""); }}
                inputClass={inputClass}
                labelClass={labelClass}
                required
                error={cityError}
              />
            )}
            <div>
              <label className={labelClass}>Accessibilité / accès</label>
              <CheckboxGroup options={accessibiliteOptions} selected={accessibilite} onChange={setAccessibilite} />
            </div>
            <div>
              <label className={labelClass}>Informations pratiques d'accès</label>
              <textarea value={infosAcces} onChange={(e) => setInfosAcces(e.target.value)} className={inputClass + " min-h-[80px] resize-y"} placeholder="Indications, interphone, code…" />
            </div>
          </div>

          {/* 4 — Type de lieu */}
          <div className={sectionCardClass}>
            <SectionHeader number={4} title="Type de lieu et usages" />
            <div>
              <label className={labelClass}>Type de lieu <span className="text-primary">*</span></label>
              <select value={typeLieu} onChange={(e) => setTypeLieu(e.target.value)} className={selectClass} required>
                <option value="">Sélectionner</option>
                {typeLieuOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Le lieu est adapté pour <span className="text-primary">*</span></label>
              <CheckboxGroup options={usagesOptions} selected={usages} onChange={setUsages} />
            </div>
            <div>
              <label className={labelClass}>Capacité d'accueil</label>
              <input value={capacite} onChange={(e) => setCapacite(e.target.value)} className={inputClass} placeholder="Ex : 4 personnes, 8 places assises…" />
            </div>
          </div>

          {/* 5 — Équipements */}
          <div className={sectionCardClass}>
            <SectionHeader number={5} title="Équipements" />
            <div>
              <label className={labelClass}>Équipements disponibles <span className="text-primary">*</span></label>
              <CheckboxGroup options={equipementsOptions} selected={equipements} onChange={setEquipements} />
            </div>
            <div>
              <label className={labelClass}>Précisions sur le matériel</label>
              <textarea value={precisionsMateriel} onChange={(e) => setPrecisionsMateriel(e.target.value)} className={inputClass + " min-h-[80px] resize-y"} placeholder="Marques, modèles, spécificités…" />
            </div>
            <div>
              <label className={labelClass}>Accompagnement technique sur place <span className="text-primary">*</span></label>
              <select value={accompagnementTechnique} onChange={(e) => setAccompagnementTechnique(e.target.value)} className={selectClass} required>
                <option value="">Sélectionner</option>
                <option value="Oui, systématiquement">Oui, systématiquement</option>
                <option value="Oui, sur demande">Oui, sur demande</option>
                <option value="Non">Non</option>
              </select>
            </div>
          </div>

          {/* 6 — Services */}
          <div className={sectionCardClass}>
            <SectionHeader number={6} title="Services proposés" />
            <CheckboxMultiSelect
              options={servicesStudioOptions}
              selected={servicesStudio}
              onChange={setServicesStudio}
              max={8}
              label="Services proposés"
            />
            <div>
              <label className={labelClass}>Le lieu s'adresse plutôt à</label>
              <CheckboxGroup options={publicCibleOptions} selected={publicCible} onChange={setPublicCible} />
            </div>
          </div>

          {/* 7 — Réservation */}
          <div className={sectionCardClass}>
            <SectionHeader number={7} title="Réservation et disponibilité" />
            <div>
              <label className={labelClass}>Disponibilité du lieu <span className="text-primary">*</span></label>
              <select value={disponibiliteLieu} onChange={(e) => setDisponibiliteLieu(e.target.value)} className={selectClass} required>
                <option value="">Sélectionner</option>
                {disponibiliteOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Mode de réservation <span className="text-primary">*</span></label>
              <select value={modeReservation} onChange={(e) => setModeReservation(e.target.value)} className={selectClass} required>
                <option value="">Sélectionner</option>
                {modeReservationOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Mode de tarification</label>
              <select value={tarification} onChange={(e) => setTarification(e.target.value)} className={selectClass}>
                <option value="">Sélectionner</option>
                {tarificationOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Indication tarifaire</label>
              <input value={indicationTarifaire} onChange={(e) => setIndicationTarifaire(e.target.value)} className={inputClass} placeholder="Ex : À partir de 50 €/h, sur devis…" />
            </div>
            <div>
              <label className={labelClass}>Accueil de projets associatifs ou à petit budget</label>
              <select value={accueilPetitBudget} onChange={(e) => setAccueilPetitBudget(e.target.value)} className={selectClass}>
                <option value="">Sélectionner</option>
                <option value="Oui">Oui</option>
                <option value="Oui, au cas par cas">Oui, au cas par cas</option>
                <option value="Non">Non</option>
              </select>
            </div>
          </div>

          {/* 8 — Collaboration */}
          <div className={sectionCardClass}>
            <SectionHeader number={8} title="Collaboration et mise en relation" />
            <div>
              <label className={labelClass}>Le lieu est ouvert à</label>
              <CheckboxGroup options={ouvertAOptions} selected={ouvertA} onChange={setOuvertA} />
            </div>
            <div>
              <label className={labelClass}>Vous recherchez actuellement</label>
              <CheckboxGroup options={rechercheOptions} selected={rechercheActuellement} onChange={setRechercheActuellement} />
            </div>
          </div>

          {/* 9 — Confidentialité */}
          <div className={sectionCardClass}>
            <SectionHeader number={9} title="Contact et confidentialité" />
            <p className="text-xs text-muted-foreground">Choisissez ce que vous souhaitez rendre visible sur votre fiche publique.</p>

            {[
              { label: "Afficher publiquement l'email", state: showEmail, set: setShowEmail },
              { label: "Afficher publiquement le téléphone", state: showPhone, set: setShowPhone },
              { label: "Afficher l'adresse complète", state: showFullAddress, set: setShowFullAddress },
              { label: "Afficher seulement la ville et le département", state: showCityOnly, set: setShowCityOnly },
              { label: "Afficher les tarifs indicatifs", state: showTarifs, set: setShowTarifs },
              { label: "Afficher le lien de réservation", state: showReservationLink, set: setShowReservationLink },
            ].map(({ label, state, set }) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl hover:bg-background/50 transition-colors">
                <input
                  type="checkbox" checked={state}
                  onChange={(e) => set(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}

            <div className="border-t border-border pt-4 mt-2">
              <label className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl hover:bg-background/50 transition-colors">
                <input type="checkbox" checked={consentContact} onChange={(e) => setConsentContact(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30" />
                <span className="text-sm text-foreground">J'accepte d'être contacté·e via l'annuaire</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-xl hover:bg-background/50 transition-colors">
                <input type="checkbox" checked={consentMiseEnRelation} onChange={(e) => setConsentMiseEnRelation(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30" />
                <span className="text-sm text-foreground">J'accepte que le collectif me mette en relation avec d'autres membres</span>
              </label>
            </div>
          </div>

          {/* 10 — Consentements */}
          <div className={sectionCardClass}>
            <SectionHeader number={10} title="Consentements" />

            <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
              <input type="checkbox" checked={consentCGU} onChange={(e) => setConsentCGU(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30" />
              <span className="text-sm text-foreground">
                J'accepte les <a href="/conditions-utilisation" target="_blank" className="text-primary hover:underline">conditions générales d'utilisation</a> et la <a href="/politique-de-confidentialite" target="_blank" className="text-primary hover:underline">politique de confidentialité</a> <span className="text-primary">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
              <input type="checkbox" checked={consentAnnuaire} onChange={(e) => setConsentAnnuaire(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30" />
              <span className="text-sm text-foreground">
                J'accepte que ce lieu apparaisse dans l'annuaire public des Podcasteur·euses du Sud <span className="text-primary">*</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group px-3 py-2.5 rounded-xl hover:bg-background/50 transition-colors">
              <input type="checkbox" checked={consentContactPDS} onChange={(e) => setConsentContactPDS(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30" />
              <span className="text-sm text-foreground">
                J'accepte d'être contacté·e par Les Podcasteur·euses du Sud <span className="text-primary">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground py-4.5 rounded-2xl text-base font-semibold hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? "Envoi en cours…" : "Référencer ce lieu"}
            {!uploading && <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default StudioFormSection;
