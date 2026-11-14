// « Envoi par e-mail » d'un numéro publié : aperçu, test à sa propre adresse, envoi unique avec confirmation et journal.
// Tout est vérifié par le serveur (rôle, numéro publié, envoi unique) ; cette page ne fait qu'afficher et demander.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Eye, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { btnPrimary, btnSecondary } from "@/lib/pds";
import { dateHeure } from "@/components/onde/adminOnde";
import {
  MESSAGE_NON_CONFIGURE, NOM_ONDE, appelEnvoiOnde, libelleEnvoye,
  type ApercuEmail, type BilanEnvoi, type EtatEnvoi,
} from "@/lib/onde";

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;
const onglet = (actif: boolean) =>
  `h-10 px-3 border-2 border-encre text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${actif ? "bg-encre text-surface" : "bg-background hover:bg-muted"}`;

const LIBELLE_COPIE: Record<string, string> = { envoye: "envoyée", erreur: "en erreur", a_envoyer: "pas encore partie", en_cours: "en cours" };

const Journal = ({ e }: { e: BilanEnvoi }) => (
  <div className="border-2 border-encre bg-background p-4 space-y-2">
    <p className="font-bold flex items-center gap-2">
      {e.statut === "termine" ? <Check className="w-4 h-4" aria-hidden /> : <AlertTriangle className="w-4 h-4" aria-hidden />}
      {e.statut === "termine" ? libelleEnvoye(e.termine_le) : e.statut === "interrompu" ? "Envoi interrompu" : "Envoi en cours"}
    </p>
    <p className="font-mono text-sm">
      {pluriel(e.envoyes, "envoyé", "envoyés")} · {pluriel(e.erreurs, "erreur", "erreurs")}
      {e.restants > 0 ? ` · ${e.restants} en attente` : ""} · sur {pluriel(e.destinataires, "destinataire", "destinataires")}
    </p>
    <p className="text-sm text-muted-foreground">
      Lancé le {dateHeure(e.demarre_le)}{e.termine_le ? ` · terminé le ${dateHeure(e.termine_le)}` : ""}
      {e.copie ? ` · copie à transférer ${LIBELLE_COPIE[e.copie] || e.copie}` : ""}
    </p>
    {e.message && e.statut !== "termine" && <p className="text-sm font-bold text-destructive">{e.message}</p>}
    {!!e.liste_erreurs?.length && (
      <details className="text-sm">
        <summary className="cursor-pointer font-bold min-h-[44px] inline-flex items-center">Voir les adresses en erreur</summary>
        <ul className="mt-2 space-y-1">
          {e.liste_erreurs.map((x) => (
            <li key={`${x.email}-${x.copie}`} className="break-words"><span className="font-mono">{x.email}</span>{x.copie ? " (copie)" : ""} — {x.erreur || "refusé"}</li>
          ))}
        </ul>
      </details>
    )}
  </div>
);

const EnvoiOnde = ({ numeroId, numero, modifie }: { numeroId: string; numero: number; modifie: boolean }) => {
  const qc = useQueryClient();
  const [apercu, setApercu] = useState(false);
  const [version, setVersion] = useState<"abonne" | "copie">("abonne");
  const [vue, setVue] = useState<"email" | "texte">("email");
  const [confirmer, setConfirmer] = useState(false);

  const etat = useQuery({
    queryKey: ["onde-envoi", numeroId],
    queryFn: () => appelEnvoiOnde<EtatEnvoi>("etat", numeroId),
    refetchOnWindowFocus: false,
  });
  const contenu = useQuery({
    queryKey: ["onde-envoi-apercu", numeroId, version],
    enabled: apercu,
    staleTime: 0,
    queryFn: () => appelEnvoiOnde<ApercuEmail>("apercu", numeroId, { version }),
  });

  const rafraichir = () => {
    qc.invalidateQueries({ queryKey: ["onde-envoi", numeroId] });
    qc.invalidateQueries({ queryKey: ["onde-envois-resume"] });
  };

  const test = useMutation({
    mutationFn: () => appelEnvoiOnde<{ a: string }>("test", numeroId),
    onSuccess: (r) => toast.success(`Test envoyé à ${r.a}. Regardez votre boîte mail d'ici une minute.`),
    onError: (e: Error) => toast.error(e.message),
  });
  const envoi = useMutation({
    mutationFn: (action: "envoyer" | "reprendre") => appelEnvoiOnde<{ envoi: BilanEnvoi | null }>(action, numeroId, { attendu: etat.data?.destinataires }),
    onSuccess: (r) => {
      rafraichir();
      if (r.envoi?.statut === "termine") toast.success(`${NOM_ONDE} n°${numero} est parti : ${pluriel(r.envoi.envoyes, "e-mail envoyé", "e-mails envoyés")}.`);
      else toast.error(r.envoi?.message || "L'envoi n'est pas terminé.");
    },
    onError: (e: Error) => {
      rafraichir();
      toast.error(e.message);
    },
  });

  const d = etat.data;
  const e = d?.envoi ?? null;
  const configure = !!d?.configure;
  const occupe = test.isPending || envoi.isPending;

  return (
    <section aria-labelledby="s-envoi" className="space-y-4">
      <h2 id="s-envoi" className="font-bold text-xl border-b-2 border-encre pb-2 flex items-center gap-2"><Mail className="w-5 h-5" aria-hidden /> Envoi par e-mail</h2>

      {etat.isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
      ) : etat.isError || !d ? (
        <p role="alert" className="font-bold text-destructive">{(etat.error as Error)?.message || "L'état de l'envoi n'a pas pu être lu."}</p>
      ) : (
        <>
          {e ? (
            <Journal e={e} />
          ) : (
            <p className="text-[15px]">
              Pas encore envoyé. Il partira à <strong>{pluriel(d.destinataires, "personne", "personnes")}</strong> : les adhérent·es à jour (sauf désinscrit·es) et les abonné·es qui ont confirmé. Une copie « [À transférer] » part aussi à {d.copie}.
            </p>
          )}

          {!configure && (
            <p className="border-2 border-dashed border-encre p-3 text-sm max-w-[70ch]">
              <strong>{MESSAGE_NON_CONFIGURE}.</strong> La clé Resend n'est pas encore enregistrée : l'aperçu marche déjà, le test et l'envoi s'activeront tout seuls dès qu'elle sera là.
            </p>
          )}
          {configure && modifie && !e && (
            <p className="text-sm font-bold">Enregistrez d'abord vos modifications : l'e-mail reprend la version en ligne.</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="button" className={btnSecondary} onClick={() => { setApercu(true); setVue("email"); }}>
              <Eye className="w-4 h-4" aria-hidden /> Aperçu de l'e-mail
            </button>
            {!e && (
              <>
                <button type="button" className={btnSecondary} disabled={!configure || occupe || modifie} onClick={() => test.mutate()}>
                  {test.isPending ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Mail className="w-4 h-4" aria-hidden />}
                  {configure ? "M'envoyer un test" : MESSAGE_NON_CONFIGURE}
                </button>
                <button type="button" className={btnPrimary} disabled={!configure || occupe || modifie || d.destinataires < 1} onClick={() => setConfirmer(true)}>
                  {envoi.isPending ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
                  {!configure ? MESSAGE_NON_CONFIGURE : envoi.isPending ? "Envoi en cours…" : `Envoyer à ${pluriel(d.destinataires, "personne", "personnes")}`}
                </button>
              </>
            )}
            {e && e.statut !== "termine" && (
              <button type="button" className={btnPrimary} disabled={!configure || occupe} onClick={() => envoi.mutate("reprendre")}>
                {envoi.isPending ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
                {!configure ? MESSAGE_NON_CONFIGURE : envoi.isPending ? "Envoi en cours…" : "Reprendre l'envoi"}
              </button>
            )}
          </div>
          {envoi.isPending && <p role="status" className="text-sm">Envoi en cours, lot par lot. Gardez cette page ouverte jusqu'au message de fin.</p>}
          {configure && d.moi && !e && <p className="text-xs text-muted-foreground">Le test part à votre adresse : {d.moi}.</p>}
        </>
      )}

      <Dialog open={apercu} onOpenChange={setApercu}>
        <DialogContent className="rounded-none max-w-[720px] w-[calc(100vw-1.5rem)] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de l'e-mail</DialogTitle>
            <DialogDescription>Ce que recevront les destinataires, construit à partir de la version en ligne du numéro.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Version">
            <button type="button" aria-pressed={version === "abonne"} className={onglet(version === "abonne")} onClick={() => setVersion("abonne")}>Destinataires</button>
            <button type="button" aria-pressed={version === "copie"} className={onglet(version === "copie")} onClick={() => setVersion("copie")}>Copie à transférer</button>
            <span className="w-px bg-filet mx-1" aria-hidden />
            <button type="button" aria-pressed={vue === "email"} className={onglet(vue === "email")} onClick={() => setVue("email")}>E-mail</button>
            <button type="button" aria-pressed={vue === "texte"} className={onglet(vue === "texte")} onClick={() => setVue("texte")}>Version texte</button>
          </div>
          {contenu.isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />
          ) : contenu.isError || !contenu.data ? (
            <p role="alert" className="font-bold text-destructive">{(contenu.error as Error)?.message || "L'aperçu n'a pas pu être construit."}</p>
          ) : (
            <div className="space-y-3">
              <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                <dt className="font-bold">De</dt><dd className="break-words">{contenu.data.expediteur}</dd>
                <dt className="font-bold">Réponses à</dt><dd className="break-words">{contenu.data.reponse}</dd>
                <dt className="font-bold">Objet</dt><dd className="break-words">{contenu.data.objet}</dd>
              </dl>
              {vue === "email" ? (
                <iframe title="Aperçu de l'e-mail" sandbox="" srcDoc={contenu.data.html} className="w-full h-[65vh] border-2 border-encre bg-background" />
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-[13px] border-2 border-encre bg-background p-3 max-h-[65vh] overflow-y-auto">{contenu.data.texte}</pre>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer {NOM_ONDE} n°{numero} à {pluriel(d?.destinataires ?? 0, "personne", "personnes")} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un numéro ne part qu'une fois : après cet envoi, il ne pourra plus être renvoyé. Une copie « [À transférer] » part aussi à {d?.copie}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmer(false); envoi.mutate("envoyer"); }}>
              Envoyer à {pluriel(d?.destinataires ?? 0, "personne", "personnes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default EnvoiOnde;

