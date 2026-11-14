import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import TexteRiche from "@/components/onde/TexteRiche";
import BoutonEcoute, { type Resoudre } from "@/components/onde/BoutonEcoute";
import { VueEvenements, VueNouveauxMembres, VuePodcast } from "@/components/onde/BlocsAuto";
import { VueDepot } from "@/components/onde/BlocDepot";
import EncartDepot from "@/components/onde/EncartDepot";
import PiedNumero from "@/components/onde/PiedNumero";
import { ImpressionCtx, QrEcoute, SonCtx, useImpression } from "@/components/onde/impressionOnde";
import { ANCRE_ECOUTER, ancreBloc } from "@/lib/ondePied";
import { container, btnPrimary, linkUnderline } from "@/lib/pds";
import { NOM_ONDE, etiquetteNumero, lienSur, numeroRubrique, type Bloc, type Chiffre, type NumeroOnde } from "@/lib/onde";

const identite: Resoudre = (u) => u;

const Chiffres = ({ chiffres }: { chiffres: Chiffre[] }) => {
  const cs = chiffres.filter((c) => c.valeur || c.libelle);
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
  const impression = useImpression();
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
          {!impression && <BoutonEcoute n={n} extrait={b} resoudre={resoudre} label={b.titre || "extrait"} />}
          <div className="min-w-0">
            <p className="font-bold text-[18px] leading-snug">{b.titre || "Extrait"}</p>
            {qui && <p className="text-[15px] text-muted-foreground mt-0.5">{qui}</p>}
            {b.lien && lienSur(b.lien) && (
              <Lien href={b.lien} className={`${linkUnderline} text-[15px] mt-2 inline-flex items-center gap-1 min-h-[44px]`}>
                Écouter l'épisode complet <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              </Lien>
            )}
            {impression && b.url && <QrEcoute libelle="Écouter l'extrait" className="mt-4" />}
          </div>
        </div>
      );
    }
    case "bouton":
      return b.libelle && b.lien && lienSur(b.lien) ? <Lien href={b.lien} className={btnPrimary}>{b.libelle}</Lien> : null;
    case "chiffres":
      return <Chiffres chiffres={b.chiffres} />;
    case "trimestre":
      return (
        <div className="space-y-8">
          {b.titre && <h2 className="title-section text-[30px] sm:text-[36px]">{b.titre}</h2>}
          {b.texte && <TexteRiche texte={b.texte} className="text-[17px] leading-relaxed max-w-[68ch]" />}
          <Chiffres chiffres={b.chiffres} />
        </div>
      );
    case "evenements":
      return <VueEvenements b={b} />;
    case "podcast":
      return <VuePodcast b={b} n={n} resoudre={resoudre} />;
    case "nouveaux_membres":
      return <VueNouveauxMembres b={b} n={n} />;
    case "depot":
      return <VueDepot b={b} n={n} resoudre={resoudre} />;
  }
};

/**
 * Un numéro de L'Onde du Sud tel qu'il s'affiche sur le site : titre (seul H1), chapeau,
 * bandeau « Écouter ce numéro », couverture puis blocs numérotés 01, 02, 03…, l'encart « Déposer pour L'Onde »
 * et le pied fixe (« Ce que l'adhésion t'ouvre », abonnement, adhésion, don).
 * « resoudre » : pour l'aperçu d'un brouillon, remplace les adresses des fichiers par des liens temporaires.
 * « impression » : version PDF (admin), chaque son remplacé par un QR code et un lien court.
 * « lienAbonnement » : cible du bouton « Recevoir L'Onde chaque mois » (formulaire de la page, sinon /onde#recevoir).
 * Ancres : #ecouter (version audio du numéro), #b01, #b02… (blocs), cibles des liens courts /o/1, /o/1/02.
 */
const NumeroVue = ({ n, resoudre = identite, impression = false, lienAbonnement }: { n: NumeroOnde; resoudre?: Resoudre; impression?: boolean; lienAbonnement?: string }) => (
  <ImpressionCtx.Provider value={impression}>
  <article className={impression ? "onde-pdf" : undefined}>
    <header className={`${container} pt-6 pb-8`}>
      <p className="font-mono text-sm font-bold uppercase tracking-wider text-primary">{NOM_ONDE} · {etiquetteNumero(n)}</p>
      <h1 className="title-section text-[40px] sm:text-[56px] lg:text-[64px] mt-2 max-w-[22ch]">{n.titre || "Sans titre"}</h1>
      {n.chapeau && <p className="mt-5 text-lg sm:text-xl max-w-[62ch]">{n.chapeau}</p>}
    </header>

    {n.audio_url && (
      <section id={ANCRE_ECOUTER} aria-label="Version audio du numéro" className="scroll-mt-24 bg-primary text-primary-foreground break-inside-avoid">
        <div className={`${container} py-5 flex items-center gap-4`}>
          {impression ? (
            <SonCtx.Provider value={{ numero: n.numero }}>
              <QrEcoute libelle={n.audio_voix ? `Écouter ce numéro, lu par ${n.audio_voix}` : "Écouter ce numéro"} />
            </SonCtx.Provider>
          ) : (
            <>
              <BoutonEcoute n={n} resoudre={resoudre} label="ce numéro" />
              <div className="min-w-0">
                <p className="font-display font-black text-[22px] sm:text-[26px] leading-tight">Écouter ce numéro</p>
                {n.audio_voix && <p className="text-[15px] text-primary-foreground/85">Lu par {n.audio_voix}, la voix du mois</p>}
              </div>
            </>
          )}
        </div>
      </section>
    )}

    {n.couverture_url && (
      <div className={`${container} pt-8`}>
        <img src={resoudre(n.couverture_url)} alt={n.couverture_alt || ""} className="block w-full max-h-[620px] object-cover border border-filet" />
      </div>
    )}

    <div className={`${container} py-12 md:py-16 print:py-8`}>
      <div className="max-w-[820px] space-y-14 print:space-y-10">
        {n.blocs.map((b, i) => (
          <section key={b.id || i} id={ancreBloc(numeroRubrique(i))} aria-labelledby={`rubrique-${i}`} className="scroll-mt-24">
            <p id={`rubrique-${i}`} className="font-mono text-sm font-bold uppercase tracking-wider text-accent-text pb-2 mb-5 border-b-2 border-encre break-after-avoid">
              <span className="text-foreground">{numeroRubrique(i)}</span>
              {b.rubrique ? <> — {b.rubrique}</> : null}
            </p>
            <SonCtx.Provider value={{ numero: n.numero, rubrique: numeroRubrique(i) }}>
              <ContenuBloc b={b} n={n} resoudre={resoudre} />
            </SonCtx.Provider>
          </section>
        ))}
        <EncartDepot />
        <PiedNumero lienAbonnement={lienAbonnement} />
      </div>
    </div>
  </article>
  </ImpressionCtx.Provider>
);

export default NumeroVue;
