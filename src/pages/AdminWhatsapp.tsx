import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Printer, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminOnglets, useOnglet } from "@/components/admin/AdminOnglets";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { btnPrimary, btnSecondary, formatName } from "@/lib/pds";
import { messageServeur } from "@/lib/inscription";
import { DEPARTEMENTS_ACCUEIL, estLienWhatsapp, libelleDepartement, regleGroupes } from "@/lib/accueil";
import { toCsv } from "@/lib/csv";

type Groupe = { id: string; nom: string; lien: string; departements: string[]; par_defaut: boolean; ordre: number };
type Suivi = {
  email: string; nom: string; etat: string; departement: string | null; departement_choisi: boolean; groupe_nom: string | null;
  whatsapp_rejoint_le: string | null; bienvenue_le: string | null; relance_le: string | null; invitation_le: string | null; relances_refusees_le: string | null;
};
type EtatEnvoi = { configure: boolean; nombre: number; derniere: { lancee_le: string; terminee_le: string | null; envoyes: number; erreurs: number; message: string | null } | null };

const ONGLETS = [
  { id: "suivi", label: "Suivi des membres" },
  { id: "groupes", label: "Groupes" },
  { id: "inviter", label: "Inviter les membres" },
];
const ETATS: Record<string, string> = { a_jour: "À jour", tolerance: "Janvier", verification: "À vérifier", terminee: "Terminée", sans_adhesion: "Sans adhésion" };
const jour = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "");
const champ = "w-full min-h-[44px] px-3 bg-background border-2 border-encre text-[15px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

const appel = async (action: string, extra: Record<string, unknown> = {}) => {
  const { data, error } = await supabase.functions.invoke("accueil-whatsapp", { body: { action, ...extra } });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const j = ctx ? await ctx.json().catch(() => null) : null;
    throw new Error(j?.error || "Le serveur n'a pas répondu.");
  }
  return data;
};

/* ---------- Suivi ---------- */
const OngletSuivi = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-accueil"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_accueil");
      if (error) throw error;
      return (data || []) as Suivi[];
    },
  });
  const [filtre, setFiltre] = useState<"tous" | "pas_rejoint" | "sans_dep">("tous");
  const [etat, setEtat] = useState("tous");
  const [q, setQ] = useState("");
  const liste = useMemo(() => data.filter((m) =>
    (filtre === "tous" || (filtre === "pas_rejoint" ? !m.whatsapp_rejoint_le : !m.departement))
    && (etat === "tous" || m.etat === etat)
    && (!q || `${m.nom} ${m.email}`.toLowerCase().includes(q.toLowerCase()))), [data, filtre, etat, q]);
  const sansDep = data.filter((m) => !m.departement).length;
  const rejoints = data.filter((m) => m.whatsapp_rejoint_le).length;
  const exporter = () => {
    const csv = toCsv([["Nom", "E-mail", "Adhésion", "Département", "Groupe", "A rejoint WhatsApp", "Bienvenue", "Relance", "Invitation"],
      ...liste.map((m) => [formatName(m.nom), m.email, ETATS[m.etat] || m.etat, libelleDepartement(m.departement), m.groupe_nom || "", jour(m.whatsapp_rejoint_le), jour(m.bienvenue_le), jour(m.relance_le), jour(m.invitation_le)])]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "suivi-whatsapp.csv";
    a.click();
  };
  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-label="Chargement" />;
  return (
    <div>
      <dl className="grid grid-cols-3 border border-filet bg-surface mb-6 max-w-[640px]">
        {[{ l: "Personnes", v: data.length }, { l: "Ont rejoint WhatsApp", v: rejoints }, { l: "Sans département", v: sansDep }].map((s, i) => (
          <div key={s.l} className={`p-3 sm:p-4 ${i ? "border-l border-filet" : ""}`}>
            <dt className="text-xs sm:text-sm text-muted-foreground">{s.l}</dt>
            <dd className="font-display font-black text-3xl">{s.v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label htmlFor="suivi-q" className="block text-sm font-bold mb-1">Rechercher</label>
          <input id="suivi-q" value={q} onChange={(e) => setQ(e.target.value)} className={champ} placeholder="Nom ou e-mail" />
        </div>
        <div>
          <label htmlFor="suivi-filtre" className="block text-sm font-bold mb-1">Afficher</label>
          <select id="suivi-filtre" value={filtre} onChange={(e) => setFiltre(e.target.value as typeof filtre)} className={champ}>
            <option value="tous">Tout le monde</option>
            <option value="pas_rejoint">Pas encore rejoint</option>
            <option value="sans_dep">Sans département</option>
          </select>
        </div>
        <div>
          <label htmlFor="suivi-etat" className="block text-sm font-bold mb-1">Adhésion</label>
          <select id="suivi-etat" value={etat} onChange={(e) => setEtat(e.target.value)} className={champ}>
            <option value="tous">Toutes</option>
            {Object.entries(ETATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button type="button" onClick={exporter} className={btnSecondary}>Exporter</button>
        <p className="font-mono text-sm text-muted-foreground ml-auto" aria-live="polite">{liste.length} personne{liste.length > 1 ? "s" : ""}</p>
      </div>
      <div className="overflow-x-auto border-2 border-encre">
        <table className="w-full text-sm bg-surface">
          <thead className="bg-background text-left">
            <tr>
              <th scope="col" className="p-3">Personne</th>
              <th scope="col" className="p-3">Adhésion</th>
              <th scope="col" className="p-3">Département</th>
              <th scope="col" className="p-3">Groupe</th>
              <th scope="col" className="p-3">A rejoint WhatsApp</th>
              <th scope="col" className="p-3">E-mails</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((m) => (
              <tr key={m.email} className="border-t border-filet align-top">
                <td className="p-3"><span className="font-semibold block">{formatName(m.nom)}</span><span className="text-muted-foreground break-all">{m.email}</span></td>
                <td className="p-3">{ETATS[m.etat] || m.etat}</td>
                <td className="p-3">{m.departement ? <span className="font-mono">{libelleDepartement(m.departement)}</span> : <span className="px-1.5 py-0.5 text-xs font-bold bg-accent text-accent-foreground">Inconnu</span>}</td>
                <td className="p-3">{m.groupe_nom || "—"}</td>
                <td className="p-3 font-mono">{m.whatsapp_rejoint_le ? jour(m.whatsapp_rejoint_le) : "—"}</td>
                <td className="p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                  {m.bienvenue_le && <span className="block">Bienvenue {jour(m.bienvenue_le)}</span>}
                  {m.relance_le && <span className="block">Relance {jour(m.relance_le)}</span>}
                  {m.invitation_le && <span className="block">Invitation {jour(m.invitation_le)}</span>}
                  {m.relances_refusees_le && <span className="block">Ne veut plus de relance</span>}
                </td>
              </tr>
            ))}
            {!liste.length && <tr><td colSpan={6} className="p-4 text-muted-foreground">Personne dans cette sélection.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Groupes ---------- */
type Form = { id?: string; nom: string; lien: string; departements: string[]; par_defaut: boolean; ordre: number };
const OngletGroupes = () => {
  const qc = useQueryClient();
  const { data: groupes = [], isLoading } = useQuery({
    queryKey: ["whatsapp-groupes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_groupes").select("id, nom, lien, departements, par_defaut, ordre").order("ordre").order("created_at");
      if (error) throw error;
      return (data || []) as Groupe[];
    },
  });
  const [form, setForm] = useState<Form | null>(null);
  const [aSupprimer, setASupprimer] = useState<Groupe | null>(null);
  const enregistrer = useMutation({
    mutationFn: async (f: Form) => {
      if (f.nom.trim().length < 2) throw new Error("Donne un nom au groupe.");
      if (!estLienWhatsapp(f.lien)) throw new Error("Le lien doit commencer par https://chat.whatsapp.com/");
      // Un seul groupe par défaut : on retire l'ancien avant
      if (f.par_defaut) {
        const autres = groupes.filter((g) => g.par_defaut && g.id !== f.id);
        for (const g of autres) {
          const { error } = await supabase.from("whatsapp_groupes").update({ par_defaut: false }).eq("id", g.id);
          if (error) throw error;
        }
      }
      const ligne = { nom: f.nom.trim(), lien: f.lien.trim(), departements: f.departements, par_defaut: f.par_defaut, ordre: f.ordre };
      const { error } = f.id
        ? await supabase.from("whatsapp_groupes").update(ligne).eq("id", f.id)
        : await supabase.from("whatsapp_groupes").insert(ligne);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Groupe enregistré."); setForm(null); qc.invalidateQueries({ queryKey: ["whatsapp-groupes"] }); qc.invalidateQueries({ queryKey: ["admin-accueil"] }); },
    onError: (e) => toast.error(messageServeur(e as { message?: string }, "Le groupe n'a pas pu être enregistré.")),
  });
  const supprimer = useMutation({
    mutationFn: async (g: Groupe) => {
      const { error } = await supabase.from("whatsapp_groupes").delete().eq("id", g.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Groupe supprimé."); setASupprimer(null); qc.invalidateQueries({ queryKey: ["whatsapp-groupes"] }); },
    onError: () => toast.error("Le groupe n'a pas pu être supprimé."),
  });
  // Départements couverts par aucun groupe (ils vont au groupe par défaut)
  const couverts = new Set(groupes.flatMap((g) => g.departements));
  const defaut = groupes.find((g) => g.par_defaut);
  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-label="Chargement" />;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-[15px] max-w-[70ch]">
          Règle actuelle : <strong>{regleGroupes(groupes) || "aucun groupe"}</strong>. Un département inconnu va au groupe par défaut.
          Ces liens ne s'affichent jamais sur le site public : seulement à la personne concernée, dans ses e-mails, et ici.
        </p>
        <button type="button" className={btnPrimary} onClick={() => setForm({ nom: "", lien: "", departements: [], par_defaut: !defaut, ordre: groupes.length + 1 })}>
          <Plus className="w-4 h-4" aria-hidden /> Ajouter un groupe
        </button>
      </div>
      {!defaut && <p role="alert" className="mb-4 border-2 border-accent bg-accent/10 p-3 text-sm font-semibold">Aucun groupe par défaut : les personnes sans groupe pour leur département n'en verront aucun.</p>}
      <ul className="grid md:grid-cols-2 gap-4">
        {groupes.map((g) => (
          <li key={g.id} className="border-2 border-encre bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-black text-xl">{g.nom}</p>
                {g.par_defaut && <span className="inline-block mt-1 px-1.5 py-0.5 text-xs font-bold bg-primary text-primary-foreground">Groupe par défaut</span>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm({ ...g })} className="inline-flex items-center justify-center w-10 h-10 border-2 border-encre hover:bg-muted" aria-label={`Modifier ${g.nom}`}><Pencil className="w-4 h-4" aria-hidden /></button>
                <button type="button" onClick={() => setASupprimer(g)} className="inline-flex items-center justify-center w-10 h-10 border-2 border-encre hover:bg-muted" aria-label={`Supprimer ${g.nom}`}><Trash2 className="w-4 h-4" aria-hidden /></button>
              </div>
            </div>
            <p className="mt-3 text-sm"><span className="text-muted-foreground">Départements : </span>
              <span className="font-mono">{g.departements.length ? g.departements.map((d) => (d === "MC" ? "Monaco" : d === "autre" ? "Autre" : d)).join(", ") : "aucun"}</span>
              {g.par_defaut && <span className="text-muted-foreground"> + tous les autres et les inconnus</span>}
            </p>
            <p className="mt-1 text-sm break-all font-mono text-muted-foreground">{g.lien}</p>
            <Link to={`/admin/whatsapp/affiche/${g.id}`} className={`${btnSecondary} mt-4`}><Printer className="w-4 h-4" aria-hidden /> Affiche A5</Link>
          </li>
        ))}
      </ul>
      {DEPARTEMENTS_ACCUEIL.some((d) => !couverts.has(d.code)) && defaut && (
        <p className="mt-4 text-sm text-muted-foreground">Vont aussi au groupe « {defaut.nom} » : {DEPARTEMENTS_ACCUEIL.filter((d) => !couverts.has(d.code)).map((d) => d.label).join(", ")}.</p>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Modifier le groupe" : "Ajouter un groupe"}</DialogTitle>
            <DialogDescription>Le lien d'invitation se copie dans WhatsApp : Infos du groupe, puis « Inviter via un lien ».</DialogDescription>
          </DialogHeader>
          {form && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); enregistrer.mutate(form); }}>
              <div>
                <label htmlFor="g-nom" className="block text-sm font-bold mb-1">Nom du groupe</label>
                <input id="g-nom" value={form.nom} maxLength={80} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={champ} required />
              </div>
              <div>
                <label htmlFor="g-lien" className="block text-sm font-bold mb-1">Lien d'invitation</label>
                <input id="g-lien" value={form.lien} onChange={(e) => setForm({ ...form, lien: e.target.value })} className={champ} placeholder="https://chat.whatsapp.com/…" required />
                {form.lien && !estLienWhatsapp(form.lien) && <p className="mt-1 text-sm font-semibold">Le lien doit commencer par https://chat.whatsapp.com/</p>}
              </div>
              <fieldset>
                <legend className="text-sm font-bold mb-1">Départements couverts</legend>
                <div className="grid grid-cols-2 gap-1">
                  {DEPARTEMENTS_ACCUEIL.map((d) => (
                    <label key={d.code} className="flex items-center gap-2 text-sm min-h-[36px] cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.departements.includes(d.code)}
                        onChange={(e) => setForm({ ...form, departements: e.target.checked ? [...form.departements, d.code] : form.departements.filter((x) => x !== d.code) })} />
                      {d.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={form.par_defaut} onChange={(e) => setForm({ ...form, par_defaut: e.target.checked })} />
                <span><strong>Groupe par défaut</strong> : reçoit tous les départements qui n'ont pas leur groupe, et les personnes dont le département est inconnu.</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className={btnSecondary} onClick={() => setForm(null)}>Annuler</button>
                <button type="submit" className={btnPrimary} disabled={enregistrer.isPending}>{enregistrer.isPending ? "Enregistrement…" : "Enregistrer"}</button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {aSupprimer?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>Ses départements iront au groupe par défaut. Le groupe WhatsApp lui-même n'est pas touché.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => aSupprimer && supprimer.mutate(aSupprimer)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ---------- Invitation de rattrapage ---------- */
const OngletInviter = () => {
  const qc = useQueryClient();
  const { data: etat, isLoading, error } = useQuery({ queryKey: ["accueil-envoi"], queryFn: () => appel("etat") as Promise<EtatEnvoi> });
  const [variante, setVariante] = useState<"connu" | "inconnu">("connu");
  const [type, setType] = useState<"invitation" | "relance">("invitation");
  const { data: apercu } = useQuery({
    queryKey: ["accueil-apercu", variante, type],
    queryFn: () => appel("apercu", { variante, type }) as Promise<{ objet: string; html: string }>,
  });
  const [confirmer, setConfirmer] = useState(false);
  const lancer = useMutation({
    mutationFn: () => appel("lancer"),
    onSuccess: (r: { code?: string; error?: string; message?: string }) => {
      if (r?.code === "non_configure") toast.error("Envoi pas encore configuré.");
      else toast.success(r?.message || "Envoi lancé.");
      qc.invalidateQueries({ queryKey: ["accueil-envoi"] });
      qc.invalidateQueries({ queryKey: ["admin-accueil"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-label="Chargement" />;
  if (error || !etat) return <p className="text-[15px]">Les informations d'envoi n'ont pas pu être chargées.</p>;
  const n = etat.nombre;
  const enCours = etat.derniere && !etat.derniere.terminee_le;
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8">
      <div className="space-y-5">
        <div className="border-2 border-encre bg-surface p-5">
          <p className="font-display font-black text-2xl">{n} membre{n > 1 ? "s" : ""} à inviter</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Adhérent·es à jour qui n'ont pas cliqué « J'ai rejoint », n'ont pas reçu la bienvenue (les nouvelles personnes l'ont déjà, avec une relance à 7 jours), ni déjà été invité·es, ni demandé à ne plus être relancé·es. Une seule invitation par personne.
          </p>
          {!etat.configure ? (
            <p role="status" className="mt-4 border-2 border-accent bg-accent/10 p-3 text-sm font-semibold">
              Envoi pas encore configuré : ces e-mails partent par le même service d'envoi que L'Onde du Sud, qui attend sa clé.
            </p>
          ) : null}
          <button type="button" className={`${btnPrimary} mt-4`} disabled={!etat.configure || (!n && !enCours) || lancer.isPending} onClick={() => setConfirmer(true)}>
            {lancer.isPending ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
            {enCours ? "Reprendre l'envoi" : "Inviter au groupe WhatsApp les membres qui ne l'ont pas rejoint"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Limite d'envoi du jour atteinte ? L'envoi reprend tout seul le lendemain, sans renvoyer à celles et ceux qui l'ont déjà reçu.
          </p>
        </div>
        {etat.derniere && (
          <div className="border border-filet bg-surface p-5 text-sm" role="status">
            <p className="font-bold">Dernier envoi lancé le <span className="font-mono">{jour(etat.derniere.lancee_le)}</span></p>
            <p className="mt-1"><span className="font-mono">{etat.derniere.envoyes}</span> envoyé{etat.derniere.envoyes > 1 ? "s" : ""}{etat.derniere.erreurs ? <>, <span className="font-mono">{etat.derniere.erreurs}</span> adresse{etat.derniere.erreurs > 1 ? "s" : ""} refusée{etat.derniere.erreurs > 1 ? "s" : ""}</> : null}.</p>
            {etat.derniere.message && <p className="mt-1">{etat.derniere.message}</p>}
          </div>
        )}
      </div>
      <div>
        <div className="flex flex-wrap gap-3 mb-3">
          <div>
            <label htmlFor="ap-type" className="block text-sm font-bold mb-1">E-mail</label>
            <select id="ap-type" value={type} onChange={(e) => setType(e.target.value as typeof type)} className={champ}>
              <option value="invitation">Invitation (membres existants)</option>
              <option value="relance">Relance à 7 jours (nouvelles personnes)</option>
            </select>
          </div>
          <div>
            <label htmlFor="ap-var" className="block text-sm font-bold mb-1">Aperçu pour</label>
            <select id="ap-var" value={variante} onChange={(e) => setVariante(e.target.value as typeof variante)} className={champ}>
              <option value="connu">Département connu</option>
              <option value="inconnu">Département inconnu</option>
            </select>
          </div>
        </div>
        {apercu ? (
          <>
            <p className="text-sm mb-2"><span className="text-muted-foreground">Objet : </span><strong>{apercu.objet}</strong></p>
            <iframe title="Aperçu de l'e-mail" srcDoc={apercu.html} sandbox="" className="w-full h-[720px] border-2 border-encre bg-surface" />
          </>
        ) : <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" aria-label="Chargement de l'aperçu" />}
      </div>
      <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{enCours ? "Reprendre l'envoi ?" : `Inviter ${n} membre${n > 1 ? "s" : ""} ?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {n} personne{n > 1 ? "s" : ""} recevr{n > 1 ? "ont" : "a"} l'e-mail « Rejoins le groupe WhatsApp de ton département », avec le groupe de son département
              (ou la règle et le lien pour l'indiquer s'il est inconnu). Chaque personne ne le reçoit qu'une fois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => lancer.mutate()}>Envoyer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const AdminWhatsapp = () => {
  const [onglet, setOnglet] = useOnglet(ONGLETS);
  return (
    <AdminLayout titre="Groupes WhatsApp" description="Accueil des nouvelles personnes, groupes par département et invitations.">
      <AdminOnglets onglets={ONGLETS} courant={onglet} onChange={setOnglet} label="Groupes WhatsApp" />
      <div role="tabpanel" id={`panneau-${onglet}`} aria-labelledby={`onglet-${onglet}`}>
        {onglet === "suivi" ? <OngletSuivi /> : onglet === "groupes" ? <OngletGroupes /> : <OngletInviter />}
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsapp;
