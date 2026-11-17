import { useState } from "react";
import { toast } from "sonner";
import { btnSecondary } from "@/lib/pds";

/** Message de présentation prêt à copier dans le groupe WhatsApp (modifiable avant de copier). */
const MessagePresentation = ({ message, id = "message-presentation" }: { message: string; id?: string }) => {
  const [texte, setTexte] = useState(message);
  const [copie, setCopie] = useState(false);
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      toast.success("Message copié : colle-le dans le groupe.");
      setTimeout(() => setCopie(false), 3000);
    } catch {
      const el = document.getElementById(id) as HTMLTextAreaElement | null;
      el?.select();
      toast.message("Sélectionne le texte et copie-le.");
    }
  };
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold mb-1.5">Ton message de présentation</label>
      <textarea
        id={id}
        value={texte}
        onChange={(e) => setTexte(e.target.value.slice(0, 1200))}
        rows={5}
        className="w-full bg-background border-2 border-encre p-3 text-[15px] leading-relaxed resize-y focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent"
      />
      <p className="mt-1.5 text-sm text-muted-foreground">Complète ce qui est entre crochets, puis colle-le dans le groupe.</p>
      <button type="button" onClick={copier} className={`${btnSecondary} mt-3`} aria-live="polite">
        {copie ? "Copié" : "Copier le message"}
      </button>
    </div>
  );
};

export default MessagePresentation;
