import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGES_SEO } from "@/lib/seo";
import PodcastsStep from "@/components/adherer/PodcastsStep";
import { field, labelCls, Req } from "@/components/adherer/fields";
import { supabase } from "@/integrations/supabase/client";
import { btnPrimary, btnSecondary, container, formatName } from "@/lib/pds";

const BASE_FIELDS =
  "prenom, nom, email, telephone, type_profil, vignette_url, photo_profil_url, bio_750, lien_principal, lien_linkedin, department_code, department_label, city_name, city_insee_code, city_postcode, ville, cherche_choix, apporte_choix, cherche_precision, apporte_precision, format_collaboration, consent_contact, consent_mise_en_relation";

type Existing = Record<string, unknown> & { prenom: string | null; nom: string | null; type_profil: string; vignette_url: string | null; photo_profil_url: string | null };

/**
 * /referencer-mon-podcast
 * - avec ?ajout=1 : ajouter un ou plusieurs podcasts à une fiche existante (même e-mail) ;
 * - sinon : l'inscription se fait désormais sur la page Adhérer.
 */
const Formulaire = () => {
  const [params] = useSearchParams();
  const isAjout = params.get("ajout") === "1";
  const emailParam = params.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [existing, setExisting] = useState<Existing | null>(null);
  const [loading, setLoading] = useState(!!emailParam);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (!isAjout || !emailParam) return;
    (async () => {
      const { data } = await supabase.from("podcasts").select(BASE_FIELDS).ilike("email", emailParam).limit(1).maybeSingle();
      if (data) {
        const row = data as unknown as Existing;
        setExisting(row);
        setPrenom(formatName(row.prenom));
        setNom(formatName(row.nom));
      }
      setLoading(false);
    })();
  }, [isAjout, emailParam]);

  if (!isAjout) {
    const profil = params.get("profil");
    return <Navigate to={{ pathname: "/adherer", search: profil ? `?profil=${profil}` : "", hash: "#inscription" }} replace />;
  }

  // Les informations de la fiche existante sont reprises sur chaque nouveau podcast
  const base: Record<string, unknown> = existing
    ? (() => {
        const { type_profil, vignette_url, photo_profil_url, ...rest } = existing;
        return {
          ...rest,
          prenom: formatName(prenom),
          nom: formatName(nom),
          email: email.trim(),
          photo_profil_url: photo_profil_url || (type_profil !== "podcasteur" ? vignette_url : null),
        };
      })()
    : { prenom: formatName(prenom), nom: formatName(nom), email: email.trim(), consent_contact: true };

  const identityOk = prenom.trim() && nom.trim() && /\S+@\S+\.\S+/.test(email);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={PAGES_SEO.ajouterPodcast.title} description={PAGES_SEO.ajouterPodcast.description} path="/referencer-mon-podcast" />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14 pb-8`}>
          <h1 className="title-page text-[52px] sm:text-[84px] max-w-[14ch]">Ajouter un podcast</h1>
          <p className="mt-4 text-lg max-w-[56ch]">
            Chaque podcast ajouté aura sa page et ses épisodes sur le site, relié à votre profil par votre adresse e-mail.
          </p>
        </div>

        <section className="bg-surface border-y border-filet">
          <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8 py-12 md:py-16">
            {doneCount > 0 ? (
              <div role="status" className="border-2 border-encre bg-background p-6">
                <p className="title-section text-[30px]">{doneCount > 1 ? `${doneCount} podcasts enregistrés.` : "Podcast enregistré."}</p>
                <p className="mt-3 text-[17px]">L'équipe le relit sous 48 à 72 heures. Il sera visible sur le site si votre adhésion est à jour.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/mon-espace" className={btnPrimary}>Mon espace membre</Link>
                  <Link to="/adherer?etape=adhesion" className={btnSecondary}>Adhérer</Link>
                </div>
              </div>
            ) : loading ? (
              <p className="font-mono text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <>
                <fieldset className="grid sm:grid-cols-3 gap-4 mb-10">
                  <legend className="text-sm font-bold mb-2">Votre profil</legend>
                  <div>
                    <label htmlFor="aj-prenom" className={labelCls}>Prénom<Req /></label>
                    <input id="aj-prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} className={field} autoComplete="given-name" />
                  </div>
                  <div>
                    <label htmlFor="aj-nom" className={labelCls}>Nom<Req /></label>
                    <input id="aj-nom" value={nom} onChange={(e) => setNom(e.target.value)} className={field} autoComplete="family-name" />
                  </div>
                  <div>
                    <label htmlFor="aj-email" className={labelCls}>E-mail du profil<Req /></label>
                    <input id="aj-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!!emailParam} className={`${field} ${emailParam ? "bg-muted" : ""}`} autoComplete="email" />
                  </div>
                  {!existing && (
                    <p className="sm:col-span-3 text-sm text-muted-foreground">
                      Pas encore de profil ? <Link to="/adherer#inscription" className="underline underline-offset-2">Créez-le d'abord sur la page Adhérer</Link>.
                    </p>
                  )}
                </fieldset>
                {identityOk ? (
                  <PodcastsStep base={base} onDone={setDoneCount} submitLabel="Enregistrer" />
                ) : (
                  <p className="text-[15px] border-l-4 border-primary pl-4">Indiquez votre prénom, votre nom et l'e-mail de votre profil pour ajouter vos podcasts.</p>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Formulaire;
