import { useState, useRef, useEffect } from "react";
import { formatName } from "@/lib/pds";
import { toCsv } from "@/lib/csv";
import AdminImagesEnAttente, { traiterImages } from "@/components/AdminImagesEnAttente";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Pencil, Trash2, X, Loader2, Download, Image, Users, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminOnglets, Panneau, useOnglet } from "@/components/admin/AdminOnglets";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { EVENT_TYPES } from "@/components/home/useHomeData";
import EvenementInscriptionsDialog from "@/components/EvenementInscriptionsDialog";
import PodcastsInvitesEditor, { type PodcastInvite } from "@/components/PodcastsInvitesEditor";
import FaqEvenementEditor from "@/components/admin/FaqEvenementEditor";
import { faqParDefaut, lireFaq, type FaqItem } from "@/lib/faqEvenement";
import { sansEmojis } from "@/lib/events";

type EventForm = {
  titre: string;
  sous_titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  lieu: string;
  adresse: string;
  type: string;
  lien_externe: string;
  publie: boolean;
  image_url: string;
  places: string;
  inscription_activee: boolean;
  podcasts_invites: PodcastInvite[];
  structure_id: string;
  format: string;
  lien_connexion: string;
  tarif: string;
  statut: string;
  faq: FaqItem[];
};

const STATUT_LABEL: Record<string, string> = { en_relecture: "En relecture", publie: "Publié", refuse: "Refusé" };

const emptyForm: EventForm = {
  titre: "", sous_titre: "", description: "", date_debut: "", date_fin: "",
  lieu: "", adresse: "", type: "rencontre", lien_externe: "", publie: true,
  image_url: "", places: "", inscription_activee: false,
  podcasts_invites: [], structure_id: "",
  format: "sur_place", lien_connexion: "", tarif: "", statut: "publie", faq: [],
};

const AdminEvenements = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inscriptionsOpen, setInscriptionsOpen] = useState<{ id: string; titre: string } | null>(null);
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAuth();
  const [params, setParams] = useSearchParams();

  const { data: evenements, isLoading } = useQuery({
    queryKey: ["admin-evenements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements").select("*").order("date_debut", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Structures (radios, festivals…) pour le bloc « À venir » de leur fiche
  const { data: structures = [] } = useQuery({
    queryKey: ["admin-structures"],
    queryFn: async () => {
      const { data } = await supabase.from("podcasts").select("id, nom_podcast").eq("type_profil", "structure_eco").order("nom_podcast");
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: inscriptionsCounts } = useQuery({
    queryKey: ["inscriptions-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenement_inscriptions")
        .select("evenement_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.evenement_id] = (counts[r.evenement_id] || 0) + 1;
      });
      return counts;
    },
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: EventForm) => {
      const payload = {
        // Émojis retirés à l'enregistrement
        titre: sansEmojis(values.titre),
        sous_titre: sansEmojis(values.sous_titre) || null,
        description: sansEmojis(values.description) || null,
        date_debut: new Date(values.date_debut).toISOString(),
        date_fin: values.date_fin ? new Date(values.date_fin).toISOString() : null,
        lieu: values.lieu || null,
        adresse: values.adresse || null,
        type: values.type,
        lien_externe: values.lien_externe || null,
        statut: values.publie ? "publie" : values.statut === "refuse" ? "refuse" : "en_relecture",
        format: values.format,
        lien_connexion: values.lien_connexion || null,
        tarif: values.tarif || null,
        image_url: values.image_url || null,
        places: values.places ? parseInt(values.places) : null,
        inscription_activee: values.inscription_activee,
        structure_id: values.structure_id || null,
        podcasts_invites: (values.podcasts_invites || []).filter(
          (p) => p && (p.nom_podcast || p.host || p.vignette_url)
        ) as any,
        faq: (lireFaq(values.faq).length ? lireFaq(values.faq) : null) as any,
      };
      if (editingId) {
        const { error } = await supabase.from("evenements").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("evenements").insert(payload);
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

  // Publier, refuser ou remettre en relecture : réservé aux admins (règle appliquée par le serveur)
  const setStatut = useMutation({
    mutationFn: async ({ id, statut, motif }: { id: string; statut: "publie" | "refuse" | "en_relecture"; motif?: string | null }) => {
      const { error } = await supabase.from("evenements").update({ statut, motif_refus: statut === "refuse" ? motif || null : null }).eq("id", id);
      if (error) throw error;
      // Publier l'événement valide aussi son visuel envoyé sans connexion
      if (statut === "publie") await traiterImages({ evenement_id: id, action: "valider" }).catch(() => null);
      // Proposition d'un membre publiée ou refusée : il est prévenu par e-mail
      if (statut === "publie" || statut === "refuse") {
        await supabase.functions.invoke("notifier-membre", { body: { type: "proposition", id } }).catch(() => null);
      }
    },
    onSuccess: (_, { statut }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-evenements"] });
      queryClient.invalidateQueries({ queryKey: ["admin-a-traiter"] });
      toast.success(statut === "publie" ? "Événement publié" : statut === "refuse" ? "Proposition refusée" : "Événement remis en relecture");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });
  const refuser = (id: string) => {
    const motif = window.prompt("Motif du refus (facultatif, visible par le membre) :");
    if (motif === null) return;
    setStatut.mutate({ id, statut: "refuse", motif: motif.trim().slice(0, 500) || null });
  };

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

  const enRelecture = (evenements || []).filter((e: any) => e.statut === "en_relecture");
  const maintenant = Date.now();
  const passe = (e: any) => new Date(e.date_fin || e.date_debut).getTime() < maintenant;
  const aVenir = (evenements || []).filter((e: any) => e.statut !== "en_relecture" && !passe(e)).reverse();
  const archives = (evenements || []).filter((e: any) => e.statut !== "en_relecture" && passe(e));
  const avecInscrits = (evenements || []).filter((e: any) => e.inscription_activee || (inscriptionsCounts?.[e.id] ?? 0) > 0);
  const onglets = [
    { id: "relecture", label: "En relecture", compte: enRelecture.length },
    { id: "a-venir", label: `À venir (${aVenir.length})` },
    { id: "archives", label: `Archives (${archives.length})` },
    { id: "inscriptions", label: "Inscriptions" },
  ];
  const [onglet, setOnglet] = useOnglet(onglets);
  const listes: Record<string, any[]> = { relecture: enRelecture, "a-venir": aVenir, archives, inscriptions: avecInscrits };
  const vides: Record<string, string> = {
    relecture: "Aucune proposition en attente de relecture.",
    "a-venir": "Aucun événement à venir.",
    archives: "Aucun événement passé.",
    inscriptions: "Aucun événement avec inscriptions.",
  };

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };
  // Réponses du dernier événement qui en a, sinon réponses habituelles : reprises pour un nouvel événement
  const faqReprise: FaqItem[] = (() => {
    const dernier = (evenements || []).find((e: any) => lireFaq(e.faq).length);
    return dernier ? lireFaq((dernier as any).faq) : faqParDefaut();
  })();
  const nouveau = () => { setForm({ ...emptyForm, faq: faqReprise.map((f) => ({ ...f })) }); setEditingId(null); setShowForm(true); };

  const toLocalDatetime = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const startEdit = (evt: any) => {
    setForm({
      titre: evt.titre, sous_titre: evt.sous_titre || "",
      description: evt.description || "",
      date_debut: evt.date_debut ? toLocalDatetime(evt.date_debut) : "",
      date_fin: evt.date_fin ? toLocalDatetime(evt.date_fin) : "",
      lieu: evt.lieu || "", adresse: evt.adresse || "",
      type: evt.type || "rencontre", lien_externe: evt.lien_externe || "",
      publie: evt.statut === "publie", image_url: evt.image_url || "",
      places: evt.places ? String(evt.places) : "",
      inscription_activee: !!evt.inscription_activee,
      podcasts_invites: Array.isArray(evt.podcasts_invites) ? evt.podcasts_invites : [],
      structure_id: (evt as { structure_id?: string | null }).structure_id || "",
      format: evt.format || "sur_place", lien_connexion: evt.lien_connexion || "",
      tarif: evt.tarif || "", statut: evt.statut || "publie",
      faq: lireFaq(evt.faq),
    });
    setEditingId(evt.id);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Sélectionnez une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 Mo."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(fileName, file, { contentType: file.type });
    if (error) { toast.error("Erreur upload : " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image uploadée !");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.date_debut) { toast.error("Titre et date de début obligatoires"); return; }
    saveMutation.mutate(form);
  };

  const exportCSV = () => {
    if (!evenements?.length) return;
    const headers = ["Titre", "Sous-titre", "Date début", "Date fin", "Lieu", "Adresse", "Type", "Places", "Lien externe", "Statut", "Description"];
    const rows = evenements.map((e: any) => [
      e.titre, e.sous_titre || "",
      new Date(e.date_debut).toLocaleString("fr-FR"),
      e.date_fin ? new Date(e.date_fin).toLocaleString("fr-FR") : "",
      e.lieu || "", e.adresse || "", e.type, e.places ?? "", e.lien_externe || "",
      STATUT_LABEL[e.statut] || e.statut, e.description || "",
    ]);
    const csv = toCsv([headers, ...rows]);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `evenements_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Raccourci « Nouvel événement » depuis l'accueil de l'admin
  useEffect(() => {
    if (params.get("nouveau") === "1") {
      nouveau();
      const p = new URLSearchParams(params); p.delete("nouveau"); setParams(p, { replace: true });
    }
  }, [params, setParams]);

  return (
    <AdminLayout
      titre="Agenda"
      description={`${evenements?.length ?? 0} événement${(evenements?.length ?? 0) > 1 ? "s" : ""} · propositions des membres, publication, inscriptions`}
      actions={<>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!evenements?.length}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
        <Button size="sm" onClick={nouveau}>
          <Plus className="w-4 h-4 mr-2" /> Nouvel événement
        </Button>
      </>}
    >
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border-2 border-foreground p-6 mb-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-xl text-foreground">{editingId ? "Modifier" : "Nouvel événement"}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Titre *</label>
                <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Session d'écoute #3" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Sous-titre</label>
                <Input value={form.sous_titre} onChange={(e) => setForm({ ...form, sous_titre: e.target.value })} placeholder="Soirée spéciale podcasts narratifs" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>

              {/* Image upload */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Image de couverture</label>
                <div className="flex items-start gap-4">
                  {form.image_url ? (
                    <div className="relative">
                      <img src={form.image_url} alt="Couverture" className="w-40 h-24 rounded-xl object-cover border border-border" />
                      <button type="button" onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-40 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="pt-2">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Image className="w-4 h-4 mr-1.5" />}
                      {uploading ? "Envoi…" : form.image_url ? "Changer" : "Ajouter une image"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP. Max 5 Mo.</p>
                  </div>
                </div>
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
                    {EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Format</label>
                <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sur_place">Sur place</SelectItem>
                    <SelectItem value="en_ligne">En ligne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Lien de connexion (en ligne)</label>
                <Input value={form.lien_connexion} onChange={(e) => setForm({ ...form, lien_connexion: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Tarif</label>
                <Input value={form.tarif} onChange={(e) => setForm({ ...form, tarif: e.target.value })} placeholder="5 €, Prix libre…" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nombre de places</label>
                <Input type="number" min="0" value={form.places} onChange={(e) => setForm({ ...form, places: e.target.value })} placeholder="Illimité si vide" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Lien externe</label>
                <Input value={form.lien_externe} onChange={(e) => setForm({ ...form, lien_externe: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label htmlFor="evt-structure" className="text-sm font-medium text-foreground mb-1 block">Structure organisatrice</label>
                <select id="evt-structure" value={form.structure_id} onChange={(e) => setForm({ ...form, structure_id: e.target.value })} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm">
                  <option value="">Aucune</option>
                  {structures.map((s) => <option key={s.id} value={s.id}>{s.nom_podcast}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" checked={form.publie} onChange={(e) => setForm({ ...form, publie: e.target.checked })} className="rounded border-border" id="publie" />
                <label htmlFor="publie" className="text-sm text-foreground">Publié (visible sur le site)</label>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" checked={form.inscription_activee} onChange={(e) => setForm({ ...form, inscription_activee: e.target.checked })} className="rounded border-border" id="inscription_activee" />
                <label htmlFor="inscription_activee" className="text-sm text-foreground">Activer le formulaire d'inscription sur la page de l'événement</label>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-border">
                <PodcastsInvitesEditor
                  value={form.podcasts_invites}
                  onChange={(next) => setForm({ ...form, podcasts_invites: next })}
                />
              </div>

              <div className="md:col-span-2 pt-2 border-t border-border">
                <FaqEvenementEditor value={form.faq} onChange={(faq) => setForm({ ...form, faq })} reprise={faqReprise} />
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

        <AdminOnglets label="Événements" onglets={onglets} courant={onglet} onChange={setOnglet} />
        <Panneau id={onglet}>
        {onglet === "inscriptions" && <p className="text-sm text-muted-foreground mb-4">Les « Je viens » de chaque événement : cliquez sur le nombre pour voir la liste et l'exporter.</p>}
        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !listes[onglet].length ? (
          <div className="text-center py-16 border-2 border-dashed border-border">
            <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
            <p className="text-muted-foreground">{vides[onglet]}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listes[onglet].map((evt: any) => (
              <div key={evt.id} className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-card border border-border p-4">
                {evt.image_url ? (
                  <img src={evt.image_url} alt="" className="shrink-0 w-16 h-16 object-cover" />
                ) : (
                  <div className="shrink-0 w-16 h-16 bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-primary leading-none">{new Date(evt.date_debut).getDate()}</span>
                    <span className="text-[10px] uppercase text-primary/70">{new Date(evt.date_debut).toLocaleDateString("fr-FR", { month: "short" })}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{evt.titre}</p>
                    <Badge variant="outline" className="text-xs">{STATUT_LABEL[evt.statut] || evt.statut}</Badge>
                    {evt.origine === "membre" && <Badge variant="outline" className="text-xs">Proposé par {evt.propose_par_nom ? formatName(evt.propose_par_nom) : "un membre"}</Badge>}
                  </div>
                  {evt.sous_titre && <p className="text-xs text-muted-foreground">{evt.sous_titre}</p>}
                  <p className="text-xs text-muted-foreground">
                    {evt.lieu && `${evt.lieu} · `}{new Date(evt.date_debut).toLocaleDateString("fr-FR")}
                    {evt.places && ` · ${evt.places} places`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0 items-center">
                  {((inscriptionsCounts?.[evt.id] ?? 0) > 0 || onglet === "inscriptions") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => setInscriptionsOpen({ id: evt.id, titre: evt.titre })}
                    >
                      <Users className="w-3.5 h-3.5" />
                      {inscriptionsCounts?.[evt.id] ?? 0} vien{(inscriptionsCounts?.[evt.id] ?? 0) > 1 ? "nent" : "t"}
                    </Button>
                  )}
                  {evt.statut === "publie" ? (
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setStatut.mutate({ id: evt.id, statut: "en_relecture" })}>
                      <EyeOff className="w-3.5 h-3.5" /> Dépublier
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" className="text-xs gap-1" onClick={() => setStatut.mutate({ id: evt.id, statut: "publie" })}>
                        <Eye className="w-3.5 h-3.5" /> Publier
                      </Button>
                      {evt.statut === "en_relecture" && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => refuser(evt.id)}>Refuser</Button>
                      )}
                    </>
                  )}
                  <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => { startEdit(evt); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => { if (confirm("Supprimer cet événement ?")) deleteMutation.mutate(evt.id); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        </Panneau>

      <EvenementInscriptionsDialog
        evenementId={inscriptionsOpen?.id ?? null}
        evenementTitre={inscriptionsOpen?.titre}
        open={!!inscriptionsOpen}
        onClose={() => setInscriptionsOpen(null)}
      />
    </AdminLayout>
  );
};

export default AdminEvenements;
