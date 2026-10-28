import { useRef } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { btnSecondary } from "@/lib/pds";
import { checkImage, cropToSquare } from "@/lib/inscription";

export const field =
  "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";
export const labelCls = "block text-sm font-bold mb-1.5";
export const hintCls = "mt-1.5 text-sm text-muted-foreground";

export const Req = () => <span aria-hidden> *</span>;

/** Cases à cocher avec un nombre maximum de choix. */
export const ChoiceList = ({
  legend,
  options,
  selected,
  onChange,
  max,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  max: number;
}) => (
  <fieldset>
    <legend className={labelCls}>
      {legend} <span className="font-normal text-muted-foreground">({selected.length}/{max})</span>
    </legend>
    <div className="grid sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        const disabled = !checked && selected.length >= max;
        return (
          <label
            key={opt}
            className={`flex items-start gap-3 px-3 py-2.5 border text-[15px] cursor-pointer ${
              checked ? "border-encre bg-primary text-primary-foreground" : disabled ? "border-filet text-muted-foreground opacity-50 cursor-not-allowed" : "border-filet bg-surface hover:border-encre"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked ? [...selected, opt] : selected.filter((s) => s !== opt))}
              className="mt-1 h-4 w-4 accent-accent shrink-0"
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  </fieldset>
);

/** Choix d'une image, recadrée au carré, avec aperçu. */
export const ImagePicker = ({
  id,
  label,
  hint,
  preview,
  onPick,
  onClear,
  round = false,
  required = false,
}: {
  id: string;
  label: string;
  hint?: string;
  preview: string | null;
  onPick: (file: File, previewUrl: string) => void;
  onClear: () => void;
  round?: boolean;
  required?: boolean;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = checkImage(file);
    if (err) { toast.error(err); return; }
    const cropped = await cropToSquare(file);
    onPick(cropped, URL.createObjectURL(cropped));
  };
  return (
    <div>
      <p id={`${id}-label`} className={labelCls}>{label}{required && <Req />}</p>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative shrink-0">
            <img src={preview} alt="Aperçu de l'image choisie" className={`w-28 h-28 object-cover border-2 border-encre ${round ? "rounded-full" : ""}`} />
            <button
              type="button"
              onClick={() => { onClear(); if (ref.current) ref.current.value = ""; }}
              className="absolute -top-2 -right-2 w-9 h-9 bg-encre text-surface inline-flex items-center justify-center"
              aria-label="Retirer l'image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span aria-hidden className={`w-28 h-28 shrink-0 border-2 border-dashed border-filet bg-surface ${round ? "rounded-full" : ""}`} />
        )}
        <div>
          <button type="button" onClick={() => ref.current?.click()} className={btnSecondary} aria-describedby={`${id}-label`}>
            {preview ? "Changer l'image" : "Choisir une image"}
          </button>
          <p className={hintCls}>{hint || "JPG, PNG ou WebP, 5 Mo maximum. L'image est recadrée au carré."}</p>
        </div>
      </div>
      <input ref={ref} id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={handle} className="hidden" />
    </div>
  );
};
