import { Check } from "lucide-react";

const prioriteOptions = [
  { value: "etre_reference", label: "Être référencé sur le site" },
  { value: "trouver_collaborations", label: "Trouver des collaborations" },
  { value: "trouver_invites", label: "Trouver des invité·es" },
  { value: "trouver_studio", label: "Trouver un studio / prestataire" },
  { value: "etre_contacte", label: "Être contacté par l'équipe" },
  { value: "proposer_partenariat", label: "Proposer un partenariat / une action" },
];

interface PrioriteSelectProps {
  value: string;
  onChange: (value: string) => void;
  labelClass?: string;
}

const PrioriteSelect = ({ value, onChange, labelClass = "" }: PrioriteSelectProps) => {
  return (
    <div>
      <label className={labelClass}>Quelle est votre priorité actuelle ?</label>
      <div className="flex flex-wrap gap-2 mt-2">
        {prioriteOptions.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(isActive ? "" : opt.value)}
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
  );
};

export default PrioriteSelect;
