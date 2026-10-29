import { useEffect, useMemo } from "react";
import { compterStat } from "@/lib/stats";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGES, SITE_URL, breadcrumbLd, descriptionSeo, ficheHref, titreSeo } from "@/lib/seo";
import MembreContactForm from "@/components/MembreContactForm";
import { AgendaLieu, FaqList, LogoLieu, PodcastsLiesList, faqJsonLd, sdOf, useLieu } from "@/components/studios/LieuParts";
import { btnPrimary, btnSecondary, cleanCity, container, linkUnderline } from "@/lib/pds";
import { ficheVide, formatDateCourte, liensLieu, useAnneeAdhesion, useFichesLieux } from "@/lib/lieux";

const SITE = SITE_URL;

/** Fiche publique d'une structure (radio, festival, incubateur…). */
const StructureEcoProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: s, isLoading } = useLieu("structure_eco", slug);
  useEffect(() => { if (s?.id) compterStat(s.id, "vue"); }, [s?.id]);
  const { data: fiches = {} } = useFichesLieux(s ? [s.id] : []);
  const f = (s && fiches[s.id]) || ficheVide(s?.id || "");
  const { data: annee } = useAnneeAdhesion(s?.id);
  const sd = sdOf(s);
  const city = cleanCity(s?.city_name);
  const type = s?.metier_principal || sd.type_structure || "Structure";

  // Partenaire (sans adhésion) : marqué « Partenaire » et non « Membre »
  const partenaire = sd.partenaire === true;

  const accroche = sd.phrase_accroche || sd.accroche || "";
  const description = s?.bio_750 || s?.description || "";
  const site = s?.lien_principal || f.liens[0]?.url || null;
  // Le site principal a son bouton en tête : la liste du bas montre les autres liens, chacun une seule fois
  const liens = liensLieu(site, f.liens, [s?.lien_linkedin]).filter((l) => l.url !== site);
  const titreMembres = f.intitule_membres === "antenne" ? "Membres passés à l'antenne" : "Membres accompagnés";

  const jsonLd = useMemo(() => {
    if (!s) return undefined;
    const org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: s.nom_podcast,
      url: `${SITE}${ficheHref(s)}`,
      ...(description && { description }),
      ...(s.vignette_url && { logo: s.vignette_url }),
      ...(city && { address: { "@type": "PostalAddress", addressLocality: city, addressRegion: "Provence-Alpes-Côte d'Azur", addressCountry: "FR" } }),
      ...((site || liens.length) && { sameAs: [site, ...liens.map((l) => l.url)].filter(Boolean) }),
      ...(!partenaire && { memberOf: { "@type": "Organization", name: "Les Podcasteur·euses du Sud", url: SITE } }),
    };
    const ariane = breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Studios", path: PAGES.studios }, { name: s.nom_podcast, path: ficheHref(s) }]);
    return [org, faqJsonLd(f.faq), ariane];
  }, [s, description, city, liens, site, partenaire, f.faq]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <main className="pt-16 md:pt-[76px]"><p className={`${container} py-20 font-mono text-muted-foreground`}>Chargement…</p></main>
      </div>
    );
  }
  if (!s) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <main className={`${container} pt-28 pb-20`}>
          <h1 className="title-page text-[44px]">Structure introuvable</h1>
          <Link to="/studios" className={`${linkUnderline} mt-6 inline-flex min-h-[44px] items-center`}>Voir les structures</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const seoTitle = titreSeo(`${s.nom_podcast}, ${type.toLowerCase()} partenaire des podcasteur·euses du Sud`);
  const seoDesc = descriptionSeo([`${s.nom_podcast}, ${type.toLowerCase()} ${city ? `à ${city}` : "en Région Sud"}, partenaire des podcasteur·euses du Sud`, accroche || description]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seoTitle} description={seoDesc} path={ficheHref(s)} image={s.vignette_url || undefined} type="profile" jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-6`}>
          <nav aria-label="Fil d'Ariane" className="text-sm">
            <ol className="flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
              <li><Link to="/" className="hover:underline underline-offset-4">Accueil</Link> <span aria-hidden>/</span></li>
              <li><Link to="/studios" className="hover:underline underline-offset-4">Studios</Link> <span aria-hidden>/</span></li>
              <li aria-current="page" className="text-foreground font-semibold">{s.nom_podcast}</li>
            </ol>
          </nav>

          <div className="mt-8 grid md:grid-cols-[160px_1fr] gap-6 md:gap-10 items-start">
            <LogoLieu src={s.vignette_url} nom={s.nom_podcast} />
            <div>
              <p className="text-sm font-bold text-primary">{[type, partenaire ? "Partenaire" : null, city].filter(Boolean).join(" · ")}</p>
              <h1 className="title-page text-[44px] sm:text-[72px] mt-2 break-words">{s.nom_podcast}</h1>
              {accroche && <p className="mt-4 text-[20px] sm:text-[22px] max-w-[52ch] leading-snug">{accroche}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {s.consent_contact && <a href="#contact-structure" className={btnPrimary}>Contacter</a>}
                {site && <a href={site} target="_blank" rel="noopener noreferrer" className={btnSecondary}>Site<span className="sr-only"> (nouvel onglet)</span></a>}
              </div>
            </div>
          </div>
        </div>

        <div className={`${container} mt-14 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-12 items-start`}>
          <div className="space-y-14 min-w-0">
            {f.propositions.length > 0 && (
              <section aria-labelledby="propose-title">
                <h2 id="propose-title" className="title-section text-[30px] sm:text-[38px] pb-3 border-b-2 border-encre">Ce que {s.nom_podcast} propose aux podcasteur·euses</h2>
                <ul className="mt-4 grid md:grid-cols-3 gap-4">
                  {f.propositions.map((p, i) => (
                    <li key={p.titre} className="border-t-[3px] border-accent bg-surface p-5">
                      <p className="font-mono text-sm text-muted-foreground">0{i + 1}</p>
                      <p className="mt-1 font-bold text-[19px] leading-tight">{p.titre}</p>
                      {p.texte && <p className="mt-2 text-[16px]">{p.texte}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {description && (
              <section aria-labelledby="presentation-title">
                <h2 id="presentation-title" className="title-section text-[30px] sm:text-[38px] pb-3 border-b-2 border-encre">Présentation</h2>
                <p className="mt-4 text-[18px] leading-relaxed whitespace-pre-line max-w-[65ch]">{description}</p>
              </section>
            )}

            {f.podcasts_lies.length > 0 && (
              <section aria-labelledby="membres-title">
                <h2 id="membres-title" className="title-section text-[30px] sm:text-[38px] pb-3 border-b-2 border-encre mb-4">{titreMembres}</h2>
                <PodcastsLiesList lies={f.podcasts_lies} />
              </section>
            )}

            <AgendaLieu id={s.id} nom={s.nom_podcast} />

            {f.presse.length > 0 && (
              <section aria-labelledby="presse-title">
                <h2 id="presse-title" className="title-section text-[30px] sm:text-[38px] pb-3 border-b-2 border-encre">Dans la presse</h2>
                <ul className="divide-y divide-filet border-b border-filet">
                  {f.presse.map((p) => (
                    <li key={p.url} className="py-3 flex flex-wrap justify-between gap-x-4">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className={linkUnderline}>{p.titre}<span className="sr-only"> (nouvel onglet)</span></a>
                      {p.date && <span className="font-mono text-sm text-muted-foreground">{formatDateCourte(p.date)}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {f.faq.length > 0 && (
              <section aria-labelledby="faq-title">
                <h2 id="faq-title" className="title-section text-[30px] sm:text-[38px] pb-3 border-b-2 border-encre">Questions fréquentes</h2>
                <FaqList faq={f.faq} />
              </section>
            )}
          </div>

          <aside id="contact-structure" aria-labelledby="contact-title" className="border-2 border-encre bg-surface p-6 scroll-mt-24">
            <h2 id="contact-title" className="title-section text-[28px]">Contact</h2>
            <dl className="mt-4 space-y-3">
              {[
                { k: "Ville", v: city },
                { k: "Accès", v: f.acces_transports },
                { k: "Accessibilité", v: f.accessibilite },
              ].filter((x) => x.v).map((x) => (
                <div key={x.k}><dt className="text-xs font-bold text-muted-foreground">{x.k}</dt><dd className="font-semibold">{x.v}</dd></div>
              ))}
            </dl>
            {liens.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {liens.map((l) => (
                  <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className={`${linkUnderline} text-sm inline-flex min-h-[36px] items-center`}>{l.label}<span className="sr-only"> (nouvel onglet)</span></a></li>
                ))}
              </ul>
            )}
            {partenaire
              ? <p className="mt-4 font-mono text-sm">Partenaire de l'association</p>
              : annee && <p className="mt-4 font-mono text-sm">Membre de l'association depuis {annee}</p>}
            {s.consent_contact ? (
              <div className="mt-6 pt-6 border-t border-filet [&_form]:grid-cols-1 [&_.sm\:col-span-2]:col-span-1">
                <p className="text-sm text-muted-foreground mb-4">Son e-mail n'est jamais affiché : votre message arrive dans son espace.</p>
                <MembreContactForm recipientId={s.id} recipientFirstName={s.nom_podcast} type="message" idPrefix="contact" />
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">Cette structure ne reçoit pas de message pour le moment.</p>
            )}
          </aside>
        </div>
        <div className="pb-20" />
      </main>
      <Footer />
    </div>
  );
};

export default StructureEcoProfile;
