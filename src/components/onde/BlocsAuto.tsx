// Affichage des blocs automatiques de L'Onde du Sud (page publique et aperçu).
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import MemberAvatar from "@/components/MemberAvatar";
import TexteRiche from "@/components/onde/TexteRiche";
import BoutonEcoute, { type Resoudre } from "@/components/onde/BoutonEcoute";
import { eventHref } from "@/components/agenda/EventRow";
import { cityFromAddress, isOnline } from "@/components/home/useHomeData";
import { dateLongue, horairesParis, jourCourt, readableTitle, surPlusieursJours } from "@/lib/events";
import { ficheHref } from "@/lib/seo";
import { btnSecondary, cleanCity, fullName, linkUnderline, titreFiche } from "@/lib/pds";
import { origineEvenement, useEvenementsChoisis, useNouveauxMembres, usePodcastChoisi } from "@/lib/ondeBlocs";
import type { BlocAudio, BlocEvenements, BlocNouveauxMembres, BlocPodcast, NumeroOnde } from "@/lib/onde";

const Attente = () => <p className="text-muted-foreground" aria-busy="true">Chargement…</p>;

export const VueEvenements = ({ b }: { b: BlocEvenements }) => {
  const { data, isLoading } = useEvenementsChoisis(b.evenements);
  if (!b.evenements.length) return null;
  if (isLoading) return <Attente />;
  const evts = data || [];
  if (!evts.length) {
    return <p className="text-muted-foreground">Ces rendez-vous ne sont plus à l'agenda. <Link to="/agenda" className={linkUnderline}>Voir l'agenda</Link></p>;
  }
  return (
    <ul className="border-t-2 border-encre">
      {evts.map((e) => {
        const titre = readableTitle(e.titre);
        const ville = cityFromAddress(e.adresse);
        const quand = surPlusieursJours(e.date_debut, e.date_fin)
          ? dateLongue(e.date_debut, e.date_fin)
          : `${dateLongue(e.date_debut)} · ${horairesParis(e.date_debut, e.date_fin)}`;
        return (
          <li key={e.id} className="grid grid-cols-[76px_1fr] sm:grid-cols-[104px_1fr] gap-x-5 py-5 border-b border-filet">
            <p className="title-section text-[28px] sm:text-[38px] leading-none"><time dateTime={e.date_debut}>{jourCourt(e.date_debut, e.date_fin)}</time></p>
            <div className="min-w-0">
              <p className="text-sm font-bold text-accent-text">{origineEvenement(e)}</p>
              <h3 className="font-bold text-[20px] sm:text-[22px] leading-tight mt-1">
                <Link to={eventHref(e)} className="hover:underline underline-offset-4">{titre}</Link>
              </h3>
              <p className="font-mono text-[13px] mt-2">{quand}</p>
              <p className="text-[15px] text-muted-foreground mt-1">
                {isOnline(e)
                  ? <span className="inline-flex items-center gap-1.5"><Globe className="w-4 h-4" aria-hidden /> En ligne</span>
                  : [e.lieu, ville].filter(Boolean).join(", ")}
              </p>
              <Link to={eventHref(e)} className={`${linkUnderline} text-[15px] inline-flex items-center min-h-[44px]`}>
                Voir l'événement<span className="sr-only"> : {titre}</span>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export const VuePodcast = ({ b, n, resoudre }: { b: BlocPodcast; n: NumeroOnde; resoudre: Resoudre }) => {
  const { data: p, isLoading } = usePodcastChoisi(b.podcast_id || undefined);
  if (b.podcast_id && isLoading) return <Attente />;
  const nomPodcast = p ? titreFiche(p) : "";
  const createur = p ? fullName(p.prenom, p.nom) : "";
  const ville = p ? cleanCity(p.city_name) : "";
  const href = p ? ficheHref(p) : "";
  const extrait: BlocAudio | undefined = b.url
    ? { id: b.id, type: "audio", url: b.url, titre: b.titre || (nomPodcast ? `Extrait de ${nomPodcast}` : "Extrait"), podcast: nomPodcast, createur, lien: href }
    : undefined;
  return (
    <div className={`border-2 border-encre bg-surface ${p ? "grid sm:grid-cols-[220px_1fr]" : ""}`}>
      {p && (
        <Link to={href} className="block sm:border-r-2 border-b-2 sm:border-b-0 border-encre focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" tabIndex={-1} aria-hidden>
          {p.vignette_url
            ? <img src={p.vignette_url} alt="" loading="lazy" className="block w-full aspect-square object-cover" />
            : <span className="block w-full aspect-square bg-primary" />}
        </Link>
      )}
      <div className="p-5 sm:p-6 space-y-4 min-w-0">
        {p && (
          <div>
            <h3 className="title-section text-[26px] sm:text-[32px] leading-tight">{nomPodcast}</h3>
            {(createur || ville) && <p className="text-[15px] text-muted-foreground mt-1">{[createur, ville].filter(Boolean).join(" · ")}</p>}
          </div>
        )}
        {b.texte && <TexteRiche texte={b.texte} className="text-[17px] leading-relaxed" />}
        {extrait && (
          <div className="flex items-center gap-4">
            <BoutonEcoute n={n} extrait={extrait} resoudre={resoudre} label={extrait.titre || "extrait"} />
            <p className="font-bold leading-snug">{extrait.titre}</p>
          </div>
        )}
        {p && (
          <Link to={href} className={btnSecondary}>
            Voir la fiche du podcast<span className="sr-only"> {nomPodcast}</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export const VueNouveauxMembres = ({ b, n }: { b: BlocNouveauxMembres; n: NumeroOnde }) => {
  const { data, isLoading } = useNouveauxMembres(n.id, b.id);
  if (isLoading) return <Attente />;
  const cartes = data || [];
  if (!cartes.length) return <p className="text-muted-foreground">Pas de nouvelle fiche à présenter ce mois-ci : rendez-vous dans le prochain numéro.</p>;
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cartes.map((c) => {
        const nom = fullName(c.prenom, c.nom);
        const ville = cleanCity(c.ville);
        return (
          <li key={c.id} className="border-2 border-encre bg-surface p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <MemberAvatar prenom={c.prenom} nom={c.nom} photoUrl={c.photo_url} />
              <div className="min-w-0">
                <h3 className="font-bold text-[18px] leading-tight">{nom}</h3>
                {ville && <p className="text-sm text-muted-foreground">{ville}</p>}
              </div>
            </div>
            <p className="text-[15px]"><span className="text-muted-foreground">Podcast : </span><span className="font-semibold">{titreFiche({ nom_podcast: c.nom_podcast })}</span></p>
            <Link to={ficheHref(c)} className={`${linkUnderline} text-[15px] mt-auto inline-flex items-center min-h-[44px]`}>
              Voir sa page<span className="sr-only"> : {nom}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
