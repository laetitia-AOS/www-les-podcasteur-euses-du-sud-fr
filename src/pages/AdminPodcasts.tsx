import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { BookOpen, ArrowLeft, LogOut, Loader2, Download, Eye, ExternalLink, Trash2, Pencil, Save, X } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const thematiques = [
  "Conversations & société", "Business & parcours de vie", "Culture, création & récits",
  "Sport & dépassement", "Santé, mental & équilibre", "Transmission & éducation",
  "Tech, médias & nouveaux usages", "Territoires, initiatives & regards", "Autre",
];

const AdminPodcasts = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdminAuth();
  const queryClient = useQueryClient();
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);
  const [editingPodcast, setEditingPodcast] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ["admin-podcasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const toggleValide = useMutation({
    mutationFn: async ({ id, valide }: { id: string; valide: boolean }) => {
      const { error } = await supabase.from("podcasts").update({ valide }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { valide }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-podcasts"] });
      toast.success(valide ? "Fiche activée dans le flux" : "Fiche retirée du flux");
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "Erreur inconnue")),
  });

  const deletePodcast = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("podcasts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-podcasts"] });
      toast.success("Fiche supprimée");
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "Erreur inconnue")),
  });

  const updatePodcast = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("podcasts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-podcasts"] });
      toast.success("Fiche modifiée");
      setEditingPodcast(null);
    },
    onError: (err: any) => toast.error("Erreur : " + (err.message || "Erreur inconnue")),
  });

  const startEdit = (p: any) => {
    setEditingPodcast(p);
    setEditForm({
      nom_podcast: p.nom_podcast || "",
      prenom: p.prenom || "",
      nom: p.nom || "",
      email: p.email || "",
      telephone: p.telephone || "",
      description: p.description || "",
      thematique: p.thematique || "",
      type_podcast: p.type_podcast || "",
      bio_750: p.bio_750 || "",
      lien_ecoute: p.lien_ecoute || "",
      lien_principal: p.lien_principal || "",
      metier_principal: p.metier_principal || "",
      services_3: Array.isArray(p.services_3) ? p.services_3.join(", ") : "",
      disponibilite: p.disponibilite || "",
      niveau_avancement: p.niveau_avancement || "",
      frequence_publication: p.frequence_publication || "",
      monetise: p.monetise || "",
      structure: p.structure || "",
    });
    setSelectedPodcast(null);
  };

  const handleSaveEdit = () => {
    if (!editingPodcast) return;
    const services3Array = editForm.services_3 ? editForm.services_3.split(",").map((s: string) => s.trim()).filter(Boolean) : null;
    updatePodcast.mutate({
      id: editingPodcast.id,
      data: {
        nom_podcast: editForm.nom_podcast,
        prenom: editForm.prenom || null,
        nom: editForm.nom || null,
        email: editForm.email,
        telephone: editForm.telephone || null,
        description: editForm.description,
        thematique: editForm.thematique || null,
        type_podcast: editForm.type_podcast || null,
        bio_750: editForm.bio_750 || null,
        lien_ecoute: editForm.lien_ecoute,
        lien_principal: editForm.lien_principal || null,
        metier_principal: editForm.metier_principal || null,
        services_3: services3Array,
        disponibilite: editForm.disponibilite || null,
        niveau_avancement: editForm.niveau_avancement || null,
        frequence_publication: editForm.frequence_publication || null,
        monetise: editForm.monetise || null,
        structure: editForm.structure || null,
      },
    });
  };

  const exportCSV = () => {
    if (!podcasts?.length) return;
    const headers = [
      "Date", "Type profil", "Nom podcast", "Prénom", "Nom", "Email", "Téléphone",
      "Thématique", "Type", "Ville", "Département", "Lien écoute",
      "Fréquence", "Niveau", "Priorité", "Besoins", "Monétisé",
      "Bio", "Lien principal", "Métier principal", "Services", "Disponibilité",
      "Score fiche", "Score dynamique", "Score opportunité", "Score global", "Segment",
      "Consent contact", "Consent mise en relation", "Validé",
    ];
    const rows = podcasts.map((p) => [
      new Date(p.created_at).toLocaleDateString("fr-FR"),
      p.type_profil, p.nom_podcast, p.prenom || "", p.nom || "", p.email, p.telephone || "",
      p.thematique || "", p.type_podcast || "", p.city_name || p.ville || "",
      p.department_label || "", p.lien_ecoute, p.frequence_publication || "",
      p.niveau_avancement || "", p.priorite_actuelle || "",
      (p.besoins_podcast || []).join(", "), p.monetise || "",
      p.bio_750 || "", p.lien_principal || "", p.metier_principal || "",
      (p.services_3 || []).join(", "), p.disponibilite || "",
      p.score_fiche, p.score_dynamique, p.score_opportunite, p.score_global, p.segment_pds,
      p.consent_contact ? "Oui" : "Non", p.consent_mise_en_relation ? "Oui" : "Non",
      p.valide ? "Oui" : "Non",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `annuaire_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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

  const validCount = podcasts?.filter((p) => p.valide).length ?? 0;
  const totalCount = podcasts?.length ?? 0;

  const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground";
  const selectClass = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground appearance-none";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-3xl text-foreground flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-primary" />
                Annuaire
              </h1>
              <p className="text-muted-foreground">
                {totalCount} fiche{totalCount > 1 ? "s" : ""} · {validCount} visible{validCount > 1 ? "s" : ""} dans le flux
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!podcasts?.length}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" /> Déconnexion
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !podcasts?.length ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune fiche enregistrée.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">Visible</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead>Nom / Podcast</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Thématique</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="w-[120px] sticky right-0 bg-background z-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {podcasts.map((p) => (
                  <TableRow key={p.id} className={!p.valide ? "opacity-60" : ""}>
                    <TableCell>
                      <Switch
                        checked={p.valide}
                        onCheckedChange={(checked) => toggleValide.mutate({ id: p.id, valide: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {p.type_profil === "podcasteur" ? "Podcasteur·euse" : p.type_profil === "pro_podcast" ? "Pro" : "Soutien"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.vignette_url && (
                          <img src={p.vignette_url} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{p.nom_podcast}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p>{p.prenom} {p.nom}</p>
                      <a href={`mailto:${p.email}`} className="text-primary text-xs hover:underline">{p.email}</a>
                    </TableCell>
                    <TableCell className="text-sm">{p.city_name || p.ville || "—"}</TableCell>
                    <TableCell className="text-sm">{p.thematique || "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{p.score_global}/100</TableCell>
                    <TableCell>
                      <Badge
                        variant={p.segment_pds === "Ambassadeur potentiel" ? "default" : p.segment_pds === "Actif engagé" ? "secondary" : "outline"}
                        className="text-xs whitespace-nowrap"
                      >
                        {p.segment_pds}
                      </Badge>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-background z-10">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedPodcast(p)} title="Voir le détail">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Modifier">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm(`Supprimer la fiche "${p.nom_podcast}" ? Cette action est irréversible.`)) {
                              deletePodcast.mutate(p.id);
                            }
                          }}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPodcast} onOpenChange={() => setSelectedPodcast(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPodcast && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedPodcast.vignette_url && (
                    <img src={selectedPodcast.vignette_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  {selectedPodcast.nom_podcast}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <DetailRow label="Type de profil" value={
                  selectedPodcast.type_profil === "podcasteur" ? "Podcasteur·euse" :
                  selectedPodcast.type_profil === "pro_podcast" ? "Professionnel·le" : "Soutien"
                } />
                <DetailRow label="Prénom" value={selectedPodcast.prenom} />
                <DetailRow label="Nom" value={selectedPodcast.nom} />
                <DetailRow label="Email" value={selectedPodcast.email} />
                <DetailRow label="Téléphone" value={selectedPodcast.telephone} />
                <DetailRow label="Structure" value={selectedPodcast.structure} />
                <DetailRow label="Ville" value={selectedPodcast.city_name || selectedPodcast.ville} />
                <DetailRow label="Département" value={selectedPodcast.department_label} />
                <DetailRow label="Code postal" value={selectedPodcast.city_postcode} />
                <DetailRow label="Thématique" value={selectedPodcast.thematique} />
                <DetailRow label="Type" value={selectedPodcast.type_podcast} />
                <DetailRow label="Fréquence" value={selectedPodcast.frequence_publication} />
                <DetailRow label="Niveau" value={selectedPodcast.niveau_avancement} />
                <DetailRow label="Monétisé" value={selectedPodcast.monetise} />
                <DetailRow label="Priorité" value={selectedPodcast.priorite_actuelle} />
                <DetailRow label="Métier principal" value={selectedPodcast.metier_principal} />
                <DetailRow label="Disponibilité" value={selectedPodcast.disponibilite} />
                <div className="col-span-2">
                  <DetailRow label="Services proposés" value={selectedPodcast.services_3?.length ? selectedPodcast.services_3.join(", ") : null} />
                </div>
                <div className="col-span-2">
                  <DetailRow label="Besoins" value={
                    selectedPodcast.besoins_podcast?.length
                      ? selectedPodcast.besoins_podcast.map((b: string) => b.replace(/_/g, " ")).join(", ")
                      : null
                  } />
                </div>
                <div className="col-span-2"><DetailRow label="Bio" value={selectedPodcast.bio_750} /></div>
                <div className="col-span-2"><DetailRow label="Description" value={selectedPodcast.description} /></div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Lien d'écoute</p>
                  <a href={selectedPodcast.lien_ecoute} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    {selectedPodcast.lien_ecoute} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {selectedPodcast.lien_principal && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">Lien principal</p>
                    <a href={selectedPodcast.lien_principal} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      {selectedPodcast.lien_principal} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <DetailRow label="Score fiche" value={`${selectedPodcast.score_fiche}/10`} />
                <DetailRow label="Score dynamique" value={`${selectedPodcast.score_dynamique}/10`} />
                <DetailRow label="Score opportunité" value={`${selectedPodcast.score_opportunite}/10`} />
                <DetailRow label="Score global" value={`${selectedPodcast.score_global}/100`} />
                <DetailRow label="Segment" value={selectedPodcast.segment_pds} />
                <DetailRow label="Consent contact" value={selectedPodcast.consent_contact ? "Oui" : "Non"} />
                <DetailRow label="Consent mise en relation" value={selectedPodcast.consent_mise_en_relation ? "Oui" : "Non"} />
                <DetailRow label="Validé (visible)" value={selectedPodcast.valide ? "Oui" : "Non"} />
                <DetailRow label="Date inscription" value={new Date(selectedPodcast.created_at).toLocaleString("fr-FR")} />
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm" onClick={() => startEdit(selectedPodcast)}>
                  <Pencil className="w-4 h-4 mr-2" /> Modifier cette fiche
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPodcast} onOpenChange={() => setEditingPodcast(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {editingPodcast && (
            <>
              <DialogHeader>
                <DialogTitle>Modifier la fiche</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nom du podcast / Titre</label>
                  <input value={editForm.nom_podcast} onChange={(e) => setEditForm({ ...editForm, nom_podcast: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Prénom</label>
                  <input value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nom</label>
                  <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Téléphone</label>
                  <input value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Structure</label>
                  <input value={editForm.structure} onChange={(e) => setEditForm({ ...editForm, structure: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Thématique</label>
                  <select value={editForm.thematique} onChange={(e) => setEditForm({ ...editForm, thematique: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    {thematiques.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Type de podcast</label>
                  <select value={editForm.type_podcast} onChange={(e) => setEditForm({ ...editForm, type_podcast: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    <option value="Indépendant">Indépendant</option>
                    <option value="Média">Média</option>
                    <option value="Marque / Entreprise">Marque / Entreprise</option>
                    <option value="Éducatif / Académique">Éducatif / Académique</option>
                    <option value="Narratif / Créatif">Narratif / Créatif</option>
                    <option value="Expert / Personal brand">Expert / Personal brand</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Niveau d'avancement</label>
                  <select value={editForm.niveau_avancement} onChange={(e) => setEditForm({ ...editForm, niveau_avancement: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    <option value="lancement">Lancement</option>
                    <option value="croissance">En croissance</option>
                    <option value="installe">Installé</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Fréquence</label>
                  <select value={editForm.frequence_publication} onChange={(e) => setEditForm({ ...editForm, frequence_publication: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    <option value="hebdomadaire">Hebdomadaire</option>
                    <option value="bimensuel">Bimensuel</option>
                    <option value="mensuel">Mensuel</option>
                    <option value="irregulier">Irrégulier</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Monétisé</label>
                  <select value={editForm.monetise} onChange={(e) => setEditForm({ ...editForm, monetise: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                    <option value="En cours">En cours</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Métier principal</label>
                  <select value={editForm.metier_principal} onChange={(e) => setEditForm({ ...editForm, metier_principal: e.target.value })} className={selectClass}>
                    <option value="">—</option>
                    <option value="Studio / enregistrement">Studio / enregistrement</option>
                    <option value="Montage / mixage">Montage / mixage</option>
                    <option value="Réalisation / production">Réalisation / production</option>
                    <option value="Sound design / composition">Sound design / composition</option>
                    <option value="Voix off">Voix off</option>
                    <option value="Vidéo / teasers / motion">Vidéo / teasers / motion</option>
                    <option value="Identité sonore / branding">Identité sonore / branding</option>
                    <option value="Copywriting / éditorial">Copywriting / éditorial</option>
                    <option value="Diffusion / marketing / RP">Diffusion / marketing / RP</option>
                    <option value="Stratégie / monétisation">Stratégie / monétisation</option>
                    <option value="Formation / coaching">Formation / coaching</option>
                    <option value="Régie pub / partenariats">Régie pub / partenariats</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Services proposés (séparés par virgules)</label>
                  <input value={editForm.services_3} onChange={(e) => setEditForm({ ...editForm, services_3: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Disponibilité</label>
                  <input value={editForm.disponibilite} onChange={(e) => setEditForm({ ...editForm, disponibilite: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Lien d'écoute</label>
                  <input value={editForm.lien_ecoute} onChange={(e) => setEditForm({ ...editForm, lien_ecoute: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Lien principal (site / LinkedIn)</label>
                  <input value={editForm.lien_principal} onChange={(e) => setEditForm({ ...editForm, lien_principal: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Description courte</label>
                  <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Bio (max 750 caractères)</label>
                  <Textarea value={editForm.bio_750} onChange={(e) => { if (e.target.value.length <= 750) setEditForm({ ...editForm, bio_750: e.target.value }); }} rows={4} className="text-sm" />
                  <p className="text-xs text-muted-foreground text-right mt-1">{(editForm.bio_750 || "").length}/750</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setEditingPodcast(null)}>
                  <X className="w-4 h-4 mr-1" /> Annuler
                </Button>
                <Button onClick={handleSaveEdit} disabled={updatePodcast.isPending}>
                  {updatePodcast.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="font-medium">{value || "—"}</p>
  </div>
);

export default AdminPodcasts;
