import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import InscriptionOnde from "@/components/onde/InscriptionOnde";
import { container, h1Ligne } from "@/lib/pds";
import { PAGES, PAGES_SEO, SITE_URL, breadcrumbLd } from "@/lib/seo";
import { NOM_COMPLET_ONDE, NOM_ONDE, etiquetteNumero, ondeHref, useNumerosPublies } from "@/lib/onde";

/** Archives de L'Onde du Sud, du numéro le plus récent au plus ancien. */
const Onde = () => {
  const { data: numeros = [], isLoading, isError } = useNumerosPublies();

  const jsonLd = [
    breadcrumbLd([
      { name: "Accueil", path: "/" },
      { name: NOM_ONDE, path: PAGES.onde },
    ]),
    numeros.length
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: NOM_COMPLET_ONDE,
          url: `${SITE_URL}${PAGES.onde}`,
          itemListElement: numeros.map((n, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}${ondeHref(n.slug)}`,
            name: n.titre,
          })),
        }
      : null,
  ];

  return (
    <>
      <SEOHead title={PAGES_SEO.onde.title} description={PAGES_SEO.onde.description} path={PAGES.onde} jsonLd={jsonLd} />
      <Navbar />
      <main className="min-h-screen pt-16 md:pt-[76px] pb-20">
        <div className={`${container} pt-10 md:pt-14`}>
          <h1 className="title-page text-[52px] sm:text-[88px]">
            <span className="block">{NOM_ONDE}<span className="sr-only">, </span></span>
            <span className={h1Ligne}>la lettre des Podcasteur·euses du Sud</span>
          </h1>
          <p className="mt-4 text-lg max-w-[60ch]">
            Chaque mois, un numéro à lire et à écouter : les rendez-vous du réseau, des podcasts d'ici et la vie de l'association.
          </p>

          <div className="mt-12 border-t-2 border-encre">
            {isLoading && <p className="py-8 text-muted-foreground">Chargement des numéros…</p>}
            {isError && <p className="py-8">Les numéros n'ont pas pu être chargés. Réessayez dans un instant.</p>}
            {!isLoading && !isError && numeros.length === 0 && (
              <p className="py-8 text-muted-foreground">Le premier numéro arrive bientôt.</p>
            )}
            <ul className="grid md:grid-cols-2 gap-x-10">
              {numeros.map((n, i) => (
                <li key={n.id} className={`py-8 border-b border-filet ${i === 0 ? "md:col-span-2" : ""}`}>
                  <Link
                    to={ondeHref(n.slug)}
                    className={`group grid gap-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${i === 0 ? "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-10 items-start" : ""}`}
                  >
                    {n.couverture_url && (
                      <img
                        src={n.couverture_url}
                        alt={n.couverture_alt || ""}
                        loading={i === 0 ? "eager" : "lazy"}
                        className="block w-full aspect-[16/9] object-cover border border-filet"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold uppercase tracking-wider text-primary">{etiquetteNumero(n)}</p>
                      <h2 className={`title-section mt-2 group-hover:underline underline-offset-4 decoration-2 decoration-accent ${i === 0 ? "text-[36px] sm:text-[48px]" : "text-[28px] sm:text-[32px]"}`}>
                        {n.titre}
                      </h2>
                      {n.chapeau && <p className="mt-3 text-[17px] max-w-[60ch]">{n.chapeau}</p>}
                      <span className="mt-4 inline-flex min-h-[44px] items-center font-bold underline underline-offset-4 decoration-2">
                        Lire le numéro<span aria-hidden>&nbsp;→</span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <InscriptionOnde className="mt-14 max-w-[860px]" />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Onde;
