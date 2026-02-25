import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AddAdhesionDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const { error } = await supabase.from("adhesions").insert({
      prenom: (form.get("prenom") as string) || null,
      nom: (form.get("nom") as string) || null,
      email: (form.get("email") as string) || null,
      telephone: (form.get("telephone") as string) || null,
      montant: form.get("montant") ? Number(form.get("montant")) : null,
      type_adhesion: (form.get("type_adhesion") as string) || "adhesion",
      statut: "active",
      date_adhesion: (form.get("date_adhesion") as string) || new Date().toISOString(),
    });

    setLoading(false);
    if (error) {
      toast.error("Erreur lors de l'ajout : " + error.message);
      return;
    }
    toast.success("Adhésion ajoutée !");
    queryClient.invalidateQueries({ queryKey: ["adhesions"] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" /> Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une adhésion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" name="prenom" required />
            </div>
            <div>
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" required />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <Input id="telephone" name="telephone" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="montant">Montant (€)</Label>
              <Input id="montant" name="montant" type="number" step="0.01" />
            </div>
            <div>
              <Label htmlFor="date_adhesion">Date d'adhésion</Label>
              <Input id="date_adhesion" name="date_adhesion" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div>
            <Label htmlFor="type_adhesion">Type</Label>
            <Input id="type_adhesion" name="type_adhesion" defaultValue="adhesion" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ajout…" : "Ajouter l'adhésion"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAdhesionDialog;
