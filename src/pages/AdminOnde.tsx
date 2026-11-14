import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Eye, Loader2, Pencil, Plus, Trash2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminOnglets, Panneau, useOnglet } from "@/components/admin/AdminOnglets";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btnPrimary, btnSecondary, fullName } from "@/lib/pds";
import { BadgeStatut, btnIcone, dateHeure, messageOnde, useNomsEquipe } from "@/components/onde/adminOnde";
import {
  NOM_ONDE, ONDE_COLUMNS_EQUIPE, etiquetteNumero, moisCourant, moisSuivant, ondeHref, slugOnde, useFichiersEquipe,
  type NumeroOnde,
} from "@/lib/onde";

const ONGLETS_ADMIN = [
  { id: "numeros", label: "Numéros" },
  { id: "editeurs", label: "Éditeurs de L'Onde" },
];

const AdminOnde = () => {
  const { isAdmin } = useAdminAuth();
  const [onglet, setOnglet] = useOnglet(isAdmin ? ONGLETS_ADMIN : ONGLETS_ADMIN.slice(0, 1));
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [aSupprimer, setASupprimer] = useState<NumeroOnde | null>(null);

  const { data: liste = [], isLoading } = useQuery({
    queryKey: ["onde-equipe-liste"],
    queryFn: async (): Promise<NumeroOnde[]> => {
      const { data, error } = await supabase.from("onde_numeros").select(ONDE_COLUMNS_EQUIPE).order("numero", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NumeroOnde[];
    },
  });
  const nom = useNomsEquipe(liste.flatMap((n) => [n.auteur_id, n.modifie_par]));
  const resoudre = useFichiersEquipe(liste.map((n) => n.couverture_url || "").filter(Boolean));

  const creer = useMutation({
    mutationFn: async () => {
      const dernier = liste[0];
      const numero = dernier ? Math.max(...liste.map((n) => n.numero)) + 1 : 1;
      const mois = dernier ? moisSuivant(dernier.mois) : moisCourant();
      const { data, error } = await supabase
        .from("onde_numeros")
        .insert({ numero, mois, slug: slugOnde(numero, mois) })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["onde-equipe-liste"] });
      navigate(`/admin/onde/${id}`);
    },
    onError: (e: { code?: string; message?: string }) => toast.error(messageOnde(e, "Le numéro n'a pas pu être créé. Réessayez.")),
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      // Les fichiers du numéro (photos, MP3) sont effacés d'abord : en cas d'échec, le numéro reste intact
      const { data: fichiers, error: errListe } = await supabase.storage.from("onde").list(id, { limit: 1000 });
      if (errListe) throw errListe;
      if (fichiers?.length) {
        const { error: errFichiers } = await supabase.storage.from("onde").remove(fichiers.map((f) => `${id}/${f.name}`));
        if (errFichiers) throw errFichiers;
      }
      const { error, count } = await supabase.from("onde_numeros").delete({ count: "exact" }).eq("id", id);
      if (error) throw error;
      if (!count) throw { code: "42501" };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onde-equipe-liste"] });
      qc.invalidateQueries({ queryKey: ["onde-publies"] });
      setASupprimer(null);
      toast.success("Numéro supprimé");
    },
    onError: (e: { code?: string; message?: string }) => toast.error(messageOnde(e, "Suppression impossible.")),
  });

  return (
    <AdminLayout
      acces="onde"
      titre={NOM_ONDE}
      description={<>La lettre mensuelle, publiée sur le site : une page par numéro, archivée sur la page <Link to="/onde" className="underline underline-offset-4">L'Onde du Sud</Link>.</>}
      actions={
        onglet === "numeros" && (
          <button type="button" className={btnPrimary} onClick={() => creer.mutate()} disabled={creer.isPending || isLoading}>
            {creer.isPending ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
            Nouveau numéro
          </button>
        )
      }
    >
      {isAdmin && <AdminOnglets onglets={ONGLETS_ADMIN} courant={onglet} onChange={setOnglet} label="L'Onde du Sud" />}

      {onglet === "numeros" && (
        <Panneau id="numeros">
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
          ) : liste.length === 0 ? (
            <p className="text-muted-foreground">Aucun numéro pour le moment. Cliquez sur « Nouveau numéro » pour commencer le premier.</p>
          ) : (
            <ol className="border-t-2 border-encre divide-y divide-filet">
              {liste.map((n) => (
                <li key={n.id} className="grid grid-cols-[88px_1fr] md:grid-cols-[112px_1fr_auto] gap-4 py-4 items-start">
                  {n.couverture_url ? (
                    <img src={resoudre(n.couverture_url)} alt="" className="w-[88px] md:w-28 aspect-[4/3] object-cover border border-filet" />
                  ) : (
                    <div className="w-[88px] md:w-28 aspect-[4/3] border-2 border-dashed border-filet flex items-center justify-center font-mono text-sm text-muted-foreground" aria-hidden>
                      n°{n.numero}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-wider text-primary flex flex-wrap items-center gap-2">
                      {etiquetteNumero(n)} <BadgeStatut statut={n.statut} />
                    </p>
                    <p className="font-bold text-lg leading-tight mt-1">{n.titre || <span className="text-muted-foreground font-normal">Sans titre</span>}</p>
                    {n.chapeau && <p className="text-sm mt-1 line-clamp-2 max-w-[70ch]">{n.chapeau}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      Modifié le {dateHeure(n.updated_at)}{nom(n.modifie_par) ? ` par ${nom(n.modifie_par)}` : ""}
                      {n.publie_le ? ` · publié le ${dateHeure(n.publie_le)}` : ""}
                      {nom(n.auteur_id) ? ` · créé par ${nom(n.auteur_id)}` : ""}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex flex-wrap gap-2 md:justify-end">
                    <Link to={`/admin/onde/${n.id}`} className={btnIcone} aria-label={`Modifier le n°${n.numero}`}>
                      <Pencil className="w-4 h-4" aria-hidden />
                    </Link>
                    <a href={`/admin/onde/${n.id}/apercu`} target="_blank" rel="noopener noreferrer" className={btnIcone} aria-label={`Aperçu du n°${n.numero} (nouvel onglet)`}>
                      <Eye className="w-4 h-4" aria-hidden />
                    </a>
                    {n.statut === "publie" && (
                      <a href={ondeHref(n.slug)} target="_blank" rel="noopener noreferrer" className={btnIcone} aria-label={`Voir le n°${n.numero} sur le site (nouvel onglet)`}>
                        <ExternalLink className="w-4 h-4" aria-hidden />
                      </a>
                    )}
                    {isAdmin && (
                      <button type="button" className={btnIcone} onClick={() => setASupprimer(n)} aria-label={`Supprimer le n°${n.numero}`}>
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panneau>
      )}

      {isAdmin && onglet === "editeurs" && (
        <Panneau id="editeurs">
          <EditeursOnde />
        </Panneau>
      )}

      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le n°{aSupprimer?.numero} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le numéro et ses fichiers (photos, MP3) disparaissent du site et de cette liste, sans retour possible. Pour le retirer seulement du site, ouvrez-le et cliquez sur « Retirer du site ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => aSupprimer && supprimer.mutate(aSupprimer.id)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

type Editeur = { user_id: string; email: string; nom: string | null };

/** Éditeur·ices de L'Onde : donner ou retirer le rôle (réservé aux admins, règle appliquée par la base). */
const EditeursOnde = () => {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [aRetirer, setARetirer] = useState<Editeur | null>(null);

  const { data: editeurs = [], isLoading } = useQuery({
    queryKey: ["onde-editeurs"],
    queryFn: async (): Promise<Editeur[]> => {
      const { data, error } = await supabase.rpc("onde_editeurs");
      if (error) throw error;
      return (data || []) as Editeur[];
    },
  });

  // Suggestions : les membres déjà connus de l'association
  const { data: membres = [] } = useQuery({
    queryKey: ["onde-membres-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_membres");
      if (error) throw error;
      return ((data || []) as { email: string; nom: string | null }[]).filter((m) => m.email);
    },
  });

  const donner = useMutation({
    mutationFn: async (mail: string) => {
      const { error } = await supabase.rpc("onde_donner_editeur", { _email: mail });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onde-editeurs"] });
      toast.success("Rôle d'éditeur·ice donné");
      setEmail("");
    },
    onError: (e: { code?: string; message?: string }) => toast.error(messageOnde(e, "Le rôle n'a pas pu être donné.")),
  });

  const retirer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("onde_retirer_editeur", { _user_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onde-editeurs"] });
      setARetirer(null);
      toast.success("Rôle retiré");
    },
    onError: (e: { code?: string; message?: string }) => toast.error(messageOnde(e, "Le rôle n'a pas pu être retiré.")),
  });

  return (
    <div className="max-w-3xl">
      <p className="text-[15px] max-w-[70ch]">
        Un·e éditeur·ice peut rédiger, modifier et publier les numéros de L'Onde du Sud, et rien d'autre dans l'administration.
        Elle ou il se connecte avec son compte de l'espace membre, puis ouvre l'adresse <span className="font-mono">/admin/onde</span>.
      </p>

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) { toast.error("Indiquez l'adresse e-mail du ou de la membre."); return; }
          donner.mutate(email.trim());
        }}
      >
        <div className="space-y-1.5 flex-1 min-w-[260px]">
          <Label htmlFor="onde-editeur-email">Adresse e-mail du ou de la membre</Label>
          <Input id="onde-editeur-email" type="email" list="onde-membres" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom@exemple.fr" />
          <datalist id="onde-membres">
            {membres.map((m) => <option key={m.email} value={m.email}>{fullName(m.nom)}</option>)}
          </datalist>
        </div>
        <button type="submit" className={btnPrimary} disabled={donner.isPending}>
          {donner.isPending ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <UserPlus className="w-4 h-4" aria-hidden />}
          Donner le rôle
        </button>
      </form>

      <h2 className="font-bold text-xl mt-10 mb-3">Éditeur·ices actuel·les</h2>
      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
      ) : editeurs.length === 0 ? (
        <p className="text-muted-foreground">Personne pour le moment. Les admins peuvent déjà tout faire dans L'Onde.</p>
      ) : (
        <ul className="border-t-2 border-encre divide-y divide-filet">
          {editeurs.map((e) => (
            <li key={e.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-bold">{e.nom ? fullName(e.nom) : e.email}</p>
                {e.nom && <p className="text-sm text-muted-foreground break-all">{e.email}</p>}
              </div>
              <button type="button" className={btnSecondary} onClick={() => setARetirer(e)}>
                <UserMinus className="w-4 h-4" aria-hidden /> Retirer le rôle
              </button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!aRetirer} onOpenChange={(o) => !o && setARetirer(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le rôle à {aRetirer?.nom ? fullName(aRetirer.nom) : aRetirer?.email} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle ou il ne pourra plus ouvrir L'Onde du Sud dans l'administration. Les numéros déjà écrits restent en place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => aRetirer && retirer.mutate(aRetirer.user_id)}>Retirer le rôle</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOnde;
