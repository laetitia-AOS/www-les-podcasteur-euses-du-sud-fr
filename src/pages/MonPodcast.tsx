import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LogOut, Save, Loader2, Image, X, ArrowLeft, Mic, Users, Trash2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface PodcastData {
  id: string;
  nom_podcast: string;
  lien_ecoute: string;
  description: string;
  thematique: string | null;
  vignette_url: string | null;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  email: string;
  ville: string | null;
  type_podcast: string | null;
  type_profil: string;
  bio_750: string | null;
  lien_principal: string | null;
  lien_linkedin: string | null;
  metier_principal: string | null;
  services_3: string[] | null;
  disponibilite: string | null;
  valide: boolean;
  niveau_avancement: string | null;
  frequence_publication: string | null;
  monetise: string | null;
  department_code: string | null;
  city_name: string | null;
}

const thematiques = [
  "Conversations & société", "Business & parcours de vie", "Culture, création & récits",
  "Sport & dépassement", "Santé, mental & équilibre", "Transmission & éducation",
  "Tech, médias & nouveaux usages", "Territoires, initiatives & regards", "Autre",
];

const MonEspace = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [podcasts, setPodcasts] = useState<PodcastData[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState<Partial<PodcastData>>({});
  const [userEmail, setUserEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/espace-membre");
        return;
      }
      setUserEmail(session.user.email || "");
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, nom_podcast, lien_ecoute, description, thematique, vignette_url, prenom, nom, telephone, email, ville, type_podcast, type_profil, bio_750, lien_principal, lien_linkedin, metier_principal, services_3, disponibilite, valide, niveau_avancement, frequence_publication, monetise, department_code, city_name")
        .eq("email", session.user.email!)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Erreur lors du chargement de vos fiches.");
      }
      if (data && data.length > 0) {
        setPodcasts(data as PodcastData[]);
        setForm(data[0] as PodcastData);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/espace-membre");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateSquareImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        URL.revokeObjectURL(img.src);
        if (ratio < 0.9 || ratio > 1.1) {
          toast.error("L'image doit être au format carré (ratio 1:1).");
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleVignetteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Sélectionnez une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 Mo."); return; }
    const isSquare = await validateSquareImage(file);
    if (!isSquare) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("podcast-thumbnails").upload(fileName, file, { contentType: file.type });
    if (error) { toast.error("Erreur upload."); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("podcast-thumbnails").getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, vignette_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image mise à jour !");
  };

  const handleSave = async () => {
    const current = podcasts[activeTab];
    if (!current) return;
    setSaving(true);

    const updateData: Record<string, unknown> = {
      nom_podcast: form.nom_podcast,
      lien_ecoute: form.lien_ecoute,
      description: form.description,
      thematique: form.thematique,
      vignette_url: form.vignette_url,
      prenom: form.prenom,
      nom: form.nom,
      telephone: form.telephone,
      bio_750: form.bio_750,
      lien_principal: form.lien_principal,
      lien_linkedin: (form as any).lien_linkedin,
      metier_principal: form.metier_principal,
      disponibilite: form.disponibilite,
      type_podcast: form.type_podcast,
      niveau_avancement: form.niveau_avancement,
      frequence_publication: form.frequence_publication,
      monetise: form.monetise,
      services_3: form.services_3,
    };

    const { error } = await supabase
      .from("podcasts")
      .update(updateData)
      .eq("id", current.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
      console.error(error);
      return;
    }
    const updated = podcasts.map((p, i) => i === activeTab ? { ...p, ...form } as PodcastData : p);
    setPodcasts(updated);
    toast.success("Fiche mise à jour !");
  };

  const handleDelete = async () => {
    const current = podcasts[activeTab];
    if (!current) return;
    setDeleting(true);
    const { error } = await supabase.from("podcasts").delete().eq("id", current.id);
    setDeleting(false);
    if (error) {
      toast.error("Erreur lors de la suppression.");
      console.error(error);
      return;
    }
    const remaining = podcasts.filter((_, i) => i !== activeTab);
    setPodcasts(remaining);
    setActiveTab(0);
    if (remaining.length > 0) {
      setForm(remaining[0]);
    }
    setShowDeleteConfirm(false);
    toast.success("Fiche supprimée.");
  };

  const switchTab = (idx: number) => {
    setActiveTab(idx);
    setForm(podcasts[idx]);
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (podcasts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="font-serif text-2xl text-foreground">Aucune fiche trouvée</h1>
          <p className="text-muted-foreground text-sm">
            Aucune fiche n'est associée à <span className="font-medium text-foreground">{userEmail}</span>.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/formulaire"><Button className="w-full">Remplir le formulaire</Button></Link>
            <Button variant="outline" onClick={handleLogout}>Se déconnecter</Button>
          </div>
        </div>
      </div>
    );
  }

  const current = podcasts[activeTab];
  const isPodcasteur = current?.type_profil === "podcasteur";
  const isPro = current?.type_profil === "pro_podcast";

  const inputClass = "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all";
  const selectClass = "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all appearance-none";
  const labelClass = "block text-sm font-medium text-foreground mb-2";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-serif text-lg text-foreground">Espace membre</h1>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1.5" /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl space-y-8">
        {/* Tabs */}
        {podcasts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {podcasts.map((p, i) => (
              <button key={p.id} onClick={() => switchTab(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  i === activeTab ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}>
                {p.type_profil === "podcasteur" ? <Mic className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {p.type_profil === "podcasteur" ? p.nom_podcast : p.type_profil === "pro_podcast" ? "Profil Pro" : "Profil Soutien"}
              </button>
            ))}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
            current.valide ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${current.valide ? "bg-primary" : "bg-muted-foreground"}`} />
            {current.valide ? "Visible sur le site" : "En attente de validation"}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {current.type_profil === "podcasteur" ? "Podcasteur·euse" : current.type_profil === "pro_podcast" ? "Professionnel·le" : "Soutien"}
          </span>
        </div>

        {/* Photo */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="font-serif text-xl text-foreground">
            {isPodcasteur ? "Vignette du podcast" : "Photo de profil"}
          </h2>
          <p className="text-xs text-muted-foreground">Format carré (1:1). JPG, PNG ou WebP. Max 5 Mo.</p>
          <div className="flex items-start gap-4">
            {form.vignette_url ? (
              <div className="relative">
                <img src={form.vignette_url} alt="Photo" className="w-28 h-28 rounded-xl object-cover border border-border" />
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, vignette_url: null }))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                <Image className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="pt-2">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleVignetteUpload} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Image className="w-4 h-4 mr-1.5" />}
                {uploading ? "Envoi…" : "Changer l'image"}
              </Button>
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-xl text-foreground">Coordonnées</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom</label>
                <input name="prenom" value={form.prenom || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input name="nom" value={form.nom || ""} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input name="telephone" value={form.telephone || ""} onChange={handleChange} className={inputClass} placeholder="06 00 00 00 00" />
            </div>
          </div>
        </div>

        {/* Présentation */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-xl text-foreground">Présentation</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Bio (max 750 caractères)</label>
              <Textarea name="bio_750" value={form.bio_750 || ""}
                onChange={(e) => { if (e.target.value.length <= 750) handleChange(e); }}
                rows={5} className="rounded-xl border-border bg-card" />
              <p className="text-xs text-muted-foreground mt-1 text-right">{(form.bio_750 || "").length}/750</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>LinkedIn / réseau social</label>
                <input name="lien_linkedin" value={(form as any).lien_linkedin || ""} onChange={handleChange} className={inputClass} placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <label className={labelClass}>Site internet / portfolio</label>
                <input name="lien_principal" value={form.lien_principal || ""} onChange={handleChange} className={inputClass} placeholder="https://..." />
              </div>
            </div>
          </div>
        </div>

        {/* Podcast (podcasteur) */}
        {isPodcasteur && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-xl text-foreground">Mon podcast</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nom du podcast</label>
                <input name="nom_podcast" value={form.nom_podcast || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Lien d'écoute principal</label>
                <input name="lien_ecoute" value={form.lien_ecoute || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description courte</label>
                <Textarea name="description" value={form.description || ""} onChange={handleChange} rows={3} className="rounded-xl border-border bg-card" />
              </div>
              <div>
                <label className={labelClass}>Thématique</label>
                <select name="thematique" value={form.thematique || ""} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  {thematiques.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Type de podcast</label>
                <select name="type_podcast" value={form.type_podcast || ""} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  <option value="Indépendant">Indépendant</option>
                  <option value="Média">Média</option>
                  <option value="Marque / Entreprise">Marque / Entreprise</option>
                  <option value="Éducatif / Académique">Éducatif / Académique</option>
                  <option value="Narratif / Créatif">Narratif / Créatif</option>
                  <option value="Expert / Personal brand">Expert / Personal brand</option>
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Niveau d'avancement</label>
                  <select name="niveau_avancement" value={form.niveau_avancement || ""} onChange={handleChange} className={selectClass}>
                    <option value="">Sélectionner</option>
                    <option value="lancement">Lancement (0–10 épisodes)</option>
                    <option value="croissance">En croissance (10–50)</option>
                    <option value="installe">Installé (50+)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Fréquence</label>
                  <select name="frequence_publication" value={form.frequence_publication || ""} onChange={handleChange} className={selectClass}>
                    <option value="">Sélectionner</option>
                    <option value="hebdomadaire">Hebdomadaire</option>
                    <option value="bimensuel">Deux fois par mois</option>
                    <option value="mensuel">Mensuel</option>
                    <option value="irregulier">Irrégulier</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Monétisé ?</label>
                <select name="monetise" value={form.monetise || ""} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                  <option value="En cours">En cours / expérimentation</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Pro info */}
        {isPro && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-xl text-foreground">Informations professionnelles</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Métier principal</label>
                <select name="metier_principal" value={form.metier_principal || ""} onChange={handleChange} className={selectClass}>
                  <option value="">Sélectionner</option>
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
              <div>
                <label className={labelClass}>Services proposés (séparés par des virgules)</label>
                <input
                  name="services_3"
                  value={Array.isArray(form.services_3) ? form.services_3.join(", ") : form.services_3 || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, services_3: e.target.value.split(",").map(s => s.trim()).filter(Boolean).slice(0, 3) }))}
                  className={inputClass}
                  placeholder="Ex : Montage, Mixage, Sound design"
                />
              </div>
              <div>
                <label className={labelClass}>Disponibilité</label>
                <input name="disponibilite" value={form.disponibilite || ""} onChange={handleChange} className={inputClass} placeholder="Ex : Ouvert aux missions / collabs" />
              </div>
            </div>
          </div>
        )}

        {/* Localisation (read-only info) */}
        {(current.city_name || current.department_code) && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-3">
            <h2 className="font-serif text-xl text-foreground">Localisation</h2>
            <p className="text-sm text-muted-foreground">
              {current.city_name}{current.department_code ? ` (${current.department_code})` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Pour modifier votre localisation, contactez-nous via la page <Link to="/contact" className="text-primary hover:underline">Contact</Link>.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Supprimer cette fiche
          </Button>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Sauvegarde…" : "Enregistrer les modifications"}
          </Button>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg text-destructive">Confirmer la suppression</h3>
            <p className="text-sm text-muted-foreground">
              Cette action est irréversible. Votre fiche sera définitivement supprimée du site et de l'annuaire.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                {deleting ? "Suppression…" : "Confirmer la suppression"}
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MonEspace;
