import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ArrowLeft, Plus, Pencil, Trash2, X, LogOut, Loader2 } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type EventForm = {
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  lieu: string;
  adresse: string;
  type: string;
  lien_externe: string;
  publie: boolean;
};

const emptyForm: EventForm = {
  titre: "",
  description: "",
  date_debut: "",
  date_fin: "",
  lieu: "",
  adresse: "",
  type: "rencontre",
  lien_externe: "",
  publie: true,
};

const AdminEvenements = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, loading: authLoading, signOut } = useAdminAuth();

  const { data: evenements, isLoading } = useQuery({
    queryKey: ["admin-evenements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: EventForm) => {
      const payload = {
        titre: values.titre,
        description: values.description || null,
        date_debut: new Date(values.date_debut).toISOString(),
        date_fin: values.date_fin ? new Date(values.date_fin).toISOString() : null,
        lieu: values.lieu || null,
        adresse: values.adresse || null,
        type: values.type,
        lien_externe: values.lien_externe || null,
        publie: values.publie,
      };

      if (editingId) {
        const { error } = await supabase
          .from("evenements")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("evenements")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-evenements"] });
      toast.success(editingId ? "Événement modifié" : "Événement créé");
      resetForm();
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("evenements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-evenements"] });
      toast.success("Événement supprimé");
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const startEdit = (evt: any) => {
    setForm({
      titre: evt.titre,
      description: evt.description || "",
      date_debut: evt.date_debut ? toLocalDatetime(evt.date_debut) : "",
      date_fin: evt.date_fin ? toLocalDatetime(evt.date_fin) : "",
      lieu: evt.lieu || "",
      adresse: evt.adresse || "",
      type: evt.type || "rencontre",
      lien_externe: evt.lien_externe || "",
      publie: evt.publie,
    });
    setEditingId(evt.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.date_debut) {
      toast.error("Titre et date de début obligatoires");
      return;
    }
    saveMutation.mutate(form);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-3xl text-foreground flex items-center gap-2">
                <CalendarDays className="w-7 h-7 text-primary" />
                Événements
              </h1>
              <p className="text-muted-foreground">
                {evenements?.length ?? 0} événement{(evenements?.length ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Déconnexion
            </Button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-xl text-foreground">
                {editingId ? "Modifier" : "Nouvel événement"}
              </h2>
              <Button type="button" variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Titre *</label>
                <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Session d'écoute #3" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="3 ou 4 volontaires viennent soumettre une écoute…" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Début *</label>
                <Input type="datetime-local" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Fin</label>
                <Input type="datetime-local" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Lieu</label>
                <Input value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} placeholder="La Briqueterie" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Adresse</label>
                <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Marseille" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rencontre">Rencontre</SelectItem>
                    <SelectItem value="atelier">Atelier</SelectItem>
                    <SelectItem value="evenement">Événement</SelectItem>
                    <SelectItem value="partenaire">Partenaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Lien externe</label>
                <Input value={form.lien_externe} onChange={(e) => setForm({ ...form, lien_externe: e.target.value })} placeholder="https://…" />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.publie}
                  onChange={(e) => setForm({ ...form, publie: e.target.checked })}
                  className="rounded border-border"
                  id="publie"
                />
                <label htmlFor="publie" className="text-sm text-foreground">Publié (visible sur le site)</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Enregistrement…" : editingId ? "Modifier" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
            </div>
          </form>
        )}

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !evenements?.length ? (
          <div className="text-center py-20">
            <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun événement.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {evenements.map((evt: any) => (
              <div
                key={evt.id}
                className="flex items-center gap-4 bg-card border border-border rounded-xl p-4"
              >
                <div className="shrink-0 w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-primary leading-none">
                    {new Date(evt.date_debut).getDate()}
                  </span>
                  <span className="text-[10px] uppercase text-primary/70">
                    {new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{evt.titre}</p>
                    {!evt.publie && <Badge variant="outline" className="text-xs">Brouillon</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {evt.lieu && `${evt.lieu} · `}
                    {new Date(evt.date_debut).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(evt)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Supprimer cet événement ?")) deleteMutation.mutate(evt.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEvenements;
