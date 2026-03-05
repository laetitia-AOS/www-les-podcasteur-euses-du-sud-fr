import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LogOut, Save, Loader2, Image, X, ArrowLeft, Mic, Users } from "lucide-react";
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
  metier_principal: string | null;
  services_3: string[] | null;
  disponibilite: string | null;
  valide: boolean;
}

const MonEspace = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        .select("id, nom_podcast, lien_ecoute, description, thematique, vignette_url, prenom, nom, telephone, email, ville, type_podcast, type_profil, bio_750, lien_principal, metier_principal, services_3, disponibilite, valide")
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
          toast.error("L'image doit être au format carré (ratio 1:1). Recadrez-la avant de l'envoyer.");
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
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    const isSquare = await validateSquareImage(file);
    if (!isSquare) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("podcast-thumbnails")
      .upload(fileName, file, { contentType: file.type });
    if (error) {
      toast.error("Erreur lors de l'envoi de l'image.");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("podcast-thumbnails")
      .getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, vignette_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image mise à jour !");
  };

  const handleSave = async () => {
    const current = podcasts[activeTab];
    if (!current) return;
    setSaving(true);
    const { error } = await supabase
      .from("podcasts")
      .update({
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
        metier_principal: form.metier_principal,
        disponibilite: form.disponibilite,
      })
      .eq("id", current.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
      console.error(error);
      return;
    }
    const updated = podcasts.map((p, i) => i === activeTab ? { ...p, ...form } as PodcastData : p);
    setPodcasts(updated);
    toast.success("Fiche mise à jour avec succès !");
  };

  const switchTab = (idx: number) => {
    setActiveTab(idx);
    setForm(podcasts[idx]);
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
            Aucune fiche n'est associée à l'adresse <span className="font-medium text-foreground">{userEmail}</span>.
          </p>
          <p className="text-muted-foreground text-sm">
            Vous devez d'abord remplir le formulaire de référencement.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/formulaire">
              <Button className="w-full">Remplir le formulaire</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>Se déconnecter</Button>
          </div>
        </div>
      </div>
    );
  }

  const current = podcasts[activeTab];
  const isPodcasteur = current?.type_profil === "podcasteur";
  const isPro = current?.type_profil === "pro_podcast";

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all";
  const labelClass = "block text-sm font-medium text-foreground mb-2";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <LogOut className="w-4 h-4 mr-1.5" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl space-y-8">
        {/* Tabs if multiple fiches */}
        {podcasts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {podcasts.map((p, i) => (
              <button
                key={p.id}
                onClick={() => switchTab(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  i === activeTab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.type_profil === "podcasteur" ? <Mic className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {p.type_profil === "podcasteur" ? p.nom_podcast : `Profil ${p.type_profil}`}
              </button>
            ))}
          </div>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
            current.valide
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${current.valide ? "bg-primary" : "bg-muted-foreground"}`} />
            {current.valide ? "Visible sur le site" : "En attente de validation"}
          </span>
        </div>

        {/* Vignette (photo) */}
        <div className="space-y-3">
          <label className={labelClass}>
            {isPodcasteur ? "Vignette du podcast" : "Photo de profil"}
            <span className="text-primary ml-1">*</span>
          </label>
          <p className="text-xs text-muted-foreground -mt-2">Format carré obligatoire (1:1). JPG, PNG ou WebP. Max 5 Mo.</p>
          <div className="flex items-start gap-4">
            {form.vignette_url ? (
              <div className="relative">
                <img
                  src={form.vignette_url}
                  alt="Photo"
                  className="w-24 h-24 rounded-xl object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, vignette_url: null }))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                <Image className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleVignetteUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Image className="w-4 h-4 mr-1.5" />}
                {uploading ? "Envoi…" : "Changer l'image"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Format carré (1:1) obligatoire</p>
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-xl text-foreground">Vos coordonnées</h2>
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
              <label className={labelClass}>Bio / présentation</label>
              <Textarea 
                name="bio_750" 
                value={form.bio_750 || ""} 
                onChange={(e) => { if (e.target.value.length <= 750) handleChange(e); }}
                rows={4} 
                className="rounded-xl border-border bg-card" 
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{(form.bio_750 || "").length}/750</p>
            </div>
            <div>
              <label className={labelClass}>Lien principal</label>
              <input name="lien_principal" value={form.lien_principal || ""} onChange={handleChange} className={inputClass} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Podcast info (podcasteur only) */}
        {isPodcasteur && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-xl text-foreground">Informations du podcast</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nom du podcast</label>
                <input name="nom_podcast" value={form.nom_podcast || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Lien d'écoute</label>
                <input name="lien_ecoute" value={form.lien_ecoute || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <Textarea name="description" value={form.description || ""} onChange={handleChange} rows={4} className="rounded-xl border-border bg-card" />
              </div>
              <div>
                <label className={labelClass}>Thématique</label>
                <input name="thematique" value={form.thematique || ""} onChange={handleChange} className={inputClass} />
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
                <input name="metier_principal" value={form.metier_principal || ""} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Disponibilité</label>
                <input name="disponibilite" value={form.disponibilite || ""} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Sauvegarde…" : "Enregistrer les modifications"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MonEspace;
