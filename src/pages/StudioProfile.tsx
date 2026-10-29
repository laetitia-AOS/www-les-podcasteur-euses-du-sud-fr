import { useEffect, useMemo } from "react";
import { compterStat } from "@/lib/stats";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import MembreContactForm from "@/components/MembreContactForm";
import DevisForm from "@/components/studios/DevisForm";
import { FaqList, LIEU_COLUMNS, PodcastsLiesList, faqJsonLd, planUrl, sdOf, useLieu, type LieuRow } from "@/components/studios/LieuParts";
import { btnListen, btnSecondary, cleanCity, container, linkUnderline } from "@/lib/pds";
import { SERVICES_STUDIO, ficheVide, formatCapacite, formatTarif, useAnneeAdhesion, useFichesLieux } from "@/lib/lieux";

const SITE = "https://www.les-podcasteur-euses-du-sud.fr";

/** Fiche publique d'un studio : tout ce qu'il faut pour choisir, puis demander un devis. */
const StudioProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: studio, isLoading } = useLieu("studio", slug);
  useEffect(() => { if (studio?.id) compterStat(studio.id, "vue"); }, [studio?.id]);
  const { data: fiches = {} } = useFichesLieux(studio ? [studio.id] : []);
  const f = (studio && fiches[studio.id]) || ficheVide(studio?.id || "");
  const { data: annee } = useAnneeAdhesion(studio?.id);
  const sd = sdOf(studio);
  const city = cleanCity(studio?.city_name);
  const adresse = sd.adresse_complete ? `${sd.adresse_complete}${studio?.city_name ? `, ${studio.city_name}` : ""}` : null;

  // Autres studios de la même ville
  const { data: voisins = [] } = useQuery({
    queryKey: ["studios-voisins", studio?.id, studio?.city_name],
    queryFn: async () => {
      const { data } = await supabase.from("podcasts").select(LIEU_COLUMNS).eq("valide", true).eq("type_profil", "studio")
        .eq("city_name", studio!.city_name!).neq("id", studio!.id).limit(3);
      return (data || []) as unknown as LieuRow[];
    },
    enabled: !!studio?.city_name,
  });

  const accroche = sd.accroche || sd.phrase_accroche || "";
  const chiffres = [formatTarif(f.tarif_heure), formatCapacite(f.capacite_voix) && `jusqu'à ${formatCapacite(f.capacite_voix)}`].filter(Boolean).join(", ");
  const description = studio?.bio_750 || studio?.description || "";
  const photos = f.photos.length ? f.photos : (sd.galerie_urls || []).slice(0, 5);
  const proposes = SERVICES_STUDIO.filter((s) => f.services.includes(s.value));
  const nonProposes = SERVICES_STUDIO.filter((s) => !f.services.includes(s.value));
  const eq = f.equipement || {};
  const liens = [
    ...(studio?.lien_principal ? [{ label: "Site", url: studio.lien_principal }] : []),
    ...f.liens.filter((l) => l.url !== studio?.lien_principal),
  ];

  const jsonLd = useMemo(() => {
    if (!studio) return undefined;
    const business = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: studio.nom_podcast,
      url: `${SITE}/studios/${studio.slug || studio.id}`,
      ...(description && { description }),
      ...(photos[0] && { image: photos }),
      address: {
        "@type": "PostalAddress",
        ...(sd.adresse_complete && { streetAddress: sd.adresse_complete }),
        ...(city && { addressLocality: city }),
        addressRegion: "Provence-Alpes-Côte d'Azur",
        addressCountry: "FR",
      },
      ...(f.tarif_heure != null && { priceRange: `À partir de ${f.tarif_heure} € / heure` }),
      ...(proposes.length && {
        makesOffer: proposes.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.label },
          ...(f.tarif_heure != null && { priceSpecification: { "@type": "UnitPriceSpecification", price: f.tarif_heure, priceCurrency: "EUR", unitText: "heure" } }),
        })),
      }),
      ...(liens.length && { sameAs: liens.map((l) => l.url) }),
      memberOf: { "@type": "Organization", name: "Les Podcasteur·euses du Sud", url: SITE },
    };
    const faq = faqJsonLd(f.faq);
    return faq ? [business, faq] : business;
  }, [studio, description, photos, sd.adresse_complete, city, f, proposes, liens]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <main className="pt-16 md:pt-[76px]"><p className={`${container} py-20 font-mono text-muted-foreground`}>Chargement…</p></main>
      </div>
    );
  }
  if (!studio) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <main className={`${container} pt-28 pb-20`}>
          <h1 className="title-page text-[44px]">Studio introuvable</h1>
          <Link to="/studios" className={`${linkUnderline} mt-6 inline-flex min-h-[44px] items-center`}>Voir tous les studios</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const seoTitle = `Studio podcast à ${city || "Marseille"} : ${studio.nom_podcast}`;
  const seoDesc = [accroche || description, chiffres].filter(Boolean).join(" — ").slice(0, 155);
  const typeLieu = sd.type_lieu || "Studio podcast";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${seoTitle} — Les Podcasteur·euses du Sud`} description={seoDesc} path={`/studios/${studio.slug || studio.id}`} image={photos[0] || studio.vignette_url || undefined} type="business.business" jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-6`}>
          <nav aria-label="Fil d'Ariane" className="text-sm">
            <ol className="flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
              <li><Link to="/" className="hover:underline underline-offset-4">Accueil</Link> <span aria-hidden>/</span></li>
              <li><Link to="/studios" className="hover:underline underline-offset-4">Studios</Link> <span aria-hidden>/</span></li>
              <li aria-current="page" className="text-foreground font-semibold">{studio.nom_podcast}</li>
            </ol>
          </nav>

          <p className="mt-8 text-sm font-bold text-primary">{[typeLieu, city].filter(Boolean).join(" · ")}</p>
          <h1 className="title-page text-[48px] sm:text-[80px] lg:text-[96px] mt-2 break-words">{studio.nom_podcast}</h1>
          {(accroche || chiffres) && (
            <p className="mt-4 text-[20px] sm:text-[24px] max-w-[46ch] leading-snug">
              {accroche}{accroche && chiffres ? " " : ""}{chiffres && <span className="font-mono text-[17px] sm:text-[19px] whitespace-nowrap">{chiffres}.</span>}
            </p>
          )}
        </div>

        {photos.length > 0 && (
          <div className={`${container} mt-8 grid gap-3 grid-cols-2 md:grid-cols-[2fr_1fr] md:grid-rows-2 md:h-[480px]`}>
            {photos.slice(0, 3).map((src, i) => (
              <img key={src} src={src} alt={`${studio.nom_podcast}, photo ${i + 1}`} loading={i ? "lazy" : "eager"}
                className={`w-full h-full min-h-0 object-cover bg-muted ${i === 0 ? `col-span-2 md:col-span-1 ${photos.length > 1 ? "md:row-span-2" : "md:col-span-2 md:row-span-2"} aspect-[4/3] md:aspect-auto` : "aspect-[4/3] md:aspect-auto"}`} />
            ))}
          </div>
        )}

        <div className={`${container} mt-12 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-12 items-start`}>
          <div className="space-y-14 min-w-0">
            {description && (
              <section aria-labelledby="desc-title">
                <h2 id="desc-title" className="title-section text-[32px] sm:text-[40px] pb-3 border-b-2 border-encre">Le studio</h2>
                <p className="mt-4 text-[18px] leading-relaxed whitespace-pre-line max-w-[65ch]">{description}</p>
              </section>
            )}

            <section aria-labelledby="services-title">
              <h2 id="services-title" className="title-section text-[32px] sm:text-[40px] pb-3 border-b-2 border-encre">Services</h2>
              <ul className="mt-4 grid sm:grid-cols-2 gap-x-8">
                {proposes.map((s) => (
                  <li key={s.value} className="flex items-center gap-3 py-2.5 border-b border-filet font-semibold text-[17px]">
                    <Check className="w-5 h-5 text-primary shrink-0" aria-hidden />{s.label}<span className="sr-only"> : proposé</span>
                  </li>
                ))}
                {nonProposes.map((s) => (
                  <li key={s.value} className="flex items-center gap-3 py-2.5 border-b border-filet text-[17px] text-muted-foreground">
                    <Minus className="w-5 h-5 shrink-0" aria-hidden />{s.label}<span className="sr-only"> : non proposé</span>
                  </li>
                ))}
              </ul>
            </section>

            {(eq.micros || eq.cameras || eq.lumieres_decor || eq.technicien != null) && (
              <section aria-labelledby="equipement-title">
                <h2 id="equipement-title" className="title-section text-[32px] sm:text-[40px] pb-3 border-b-2 border-encre">Équipement</h2>
                <dl className="mt-2 divide-y divide-filet">
                  {[
                    { k: "Micros", v: eq.micros },
                    { k: "Caméras", v: eq.cameras },
                    { k: "Lumières et décor", v: eq.lumieres_decor },
                    { k: "Technicien·ne sur place", v: eq.technicien == null ? null : eq.technicien ? "Oui" : "Non" },
                  ].filter((x) => x.v).map((x) => (
                    <div key={x.k} className="grid sm:grid-cols-[220px_1fr] gap-1 py-3">
                      <dt className="font-bold">{x.k}</dt>
                      <dd className="whitespace-pre-line">{x.v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {f.podcasts_lies.length > 0 && (
              <section aria-labelledby="enregistres-title">
                <h2 id="enregistres-title" className="title-section text-[32px] sm:text-[40px] pb-3 border-b-2 border-encre mb-4">Enregistrés ici</h2>
                <PodcastsLiesList lies={f.podcasts_lies} />
              </section>
            )}

            {f.faq.length > 0 && (
              <section aria-labelledby="faq-title">
                <h2 id="faq-title" className="title-section text-[32px] sm:text-[40px] pb-3 border-b-2 border-encre">Questions fréquentes</h2>
                <FaqList faq={f.faq} />
              </section>
            )}
          </div>

          {/* En pratique */}
          <aside aria-labelledby="pratique-title" className="border-2 border-encre bg-surface p-6 lg:sticky lg:top-24">
            <h2 id="pratique-title" className="title-section text-[28px]">En pratique</h2>
            <dl className="mt-4 space-y-3 text-[16px]">
              {[
                { k: "Tarif", v: formatTarif(f.tarif_heure) || sd.indication_tarifaire },
                { k: "Capacité", v: formatCapacite(f.capacite_voix) },
                { k: "Adresse", v: adresse },
                { k: "Accès", v: f.acces_transports },
                { k: "Accessibilité", v: f.accessibilite },
              ].filter((x) => x.v).map((x) => (
                <div key={x.k}>
                  <dt className="text-xs font-bold text-muted-foreground">{x.k}</dt>
                  <dd className="font-semibold">{x.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 grid gap-3">
              {studio.consent_contact && <a href="#devis-studio" className={`${btnListen} w-full`}>Demander un devis</a>}
              {studio.consent_contact && <a href="#ecrire-studio" className={`${btnSecondary} w-full`}>Écrire au studio</a>}
              {adresse && (
                <a href={planUrl(adresse)} target="_blank" rel="noopener noreferrer" className={`${linkUnderline} inline-flex min-h-[44px] items-center justify-center`}>
                  Voir le plan<span className="sr-only"> (nouvel onglet)</span>
                </a>
              )}
            </div>
            {liens.length > 0 && (
              <ul className="mt-5 pt-5 border-t border-filet flex flex-wrap gap-x-4 gap-y-1">
                {liens.map((l) => (
                  <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" className={`${linkUnderline} text-sm inline-flex min-h-[36px] items-center`}>{l.label}<span className="sr-only"> (nouvel onglet)</span></a></li>
                ))}
              </ul>
            )}
            {annee && <p className="mt-5 pt-5 border-t border-filet font-mono text-sm">Membre de l'association depuis {annee}</p>}
          </aside>
        </div>

        {studio.consent_contact && (
          <>
            <section id="devis-studio" className="mt-20 bg-encre text-surface scroll-mt-20" aria-labelledby="devis-studio-title">
              <div className={`${container} py-12 md:py-16 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10`}>
                <div>
                  <h2 id="devis-studio-title" className="title-section text-surface text-[36px] sm:text-[48px]">Demander un devis à {studio.nom_podcast}</h2>
                  <p className="mt-4 text-[17px] text-surface/85">Le studio reçoit votre demande dans son espace et vous répond directement à votre adresse.</p>
                </div>
                <DevisForm dark studioId={studio.id} studioName={studio.nom_podcast} idPrefix="devis" />
              </div>
            </section>
            <section id="ecrire-studio" className={`${container} pt-14 scroll-mt-24`} aria-labelledby="ecrire-studio-title">
              <div className="border-2 border-encre bg-surface p-6 sm:p-8 grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 md:gap-10">
                <div>
                  <h2 id="ecrire-studio-title" className="title-section text-[28px] sm:text-[34px]">Écrire au studio</h2>
                  <p className="mt-3 text-[15px] text-muted-foreground">Une question avant de réserver ? Son e-mail n'est jamais affiché.</p>
                </div>
                <MembreContactForm recipientId={studio.id} recipientFirstName={studio.nom_podcast} type="message" idPrefix="ecrire" />
              </div>
            </section>
          </>
        )}

        {voisins.length > 0 && (
          <section className={`${container} py-16`} aria-labelledby="voisins-title">
            <h2 id="voisins-title" className="title-section text-[32px] sm:text-[40px] pb-3 border-b-2 border-encre">Autres studios à {city}</h2>
            <ul className="divide-y divide-filet border-b border-filet">
              {voisins.map((v) => (
                <li key={v.id}>
                  <Link to={`/studios/${v.slug || v.id}`} className="flex flex-wrap items-baseline justify-between gap-x-6 py-4 group">
                    <span className="font-bold text-[18px] group-hover:underline underline-offset-4">{v.nom_podcast}</span>
                    <span className="font-mono text-sm text-muted-foreground">{sdOf(v).type_lieu || "Studio"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="pb-16" />
      </main>
      <Footer />
    </div>
  );
};

export default StudioProfile;
