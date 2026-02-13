import { Check } from "lucide-react";

interface BesoinOption {
  value: string;
  label: string;
  category: string;
}

const besoinOptions: BesoinOption[] = [
  // Audience & Visibilité
  { value: "developper_audience", label: "Développer mon audience", category: "Audience & Visibilité" },
  { value: "ameliorer_visibilite", label: "Améliorer ma visibilité", category: "Audience & Visibilité" },
  { value: "optimiser_plateformes", label: "Optimiser ma présence sur les plateformes", category: "Audience & Visibilité" },
  // Réseau & Collaborations
  { value: "trouver_invites", label: "Trouver des invité·es", category: "Réseau & Collaborations" },
  { value: "trouver_collaborations", label: "Trouver des collaborations", category: "Réseau & Collaborations" },
  { value: "rejoindre_reseau", label: "Rejoindre un réseau", category: "Réseau & Collaborations" },
  // Monétisation
  { value: "explorer_monetisation", label: "Explorer la monétisation", category: "Monétisation" },
  { value: "trouver_sponsors", label: "Trouver des sponsors", category: "Monétisation" },
  // Contenu & Éditorial
  { value: "clarifier_ligne_editoriale", label: "Clarifier ma ligne éditoriale", category: "Contenu & Éditorial" },
  { value: "ameliorer_storytelling", label: "Améliorer mon storytelling", category: "Contenu & Éditorial" },
  // Technique & Voix
  { value: "gagner_aisance_micro", label: "Gagner en aisance au micro", category: "Technique & Voix" },
  { value: "ameliorer_posture_vocale", label: "Améliorer ma posture vocale", category: "Technique & Voix" },
  { value: "trouver_studio", label: "Trouver un studio", category: "Technique & Voix" },
  { value: "ameliorer_audio", label: "Améliorer la qualité audio", category: "Technique & Voix" },
  // Stratégie
  { value: "clarifier_positionnement", label: "Clarifier mon positionnement", category: "Stratégie" },
  { value: "professionnaliser_projet", label: "Professionnaliser mon projet", category: "Stratégie" },
];

interface BesoinsMultiSelectProps {
  selected: string[];
  onChange: (values: string[]) => void;
  labelClass?: string;
}

const BesoinsMultiSelect = ({ selected, onChange, labelClass = "" }: BesoinsMultiSelectProps) => {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  // Group by category
  const categories = besoinOptions.reduce<Record<string, BesoinOption[]>>((acc, opt) => {
    (acc[opt.category] ??= []).push(opt);
    return acc;
  }, {});

  return (
    <div>
      <label className={labelClass}>Vos besoins</label>
      <p className="text-xs text-muted-foreground mb-4">
        Sélectionnez autant de besoins que vous le souhaitez.
      </p>
      <div className="space-y-4">
        {Object.entries(categories).map(([category, options]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {category}
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const isActive = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                      border transition-all duration-200 cursor-pointer select-none
                      ${isActive
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                      }
                    `}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BesoinsMultiSelect;
