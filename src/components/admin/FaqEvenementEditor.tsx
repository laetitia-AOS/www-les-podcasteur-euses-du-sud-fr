import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FAQ_MAX, type FaqItem } from "@/lib/faqEvenement";

type Props = {
  value: FaqItem[];
  onChange: (next: FaqItem[]) => void;
  /** Réponses du dernier événement (ou par défaut), pour repartir de là */
  reprise: FaqItem[];
};

/** Questions fréquentes d'un événement, modifiables par l'équipe. */
const FaqEvenementEditor = ({ value, onChange, reprise }: Props) => {
  const maj = (i: number, champ: keyof FaqItem, v: string) =>
    onChange(value.map((f, j) => (j === i ? { ...f, [champ]: v } : f)));

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">Questions fréquentes de la page</legend>
      <p className="text-xs text-muted-foreground">
        Laissées vides, la page affiche les réponses habituelles de l'association. Une question sans réponse n'est pas affichée.
      </p>
      {value.map((f, i) => (
        <div key={i} className="border border-border p-3 space-y-2">
          <div className="flex gap-2 items-start">
            <label className="sr-only" htmlFor={`faq-q-${i}`}>Question {i + 1}</label>
            <Input id={`faq-q-${i}`} value={f.q} maxLength={160} onChange={(e) => maj(i, "q", e.target.value)} placeholder="Question" />
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Retirer la question ${i + 1}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <label className="sr-only" htmlFor={`faq-r-${i}`}>Réponse {i + 1}</label>
          <Textarea id={`faq-r-${i}`} value={f.r} maxLength={600} rows={2} onChange={(e) => maj(i, "r", e.target.value)} placeholder="Réponse" />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {value.length < FAQ_MAX && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { q: "", r: "" }])}>
            <Plus className="w-4 h-4 mr-1" /> Ajouter une question
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(reprise.map((f) => ({ ...f })))}>
          Reprendre les réponses du dernier événement
        </Button>
      </div>
    </fieldset>
  );
};

export default FaqEvenementEditor;
