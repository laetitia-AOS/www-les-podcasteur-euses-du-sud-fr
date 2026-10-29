import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { btnListen, btnPrimary, btnSecondary, cleanCity, container } from "@/lib/pds";
import DevisForm from "@/components/studios/DevisForm";
import { SERVICES_STUDIO, formatCapacite, formatTarif, serviceLabel, useFichesLieux } from "@/lib/lieux";

const DEPARTEMENTS = [
  { code: "04", label: "Alpes-de-Haute-Provence" },
  { code: "05", label: "Hautes-Alpes" },
  { code: "06", label: "Alpes-Maritimes" },
  { code: "13", label: "Bouches-du-Rhône" },
  { code: "83", label: "Var" },
  { code: "84", label: "Vaucluse" },
];

const TYPES_STUDIO = [
  "Studio podcast équipé",
  "Studio audio polyvalent",
  "Plateau vidéo podcast",
  "Cabine voix off",
  "Lieu d'enregistrement mobile",
  "Salle de formation / atelier",
  "Lieu événementiel avec captation possible",
];

type StudioData = {
  type_lieu?: string;
  accroche?: string;
  phrase_accroche?: string;
  indication_tarifaire?: string;
  capacite?: string;
  accessibilite?: string[];
  services_studio?: string[];
  usages?: string[];
  galerie_urls?: string[];
};

interface Profile {
  id: string;
  slug: string | null;
  type_profil: string;
  city_name: string | null;
  department_code: string | null;
  bio_750: string | null;
  description: string | null;
  nom_podcast: string;
  metier_principal: string | null;
  services_3: string[] | null;
  vignette_url: string | null;
  consent_contact: boolean;
  studio_data: StudioData | string | null;
}

const sdOf = (p: Profile): StudioData => {
  if (!p.studio_data) return {};
  if (typeof p.studio_data === "string") { try { return JSON.parse(p.studio_data); } catch { return {}; } }
  return p.studio_data;
};

const fieldLight = "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

const AgencesStudios = () => {
  const [dept, setDept] = useState("");
  const [type, setType] = useState("");
  const [besoin, setBesoin] = useState("");
  const [devisFor, setDevisFor] = useState<string | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["studios-structures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, type_profil, city_name, department_code, bio_750, description, nom_podcast, metier_principal, services_3, vignette_url, consent_contact, studio_data")
        .eq("valide", true)
        .in("type_profil", ["studio", "structure_eco"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Profile[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const studios = profiles.filter((p) => p.type_profil === "studio");
  const { data: fiches = {} } = useFichesLieux(studios.map((s) => s.id));
  const structures = profiles.filter((p) => p.type_profil === "structure_eco");

  const filtered = useMemo(() => {
    return studios.filter((p) => {
      const sd = sdOf(p);
      if (dept && p.department_code !== dept) return false;
      if (type && sd.type_lieu !== type) return false;
      if (besoin && !(fiches[p.id]?.services || []).includes(besoin)) return false;
      return true;
    });
  }, [studios, dept, type, besoin, fiches]);

  const openDevis = (id: string | null) => {
    setDevisFor(id);
    document.getElementById("devis")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => document.getElementById("devis-nom")?.focus({ preventScroll: true }), 400);
  };

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Studios et agences podcast en Région Sud",
    itemListElement: studios.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.les-podcasteur-euses-du-sud.fr/studios/${s.slug || s.id}`,
      name: s.nom_podcast,
    })),
  }), [studios]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Studios podcast et agences à Marseille et en Région Sud — Les Podcasteur·euses du Sud"
        description="Où enregistrer, avec qui produire, qui peut monter ou réaliser votre podcast en Région Sud : studios audio, plateaux vidéo, agences. Demandez un devis en une fois."
        path="/studios"
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14`}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="title-page text-[56px] sm:text-[88px]">Studios<br />&amp; agences</h1>
              <p className="mt-4 text-lg max-w-[52ch]">
                Où enregistrer, avec qui produire, qui peut monter ou réaliser votre podcast dans la région.
              </p>
            </div>
            <button onClick={() => openDevis(null)} className={`${btnListen} px-6 self-start md:self-auto`}>Je cherche un studio</button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 pb-6 border-b-2 border-encre">
            <div>
              <label htmlFor="studios-dept" className="block text-sm font-bold mb-1.5">Département</label>
              <select id="studios-dept" value={dept} onChange={(e) => setDept(e.target.value)} className={fieldLight}>
                <option value="">Toute la région</option>
                {DEPARTEMENTS.map((d) => <option key={d.code} value={d.code}>{d.label} ({d.code})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="studios-type" className="block text-sm font-bold mb-1.5">Type de lieu</label>
              <select id="studios-type" value={type} onChange={(e) => setType(e.target.value)} className={fieldLight}>
                <option value="">Studios et agences</option>
                {TYPES_STUDIO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <p id="besoin-label" className="text-sm font-bold mb-2">J'ai besoin de</p>
            <div role="group" aria-labelledby="besoin-label" className="flex flex-wrap gap-2">
              {SERVICES_STUDIO.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBesoin(besoin === b.value ? "" : b.value)}
                  aria-pressed={besoin === b.value}
                  className={`min-h-[44px] px-4 border font-semibold text-[15px] ${besoin === b.value ? "bg-encre text-surface border-encre" : "border-encre bg-surface hover:bg-muted"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 font-mono text-sm text-muted-foreground" aria-live="polite">
            {isLoading ? "Chargement…" : `${filtered.length} studio${filtered.length > 1 ? "s" : ""}`}
          </p>

          {!isLoading && filtered.length === 0 && (
            <p className="py-10 text-lg">Aucun studio ne correspond encore à ces critères. Enlevez un filtre, ou décrivez votre besoin plus bas : l'équipe vous orientera.</p>
          )}

          <ul className="mt-4 grid md:grid-cols-2 gap-6">
            {filtered.map((p) => {
              const sd = sdOf(p);
              const f = fiches[p.id];
              const services = (f?.services || []).map(serviceLabel);
              const photo = f?.photos?.[0] || sd.galerie_urls?.[0] || p.vignette_url;
              const href = `/studios/${p.slug || p.id}`;
              const accroche = sd.accroche || sd.phrase_accroche || p.description || p.bio_750 || "";
              const meta = [
                { k: "Tarif", v: formatTarif(f?.tarif_heure) || sd.indication_tarifaire },
                { k: "Capacité", v: formatCapacite(f?.capacite_voix) },
                { k: "Accès", v: f?.acces_transports },
              ].filter((m) => m.v);
              return (
                <li key={p.id} className="bg-surface border border-filet flex flex-col">
                  <Link to={href} tabIndex={-1} aria-hidden className="block aspect-[16/9] bg-muted overflow-hidden">
                    {photo && <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />}
                  </Link>
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    {sd.type_lieu && <p className="text-sm font-bold text-primary">{sd.type_lieu}</p>}
                    <h2 className="title-section text-[30px] sm:text-[34px] mt-1">
                      <Link to={href} className="hover:underline underline-offset-4">{p.nom_podcast}</Link>
                    </h2>
                    {p.city_name && <p className="text-[15px] text-muted-foreground">{cleanCity(p.city_name)}</p>}
                    {accroche && <p className="mt-3 text-[17px] line-clamp-3">{accroche}</p>}
                    {meta.length > 0 && (
                      <dl className="mt-4 grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 border-y border-filet py-3">
                        {meta.map((m) => (
                          <div key={m.k} className="min-w-0">
                            <dt className="text-xs text-muted-foreground">{m.k}</dt>
                            <dd className="font-mono text-sm break-words">{m.v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {services.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
                        {services.slice(0, 5).map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    )}
                    <div className="mt-auto pt-5 flex flex-wrap gap-3">
                      {p.consent_contact && (
                        <button onClick={() => openDevis(p.id)} className={btnPrimary} aria-label={`Demander un devis à ${p.nom_podcast}`}>Demander un devis</button>
                      )}
                      <Link to={href} className={btnSecondary} aria-label={`Voir la fiche de ${p.nom_podcast}`}>Voir la fiche</Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Demande de devis */}
        <section id="devis" className="mt-16 md:mt-24 bg-encre text-surface scroll-mt-20" aria-labelledby="devis-title">
          <div className={`${container} py-12 md:py-16 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10`}>
            <div>
              <h2 id="devis-title" className="title-section text-surface text-[40px] sm:text-[52px]">Décrivez votre besoin, les studios vous répondent</h2>
              <p className="mt-4 text-[17px] text-surface/85">
                {devisFor
                  ? <>Votre demande sera envoyée à <strong>{studios.find((s) => s.id === devisFor)?.nom_podcast}</strong>.</>
                  : <>Une seule demande, envoyée à tous les studios membres du département qui proposent les besoins cochés. Vous comparez, vous choisissez.</>}
              </p>
              {devisFor && (
                <button onClick={() => setDevisFor(null)} className="mt-3 inline-flex min-h-[44px] items-center font-bold underline underline-offset-4">
                  Envoyer plutôt à tous les studios qui correspondent
                </button>
              )}
            </div>

            <DevisForm
              key={devisFor || "groupe"}
              dark
              studioId={devisFor}
              studioName={devisFor ? studios.find((x) => x.id === devisFor)?.nom_podcast : undefined}
              defaultDepartement={dept}
              defaultBesoins={besoin ? [besoin] : []}
            />
          </div>
        </section>

        {/* Structures */}
        <section className={`${container} py-16 md:py-20`} aria-labelledby="structures-title">
          <h2 id="structures-title" className="title-section text-[40px] sm:text-[52px] pb-4 border-b-2 border-encre">Radios, festivals, incubateurs</h2>
          {structures.length === 0 && !isLoading ? (
            <p className="py-6 text-[17px] border-b border-filet">Les premières structures arrivent bientôt.</p>
          ) : (
            <ul className="divide-y divide-filet border-b border-filet">
              {structures.map((s) => (
                <li key={s.id}>
                  <Link to={`/structures/${s.slug || s.id}`} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 group">
                    <span className="font-bold text-[18px] group-hover:underline underline-offset-4">{s.nom_podcast}</span>
                    <span className="font-mono text-sm text-muted-foreground">{[s.metier_principal, cleanCity(s.city_name)].filter(Boolean).join(" · ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 border-2 border-encre bg-surface p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-bold text-[18px]">Vous êtes un studio, une agence ou une structure ?</p>
              <Link to="/espace-membre" className="mt-1 inline-flex min-h-[36px] items-center text-[15px] underline underline-offset-4">Déjà référencé·e ? Ajouter un podcast depuis l'espace membre</Link>
            </div>
            <Link to="/adherer?profil=studio#inscription" className={`${btnSecondary} shrink-0`}>Référencer ma structure</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AgencesStudios;
