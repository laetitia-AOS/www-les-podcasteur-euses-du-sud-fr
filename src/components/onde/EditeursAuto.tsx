// Éditeur de L'Onde du Sud : champs des blocs automatiques (agenda, podcast à l'écoute, nouveaux membres).
import { useState } from "react";
import { Globe, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BoutonFichier, Champ, ChampTexteRiche } from "@/components/onde/champsOnde";
import { cityFromAddress, isOnline } from "@/components/home/useHomeData";
import { jourCourt, readableTitle } from "@/lib/events";
import { btnSecondary, cleanCity, formatName, fullName, titreFiche } from "@/lib/pds";
import { LIMITES_ONDE, moisAnnee, type BlocEvenements, type BlocNouveauxMembres, type BlocPodcast } from "@/lib/onde";
import {
  dansLesJours, filtrerPodcasts, ligneBilan, origineEvenement, useBilanMembres, useEvenementsAVenir,
  useEvenementsChoisis, usePodcastChoisi, usePodcastsAnnuaire, type PodcastOnde,
} from "@/lib/ondeBlocs";

type Envoi = (cle: string, file: File, sorte: "image" | "audio", apres: (url: string) => void) => Promise<void>;

const Chargement = () => <Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none text-primary" aria-label="Chargement" />;

// ——— Événements de l'agenda ———

export const EditeurEvenements = ({ b, pid, onChange }: { b: BlocEvenements; pid: string; onChange: (b: BlocEvenements) => void }) => {
  const [plusLoin, setPlusLoin] = useState(false);
  const { data: aVenir, isLoading } = useEvenementsAVenir();
  const { data: choisis } = useEvenementsChoisis(b.evenements);
  const proches = (aVenir || []).filter((e) => plusLoin || dansLesJours(e));
  const plusTard = (aVenir || []).length - proches.length;
  // Les événements déjà cochés restent dans la liste, même passés ou plus lointains
  const liste = [...proches, ...(choisis || []).filter((c) => !proches.some((e) => e.id === c.id))]
    .sort((x, y) => x.date_debut.localeCompare(y.date_debut));
  const plein = b.evenements.length >= LIMITES_ONDE.evenementsMax;
  const disparus = b.evenements.filter((id) => choisis && !choisis.some((c) => c.id === id)).length;

  const basculer = (id: string) =>
    onChange({ ...b, evenements: b.evenements.includes(id) ? b.evenements.filter((x) => x !== id) : [...b.evenements, id] });

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium mb-1.5">Événements à mettre en avant *</legend>
      {isLoading ? <Chargement /> : liste.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun événement publié dans les {LIMITES_ONDE.joursAgenda} prochains jours.</p>
      ) : (
        <ul className="border-2 border-encre divide-y divide-filet bg-background">
          {liste.map((e) => {
            const coche = b.evenements.includes(e.id);
            const lieu = isOnline(e) ? "En ligne" : [e.lieu, cityFromAddress(e.adresse)].filter(Boolean).join(", ");
            return (
              <li key={e.id}>
                <label className={`flex items-start gap-3 px-3 py-3 cursor-pointer hover:bg-muted ${!coche && plein ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <input
                    type="checkbox"
                    className="w-5 h-5 mt-0.5 accent-primary shrink-0"
                    checked={coche}
                    disabled={!coche && plein}
                    onChange={() => basculer(e.id)}
                  />
                  <span className="min-w-0">
                    <span className="font-mono text-sm font-bold mr-2">{jourCourt(e.date_debut, e.date_fin)}</span>
                    <span className="font-bold">{readableTitle(e.titre)}</span>
                    <span className="block text-sm text-muted-foreground">
                      {isOnline(e) && <Globe className="inline w-3.5 h-3.5 mr-1 -mt-0.5" aria-hidden />}
                      {[lieu, origineEvenement(e)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {!plusLoin && plusTard > 0 && (
        <button type="button" className={btnSecondary} onClick={() => setPlusLoin(true)}>
          Afficher aussi les {plusTard} événement{plusTard > 1 ? "s" : ""} plus lointain{plusTard > 1 ? "s" : ""}
        </button>
      )}
      <p className="text-xs text-muted-foreground" id={`${pid}-aide-evts`}>
        {b.evenements.length} coché{b.evenements.length > 1 ? "s" : ""} sur {LIMITES_ONDE.evenementsMax} au maximum. Date, titre et lieu sont relus dans l'agenda à chaque affichage : si un événement change, le bloc suit.
      </p>
      {disparus > 0 && (
        <p className="text-sm font-bold text-destructive">
          {disparus} événement{disparus > 1 ? "s cochés ne sont" : " coché n'est"} plus publié{disparus > 1 ? "s" : ""} dans l'agenda : il{disparus > 1 ? "s ne s'affichent" : " ne s'affiche"} pas.
        </p>
      )}
    </fieldset>
  );
};

// ——— Podcast à l'écoute ———

const LignePodcast = ({ p }: { p: PodcastOnde }) => (
  <span className="flex items-center gap-3 min-w-0">
    {p.vignette_url ? <img src={p.vignette_url} alt="" className="w-12 h-12 object-cover border border-filet shrink-0" /> : <span className="w-12 h-12 bg-primary shrink-0" aria-hidden />}
    <span className="min-w-0">
      <span className="block font-bold truncate">{titreFiche(p)}</span>
      <span className="block text-sm text-muted-foreground truncate">{[fullName(p.prenom, p.nom), cleanCity(p.city_name)].filter(Boolean).join(" · ")}</span>
    </span>
  </span>
);

export const EditeurPodcast = ({
  b, pid, resoudre, envoi, envoyer, onChange,
}: {
  b: BlocPodcast; pid: string; resoudre: (u: string) => string; envoi: string | null; envoyer: Envoi; onChange: (b: BlocPodcast) => void;
}) => {
  const [recherche, setRecherche] = useState("");
  const { data: tous, isLoading } = usePodcastsAnnuaire();
  const { data: choisi } = usePodcastChoisi(b.podcast_id || undefined);
  const selection = (tous || []).find((p) => p.id === b.podcast_id) || choisi || null;
  const resultats = filtrerPodcasts(tous || [], recherche).slice(0, 8);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${pid}-recherche`}>Podcast de l'annuaire *</Label>
        {b.podcast_id ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-encre bg-background p-3">
            {selection ? <LignePodcast p={selection} /> : <span className="text-sm text-destructive font-bold">Cette fiche n'est plus visible dans l'annuaire : choisissez un autre podcast.</span>}
            <button type="button" className={btnSecondary} onClick={() => onChange({ ...b, podcast_id: "" })}>Changer de podcast</button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id={`${pid}-recherche`}
                className="pl-9"
                value={recherche}
                placeholder="Nom du podcast, du créateur·ice ou ville"
                onChange={(e) => setRecherche(e.target.value)}
                aria-describedby={`${pid}-nb-resultats`}
              />
            </div>
            {isLoading ? <Chargement /> : (
              <>
                <p id={`${pid}-nb-resultats`} className="text-xs text-muted-foreground" aria-live="polite">
                  {resultats.length ? `${filtrerPodcasts(tous || [], recherche).length} podcast(s) trouvé(s)${resultats.length < filtrerPodcasts(tous || [], recherche).length ? " : affinez la recherche pour voir les autres" : ""}.` : "Aucun podcast ne correspond."}
                </p>
                {resultats.length > 0 && (
                  <ul className="border-2 border-encre divide-y divide-filet bg-background">
                    {resultats.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                          onClick={() => { onChange({ ...b, podcast_id: p.id }); setRecherche(""); }}
                        >
                          <LignePodcast p={p} />
                          <span className="sr-only"> : choisir ce podcast</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground">Pochette, nom, créateur·ice et ville viennent de la fiche, à jour à chaque affichage.</p>
      </div>

      <Champ id={`${pid}-texte`} label="Texte de présentation *" max={LIMITES_ONDE.presentation} n={(b.texte || "").length}>
        <ChampTexteRiche id={`${pid}-texte`} rows={5} value={b.texte || ""} onChange={(v) => onChange({ ...b, texte: v })} />
      </Champ>

      <div className="space-y-2">
        <Label>Extrait audio (facultatif)</Label>
        {b.url && <audio controls preload="none" src={resoudre(b.url)} className="w-full max-w-xl" />}
        <div className="flex flex-wrap items-center gap-3">
          <BoutonFichier label={b.url ? "Remplacer le MP3" : "Envoyer un MP3"} accept="audio/mpeg,.mp3" enCours={envoi === pid} onFiles={(f) => f[0] && envoyer(pid, f[0], "audio", (url) => onChange({ ...b, url }))} />
          {b.url && (
            <button type="button" className="text-sm underline underline-offset-4 inline-flex items-center gap-1 min-h-[44px]" onClick={() => onChange({ ...b, url: "", titre: "" })}>
              <X className="w-3 h-3" aria-hidden /> Retirer l'extrait
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">MP3 de 20 Mo au maximum, lu dans le lecteur en bas de page.</p>
      </div>
      {b.url && (
        <Champ id={`${pid}-titre`} label="Titre de l'extrait" max={LIMITES_ONDE.titreBloc} n={(b.titre || "").length} aide={selection ? `Sans titre, il s'appelle « Extrait de ${titreFiche(selection)} ».` : undefined}>
          <Input id={`${pid}-titre`} value={b.titre || ""} onChange={(e) => onChange({ ...b, titre: e.target.value })} />
        </Champ>
      )}
    </>
  );
};

// ——— Les nouveaux membres du mois ———

const Noms = ({ titre, noms }: { titre: string; noms: string[] }) =>
  noms.length ? (
    <p className="text-sm"><span className="font-bold">{titre} : </span>{noms.map((x) => formatName(x)).join(", ")}</p>
  ) : null;

export const EditeurNouveauxMembres = ({ b, pid, numeroId, onChange }: { b: BlocNouveauxMembres; pid: string; numeroId: string; onChange: (b: BlocNouveauxMembres) => void }) => {
  const { data: bilan, isLoading, isError } = useBilanMembres(numeroId, b.id, b.mois);
  return (
    <>
      <div className="grid sm:grid-cols-[220px_1fr] gap-4 items-start">
        <Champ id={`${pid}-mois`} label="Mois des adhésions *">
          <Input id={`${pid}-mois`} type="month" value={(b.mois || "").slice(0, 7)} onChange={(e) => e.target.value && onChange({ ...b, mois: `${e.target.value}-01` })} />
        </Champ>
        <p className="text-sm text-muted-foreground sm:pt-7">
          Rempli automatiquement, rien à écrire. Par défaut, le mois qui précède celui du numéro.
        </p>
      </div>
      <div className="border-2 border-encre bg-background p-4 space-y-2" role="status" aria-live="polite">
        {isLoading ? <Chargement /> : isError || !bilan ? (
          <p className="text-sm text-destructive font-bold">Le calcul n'a pas pu être fait. Rechargez la page.</p>
        ) : (
          <>
            <p className="font-bold">{ligneBilan(bilan)}{b.mois ? ` (${moisAnnee(b.mois)})` : ""}</p>
            {bilan.reportes > 0 && (
              <p className="text-sm">Dont {bilan.reportes} personne{bilan.reportes > 1 ? "s" : ""} d'un mois précédent, dont la fiche est maintenant complète.</p>
            )}
            <Noms titre="Affiché·es" noms={bilan.affiches} />
            <Noms titre="En attente d'une fiche complète" noms={bilan.en_attente} />
            {bilan.deja > 0 && <p className="text-sm text-muted-foreground">{bilan.deja} déjà présenté·e{bilan.deja > 1 ? "s" : ""} dans un autre numéro : personne n'apparaît deux fois.</p>}
            <p className="text-xs text-muted-foreground">
              {bilan.fige
                ? "Liste arrêtée à la publication : elle ne change plus, et ces personnes n'apparaîtront dans aucun autre numéro."
                : "Apparaissent les personnes dont la première adhésion date de ce mois, avec une fiche validée, une photo de profil et un podcast. Les autres apparaîtront dans le numéro où leur fiche sera complète. La liste est arrêtée à la publication."}
            </p>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Ce cadre n'est visible que par l'équipe. Sur le site, chaque carte montre la photo, le nom, le podcast, la ville et un lien « Voir sa page ».</p>
    </>
  );
};
