// Onglet « Dépôts du mois » de l'admin de L'Onde du Sud (admins et éditeur·ices) : ce que les membres ont déposé,
// le plus récent d'abord, avec lecture du son, statut et « Utiliser dans un numéro ».
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { dateHeure, messageOnde } from "@/components/onde/adminOnde";
import { btnSecondary, fullName, linkUnderline } from "@/lib/pds";
import { ficheHref } from "@/lib/seo";
import { etiquetteNumero, useFichiersEquipe, type NumeroOnde } from "@/lib/onde";
import { STATUTS_DEPOT, TYPES_DEPOT, libelleTypeDepot, type DepotEquipe, type StatutDepot } from "@/lib/ondeDepots";

const select = "min-h-[44px] px-3 bg-surface border-2 border-encre text-[15px] font-semibold focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

const DepotsOnde = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [statut, setStatut] = useState("");
  const [aUtiliser, setAUtiliser] = useState<DepotEquipe | null>(null);
  const [numeroChoisi, setNumeroChoisi] = useState("");

  const { data: depots = [], isLoading, isError } = useQuery({
    queryKey: ["onde-depots-equipe"],
    queryFn: async (): Promise<DepotEquipe[]> => {
      const { data, error } = await supabase.rpc("onde_depots_equipe");
      if (error) throw error;
      return (data || []) as DepotEquipe[];
    },
  });
  const resoudre = useFichiersEquipe(depots.flatMap((d) => [d.audio_url || "", d.photo_url || ""]).filter(Boolean));

  const { data: brouillons = [] } = useQuery({
    queryKey: ["onde-brouillons"],
    enabled: !!aUtiliser,
    queryFn: async () => {
      const { data, error } = await supabase.from("onde_numeros").select("id, numero, mois, titre").eq("statut", "brouillon").order("numero", { ascending: false });
      if (error) throw error;
      return (data || []) as Pick<NumeroOnde, "id" | "numero" | "mois" | "titre">[];
    },
  });

  const liste = useMemo(() => depots.filter((d) => (!type || d.type === type) && (!statut || d.statut === statut)), [depots, type, statut]);

  const changerStatut = useMutation({
    mutationFn: async ({ id, s }: { id: string; s: StatutDepot }) => {
      const { error } = await supabase.rpc("onde_depot_statut", { _id: id, _statut: s });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["onde-depots-equipe"] }); toast.success("Statut enregistré"); },
    onError: (e: { code?: string; message?: string }) => toast.error(messageOnde(e, "Le statut n'a pas pu être enregistré.")),
  });

  const utiliser = useMutation({
    mutationFn: async ({ depot, numero }: { depot: string; numero: string }) => {
      const { data, error } = await supabase.rpc("onde_utiliser_depot", { _depot_id: depot, _numero_id: numero });
      if (error) throw error;
      return { numero, bloc: data as string };
    },
    onSuccess: ({ numero, bloc }) => {
      qc.invalidateQueries({ queryKey: ["onde-depots-equipe"] });
      qc.invalidateQueries({ queryKey: ["onde-equipe", numero] });
      qc.invalidateQueries({ queryKey: ["onde-equipe-liste"] });
      setAUtiliser(null);
      toast.success("Bloc ajouté à la fin du numéro : vous pouvez tout retoucher.");
      navigate(`/admin/onde/${numero}#bloc-${bloc}`);
    },
    onError: (e: { code?: string; message?: string }) => toast.error(messageOnde(e, "Le bloc n'a pas pu être créé. Réessayez.")),
  });

  return (
    <div className="max-w-4xl">
      <p className="text-[15px] max-w-[70ch]">
        Ce que les adhérent·es déposent depuis leur espace membre. Un dépôt non utilisé reste ici les mois suivants.
        « Utiliser dans un numéro » ajoute un bloc déjà rempli à un brouillon, avec la mention « Déposé par ».
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label htmlFor="depots-type" className="block text-sm font-bold">Type</label>
          <select id="depots-type" className={select} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tous les types</option>
            {TYPES_DEPOT.map((t) => <option key={t.id} value={t.id}>{t.court}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="depots-statut" className="block text-sm font-bold">Statut</label>
          <select id="depots-statut" className={select} value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUTS_DEPOT.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <p className="font-mono text-sm text-muted-foreground pb-3" role="status">{liste.length} dépôt{liste.length > 1 ? "s" : ""}</p>
      </div>

      {isLoading ? (
        <Loader2 className="mt-6 w-6 h-6 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
      ) : isError ? (
        <p className="mt-6">Les dépôts n'ont pas pu être chargés. Réessayez dans un instant.</p>
      ) : liste.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{depots.length ? "Aucun dépôt pour ces filtres." : "Aucun dépôt pour le moment."}</p>
      ) : (
        <ul className="mt-6 border-t-2 border-encre divide-y divide-filet">
          {liste.map((d) => {
            const nom = fullName(d.prenom, d.nom) || "Membre";
            const href = d.fiche_id && d.fiche_visible ? ficheHref({ id: d.fiche_id, slug: d.fiche_slug, type_profil: d.fiche_type, nom_podcast: d.fiche_nom_podcast }) : null;
            const photo = d.photo_url ? resoudre(d.photo_url) : undefined;
            return (
              <li key={d.id} className={`py-5 grid gap-4 ${d.photo_url ? "sm:grid-cols-[160px_1fr]" : ""}`}>
                {d.photo_url && (photo
                  ? <img src={photo} alt={`Photo jointe au dépôt « ${d.titre} »`} className="w-full sm:w-40 aspect-[4/3] object-cover border border-filet" />
                  : <div className="w-full sm:w-40 aspect-[4/3] border border-filet bg-muted" aria-hidden />)}
                <div className="min-w-0 space-y-2">
                  <p className="font-mono text-xs uppercase tracking-wider flex flex-wrap items-center gap-2">
                    <span className="border border-encre px-1.5">{libelleTypeDepot(d.type)}</span>
                    <span className="text-muted-foreground normal-case tracking-normal">{dateHeure(d.created_at)}</span>
                    {d.numero_id && d.numero !== null && (
                      <Link to={`/admin/onde/${d.numero_id}`} className="normal-case tracking-normal underline underline-offset-4">
                        {d.publie ? "Publié dans le" : "Dans le"} {etiquetteNumero({ numero: d.numero, mois: d.numero_mois || "" })}
                      </Link>
                    )}
                  </p>
                  <p className="font-bold text-lg leading-tight">{d.titre}</p>
                  <p className="text-[15px] whitespace-pre-line max-w-[70ch]">{d.texte}</p>
                  {d.audio_url && <audio controls preload="none" src={resoudre(d.audio_url)} className="w-full max-w-xl" aria-label={`Écouter : ${d.titre}`} />}
                  {d.lien_ecoute && (
                    <a href={d.lien_ecoute} target="_blank" rel="noopener noreferrer" className={`${linkUnderline} text-[15px] inline-flex items-center gap-1 min-h-[44px] break-all`}>
                      Écouter sur le lien déposé <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden /><span className="sr-only"> (nouvel onglet)</span>
                    </a>
                  )}
                  <p className="text-sm">
                    Déposé par {href
                      ? <a href={href} target="_blank" rel="noopener noreferrer" className={linkUnderline}>{nom}<span className="sr-only"> (nouvel onglet)</span></a>
                      : <strong>{nom}</strong>}
                    {!href && <span className="text-muted-foreground"> (fiche pas visible sur le site)</span>}
                  </p>
                  <div className="flex flex-wrap items-end gap-3 pt-1">
                    <div className="space-y-1">
                      <label htmlFor={`statut-${d.id}`} className="block text-xs font-bold">Statut</label>
                      <select
                        id={`statut-${d.id}`}
                        className={select}
                        value={d.statut}
                        disabled={changerStatut.isPending}
                        onChange={(e) => changerStatut.mutate({ id: d.id, s: e.target.value as StatutDepot })}
                      >
                        {STATUTS_DEPOT.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <button type="button" className={btnSecondary} onClick={() => { setAUtiliser(d); setNumeroChoisi(""); }}>
                      <FilePlus2 className="w-4 h-4" aria-hidden /> Utiliser dans un numéro
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!aUtiliser} onOpenChange={(o) => !o && setAUtiliser(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Utiliser « {aUtiliser?.titre} » dans un numéro</AlertDialogTitle>
            <AlertDialogDescription>
              Un bloc déjà rempli (étiquette, titre, texte, son, photo et « Déposé par ») est ajouté à la fin du brouillon choisi. Le dépôt passe en « Retenu ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          {brouillons.length === 0 ? (
            <p className="text-[15px]">Aucun numéro en brouillon. Créez d'abord un numéro dans l'onglet « Numéros ».</p>
          ) : (
            <fieldset className="space-y-2">
              <legend className="text-sm font-bold mb-1">Numéro en brouillon</legend>
              {brouillons.map((b) => (
                <label key={b.id} className="flex items-center gap-3 min-h-[44px] border-2 border-encre px-3 cursor-pointer has-[:checked]:bg-muted">
                  <input type="radio" name="numero-brouillon" value={b.id} checked={numeroChoisi === b.id} onChange={() => setNumeroChoisi(b.id)} className="h-5 w-5 accent-primary" />
                  <span><span className="font-mono text-sm">{etiquetteNumero(b)}</span> — {b.titre || "Sans titre"}</span>
                </label>
              ))}
            </fieldset>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={!numeroChoisi || utiliser.isPending}
              onClick={(e) => { e.preventDefault(); if (aUtiliser && numeroChoisi) utiliser.mutate({ depot: aUtiliser.id, numero: numeroChoisi }); }}
            >
              {utiliser.isPending ? "Un instant…" : "Créer le bloc"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DepotsOnde;
