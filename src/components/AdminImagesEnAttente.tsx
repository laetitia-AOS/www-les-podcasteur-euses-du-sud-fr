import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

type Pending = { id: string; email: string; bucket_cible: string; chemin: string; created_at: string };

const LIEUX: Record<string, string> = {
  "podcast-thumbnails": "Photo ou pochette",
  "studio-galleries": "Galerie",
  "event-images": "Visuel d'événement",
};

/** Appelle la fonction de validation (admin seulement, vérifié côté serveur). */
export const traiterImages = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("valider-images", { body });
  if (error) throw error;
  return data as { traitees: number };
};

/**
 * Images envoyées sans connexion : invisibles sur le site tant qu'elles ne sont pas validées ici
 * (ou automatiquement quand la fiche ou l'événement qui les utilise est validé).
 */
const AdminImagesEnAttente = () => {
  const queryClient = useQueryClient();
  const { data: images = [] } = useQuery({
    queryKey: ["images-en-attente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("images_en_attente")
        .select("id, email, bucket_cible, chemin, created_at")
        .eq("statut", "en_attente")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      const rows = (data || []) as Pending[];
      if (!rows.length) return [];
      const { data: signed } = await supabase.storage
        .from("images-en-attente")
        .createSignedUrls(rows.map((r) => `${r.bucket_cible}/${r.chemin}`), 600);
      return rows.map((r, i) => ({ ...r, apercu: signed?.[i]?.signedUrl ?? "" }));
    },
  });

  const traiter = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "valider" | "refuser" }) => traiterImages({ ids: [id], action }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["images-en-attente"] });
      toast.success(action === "valider" ? "Image validée : elle s'affiche sur le site." : "Image refusée et supprimée.");
    },
    onError: () => toast.error("L'opération n'a pas abouti."),
  });

  if (!images.length) return null;

  return (
    <section className="mb-8 rounded-lg border border-border bg-card p-4" aria-labelledby="images-attente-title">
      <h2 id="images-attente-title" className="font-display font-bold text-lg text-foreground">
        Images en attente de validation ({images.length})
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Envoyées sans connexion, elles restent invisibles sur le site tant que vous ne les validez pas.
      </p>
      <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.map((img) => (
          <li key={img.id} className="border border-border rounded-md overflow-hidden">
            {img.apercu ? (
              <img src={img.apercu} alt={`Image envoyée par ${img.email}`} className="w-full aspect-square object-cover bg-muted" />
            ) : (
              <div className="w-full aspect-square bg-muted" />
            )}
            <div className="p-2 text-xs">
              <p className="font-medium">{LIEUX[img.bucket_cible] ?? img.bucket_cible}</p>
              <p className="text-muted-foreground truncate" title={img.email}>{img.email}</p>
              <div className="mt-2 flex gap-1">
                <Button size="sm" className="flex-1" disabled={traiter.isPending} onClick={() => traiter.mutate({ id: img.id, action: "valider" })} aria-label={`Valider l'image de ${img.email}`}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1" disabled={traiter.isPending} onClick={() => traiter.mutate({ id: img.id, action: "refuser" })} aria-label={`Refuser l'image de ${img.email}`}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AdminImagesEnAttente;
