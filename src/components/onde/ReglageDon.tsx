// Le seul réglage de L'Onde : le lien du bouton « Soutenir L'Onde par un don » (pied de chaque numéro, page et e-mail).
// Admins et éditeur·ices ; la base vérifie le rôle et l'adresse (https). Vide : le bouton n'apparaît nulle part.
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btnPrimary } from "@/lib/pds";
import { messageOnde } from "@/components/onde/adminOnde";
import { PIED_DON, lienDonValide, reglerLienDon, useLienDon } from "@/lib/ondePied";

const ReglageDon = () => {
  const qc = useQueryClient();
  const { data: actuel, isLoading } = useLienDon();
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { if (actuel !== undefined) setV(actuel || ""); }, [actuel]);

  const enregistrer = useMutation({
    mutationFn: (lien: string) => reglerLienDon(lien),
    onSuccess: (l) => {
      qc.setQueryData(["onde-lien-don"], l);
      setV(l || "");
      toast.success(l ? "Lien de don enregistré : le bouton apparaît dans les numéros" : "Lien de don retiré : le bouton n'apparaît plus");
    },
    onError: (e: { code?: string; message?: string }) => toast.error(messageOnde(e, "Le lien n'a pas pu être enregistré.")),
  });

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    const l = v.trim();
    if (l && !lienDonValide(l)) { setErr("Collez une adresse complète qui commence par https://"); return; }
    setErr("");
    enregistrer.mutate(l);
  };

  return (
    <section aria-labelledby="onde-don-titre" className="mt-12 border-2 border-encre bg-surface p-5 max-w-3xl">
      <h2 id="onde-don-titre" className="font-bold text-lg">Lien de don</h2>
      <p className="text-[15px] mt-1 max-w-[70ch]">
        Le bouton « {PIED_DON} » s'affiche en bas de chaque numéro, sur le site et dans l'e-mail, seulement quand ce lien est rempli. Laissez vide pour le masquer.
      </p>
      <form onSubmit={envoyer} noValidate className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 flex-1 min-w-[260px]">
          <Label htmlFor="onde-lien-don">Adresse de la page de don</Label>
          <Input
            id="onde-lien-don" type="url" inputMode="url" placeholder="https://…" value={v} disabled={isLoading}
            onChange={(e) => setV(e.target.value)} aria-invalid={!!err} aria-describedby={err ? "onde-lien-don-err" : undefined}
          />
          {err && <p id="onde-lien-don-err" className="text-sm text-destructive">{err}</p>}
        </div>
        <button type="submit" className={btnPrimary} disabled={enregistrer.isPending || isLoading || v.trim() === (actuel || "")}>
          {enregistrer.isPending && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
          Enregistrer
        </button>
      </form>
    </section>
  );
};

export default ReglageDon;
