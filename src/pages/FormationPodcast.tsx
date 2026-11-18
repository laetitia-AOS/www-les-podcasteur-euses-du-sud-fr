import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import MemberAvatar, { avatarFor } from "@/components/MemberAvatar";
import InscriptionOnde from "@/components/onde/InscriptionOnde";
import { PAGES, PAGES_SEO, SITE_URL, breadcrumbLd } from "@/lib/seo";
import { btnPrimary, container, h1Ligne, linkUnderline } from "@/lib/pds";
import { CODE_FORMATION, formateurs, hrefFormateur, type FicheFormation } from "@/lib/formation";

/**
 * « Formation podcast » : l'annonce des formations de l'association en 2027,
 * puis les membres qui ont coché « Formation » dans « J'apporte ».
 */
const FormationPodcast = () => {
  const seo = PAGES_SEO.formation;

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ["formation-fiches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts_publics")
        .select("id, slug, prenom, nom, structure, type_profil, nom_podcast, metier_principal, city_name, vignette_url, photo_profil_url, apporte_choix, created_at")
        .eq("valide", true)
        .contains("apporte_choix", [CODE_FORMATION]);
      if (error) throw error;
      return (data || []) as FicheFormation[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const liste = useMemo(() => formateurs(fiches), [fiches]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Formation podcast à Marseille et en Région Sud",
      description: seo.description,
      url: `${SITE_URL}${PAGES.formation}`,
      inLanguage: "fr",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: liste.map((f, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}${hrefFormateur(f)}`,
          name: f.nom,
        })),
      },
    },
    breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Annuaire", path: PAGES.annuaire }, { name: "Formation podcast", path: PAGES.formation }]),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={seo.title} description={seo.description} path={PAGES.formation} jsonLd={jsonLd} />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14`}>
          <nav aria-label="Fil d'Ariane" className="font-mono text-sm text-muted-foreground">
            <Link to={PAGES.annuaire} className="underline underline-offset-4 hover:text-foreground">Annuaire</Link>
            <span aria-hidden> / </span>
            <span>Formation podcast</span>
          </nav>
          <h1 className="title-page text-[52px] sm:text-[88px] mt-4">
            <span className="block">Formation podcast</span>
            <span className={h1Ligne}>à Marseille et en Région Sud</span>
          </h1>
          <p className="mt-3 md:mt-4 text-[17px] md:text-lg max-w-[60ch]">
            Apprendre à lancer, enregistrer, monter ou faire écouter un podcast : les formations que prépare l'association, et les membres qui forment déjà.
          </p>
        </div>

        <section className={`${container} mt-12 md:mt-16`} aria-labelledby="formations-2027">
          <div className="grid lg:grid-cols-[1fr_minmax(0,520px)] gap-8 lg:gap-12 items-start">
            <div className="border-l-[6px] border-accent pl-5 sm:pl-7">
              <p className="font-mono text-sm font-bold uppercase tracking-wider text-primary">En préparation</p>
              <h2 id="formations-2027" className="title-section text-[36px] sm:text-[48px] mt-2">Nos formations en 2027</h2>
              <p className="mt-4 text-[17px] max-w-[56ch]">
                Les Podcasteur·euses du Sud préparent des formations au podcast pour 2027. Deux pistes sont à l'étude :
              </p>
              <ul className="mt-5 space-y-4 max-w-[56ch]">
                <li className="border-t-2 border-encre pt-3">
                  <h3 className="font-bold text-[20px] leading-tight">Un club pour débuter</h3>
                  <p className="mt-1 text-[16px]">Pour celles et ceux qui veulent lancer leur premier podcast et apprendre en groupe.</p>
                </li>
                <li className="border-t-2 border-encre pt-3">
                  <h3 className="font-bold text-[20px] leading-tight">Du coaching pour les podcasts déjà lancés</h3>
                  <p className="mt-1 text-[16px]">Pour améliorer un podcast qui existe déjà, avec un accompagnement.</p>
                </li>
              </ul>
              <p className="mt-5 text-[17px] max-w-[56ch]">
                Le programme, les dates, les lieux et les conditions seront publiés ici dès qu'ils seront arrêtés. Pour être prévenu·e, recevez L'Onde du Sud, notre lettre mensuelle : les formations y seront annoncées.
              </p>
            </div>
            <InscriptionOnde mention="Formations 2027" />
          </div>
        </section>

        <section className={`${container} mt-16 md:mt-24`} aria-labelledby="formateurs-title">
          <h2 id="formateurs-title" className="title-section text-[36px] sm:text-[48px] pb-4 border-b-2 border-encre">
            Membres qui forment au podcast
          </h2>
          <p className="mt-4 text-[17px] max-w-[62ch]">
            {isLoading
              ? "Chargement…"
              : liste.length
                ? `${liste.length} membre${liste.length > 1 ? "s" : ""} de l'association ${liste.length > 1 ? "proposent" : "propose"} de la formation. Écrivez-leur depuis leur profil pour parler de votre projet.`
                : "Aucun·e membre n'indique encore proposer de formation."}
          </p>
          {liste.length > 0 && (
            <ul className="mt-4 divide-y divide-filet border-y border-filet">
              {liste.map((f) => {
                const a = avatarFor(f.fiche, fiches);
                const href = hrefFormateur(f);
                return (
                  <li key={f.cle} className="grid grid-cols-[56px_1fr] sm:grid-cols-[64px_1fr_auto] gap-x-4 sm:gap-x-5 gap-y-2 py-5">
                    <MemberAvatar prenom={f.fiche.prenom} nom={f.fiche.nom} photoUrl={a?.url} alt={a?.alt} />
                    <div className="min-w-0">
                      <h3 className="text-[19px] sm:text-[21px] leading-tight font-bold [font-stretch:100%]">
                        <Link to={href} className="hover:underline underline-offset-4">{f.nom}</Link>
                        <span className="font-normal text-muted-foreground text-[15px]">
                          {" "}— {f.role}{f.ville ? `, ${f.ville}` : ""}
                        </span>
                      </h3>
                      {f.podcasts.length > 0 && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Podcast{f.podcasts.length > 1 ? "s" : ""} : {f.podcasts.join(", ")}
                        </p>
                      )}
                    </div>
                    <Link
                      to={href}
                      className="col-start-2 sm:col-start-auto inline-flex min-h-[44px] sm:min-h-0 items-start font-bold text-[15px] underline underline-offset-4 whitespace-nowrap"
                      aria-label={`Voir le profil de ${f.nom}`}
                    >
                      Voir le profil
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link to={PAGES.annuaire} className={`${linkUnderline} mt-4 inline-flex min-h-[44px] items-center`}>
            Tout l'annuaire des pros de l'audio<span aria-hidden>&nbsp;→</span>
          </Link>
        </section>

        <section className={`${container} mt-12 md:mt-16`} aria-labelledby="aussi-title">
          <h2 id="aussi-title" className="title-section text-[28px] sm:text-[34px]">Aussi sur le site</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6">
            <li><Link to={PAGES.agenda} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>Ateliers et rendez-vous podcast</Link></li>
            <li><Link to={PAGES.studiosMarseille} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>Studios podcast à Marseille</Link></li>
            <li><Link to={PAGES.ecouter} className={`${linkUnderline} inline-flex min-h-[44px] items-center`}>Podcasts de la région à écouter</Link></li>
          </ul>
        </section>

        <section className="mt-16 md:mt-24 bg-surface border-y border-filet" aria-label="Vous formez au podcast">
          <div className={`${container} py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5`}>
            <p className="font-bold text-lg sm:text-xl max-w-[56ch]">
              Vous formez au podcast et vous êtes membre ? Cochez « Formation » dans « J'apporte », depuis votre espace membre.
            </p>
            <Link to="/espace-membre" className={`${btnPrimary} px-7 shrink-0 self-start sm:self-auto`}>Mon espace membre</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FormationPodcast;
