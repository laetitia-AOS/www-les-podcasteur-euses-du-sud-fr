import { useState } from "react";
import { z } from "zod";
import { btnPrimary } from "@/lib/pds";

const MAX = 1000;

const schema = z.object({
  sender_name: z.string().trim().min(2, "Indiquez votre nom.").max(100, "100 caractères maximum."),
  sender_email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  message: z.string().trim().min(10, "Votre message doit faire au moins 10 caractères.").max(MAX, "1 000 caractères maximum."),
});

type Props = { recipientId: string; recipientFirstName: string; type?: "collab" | "message"; idPrefix?: string };

const fieldClass = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

/** Formulaire « Proposer une collab » : la demande est enregistrée côté serveur, sans jamais afficher l'adresse du membre. */
const MembreContactForm = ({ recipientId, recipientFirstName, type = "collab", idPrefix = "cf" }: Props) => {
  const isCollab = type === "collab";
  const [values, setValues] = useState({ sender_name: "", sender_email: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [relayed, setRelayed] = useState(false);
  const [serverError, setServerError] = useState("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.website) return; // champ piège anti-robots
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-membre`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ recipient_id: recipientId, type, ...parsed.data }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(body.error || "Le message n'a pas pu partir. Réessayez dans un instant.");
        setStatus("error");
        return;
      }
      setRelayed(body.emailed === false);
      setStatus("sent");
    } catch {
      setServerError("Le message n'a pas pu partir. Vérifiez votre connexion et réessayez.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div role="status" className="py-4">
        <p className="font-bold text-xl">{isCollab ? "Proposition envoyée." : "Message envoyé."}</p>
        <p className="mt-2 text-[17px]">
          {relayed
            ? `${isCollab ? "Votre proposition est enregistrée" : "Votre message est enregistré"} : ${recipientFirstName || "ce membre"} le retrouve dans son espace membre et vous répondra directement.`
            : `${recipientFirstName || "Le membre"} le reçoit par e-mail et vous répondra directement.`}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor={`${idPrefix}-name`} className="block text-sm font-bold mb-1.5">Votre nom</label>
        <input id={`${idPrefix}-name`} name="sender_name" value={values.sender_name} onChange={onChange} autoComplete="name" className={fieldClass} aria-invalid={!!errors.sender_name} aria-describedby={errors.sender_name ? `${idPrefix}-name-err` : undefined} />
        {errors.sender_name && <p id={`${idPrefix}-name-err`} className="mt-1 text-sm text-destructive">{errors.sender_name}</p>}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-email`} className="block text-sm font-bold mb-1.5">Votre e-mail</label>
        <input id={`${idPrefix}-email`} name="sender_email" type="email" value={values.sender_email} onChange={onChange} autoComplete="email" className={fieldClass} aria-invalid={!!errors.sender_email} aria-describedby={errors.sender_email ? `${idPrefix}-email-err` : undefined} />
        {errors.sender_email && <p id={`${idPrefix}-email-err`} className="mt-1 text-sm text-destructive">{errors.sender_email}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-message`} className="block text-sm font-bold mb-1.5">Message</label>
        <textarea id={`${idPrefix}-message`} name="message" rows={5} maxLength={MAX} value={values.message} onChange={onChange} placeholder={isCollab ? "Ce que vous proposez, pour quand, sous quelle forme." : "Votre question ou votre demande."} className={`${fieldClass} py-2 resize-y`} aria-invalid={!!errors.message} aria-describedby={`${idPrefix}-message-count${errors.message ? ` ${idPrefix}-message-err` : ""}`} />
        <p id={`${idPrefix}-message-count`} className="mt-1 font-mono text-sm text-muted-foreground">{values.message.length}/{MAX} caractères</p>
        {errors.message && <p id={`${idPrefix}-message-err`} className="mt-1 text-sm text-destructive">{errors.message}</p>}
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor={`${idPrefix}-website`}>Site web</label>
        <input id={`${idPrefix}-website`} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={onChange} />
      </div>
      {status === "error" && <p role="alert" className="sm:col-span-2 text-destructive font-semibold">{serverError}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={status === "sending"} className={`${btnPrimary} px-7`}>
          {status === "sending" ? "Envoi…" : isCollab ? "Envoyer ma proposition" : "Envoyer"}
        </button>
      </div>
    </form>
  );
};

export default MembreContactForm;
