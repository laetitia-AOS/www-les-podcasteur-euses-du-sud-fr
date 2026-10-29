import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { btnSecondary } from "@/lib/pds";
import { cardCls, sectionTitle } from "@/components/espace-membre/types";

const field = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] font-mono focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

/** « Supprimer mes données » : effacement immédiat, confirmé en tapant SUPPRIMER (vérifié aussi par le serveur). */
const SupprimerDonnees = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mot, setMot] = useState("");
  const [sending, setSending] = useState(false);
  const ok = mot.trim() === "SUPPRIMER";

  const supprimer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("supprimer-mes-donnees", { body: { confirmation: "SUPPRIMER" } });
    setSending(false);
    if (error || !data?.success) {
      let msg = "La suppression n'a pas pu être faite. Réessayez dans un instant.";
      try { const b = await (error as { context?: Response })?.context?.json(); if (b?.error) msg = b.error; } catch { /* message par défaut */ }
      toast.error(msg);
      return;
    }
    await supabase.auth.signOut();
    toast.success("Vos données ont été supprimées.");
    navigate("/", { replace: true });
  };

  return (
    <section id="suppression" aria-labelledby="suppression-title" className="scroll-mt-6">
      <div className={cardCls}>
        <h2 id="suppression-title" className={sectionTitle}>Supprimer mes données</h2>
        <p className="mt-3 text-[15px] max-w-[64ch]">
          Tout est effacé tout de suite : vos fiches, podcasts, photos, épisodes, chiffres, messages reçus, propositions d'événement en relecture, « Je viens » et votre compte de connexion. Cette action est définitive.
        </p>
        <p className="mt-2 text-[15px] max-w-[64ch] text-muted-foreground">
          L'association garde la trace comptable de vos paiements (date, montant, numéro HelloAsso), sans votre nom ni votre adresse. Les messages que vous avez envoyés restent chez leurs destinataires, signés « Membre supprimé ».
        </p>
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className={`${btnSecondary} mt-5`}>Supprimer mes données</button>
        ) : (
          <form onSubmit={supprimer} className="mt-5 max-w-sm space-y-3">
            <label htmlFor="confirm-suppression" className="block text-sm font-bold">Tapez SUPPRIMER pour confirmer</label>
            <input id="confirm-suppression" value={mot} onChange={(e) => setMot(e.target.value)} autoComplete="off" className={field} autoFocus />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={!ok || sending} className="inline-flex items-center justify-center min-h-[44px] px-5 font-bold text-[15px] bg-destructive text-destructive-foreground border-2 border-destructive disabled:opacity-50 focus-visible:outline-[3px] focus-visible:outline-accent">
                {sending ? "Suppression…" : "Tout supprimer définitivement"}
              </button>
              <button type="button" onClick={() => { setOpen(false); setMot(""); }} className={btnSecondary}>Annuler</button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default SupprimerDonnees;
