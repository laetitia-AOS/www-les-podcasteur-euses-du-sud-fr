import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Loader2, Plus, Trash2, X, Mic2 } from "lucide-react";
import { toast } from "sonner";

export type PodcastInvite = {
  nom_podcast: string;
  host: string;
  vignette_url: string;
  lien_ecoute: string;
};

const emptyInvite: PodcastInvite = { nom_podcast: "", host: "", vignette_url: "", lien_ecoute: "" };

interface Props {
  value: PodcastInvite[];
  onChange: (value: PodcastInvite[]) => void;
  max?: number;
}

const PodcastsInvitesEditor = ({ value, onChange, max = 4 }: Props) => {
  const items = value || [];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const update = (index: number, patch: Partial<PodcastInvite>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(next);
  };

  const add = () => {
    if (items.length >= max) return;
    onChange([...items, { ...emptyInvite }]);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Sélectionnez une image."); return; }
    if (file.size > 3 * 1024 * 1024) { toast.error("Max 3 Mo."); return; }
    setUploadingIndex(index);
    const ext = file.name.split(".").pop();
    const fileName = `invite-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(fileName, file, { contentType: file.type });
    if (error) {
      toast.error("Erreur upload : " + error.message);
      setUploadingIndex(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(fileName);
    update(index, { vignette_url: urlData.publicUrl });
    setUploadingIndex(null);
    toast.success("Vignette ajoutée");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Podcasts à l'écoute</p>
          <p className="text-xs text-muted-foreground">Jusqu'à {max} podcasts mis en avant (vignette, host, nom du podcast)</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={items.length >= max}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Ajouter
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aucun podcast renseigné. Ajoutez jusqu'à {max} invité·es.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it, index) => (
            <div key={index} className="rounded-xl border border-border p-4 bg-background/50">
              <div className="flex items-start gap-4">
                {/* Vignette */}
                <div className="shrink-0">
                  {it.vignette_url ? (
                    <div className="relative">
                      <img src={it.vignette_url} alt="" className="w-20 h-20 rounded-lg object-cover border border-border" />
                      <button
                        type="button"
                        onClick={() => update(index, { vignette_url: "" })}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        aria-label="Supprimer la vignette"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                      <Mic2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <input
                    ref={(el) => (fileInputs.current[index] = el)}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleUpload(e, index)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-20 h-7 text-xs px-2"
                    onClick={() => fileInputs.current[index]?.click()}
                    disabled={uploadingIndex === index}
                  >
                    {uploadingIndex === index ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <><ImageIcon className="w-3 h-3 mr-1" />{it.vignette_url ? "Changer" : "Ajouter"}</>
                    )}
                  </Button>
                </div>

                {/* Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Nom du podcast</label>
                    <Input
                      value={it.nom_podcast}
                      onChange={(e) => update(index, { nom_podcast: e.target.value })}
                      placeholder="Mon super podcast"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Host·e</label>
                    <Input
                      value={it.host}
                      onChange={(e) => update(index, { host: e.target.value })}
                      placeholder="Prénom Nom"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-foreground mb-1 block">Lien d'écoute (optionnel)</label>
                    <Input
                      value={it.lien_ecoute}
                      onChange={(e) => update(index, { lien_ecoute: e.target.value })}
                      placeholder="https://…"
                    />
                  </div>
                </div>

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="Retirer ce podcast"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PodcastsInvitesEditor;
