import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatName } from "@/lib/pds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fullName } from "@/lib/pds";

const STATUS: Record<string, string> = { pending: "À transmettre", transmis: "Transmis", archive: "Archivé" };

/**
 * Messages envoyés depuis le formulaire « Écrire à… » des fiches.
 * Ils sont enregistrés sans envoi automatique : l'équipe les transmet au membre depuis sa propre messagerie.
 */
const AdminMembreMessages = () => {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["contact-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("id, created_at, sender_name, sender_email, message, status, recipient_id, podcasts(nom_podcast, prenom, nom, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-a-traiter"] });
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "inconnue")),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast.success("Message supprimé");
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "inconnue")),
  });

  const forwardHref = (m: any) => {
    const r = m.podcasts || {};
    const subject = `Message de ${m.sender_name} via Les Podcasteur·euses du Sud`;
    const body =
      `Bonjour ${r.prenom || ""},\n\n${m.sender_name} (${m.sender_email}) vous a écrit depuis votre fiche${r.nom_podcast ? ` « ${r.nom_podcast} »` : ""} :\n\n` +
      `${m.message}\n\nPour lui répondre, écrivez directement à ${m.sender_email}.\n\nL'équipe des Podcasteur·euses du Sud`;
    return `mailto:${encodeURIComponent(r.email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const pending = messages?.filter((m) => m.status === "pending").length ?? 0;

  return (
    <section aria-labelledby="membre-messages-title">
      <h2 id="membre-messages-title" className="font-display font-bold text-2xl text-foreground">
        Messages aux membres
      </h2>
      <p className="text-muted-foreground mt-1 mb-5">
        Messages, collabs et devis envoyés depuis les fiches. Le membre les reçoit par e-mail et dans son espace membre.
        {pending > 0 ? ` ${pending} encore marqué${pending > 1 ? "s" : ""} « À transmettre ».` : ""} « Transmettre » ouvre un e-mail prêt à renvoyer à la main si besoin.
      </p>
      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : !messages?.length ? (
        <p className="text-muted-foreground">Aucun message pour le moment.</p>
      ) : (
        <div className="border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pour</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((m) => {
                const r = m.podcasts || {};
                return (
                  <TableRow key={m.id} className={m.status === "pending" ? "bg-primary/5" : ""}>
                    <TableCell className="text-sm whitespace-nowrap">{new Date(m.created_at).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium">{fullName(r.prenom, r.nom) || "—"}</p>
                      {r.nom_podcast && r.nom_podcast !== "—" && <p className="text-xs text-muted-foreground">{r.nom_podcast}</p>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium">{formatName(m.sender_name)}</p>
                      <a href={`mailto:${m.sender_email}`} className="text-primary text-xs hover:underline">{m.sender_email}</a>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs whitespace-pre-wrap">{m.message}</TableCell>
                    <TableCell>
                      <select
                        value={m.status}
                        onChange={(e) => setStatus.mutate({ id: m.id, status: e.target.value })}
                        className="text-xs border border-border bg-card px-2 py-1 text-foreground"
                        aria-label="Statut du message"
                      >
                        {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <a href={forwardHref(m)} onClick={() => m.status === "pending" && setStatus.mutate({ id: m.id, status: "transmis" })}>
                          <Button size="sm"><Mail className="w-4 h-4 mr-1" /> Transmettre</Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => window.confirm(`Supprimer le message de ${m.sender_name} ?`) && remove.mutate(m.id)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};

export default AdminMembreMessages;
