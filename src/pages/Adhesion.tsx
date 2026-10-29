import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGES, PAGES_SEO } from "@/lib/seo";
import ProfilStep, { type ProfilResult } from "@/components/adherer/ProfilStep";
import PodcastsStep from "@/components/adherer/PodcastsStep";
import { btnPrimary, btnSecondary, container, h1Ligne, linkUnderline } from "@/lib/pds";
import { anneeEnCours, libelleValidite, periodeRenouvellement } from "@/lib/espaceMembre";
import { FORMULES_HELLOASSO, HELLOASSO_WIDGET, TARIFS, TYPES_PROFIL, formulePourType, profilColumns, type TypeProfil } from "@/lib/inscription";

type StepKey = "profil" | "podcasts" | "adhesion" | "paiement";

const STEP_LABELS: Record<StepKey, string> = {
  profil: "Votre profil",
  podcasts: "Vos podcasts",
  adhesion: "Adhésion",
  paiement: "Paiement",
};

const COMPARATIF: { label: string; profil: string; membre: string }[] = [
  { label: "Profil enregistré et relu par l'équipe", profil: "Oui", membre: "Oui" },
  { label: "Visible dans l'annuaire et dans « Écouter »", profil: "Non", membre: "Oui" },
  { label: "Épisodes dans le lecteur du site", profil: "Non", membre: "Oui, en rotation" },
  { label: "« Cherche / Apporte » visibles et messages des autres membres", profil: "Non", membre: "Oui" },
  { label: "Proposer des événements à l'agenda", profil: "Non", membre: "Oui" },
];

const ANNEE = anneeEnCours();

const FAQ = [
  {
    q: "Jusqu'à quand mon adhésion est-elle valable ?",
    a: `L'adhésion suit l'année civile : elle est valable jusqu'au 31 décembre de l'année payée, quelle que soit la date de paiement (une adhésion réglée en ${ANNEE} est valable jusqu'au 31 décembre ${ANNEE}). Il n'y a pas de prorata. Sans renouvellement, votre profil reste visible en janvier, puis il est masqué le 1er février, sans être supprimé.`,
  },
  {
    q: "Comment renouveler mon adhésion ?",
    a: "Le renouvellement ouvre le 1er décembre pour l'année suivante. Connectez-vous à votre espace membre et cliquez sur « Renouveler » : vous arrivez sur le paiement HelloAsso. Utilisez la même adresse e-mail que pour votre profil. Si votre adhésion de l'année est déjà payée, le paiement couvre l'année suivante.",
  },
  {
    q: "Puis-je créer un profil sans adhérer ?",
    a: "Oui. Votre profil est enregistré et relu par l'équipe, mais il n'apparaît publiquement qu'une fois l'adhésion réglée.",
  },
  {
    q: "Combien coûte l'adhésion ?",
    a: `${TARIFS.personne} € par an pour une personne, et à partir de ${TARIFS.minimumPersonne} € si le prix est un frein. ${TARIFS.studio} € par an pour un studio ou une agence. Le paiement se fait sur HelloAsso.`,
  },
  {
    q: "Pourquoi utiliser la même adresse e-mail ?",
    a: "C'est l'adresse e-mail qui relie votre adhésion à votre profil. Avec la même adresse, votre profil peut être activé dès que le paiement est enregistré.",
  },
  {
    q: "Que se passe-t-il si je ne renouvelle pas ?",
    a: "Votre profil reste enregistré. Il reste visible pendant le mois de janvier, puis il est masqué du site le 1er février. Il réapparaît dès votre paiement.",
  },
  {
    q: "J'ai déjà un profil, je veux ajouter un podcast.",
    a: "Connectez-vous à votre espace membre et choisissez « Ajouter un podcast ». Vos informations sont reprises automatiquement.",
  },
  {
    q: "Je ne vis pas en Région Sud, puis-je adhérer ?",
    a: "Oui, l'adhésion est ouverte à toustes. L'annuaire, l'agenda et les rencontres restent centrés sur la Région Sud.",
  },
];

const Adhesion = () => {
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const paramType = params.get("profil");
  const initialType: TypeProfil = TYPES_PROFIL.some((t) => t.value === paramType) ? (paramType as TypeProfil) : "podcasteur";

  const [type, setType] = useState<TypeProfil>(initialType);
  const [step, setStep] = useState<StepKey>(params.get("etape") === "adhesion" ? "adhesion" : "profil");
  const [result, setResult] = useState<ProfilResult | null>(null);
  const [podcastCount, setPodcastCount] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  const steps: StepKey[] = type === "podcasteur" ? ["profil", "podcasts", "adhesion", "paiement"] : ["profil", "adhesion", "paiement"];
  const current = steps.indexOf(step);

  // À chaque changement d'étape, on remonte en haut du formulaire
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    sectionRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }, [step]);

  // Profil enregistré dans ce navigateur avant le paiement : la page « Bienvenue » ne propose pas d'en créer un autre
  useEffect(() => {
    if (step !== "paiement" || !(result?.saved || podcastCount > 0)) return;
    try { localStorage.setItem("pds_profil_cree", String(Date.now())); } catch { /* navigation privée */ }
  }, [step, result, podcastCount]);

  useEffect(() => {
    if (hash !== "#inscription" && params.get("etape") !== "adhesion") return;
    const t = setTimeout(() => sectionRef.current?.scrollIntoView({ block: "start" }), 300);
    return () => clearTimeout(t);
  }, [hash, params]);

  // Renouvellement depuis l'espace membre : la formule déjà payée est transmise dans le lien
  const formule = params.get("formule") === "studio" || params.get("formule") === "personne"
    ? (params.get("formule") as "studio" | "personne")
    : formulePourType(result?.type ?? type);
  const isStructure = formule === "studio";
  // Année couverte : celle transmise par l'espace membre (renouvellement anticipé), sinon l'année en cours
  const pour = Number(params.get("pour"));
  const anneeCouverte = Number.isInteger(pour) && pour >= ANNEE && pour <= ANNEE + 1 ? pour : ANNEE;
  const Validite = () => (
    <p className="font-bold text-[17px]" data-validite>
      {libelleValidite(anneeCouverte)}
      {anneeCouverte === ANNEE && periodeRenouvellement() && (
        <span className="block font-normal text-[15px] mt-1">Déjà membre {ANNEE} ? Votre paiement couvrira toute l'année {ANNEE + 1}.</span>
      )}
    </p>
  );
  const consigne = FORMULES_HELLOASSO[formule];
  const Consigne = () => (
    <div className="border-l-[6px] border-accent bg-background p-4 sm:p-5">
      <p className="font-bold text-[17px]">Dans le formulaire HelloAsso, choisissez « {consigne.nom} »</p>
      <p className="mt-1 text-[15px] font-semibold">{libelleValidite(anneeCouverte)}, quelle que soit la date de paiement.</p>
      <p className="mt-1 text-[15px]">{consigne.consigne}. N'ajoutez pas l'autre formule à votre panier.</p>
    </div>
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={PAGES_SEO.adherer.title}
        description={PAGES_SEO.adherer.description}
        path={PAGES.adherer}
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14 pb-12 md:pb-16`}>
          <h1 className="title-page text-[56px] sm:text-[96px]">
            <span className="block max-w-[12ch]">Entrer dans le réseau</span>
            <span className={h1Ligne}>Adhésion aux Podcasteur·euses du Sud</span>
          </h1>
          <p className="mt-5 text-lg max-w-[56ch]">
            D'abord un profil, gratuit mais sans visibilité publique. Ensuite l'adhésion, pour être vu·e, entendu·e et mis·e en relation.
          </p>
          <p className="mt-3 font-bold text-[17px]">Adhésion {ANNEE} : {libelleValidite(ANNEE).toLowerCase()}, quelle que soit la date de paiement.</p>

          <div className="mt-10">
            <table className="w-full border-2 border-encre bg-surface text-[14px] sm:text-[15px]">
              <caption className="sr-only">Comparatif entre un profil gratuit et l'adhésion</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left p-3 sm:p-4 w-[46%] sm:w-[52%]"><span className="sr-only">Ce qui est inclus</span></th>
                  <th scope="col" className="text-left p-3 sm:p-4 border-l border-filet align-bottom">
                    <span className="block font-mono text-xs font-normal text-muted-foreground">Gratuit</span>
                    <span className="block title-section text-[24px]">Profil</span>
                  </th>
                  <th scope="col" className="text-left p-3 sm:p-4 bg-primary text-primary-foreground align-bottom">
                    <span className="block font-mono text-xs font-normal">{TARIFS.personne} € par an</span>
                    <span className="block title-section text-[24px] text-primary-foreground">Membre</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map((r) => (
                  <tr key={r.label} className="border-t border-filet">
                    <th scope="row" className="text-left font-semibold p-3 sm:p-4">{r.label}</th>
                    <td className="p-3 sm:p-4 border-l border-filet text-muted-foreground">{r.profil}</td>
                    <td className="p-3 sm:p-4 bg-primary/10 font-bold">{r.membre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[15px]">
            <strong>Le prix est un frein ?</strong> Adhérez à partir de {TARIFS.minimumPersonne} €. Pour les personnes uniquement : les studios et agences paient {TARIFS.studio} € par an.
          </p>
        </div>

        <section ref={sectionRef} id="inscription" aria-labelledby="inscription-title" className="bg-surface border-y border-filet scroll-mt-20">
          <div className="mx-auto w-full max-w-[920px] px-5 sm:px-8 py-12 md:py-16">
            <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Étapes">
              {steps.map((s, i) => (
                <li key={s} aria-current={i === current ? "step" : undefined} className={`pt-2 border-t-4 ${i <= current ? "border-primary" : "border-filet"}`}>
                  <span className="block font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <span className={`block text-sm sm:text-[15px] leading-tight ${i === current ? "font-bold" : ""}`}>{STEP_LABELS[s]}</span>
                </li>
              ))}
            </ol>

            <h2 id="inscription-title" className="title-section text-[36px] sm:text-[44px] mt-10">{STEP_LABELS[step]}</h2>

            {/* Le profil reste en mémoire pendant l'étape podcasts, pour pouvoir y revenir */}
            <div hidden={step !== "profil"} className="mt-6">
              <p className="mb-6 text-[15px]">
                Déjà un profil ?{" "}
                <button type="button" onClick={() => setStep("adhesion")} className={linkUnderline}>Passer directement à l'adhésion</button>
              </p>
              <ProfilStep
                initialType={initialType}
                onTypeChange={setType}
                onDone={(r) => {
                  setResult(r);
                  setStep(r.type === "podcasteur" ? "podcasts" : "adhesion");
                }}
              />
            </div>

            {step === "podcasts" && result?.profil && (
              <div className="mt-6">
                <p className="mb-6 text-[17px] max-w-[60ch]">
                  Ajoutez un ou plusieurs podcasts. Chacun aura sa page et ses épisodes sur le site, reliés à votre profil.
                </p>
                <PodcastsStep
                  base={profilColumns(result.profil)}
                  onBack={() => setStep("profil")}
                  onDone={(n) => { setPodcastCount(n); setStep("adhesion"); }}
                />
              </div>
            )}

            {step === "adhesion" && (
              <div className="mt-6">
                {result?.saved || podcastCount > 0 ? (
                  <div role="status" className="border-2 border-encre bg-background p-5 mb-8">
                    <p className="font-bold text-[17px]">
                      {podcastCount > 1 ? `Votre profil et vos ${podcastCount} podcasts sont enregistrés.` : podcastCount === 1 ? "Votre profil et votre podcast sont enregistrés." : "Votre profil est enregistré."}
                    </p>
                    <p className="mt-1 text-[15px]">
                      L'équipe le relit sous 48 à 72 heures. Il deviendra visible sur le site une fois votre adhésion réglée.
                    </p>
                    {result && result.type !== "podcasteur" && (
                      <p className="mt-3 text-[15px]">
                        Vous avez aussi un podcast ?{" "}
                        <Link to={`/referencer-mon-podcast?ajout=1&email=${encodeURIComponent(result.email)}`} className={linkUnderline}>Ajouter mon podcast</Link>
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={`border-2 p-5 ${!isStructure ? "border-primary bg-background" : "border-filet bg-background"}`}>
                    <p className="font-mono text-xs text-muted-foreground">Une personne</p>
                    <p className="title-section text-[40px] mt-1">{TARIFS.personne} €<span className="text-[18px]"> / an</span></p>
                    <p className="mt-2 text-[15px]">Le prix est un frein ? Choisissez un montant libre, à partir de {TARIFS.minimumPersonne} €.</p>
                  </div>
                  <div className={`border-2 p-5 ${isStructure ? "border-primary bg-background" : "border-filet bg-background"}`}>
                    <p className="font-mono text-xs text-muted-foreground">Un studio ou une agence</p>
                    <p className="title-section text-[40px] mt-1">{TARIFS.studio} €<span className="text-[18px]"> / an</span></p>
                    <p className="mt-2 text-[15px]">Pour les studios, agences et structures.</p>
                  </div>
                </div>
                <div className="mt-6 border-2 border-encre bg-surface p-4 sm:p-5">
                  <p className="font-mono text-xs text-muted-foreground">Récapitulatif avant paiement</p>
                  <p className="mt-1 text-[17px]">{isStructure ? `Studio ou agence · ${TARIFS.studio} €` : `Personne · ${TARIFS.personne} € conseillés, dès ${TARIFS.minimumPersonne} €`}</p>
                  <div className="mt-1"><Validite /></div>
                </div>
                <div className="mt-4"><Consigne /></div>
                <p className="mt-6 text-[17px] max-w-[62ch]">
                  <strong>Utilisez la même adresse e-mail que pour votre profil{result?.email ? ` (${result.email})` : ""}</strong> : c'est elle qui active votre visibilité.
                </p>
                <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
                  {result?.saved || podcastCount ? (
                    <span />
                  ) : (
                    <button type="button" onClick={() => setStep(result?.type === "podcasteur" ? "podcasts" : "profil")} className={btnSecondary}>
                      {result?.type === "podcasteur" ? "Revenir à mes podcasts" : "Revenir au profil"}
                    </button>
                  )}
                  <button type="button" onClick={() => setStep("paiement")} className={`${btnPrimary} px-8`}>Continuer vers le paiement</button>
                </div>
              </div>
            )}

            {step === "paiement" && (
              <div className="mt-6">
                <div className="mb-4"><Consigne /></div>
                <p className="mb-4 text-[15px]">
                  Paiement sécurisé sur HelloAsso. Une fois le paiement validé, vous arrivez sur une page de bienvenue. L'adhésion suit l'année civile : pas de prorata, elle se termine le 31 décembre.
                </p>
                <iframe
                  id="haWidget"
                  allowTransparency={true}
                  src={HELLOASSO_WIDGET}
                  style={{ width: "100%", border: "none", minHeight: 800 }}
                  title="Formulaire d'adhésion HelloAsso"
                />
                <button type="button" onClick={() => setStep("adhesion")} className={`${btnSecondary} mt-4`}>Revenir aux tarifs</button>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto w-full max-w-[920px] px-5 sm:px-8 py-14 md:py-20">
          <h2 id="faq-title" className="title-section text-[36px] sm:text-[44px] pb-4 border-b-2 border-encre">Questions fréquentes</h2>
          <div className="divide-y divide-filet border-b border-filet">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none flex items-start gap-3 font-bold text-[17px] min-h-[44px] items-center">
                  <span aria-hidden className="inline-block transition-transform group-open:rotate-90 motion-reduce:transition-none">▸</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-6 text-[16px] max-w-[64ch]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Adhesion;
