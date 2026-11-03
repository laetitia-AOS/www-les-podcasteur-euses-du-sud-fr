import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import LogoPartenaire from "@/components/LogoPartenaire";
import { container, h1Ligne } from "@/lib/pds";
import { PAGES, PAGES_SEO, SITE_NAME, SITE_URL, breadcrumbLd } from "@/lib/seo";
import { domaineAffiche, lienSite, usePartenaires } from "@/lib/partenaires";

const Partenaires = () => {
  const { data: partenaires = [], isLoading, isError } = usePartenaires();

  const jsonLd = [
    breadcrumbLd([
      { name: "Accueil", path: "/" },
      { name: "Partenaires", path: PAGES.partenaires },
    ]),
    partenaires.length
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Partenaires de ${SITE_NAME}`,
          url: `${SITE_URL}${PAGES.partenaires}`,
          itemListElement: partenaires.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Organization",
              name: p.nom,
              ...(lienSite(p.site_url) ? { url: lienSite(p.site_url) } : {}),
              ...(p.logo_url ? { logo: p.logo_url } : {}),
              ...(p.description || p.accroche ? { description: p.description || p.accroche } : {}),
            },
          })),
        }
      : null,
  ];

  return (
    <>
      <SEOHead title={PAGES_SEO.partenaires.title} description={PAGES_SEO.partenaires.description} path={PAGES.partenaires} jsonLd={jsonLd} />
      <Navbar />
      <main className="min-h-screen pt-16 md:pt-[76px] pb-20">
        <div className={`${container} pt-10 md:pt-14`}>
          <h1 className="title-page text-[56px] sm:text-[88px]">
            <span className="block">Partenaires</span>
            <span className={h1Ligne}>celles et ceux qui font avancer l'association avec nous</span>
          </h1>
          <p className="mt-4 text-lg max-w-[60ch]">
            Radios, lieux, collectifs : chacun·e soutient le podcast en Région Sud à sa manière. Voici ce que nous faisons ensemble.
          </p>

          <div className="mt-12 border-t-2 border-encre">
            {isLoading && <p className="py-8 text-muted-foreground">Chargement des partenaires…</p>}
            {isError && <p className="py-8">La liste des partenaires n'a pas pu être chargée. Réessayez dans un instant.</p>}
            {!isLoading && !isError && partenaires.length === 0 && (
              <p className="py-8 text-muted-foreground">Aucun partenaire pour le moment.</p>
            )}
            <ul className="divide-y divide-filet border-b border-filet">
              {partenaires.map((p) => {
                const href = lienSite(p.site_url);
                return (
                  <li key={p.id} className="grid grid-cols-[80px_1fr] sm:grid-cols-[140px_1fr] gap-5 sm:gap-8 py-8">
                    <LogoPartenaire src={p.logo_url} nom={p.nom} className="w-20 h-20 sm:w-[140px] sm:h-[140px]" />
                    <div className="min-w-0">
                      <h2 className="font-display font-black text-[28px] sm:text-[36px] leading-none">
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline-offset-4 decoration-2 hover:underline hover:decoration-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            {p.nom}
                            <span aria-hidden>&nbsp;→</span>
                            <span className="sr-only"> (site de {p.nom}, nouvel onglet)</span>
                          </a>
                        ) : (
                          p.nom
                        )}
                      </h2>
                      {p.accroche && <p className="mt-2 font-mono text-sm text-primary">{p.accroche}</p>}
                      {p.description && (
                        <p className="mt-4 text-[17px] leading-relaxed max-w-[65ch] whitespace-pre-line">{p.description}</p>
                      )}
                      {href && (
                        <p className="mt-3 font-mono text-sm text-muted-foreground break-all">{domaineAffiche(href)}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Partenaires;
