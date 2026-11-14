import { Link } from "react-router-dom";
import { ExternalLink, Pause, Play } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import TexteRiche from "@/components/onde/TexteRiche";
import { container, btnPrimary, linkUnderline } from "@/lib/pds";
import {
  NOM_ONDE, episodeOnde, etiquetteNumero, lienSur, numeroRubrique,
  type Bloc, type BlocAudio, type NumeroOnde,
} from "@/lib/onde";

type Resoudre = (url: string) => string | undefined;
const identite: Resoudre = (u) => u;

const btnRond =
  "w-12 h-12 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center shrink-0 hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40";

/** Bouton lecture relié au lecteur du site (barre en bas de page). */
const BoutonEcoute = ({ n, extrait, resoudre, label }: { n: NumeroOnde; extrait?: BlocAudio; resoudre: Resoudre; label: string }) => {
  const { play, isCurrent, playing } = usePlayer();
  const ep = episodeOnde(n, extrait, resoudre);
  const actif = !!ep && isCurrent(ep) && playing;
  return (
    <button type="button" className={btnRond} disabled={!ep} onClick={() => ep && play(ep)} aria-label={actif ? `Mettre en pause : ${label}` : `Écouter : ${label}`}>
      {actif ? <Pause className="w-5 h-5" fill="currentColor" aria-hidden /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" aria-hidden />}
    </button>
  );
};

const Lien = ({ href, className, children }: { href: string; className: string; children: React.ReactNode }) =>
  href.startsWith("/") ? (
    <Link to={href} className={className}>{children}</Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}<span className="sr-only"> (nouvel onglet)</span>
    </a>
  );

const ContenuBloc = ({ b, n, resoudre }: { b: Bloc; n: NumeroOnde; resoudre: Resoudre }) => {
  switch (b.type) {
    case "texte":
      return (
        <>
          {b.titre && <h2 className="title-section text-[30px] sm:text-[36px] mb-4">{b.titre}</h2>}
          {b.texte && <TexteRiche texte={b.texte} className="text-[17px] leading-relaxed max-w-[68ch]" />}
        </>
      );
    case "images": {
      const imgs = b.images.filter((i) => i.url);
      if (!imgs.length) return null;
      if (imgs.length === 1) {
        return <img src={resoudre(imgs[0].url)} alt={imgs[0].alt || ""} loading="lazy" className="block w-full h-auto border border-filet" />;
      }
      return (
        <ul className={`grid gap-3 ${imgs.length === 2 || imgs.length === 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
          {imgs.map((img, i) => (
            <li key={`${img.url}-${i}`}>
              <img src={resoudre(img.url)} alt={img.alt || ""} loading="lazy" className="block w-full aspect-[4/3] object-cover border border-filet" />
            </li>
          ))}
        </ul>
      );
    }
    case "audio": {
      const qui = [b.podcast, b.createur].filter(Boolean).join(" · ");
      return (
        <div className="border-2 border-encre bg-surface p-5 flex items-start gap-4">
          <BoutonEcoute n={n} extrait={b} resoudre={resoudre} label={b.titre || "extrait"} />
          <div className="min-w-0">
            <p className="font-bold text-[18px] leading-snug">{b.titre || "Extrait"}</p>
            {qui && <p className="text-[15px] text-muted-foreground mt-0.5">{qui}</p>}
            {b.lien && lienSur(b.lien) && (
              <Lien href={b.lien} className={`${linkUnderline} text-[15px] mt-2 inline-flex items-center gap-1 min-h-[44px]`}>
                Écouter l'épisode complet <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              </Lien>
            )}
          </div>
        </div>
      );
    }
    case "bouton":
      return b.libelle && b.lien && lienSur(b.lien) ? <Lien href={b.lien} className={btnPrimary}>{b.libelle}</Lien> : null;
    case "chiffres": {
      const cs = b.chiffres.filter((c) => c.valeur || c.libelle);
      if (!cs.length) return null;
      return (
        <dl className={`grid grid-cols-2 ${cs.length === 3 ? "sm:grid-cols-3" : cs.length === 4 ? "sm:grid-cols-4" : ""} border-t-2 border-encre`}>
          {cs.map((c, i) => (
            <div key={i} className="py-4 pr-4 border-b border-filet">
              <dt className="sr-only">{c.libelle}</dt>
              <dd>
                <span className="block title-section text-[44px] sm:text-[56px] leading-none text-primary">{c.valeur}</span>
                <span aria-hidden className="block mt-2 text-[15px] font-semibold">{c.libelle}</span>
              </dd>
            </div>
          ))}
        </dl>
      );
    }
  }
};

/**
 * Un numéro de L'Onde du Sud tel qu'il s'affiche sur le site : titre (seul H1), chapeau,
 * bandeau « Écouter ce numéro », couverture puis blocs numérotés 01, 02, 03…
 * « resoudre » : pour l'aperçu d'un brouillon, remplace les adresses des fichiers par des liens temporaires.
 */
const NumeroVue = ({ n, resoudre = identite }: { n: NumeroOnde; resoudre?: Resoudre }) => (
  <article>
    <header className={`${container} pt-6 pb-8`}>
      <p className="font-mono text-sm font-bold uppercase tracking-wider text-primary">{NOM_ONDE} · {etiquetteNumero(n)}</p>
      <h1 className="title-section text-[40px] sm:text-[56px] lg:text-[64px] mt-2 max-w-[22ch]">{n.titre || "Sans titre"}</h1>
      {n.chapeau && <p className="mt-5 text-lg sm:text-xl max-w-[62ch]">{n.chapeau}</p>}
    </header>

    {n.audio_url && (
      <section aria-label="Version audio du numéro" className="bg-primary text-primary-foreground">
        <div className={`${container} py-5 flex items-center gap-4`}>
          <BoutonEcoute n={n} resoudre={resoudre} label="ce numéro" />
          <div className="min-w-0">
            <p className="font-display font-black text-[22px] sm:text-[26px] leading-tight">Écouter ce numéro</p>
            {n.audio_voix && <p className="text-[15px] text-primary-foreground/85">Lu par {n.audio_voix}, la voix du mois</p>}
          </div>
        </div>
      </section>
    )}

    {n.couverture_url && (
      <div className={`${container} pt-8`}>
        <img src={resoudre(n.couverture_url)} alt={n.couverture_alt || ""} className="block w-full max-h-[620px] object-cover border border-filet" />
      </div>
    )}

    <div className={`${container} py-12 md:py-16`}>
      <div className="max-w-[820px] space-y-14">
        {n.blocs.map((b, i) => (
          <section key={b.id || i} aria-labelledby={`rubrique-${i}`}>
            <p id={`rubrique-${i}`} className="font-mono text-sm font-bold uppercase tracking-wider text-accent-text pb-2 mb-5 border-b-2 border-encre">
              <span className="text-foreground">{numeroRubrique(i)}</span>
              {b.rubrique ? <> — {b.rubrique}</> : null}
            </p>
            <ContenuBloc b={b} n={n} resoudre={resoudre} />
          </section>
        ))}
      </div>
    </div>
  </article>
);

export default NumeroVue;
