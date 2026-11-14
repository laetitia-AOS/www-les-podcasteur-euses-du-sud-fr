import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import NumeroVue from "@/components/onde/NumeroVue";
import InscriptionOnde from "@/components/onde/InscriptionOnde";
import { btnSecondary, container } from "@/lib/pds";
import { PAGES, breadcrumbLd } from "@/lib/seo";
import { NOM_ONDE, articleOndeLd, descriptionOnde, ondeHref, titreSeoOnde, useNumeroPublie } from "@/lib/onde";

/** Un numéro publié de L'Onde du Sud : /onde/n1-decembre-2026 */
const OndeNumero = () => {
  const { slug } = useParams();
  const { data: n, isLoading } = useNumeroPublie(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 md:pt-[76px]"><p className={`${container} py-20 font-mono text-muted-foreground`}>Chargement…</p></main>
      </div>
    );
  }

  if (!n) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title={`Numéro introuvable — ${NOM_ONDE}`} description="Ce numéro de L'Onde du Sud n'existe pas, ou il n'est plus en ligne." path={`/onde/${slug}`} noindex />
        <Navbar />
        <main className={`${container} pt-32 pb-24`}>
          <h1 className="title-page text-[52px]">Numéro introuvable</h1>
          <p className="mt-4 text-lg">Ce numéro n'existe pas, ou il n'est plus en ligne.</p>
          <Link to={PAGES.onde} className={`${btnSecondary} mt-8`}>Tous les numéros</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={titreSeoOnde(n)}
        description={descriptionOnde(n)}
        path={ondeHref(n.slug)}
        image={n.couverture_url || undefined}
        type="article"
        jsonLd={[
          articleOndeLd(n),
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: NOM_ONDE, path: PAGES.onde },
            { name: `n°${n.numero}`, path: ondeHref(n.slug) },
          ]),
        ]}
      />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <nav aria-label="Fil d'Ariane" className={`${container} pt-5`}>
          <ol className="flex flex-wrap items-center gap-x-2 text-sm">
            <li><Link to="/" className="underline underline-offset-4">Accueil</Link></li>
            <li aria-hidden>/</li>
            <li><Link to={PAGES.onde} className="underline underline-offset-4">{NOM_ONDE}</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-muted-foreground">n°{n.numero}</li>
          </ol>
        </nav>
        <NumeroVue n={n} />
        <div className={`${container} pb-16`}>
          <InscriptionOnde className="mb-10 max-w-[860px]" />
          <Link to={PAGES.onde} className={btnSecondary}>Tous les numéros</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OndeNumero;
