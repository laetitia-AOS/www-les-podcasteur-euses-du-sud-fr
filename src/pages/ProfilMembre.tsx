import { useEffect, useMemo } from "react";
import { compterStat } from "@/lib/stats";
import { collabLabel } from "@/lib/inscription";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { PAGES, SITE_NAME, SITE_URL, breadcrumbLd, descriptionSeo, ficheHref, titreSeo } from "@/lib/seo";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play } from "lucide-react";
import { withUtm } from "@/lib/utm";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import MembreContactForm from "@/components/MembreContactForm";
import { usePlayer } from "@/contexts/PlayerContext";
import { usePodcastEpisodes } from "@/lib/episodes";
import {
  btnListen,
  btnPrimary,
  btnSecondary,
  cleanCity,
  container,
  formatDuration,
  formatName,
  formatShortDate,
  fullName as makeFullName,
} from "@/lib/pds";

// L'e-mail et le téléphone ne sont volontairement jamais demandés ici.
const PUBLIC_FIELDS =
  "id, slug, prenom, nom, type_profil, city_name, department_label, bio_750, lien_principal, lien_linkedin, nom_podcast, lien_ecoute, flux_rss, description, vignette_url, photo_profil_url, thematique, type_podcast, metier_principal, services_3, structure, cherche_choix, apporte_choix, cherche_precision, apporte_precision, format_collaboration, consent_contact";

interface ProfileData {
  id: string;
  slug: string | null;
  prenom: string | null;
  nom: string | null;
  type_profil: string;
  city_name: string | null;
  department_label: string | null;
  bio_750: string | null;
  lien_principal: string | null;
  lien_linkedin: string | null;
  nom_podcast: string | null;
  lien_ecoute: string | null;
  flux_rss: string | null;
  description: string;
  vignette_url: string | null;
  photo_profil_url: string | null;
  thematique: string | null;
  type_podcast: string | null;
  metier_principal: string | null;
  services_3: string[] | null;
  structure: string | null;
  cherche_choix: string[] | null;
  apporte_choix: string[] | null;
  cherche_precision: string | null;
  apporte_precision: string | null;
  format_collaboration: string | null;
  consent_contact: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  podcasteur: "Podcast",
  pro_podcast: "Acteur·ice de l'écosystème",
  soutien: "Soutien",
  structure_eco: "Structure",
  studio: "Studio",
};

const SITE = SITE_URL;
const isPlaceholderLink = (url?: string | null) => !url || /les-podcasteur-euses-du-sud\.fr\/?$/.test(url);

const platformLabel = (url: string): string => {
  const h = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  if (h.includes("spotify")) return "Spotify";
  if (h.includes("apple")) return "Apple Podcasts";
  if (h.includes("deezer")) return "Deezer";
  if (h.includes("ausha")) return "Ausha";
  if (h.includes("acast")) return "Acast";
  if (h.includes("youtube") || h.includes("youtu.be")) return "YouTube";
  if (h.includes("linktr")) return "Tous les liens";
  return "Lien d'écoute";
};

const ProfilMembre = () => {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const { play, isCurrent, playing } = usePlayer();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profil-membre", slug],
    enabled: !!slug,
    queryFn: async () => {
      let query = supabase.from("podcasts").select(PUBLIC_FIELDS).eq("valide", true);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug!);
      query = isUuid ? query.eq("id", slug!) : query.eq("slug", slug!);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as unknown as ProfileData | null;
    },
  });

  const isPodcast = profile?.type_profil === "podcasteur" && !!profile?.nom_podcast;
  const { data: epData, isLoading: epLoading } = usePodcastEpisodes(isPodcast ? profile?.id : undefined);
  const episodes = epData?.episodes || [];

  const prenom = formatName(profile?.prenom);
  const name = profile ? makeFullName(profile.prenom, profile.nom) : "";
  const city = cleanCity(profile?.city_name);
  const title = profile ? (isPodcast ? profile.nom_podcast! : name || profile.structure || "Profil") : "";
  const intro = profile ? (isPodcast ? profile.description : profile.bio_750 || profile.description) : "";
  useEffect(() => { if (profile?.id) compterStat(profile.id, "vue"); }, [profile?.id]);
  // Une seule adresse par fiche : /ecouter/… pour un podcast, /annuaire/… pour un·e pro (les anciennes adresses y mènent)
  const canonicalPath = profile ? ficheHref(profile) : pathname;
  const lieu = city ? `à ${city}` : "en Région Sud";
  const rubrique = isPodcast ? { name: "Écouter", path: PAGES.ecouter } : { name: "Annuaire", path: PAGES.annuaire };
  const photoPro = profile && !isPodcast ? profile.photo_profil_url || profile.vignette_url : null;

  const jsonLd = useMemo(() => {
    if (!profile) return undefined;
    if (isPodcast) {
      return {
        "@context": "https://schema.org",
        "@type": "PodcastSeries",
        name: profile.nom_podcast,
        description: profile.description,
        url: `${SITE}${canonicalPath}`,
        ...(profile.vignette_url && { image: profile.vignette_url }),
        ...(profile.flux_rss && { webFeed: profile.flux_rss }),
        ...(profile.thematique && { genre: profile.thematique }),
        inLanguage: "fr",
        author: { "@type": "Person", name, ...(city && { address: { "@type": "PostalAddress", addressLocality: city, addressRegion: "Provence-Alpes-Côte d'Azur", addressCountry: "FR" } }) },
        ...(!isPlaceholderLink(profile.lien_ecoute) && { sameAs: [profile.lien_ecoute] }),
        ...(episodes.length > 0 && {
          episode: episodes.map((ep) => ({
            "@type": "PodcastEpisode",
            name: ep.title,
            url: ep.link || `${SITE}${canonicalPath}`,
            ...(ep.summary && { description: ep.summary }),
            ...(ep.date && { datePublished: ep.date }),
            ...(ep.duration && { timeRequired: `PT${Math.floor(ep.duration / 60)}M${ep.duration % 60}S` }),
            ...(ep.image && { image: ep.image }),
            associatedMedia: { "@type": "MediaObject", contentUrl: ep.audioUrl },
            partOfSeries: { "@type": "PodcastSeries", name: profile.nom_podcast, url: `${SITE}${canonicalPath}` },
          })),
        }),
      };
    }
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      url: `${SITE}${canonicalPath}`,
      ...(intro && { description: intro }),
      ...(profile.metier_principal && { jobTitle: profile.metier_principal }),
      ...(city && { address: { "@type": "PostalAddress", addressLocality: city, addressRegion: "Provence-Alpes-Côte d'Azur", addressCountry: "FR" } }),
      ...(photoPro && { image: photoPro }),
      memberOf: { "@type": "Organization", name: SITE_NAME, url: SITE },
    };
  }, [profile, isPodcast, name, city, intro, canonicalPath, episodes, photoPro]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 md:pt-[76px]"><p className={`${container} py-20 font-mono text-muted-foreground`}>Chargement…</p></main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title={titreSeo("Fiche introuvable")} description="Cette fiche n'existe pas ou n'est pas encore visible." path={pathname} noindex />
        <Navbar />
        <main className={`${container} pt-32 pb-24`}>
          <h1 className="title-page text-[56px]">Fiche introuvable</h1>
          <p className="mt-4 text-lg">Cette fiche n'existe pas, ou elle n'est pas encore visible sur le site.</p>
          <Link to="/annuaire" className={`${btnSecondary} mt-8`}>Voir l'annuaire</Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (pathname !== canonicalPath) return <Navigate to={{ pathname: canonicalPath, hash: window.location.hash }} replace />;

  const cherche = (profile.cherche_choix || []).map(collabLabel);
  const apporte = (profile.apporte_choix || []).map(collabLabel);
  const latest = episodes[0];
  const latestActive = latest ? isCurrent(latest) && playing : false;

  const alsoOn: { label: string; href: string }[] = [];
  if (!isPlaceholderLink(profile.lien_ecoute)) alsoOn.push({ label: platformLabel(profile.lien_ecoute!), href: withUtm(profile.lien_ecoute!, "fiche-membre") });
  if (profile.lien_principal && profile.lien_principal !== profile.lien_ecoute) alsoOn.push({ label: "Site", href: withUtm(profile.lien_principal, "fiche-membre") });
  if (profile.lien_linkedin) alsoOn.push({ label: "LinkedIn", href: withUtm(profile.lien_linkedin, "fiche-membre") });
  if (profile.flux_rss) alsoOn.push({ label: "Flux RSS", href: profile.flux_rss });

  const metier = (profile.metier_principal || "").trim() || "pro de l'audio";
  const seoTitle = titreSeo(
    isPodcast ? `${(profile.nom_podcast || "").trim()}, podcast de ${name} ${lieu}` : `${name}, ${metier} ${lieu}`,
  );
  const seoDesc = descriptionSeo([
    isPodcast ? `${(profile.nom_podcast || "").trim()}, podcast de ${name} ${lieu}` : `${name}, ${metier} ${lieu}, en Région Sud`,
    intro,
  ]);
  const seoImage = isPodcast ? profile.vignette_url : photoPro;
  const ld = [jsonLd, breadcrumbLd([{ name: "Accueil", path: "/" }, rubrique, { name: title, path: canonicalPath }])];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seoTitle} description={seoDesc} path={canonicalPath} image={seoImage || undefined} type={isPodcast ? "website" : "profile"} jsonLd={ld} />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-6`}>
          <nav aria-label="Fil d'Ariane" className="text-sm">
            <ol className="flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
              <li><Link to="/" className="inline-flex min-h-[32px] items-center hover:underline underline-offset-4">Accueil</Link> <span aria-hidden>/</span></li>
              <li><Link to={rubrique.path} className="inline-flex min-h-[32px] items-center hover:underline underline-offset-4">{rubrique.name}</Link> <span aria-hidden>/</span></li>
              <li aria-current="page" className="inline-flex min-h-[32px] items-center text-foreground font-semibold">{title}</li>
            </ol>
          </nav>
        </div>

        {/* En-tête */}
        <section className={`${container} pt-4 pb-12 grid md:grid-cols-[minmax(0,5fr)_minmax(0,9fr)] gap-8 md:gap-12 items-start`}>
          <div className="aspect-square bg-muted overflow-hidden max-w-[420px] w-full">
            {(isPodcast ? profile.vignette_url : photoPro) ? (
              <img src={(isPodcast ? profile.vignette_url : photoPro)!} alt={isPodcast ? `Pochette du podcast ${profile.nom_podcast}` : `Photo de ${name}`} className="w-full h-full object-cover" />
            ) : (
              <span className="flex w-full h-full items-center justify-center bg-primary text-primary-foreground title-section text-3xl p-6 text-center">{title}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary">
              {ROLE_LABELS[profile.type_profil] || "Membre"}
              {isPodcast && profile.thematique && profile.thematique !== "Autre" ? ` · ${profile.thematique}` : ""}
              {!isPodcast && profile.metier_principal ? ` · ${profile.metier_principal}` : ""}
            </p>
            <h1 className="title-page text-[48px] sm:text-[72px] lg:text-[88px] mt-2 break-words">{title}</h1>
            {isPodcast ? (
              <p className="mt-4 text-[17px]">
                par <strong>{name}</strong>{city ? ` · ${city}` : ""}
              </p>
            ) : (
              city && <p className="mt-4 text-[17px]">{city}{profile.structure ? ` · ${profile.structure}` : ""}</p>
            )}
            {intro && <p className="mt-5 text-lg leading-relaxed max-w-[60ch] whitespace-pre-line">{intro}</p>}

            <div className="mt-7 flex flex-wrap gap-3">
              {isPodcast && latest && (
                <button onClick={() => play(latest)} className={`${btnPrimary} px-6`}>
                  {latestActive ? <Pause className="w-4 h-4" fill="currentColor" aria-hidden /> : <Play className="w-4 h-4" fill="currentColor" aria-hidden />}
                  {latestActive ? "Mettre en pause" : "Écouter le dernier épisode"}
                </button>
              )}
              {isPodcast && !latest && !epLoading && !isPlaceholderLink(profile.lien_ecoute) && (
                <a href={withUtm(profile.lien_ecoute!, "fiche-membre")} onClick={() => compterStat(profile.id, "ecoute")} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} px-6`}>
                  <Play className="w-4 h-4" fill="currentColor" aria-hidden /> Écouter<span className="sr-only"> (nouvel onglet)</span>
                </a>
              )}
              {profile.consent_contact && (
                <a href="#ecrire" className={btnSecondary}>Proposer une collab</a>
              )}
            </div>

            {alsoOn.length > 0 && (
              <p className="mt-5 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-muted-foreground">{isPodcast ? "Aussi sur" : "Liens"}</span>
                {alsoOn.map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[36px] items-center underline underline-offset-4 hover:text-primary">
                    {l.label}
                  </a>
                ))}
              </p>
            )}
          </div>
        </section>

        {/* Cherche / Apporte */}
        {(cherche.length > 0 || apporte.length > 0 || !!profile.cherche_precision || !!profile.apporte_precision || profile.consent_contact) && (
          <section aria-label="Ce que ce membre cherche et apporte" className="bg-surface border-y border-filet">
            <div className={`${container} py-8 grid md:grid-cols-[1fr_1fr_auto] gap-6 md:gap-10 items-center`}>
              {(cherche.length > 0 || profile.cherche_precision) ? (
                <div>
                  <h2 className="text-sm font-bold [font-stretch:100%] leading-normal text-primary">{prenom || "Ce membre"} cherche</h2>
                  <ul className="mt-1 font-bold text-[19px] leading-snug">
                    {cherche.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                  {profile.cherche_precision && <p className="mt-1 text-[15px] text-muted-foreground">{profile.cherche_precision}</p>}
                </div>
              ) : <div />}
              {(apporte.length > 0 || profile.apporte_precision) ? (
                <div>
                  <h2 className="text-sm font-bold [font-stretch:100%] leading-normal text-accent-text">{prenom || "Ce membre"} apporte</h2>
                  <ul className="mt-1 font-bold text-[19px] leading-snug">
                    {apporte.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                  {profile.apporte_precision && <p className="mt-1 text-[15px] text-muted-foreground">{profile.apporte_precision}</p>}
                </div>
              ) : <div />}
              {profile.consent_contact && (
                <a href="#ecrire" className={`${btnListen} self-start md:self-center`}>Proposer une collab</a>
              )}
            </div>
          </section>
        )}

        {/* Services (acteur·ices de l'écosystème) */}
        {!isPodcast && profile.services_3 && profile.services_3.length > 0 && (
          <section className={`${container} pt-14`} aria-labelledby="services-title">
            <h2 id="services-title" className="title-section text-[40px] sm:text-[52px] pb-4 border-b-2 border-encre">Services</h2>
            <ul className="divide-y divide-filet border-b border-filet">
              {profile.services_3.map((s) => <li key={s} className="py-4 text-[17px] font-semibold">{s}</li>)}
            </ul>
          </section>
        )}

        {/* Présentation longue pour un podcast */}
        {isPodcast && profile.bio_750 && profile.bio_750 !== profile.description && (
          <section className={`${container} pt-14`} aria-labelledby="bio-title">
            <h2 id="bio-title" className="title-section text-[40px] sm:text-[52px] pb-4 border-b-2 border-encre">À propos</h2>
            <p className="pt-5 text-[17px] leading-relaxed max-w-[70ch] whitespace-pre-line">{profile.bio_750}</p>
          </section>
        )}

        {/* Épisodes */}
        {isPodcast && (
          <section className={`${container} pt-14`} aria-labelledby="episodes-title">
            <h2 id="episodes-title" className="title-section text-[44px] sm:text-[56px] pb-4 border-b-2 border-encre">Épisodes</h2>
            {epLoading ? (
              <p className="py-6 font-mono text-sm text-muted-foreground">Chargement des épisodes…</p>
            ) : episodes.length === 0 ? (
              <p className="py-6 text-[17px] border-b border-filet">
                Les épisodes ne sont pas encore affichés ici.
                {!isPlaceholderLink(profile.lien_ecoute) && (
                  <> <a href={withUtm(profile.lien_ecoute!, "fiche-membre")} onClick={() => compterStat(profile.id, "ecoute")} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">Écouter sur {platformLabel(profile.lien_ecoute!)}</a>.</>
                )}
              </p>
            ) : (
              <>
                <ul className="divide-y divide-filet border-b border-filet">
                  {episodes.map((ep, i) => {
                    const active = isCurrent(ep) && playing;
                    return (
                      <li key={ep.audioUrl} className="grid grid-cols-[44px_1fr] sm:grid-cols-[44px_1fr_auto] gap-x-4 gap-y-1 py-4 items-center">
                        <button
                          onClick={() => play(ep)}
                          className={`w-11 h-11 rounded-full border-2 border-primary inline-flex items-center justify-center ${i === 0 || active ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary hover:text-primary-foreground"}`}
                          aria-label={`${active ? "Mettre en pause" : "Écouter"} : ${ep.title}`}
                        >
                          {active ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
                        </button>
                        <div className="min-w-0">
                          <p className="font-bold text-[17px] leading-tight">{ep.title}</p>
                          {ep.summary && <p className="text-sm text-muted-foreground mt-1">{ep.summary}</p>}
                        </div>
                        <p className="col-start-2 sm:col-start-auto font-mono text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {[formatShortDate(ep.date), formatDuration(ep.duration)].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-sm text-muted-foreground">Les 10 derniers épisodes, mis à jour toutes les 6 heures depuis le flux RSS.</p>
              </>
            )}
          </section>
        )}

        {/* Écrire */}
        {profile.consent_contact && (
          <section id="ecrire" className={`${container} pt-14 pb-20 scroll-mt-24`} aria-labelledby="ecrire-title">
            <div className="border-2 border-encre bg-surface p-6 sm:p-8 grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 md:gap-10">
              <div>
                <h2 id="ecrire-title" className="title-section text-[30px] sm:text-[36px]">Proposer une collab à {prenom || name}</h2>
                <p className="mt-3 text-[15px] text-muted-foreground">
                  Votre proposition arrive dans son espace membre, et il ou elle vous répond directement à votre adresse. Son e-mail et son téléphone ne sont jamais affichés.
                </p>
              </div>
              <MembreContactForm recipientId={profile.id} recipientFirstName={prenom} />
            </div>
          </section>
        )}
        {!profile.consent_contact && <div className="pb-20" />}
      </main>
      <Footer />
    </div>
  );
};

export default ProfilMembre;
