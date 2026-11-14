// Bloc « dépôt d'un·e membre » de L'Onde du Sud (lot 5) : affichage (page, aperçu) et champs de l'éditeur.
// « Déposé par » est relu dans la base à chaque affichage : rien n'est recopié dans le numéro.
import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink, X } from "lucide-react";
import TexteRiche from "@/components/onde/TexteRiche";
import BoutonEcoute, { type Resoudre } from "@/components/onde/BoutonEcoute";
import { Champ, ChampTexteRiche } from "@/components/onde/champsOnde";
import { Input } from "@/components/ui/input";
import { btnSecondary, linkUnderline } from "@/lib/pds";
import { LIMITES_ONDE, lienSur, type BlocAudio, type BlocDepot, type NumeroOnde } from "@/lib/onde";
import { creditDepot, useCreditsDepots } from "@/lib/ondeDepots";

const LienEcoute = ({ href }: { href: string }) =>
  href.startsWith("/") ? (
    <Link to={href} className={btnSecondary}>Écouter</Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
      Écouter <ExternalLink className="w-4 h-4" aria-hidden /><span className="sr-only"> (nouvel onglet)</span>
    </a>
  );

export const VueDepot = ({ b, n, resoudre }: { b: BlocDepot; n: NumeroOnde; resoudre: Resoudre }) => {
  const { data: credits } = useCreditsDepots(n.id, true);
  const qui = creditDepot(credits?.[b.depot_id]);
  const photo = b.photo?.url ? resoudre(b.photo.url) : undefined;
  const extrait: BlocAudio | undefined = b.url
    ? { id: b.id, type: "audio", url: b.url, titre: b.titre || "Extrait", podcast: "", createur: qui ? `Déposé par ${qui.nom}` : "", lien: qui?.href || "" }
    : undefined;
  const lien = b.lien && lienSur(b.lien) ? b.lien : null;
  return (
    <div className={`border-2 border-encre bg-surface ${photo ? "grid sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""}`}>
      {photo && (
        <img src={photo} alt={b.photo?.alt || ""} loading="lazy" className="block w-full aspect-[4/3] sm:aspect-auto sm:h-full object-cover border-b-2 sm:border-b-0 sm:border-r-2 border-encre" />
      )}
      <div className="p-5 sm:p-6 space-y-4 min-w-0">
        {b.titre && <h2 className="title-section text-[28px] sm:text-[34px] leading-tight">{b.titre}</h2>}
        {b.texte && <TexteRiche texte={b.texte} className="text-[17px] leading-relaxed" />}
        {(extrait || lien) && (
          <div className="flex flex-wrap items-center gap-4">
            {extrait && (
              <span className="inline-flex items-center gap-3">
                <BoutonEcoute n={n} extrait={extrait} resoudre={resoudre} label={b.titre || "le son déposé"} />
                <span className="font-bold">Écouter</span>
              </span>
            )}
            {lien && !extrait && <LienEcoute href={lien} />}
            {lien && extrait && (
              <a href={lien} target="_blank" rel="noopener noreferrer" className={`${linkUnderline} text-[15px] inline-flex items-center gap-1 min-h-[44px]`}>
                Écouter ailleurs <ExternalLink className="w-3.5 h-3.5" aria-hidden /><span className="sr-only"> (nouvel onglet)</span>
              </a>
            )}
          </div>
        )}
        {qui && (
          <p className="text-[15px] border-t border-filet pt-3">
            Déposé par {qui.href ? <Link to={qui.href} className={linkUnderline}>{qui.nom}</Link> : <strong>{qui.nom}</strong>}
          </p>
        )}
      </div>
    </div>
  );
};

/** Champs propres au bloc « dépôt » dans l'éditeur (étiquette et résumé pour l'e-mail sont communs à tous les blocs). */
export const EditeurDepot = ({ b, pid, numeroId, resoudre, onChange }: {
  b: BlocDepot; pid: string; numeroId: string; resoudre: (u: string) => string | undefined; onChange: (b: BlocDepot) => void;
}) => {
  const { data: credits, isSuccess } = useCreditsDepots(numeroId, true);
  const qui = creditDepot(credits?.[b.depot_id]);
  return (
    <div className="space-y-4">
      {isSuccess && !credits?.[b.depot_id] ? (
        <p role="alert" className="border-2 border-destructive p-3 text-[15px] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          Ce dépôt a été retiré par son auteur·ice : supprimez ce bloc, il ne pourra pas être publié.
        </p>
      ) : (
        <p className="text-[15px] bg-muted px-3 py-2">
          Déposé par <strong>{qui?.nom || "…"}</strong>
          {qui && !qui.href && <span className="text-muted-foreground"> (fiche pas visible sur le site pour le moment : le nom s'affiche sans lien)</span>}
          <span className="block text-xs text-muted-foreground mt-0.5">Mention affichée sous le bloc, sur la page et dans l'e-mail.</span>
        </p>
      )}
      <Champ id={`${pid}-titre`} label="Titre *" max={LIMITES_ONDE.titreBloc} n={(b.titre || "").length}>
        <Input id={`${pid}-titre`} value={b.titre || ""} onChange={(e) => onChange({ ...b, titre: e.target.value })} />
      </Champ>
      <Champ id={`${pid}-texte`} label="Texte" max={LIMITES_ONDE.presentation} n={(b.texte || "").length}>
        <ChampTexteRiche id={`${pid}-texte`} rows={5} value={b.texte || ""} onChange={(v) => onChange({ ...b, texte: v })} />
      </Champ>
      <div className="space-y-2">
        <p className="text-sm font-medium">Le son</p>
        {b.url ? (
          <div className="flex flex-wrap items-center gap-3">
            <audio controls preload="none" src={resoudre(b.url)} className="w-full max-w-xl" />
            <button type="button" className="text-sm underline underline-offset-4 inline-flex items-center gap-1 min-h-[44px]" onClick={() => onChange({ ...b, url: undefined })}>
              <X className="w-3 h-3" aria-hidden /> Retirer le MP3
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Pas de MP3 dans ce bloc.</p>
        )}
      </div>
      <Champ id={`${pid}-lien`} label="Lien d'écoute" aide="Une adresse qui commence par https://">
        <Input id={`${pid}-lien`} type="url" inputMode="url" placeholder="https://…" value={b.lien || ""} onChange={(e) => onChange({ ...b, lien: e.target.value })} />
      </Champ>
      {b.photo?.url && (
        <div className="grid sm:grid-cols-[200px_1fr] gap-4 items-start">
          <div className="relative">
            <img src={resoudre(b.photo.url)} alt="" className="w-full aspect-[4/3] object-cover border border-filet" />
            <button
              type="button"
              className="absolute top-2 right-2 inline-flex items-center justify-center w-10 h-10 border-2 border-encre bg-background hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => onChange({ ...b, photo: undefined })}
              aria-label="Retirer la photo"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
          <Champ id={`${pid}-alt`} label="Texte alternatif de la photo *" max={LIMITES_ONDE.alt} n={(b.photo.alt || "").length} aide="Décrivez la photo en une phrase, pour les personnes qui ne la voient pas.">
            <Input id={`${pid}-alt`} value={b.photo.alt || ""} aria-invalid={!(b.photo.alt || "").trim()} onChange={(e) => onChange({ ...b, photo: { ...b.photo!, alt: e.target.value } })} />
          </Champ>
        </div>
      )}
    </div>
  );
};
