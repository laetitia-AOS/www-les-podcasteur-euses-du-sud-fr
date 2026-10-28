import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fullName } from "@/lib/pds";

export type Rattachement = { id: string; adhesion_id: string; email_membre: string; created_at: string };

type Adhesion = { id: string; prenom: string | null; nom: string | null; email: string | null; date_adhesion: string | null; montant: number | null };

/** Liste des rattachements (lecture réservée aux administrateur·ices par les règles d'accès). */
export const useRattachements = (enabled: boolean) =>
  useQuery({
    queryKey: ["adhesion-rattachements"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("adhesion_rattachements").select("id, adhesion_id, email_membre, created_at");
      if (error) throw error;
      return (data || []) as Rattachement[];
    },
  });

const RattacherAdhesionDialog = ({
  adhesion,
  rattachements,
  onClose,
}: {
  adhesion: Adhesion | null;
  rattachements: Rattachement[];
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");

  const { data: membres } = useQuery({
    queryKey: ["admin-membres-emails"],
    enabled: !!adhesion,
    queryFn: async () => {
      const { data, error } = await supabase.from("podcasts").select("email, prenom, nom, nom_podcast, type_profil");
      if (error) throw error;
      const byEmail = new Map<string, { email: string; label: string }>();
      (data || []).forEach((p) => {
        const key = (p.email || "").trim().toLowerCase();
        if (!key || byEmail.has(key)) return;
        const name = fullName(p.prenom, p.nom) || p.nom_podcast;
        byEmail.set(key, { email: key, label: name });
      });
      return [...byEmail.values()].sort((a, b) => a.label.localeCompare(b.label, "fr"));
    },
  });

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !membres) return [];
    return membres.filter((m) => m.email.includes(q) || m.label.toLowerCase().includes(q)).slice(0, 8);
  }, [search, membres]);

  const existing = rattachements.filter((r) => r.adhesion_id === adhesion?.id);

  const add = useMutation({
    mutationFn: async (mail: string) => {
      const { error } = await supabase.from("adhesion_rattachements").insert({ adhesion_id: adhesion!.id, email_membre: mail });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adhesion-rattachements"] });
      toast.success("Paiement rattaché au compte membre.");
      setEmail("");
      setSearch("");
    },
    onError: (err: { code?: string; message?: string }) =>
      toast.error(err.code === "23505" ? "Ce paiement est déjà rattaché à ce compte." : "Le rattachement n'a pas abouti."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("adhesion_rattachements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adhesion-rattachements"] });
      toast.success("Rattachement retiré.");
    },
    onError: () => toast.error("Le rattachement n'a pas pu être retiré."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!membres?.some((m) => m.email === mail)) {
      toast.error("Choisissez un compte membre dans la liste.");
      return;
    }
    add.mutate(mail);
  };

  return (
    <Dialog open={!!adhesion} onOpenChange={(o) => { if (!o) { setEmail(""); setSearch(""); onClose(); } }}>
      <DialogContent className="max-w-lg">
        {adhesion && (
          <>
            <DialogHeader>
              <DialogTitle>Rattacher ce paiement à un compte membre</DialogTitle>
              <DialogDescription>
                Paiement de {fullName(adhesion.prenom, adhesion.nom) || "—"} ({adhesion.email || "sans e-mail"})
                {adhesion.date_adhesion ? ` le ${new Date(adhesion.date_adhesion).toLocaleDateString("fr-FR")}` : ""}
                {adhesion.montant ? ` · ${adhesion.montant} €` : ""}. Le membre verra cette adhésion dans son espace, et ses fiches complètes deviennent visibles.
              </DialogDescription>
            </DialogHeader>

            {existing.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Déjà rattaché à :</p>
                <ul className="space-y-1">
                  {existing.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-sm border border-border px-3 py-2">
                      <span className="break-all">{r.email_membre}</span>
                      <Button variant="ghost" size="sm" onClick={() => remove.mutate(r.id)} disabled={remove.isPending} aria-label={`Retirer le rattachement à ${r.email_membre}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <div>
                <label htmlFor="ratt-search" className="block text-sm font-medium mb-1">Chercher un membre (nom ou e-mail)</label>
                <Input id="ratt-search" value={search} onChange={(e) => { setSearch(e.target.value); setEmail(""); }} autoComplete="off" />
              </div>
              {results.length > 0 && !email && (
                <ul className="border border-border divide-y divide-border max-h-56 overflow-auto" role="listbox" aria-label="Membres trouvés">
                  {results.map((m) => (
                    <li key={m.email}>
                      <button type="button" role="option" aria-selected={false} onClick={() => { setEmail(m.email); setSearch(`${m.label} — ${m.email}`); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted min-h-[44px]">
                        <span className="font-medium">{m.label}</span> <span className="text-muted-foreground break-all">{m.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {search.trim() && results.length === 0 && !email && (
                <p className="text-sm text-muted-foreground">Aucun compte membre trouvé.</p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
                <Button type="submit" disabled={!email || add.isPending}>
                  {add.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                  Rattacher
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RattacherAdhesionDialog;
