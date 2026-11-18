import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import DevisForm from "@/components/studios/DevisForm";
import StudioCarte, { type StudioListe } from "@/components/studios/StudioCarte";
import { useFichesLieux } from "@/lib/lieux";
import { PAGES, SITE_URL, breadcrumbLd, ficheHref } from "@/lib/seo";
import { container, h1Ligne, linkUnderline } from "@/lib/pds";
import { LIENS_LOCAUX, PAGE_STUDIOS_MARSEILLE, dansZone, seoDe } from "@/lib/pagesLocales";

/** Studios podcast membres d'une ville, avec la demande de devis groupée. */
const StudiosVille = () => {
  const page = PAGE_STUDIOS_MARSEILLE;
  const seo = seoDe(page.cle);
  const [devisFor, setDevisFor] = useState<string | null>(null);

  const { data: tous = [], isLoading } = useQuery({
    queryKey: ["studios-locaux"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts_publics")
        .select("id, slug, type_profil, city_name, department_code, nom_podcast, vignette_url, consent_contact, studio_data")
        .eq("type_profil", "studio")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as (StudioListe & { department_code: string | null })[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const studios = useMemo(() => tous.filter((s) => dansZone(page, s)), [tous, page]);
  const { data: fiches = {} } = useFichesLieux(studios.map((s) => s.id));

  const openDevis = (id: string | null) => {
    setDevisFor(id);
    document.getElementById("devis")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => document.getElementById("devis-nom")?.focus({ preventScroll: true }), 400);
  };

  const titre = `Studios podcast ${page.lieu}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: titre,
      itemListElement: studios.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${ficheHref(s)}`, name: s.nom_podcast })),
    },
    breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Studios", path: PAGES.studios }, { name: titre, path: page.chemin }]),
  ];
  const nom = studios.find((s) => s.id === devisFor)?.nom_podcast;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seo.title} description={seo.description} path={page.chemin} jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14`}>
          <nav aria-label="Fil d'Ariane" className="font-mono text-sm text-muted-foreground">
            <Link to={PAGES.studios} className="underline underline-offset-4 hover:text-foreground">Studios</Link>
            <span aria-hidden> / </span>
            <span>{titre}</span>
          </nav>
          <h1 className="title-page text-[56px] sm:text-[88px] mt-4">
            <span className="block">Studios podcast</span>
            <span className={h1Ligne}>{page.lieu}</span>
          </h1>
          <p className="mt-4 text-lg max-w-[60ch]">
            {isLoading
              ? "Chargement des studios…"
              : `${studios.length} studio${studios.length > 1 ? "s" : ""} membre${studios.length > 1 ? "s" : ""} des Podcasteur·euses du Sud ${page.lieu}. Comparez services, tarifs et accès, puis envoyez une seule demande de devis.`}
          </p>

          <ul className="mt-8 grid md:grid-cols-2 gap-6">
            {studios.map((p) => <StudioCarte key={p.id} p={p} fiche={fiches[p.id]} onDevis={openDevis} />)}
          </ul>
        </div>

        <section id="devis" className="mt-16 md:mt-24 bg-encre text-surface scroll-mt-20" aria-labelledby="devis-title">
          <div className={`${container} py-12 md:py-16 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10`}>
            <div>
              <h2 id="devis-title" className="title-section text-surface text-[40px] sm:text-[52px]">Décrivez votre besoin, les studios vous répondent</h2>
              <p className="mt-4 text-[17px] text-surface/85">
                {devisFor
                  ? <>Votre demande sera envoyée à <strong>{nom}</strong>.</>
                  : <>Une seule demande, envoyée à tous les studios membres des Bouches-du-Rhône qui proposent les besoins cochés. Vous comparez, vous choisissez.</>}
              </p>
              {devisFor && (
                <button onClick={() => setDevisFor(null)} className="mt-3 inline-flex min-h-[44px] items-center font-bold underline underline-offset-4">
                  Envoyer plutôt à tous les studios qui correspondent
                </button>
              )}
            </div>
            <DevisForm key={devisFor || "groupe"} dark studioId={devisFor} studioName={nom} defaultDepartement={page.departement} />
          </div>
        </section>

        <section className={`${container} py-12 md:py-16`} aria-labelledby="aussi-title">
          <h2 id="aussi-title" className="title-section text-[28px] sm:text-[34px]">Aussi sur le site</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6">
            {LIENS_LOCAUX.filter((l) => l.to !== page.chemin).map((l) => (
              <li key={l.to}><Link to={l.to} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>{l.label}</Link></li>
            ))}
            <li><Link to={PAGES.studios} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>Tous les studios et agences de la région</Link></li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StudiosVille;
