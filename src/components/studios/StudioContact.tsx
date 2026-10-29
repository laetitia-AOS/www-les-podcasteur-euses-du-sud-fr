import { useState } from "react";
import DevisForm from "@/components/studios/DevisForm";
import MembreContactForm from "@/components/MembreContactForm";

export type ModeContact = "devis" | "question";

type Props = { studioId: string; studioName: string; mode: ModeContact; onMode: (m: ModeContact) => void };

const MODES: { value: ModeContact; label: string; aide: string }[] = [
  { value: "devis", label: "Demander un devis", aide: "Format, période, besoins et description du projet." },
  { value: "question", label: "Poser une question", aide: "Un message, sans engagement." },
];

/** Formulaire unique de la fiche studio : un choix en tête, puis le devis ou la question. Nom et e-mail sont gardés d'un choix à l'autre. */
const StudioContact = ({ studioId, studioName, mode, onMode }: Props) => {
  const [identite, setIdentite] = useState({ nom: "", email: "" });
  return (
    <div>
      <fieldset>
        <legend className="text-sm font-bold mb-2">Vous voulez</legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {MODES.map((m) => {
            const on = mode === m.value;
            return (
              <label
                key={m.value}
                className={`flex items-start gap-3 p-4 border-2 cursor-pointer ${on ? "border-encre bg-encre text-surface" : "border-encre bg-surface hover:bg-muted"} has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-accent`}
              >
                <input type="radio" name="mode-contact" value={m.value} checked={on} onChange={() => onMode(m.value)} className="mt-1 h-4 w-4 accent-accent shrink-0" />
                <span>
                  <span className="block font-bold text-[17px]">{m.label}</span>
                  <span className={`block text-sm ${on ? "text-surface/80" : "text-muted-foreground"}`}>{m.aide}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-6">
        {mode === "devis" ? (
          <DevisForm key="devis" studioId={studioId} studioName={studioName} idPrefix="contact-studio" identite={identite} onIdentite={setIdentite} />
        ) : (
          <MembreContactForm key="question" recipientId={studioId} recipientFirstName={studioName} type="message" idPrefix="contact-studio" identite={identite} onIdentite={setIdentite} />
        )}
      </div>
    </div>
  );
};

export default StudioContact;
