import { ficheHref } from "@/lib/seo";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGES, PAGES_SEO } from "@/lib/seo";
import { btnSecondary, cleanCity, container, h1Ligne, fullName } from "@/lib/pds";
import MemberAvatar, { avatarFor } from "@/components/MemberAvatar";
import { COLLAB_CHOIX_APPORTE, apporteLabel, collabLabel, phraseApportent } from "@/lib/inscription";

const PROFILS = [
  { value: "", label: "Tous" },
  { value: "podcasteur", label: "Podcasteur·euses" },
  { value: "pro_podcast", label: "Acteur·ices de l'écosystème" },
  { value: "soutien", label: "Soutiens" },
];

const ROLE: Record<string, string> = {
  podcasteur: "podcasteur·euse",
  pro_podcast: "acteur·ice de l'écosystème",
  soutien: "soutien",
};

const DEPARTEMENTS = [
  { code: "04", label: "Alpes-de-Haute-Provence" },
  { code: "05", label: "Hautes-Alpes" },
  { code: "06", label: "Alpes-Maritimes" },
  { code: "13", label: "Bouches-du-Rhône" },
  { code: "83", label: "Var" },
  { code: "84", label: "Vaucluse" },
];

const PAGE = 10;
const fieldClass = "w-full min-h-[40px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface Profile {
  id: string;
  slug: string | null;
  prenom: string | null;
  nom: string | null;
  type_profil: string;
  city_name: string | null;
  department_code: string | null;
  department_label: string | null;
  bio_750: string | null;
  nom_podcast: string | null;
  metier_principal: string | null;
  services_3: string[] | null;
  thematique: string | null;
  vignette_url: string | null;
  photo_profil_url?: string | null;
  cherche_choix: string[] | null;
  apporte_choix: string[] | null;
  cherche_precision: string | null;
  apporte_precision: string | null;
  created_at: string;
}

const Annuaire = () => {
  const [search, setSearch] = useState("");
  const [besoins, setBesoins] = useState<string[]>([]);
  const [profil, setProfil] = useState("");
  const [dept, setDept] = useState("");
  const [visible, setVisible] = useState(PAGE);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["annuaire-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("id, slug, prenom, nom, type_profil, city_name, department_code, department_label, bio_750, nom_podcast, metier_principal, services_3, thematique, vignette_url, photo_profil_url, cherche_choix, apporte_choix, cherche_precision, apporte_precision, created_at")
        .eq("valide", true)
        .in("type_profil", ["podcasteur", "pro_podcast", "soutien"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Profile[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    const q = norm(search.trim());
    return profiles.filter((p) => {
      if (profil && p.type_profil !== profil) return false;
      if (dept && p.department_code !== dept) return false;
      // « Je cherche quelqu'un pour X » : on montre les profils qui APPORTENT X
      if (besoins.length && !besoins.some((b) => p.apporte_choix?.includes(b))) return false;
      if (q) {
        const hay = norm(
          [p.prenom, p.nom, p.nom_podcast, p.metier_principal, p.bio_750, p.city_name, p.thematique, ...(p.services_3 || []), ...(p.apporte_choix || []).map(apporteLabel), p.apporte_precision]
            .filter(Boolean)
            .join(" "),
        );
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [profiles, search, besoins, profil, dept]);

  useEffect(() => setVisible(PAGE), [search, besoins, profil, dept]);

  const hasFilters = !!(search || besoins.length || profil || dept);
  const clear = () => { setSearch(""); setBesoins([]); setProfil(""); setDept(""); };
  const toggle = (v: string) => setBesoins((b) => (b.includes(v) ? b.filter((x) => x !== v) : [...b, v]));

  const summary = (() => {
    const n = filtered.length;
    if (besoins.length) return <strong>{phraseApportent(n, besoins)}</strong>;
    return <strong>{`${n} profil${n > 1 ? "s" : ""}`}</strong>;
  })();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={PAGES_SEO.annuaire.title}
        description={PAGES_SEO.annuaire.description}
        path={PAGES.annuaire}
      />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14 pb-20`}>
          <h1 className="title-page text-[60px] sm:text-[96px]">
            <span className="block">Annuaire</span>
            <span className={h1Ligne}>des podcasteur·euses et pros de l'audio en Région Sud</span>
          </h1>
          <p className="mt-4 text-lg max-w-[56ch]">
            Podcasteur·euses, monteur·euses, voix off, sound designers, consultant·es. Dites ce que vous cherchez, on vous montre qui l'apporte.
          </p>

          <div className="mt-8 grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-10 items-start">
            {/* Filtres */}
            <aside aria-label="Filtres" className="border-t-2 border-encre pt-4 space-y-5">
              <div>
                <label htmlFor="annuaire-search" className="block text-sm font-bold mb-1.5">Rechercher</label>
                <input id="annuaire-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Un nom, une compétence" className={fieldClass} />
              </div>

              <fieldset>
                <legend className="text-sm font-bold mb-2">Je cherche quelqu'un pour</legend>
                <ul className="space-y-0.5">
                  {COLLAB_CHOIX_APPORTE.map((b) => {
                    const id = `besoin-${b.value}`;
                    return (
                      <li key={b.value}>
                        <label htmlFor={id} className="flex items-center gap-2.5 min-h-[32px] cursor-pointer text-[15px]">
                          <input id={id} type="checkbox" checked={besoins.includes(b.value)} onChange={() => toggle(b.value)} className="w-4 h-4 accent-primary shrink-0" />
                          {b.label}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>

              <div>
                <label htmlFor="annuaire-profil" className="block text-sm font-bold mb-1.5">Profil</label>
                <select id="annuaire-profil" value={profil} onChange={(e) => setProfil(e.target.value)} className={fieldClass}>
                  {PROFILS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="annuaire-dept" className="block text-sm font-bold mb-1.5">Département</label>
                <select id="annuaire-dept" value={dept} onChange={(e) => setDept(e.target.value)} className={fieldClass}>
                  <option value="">Toute la région</option>
                  {DEPARTEMENTS.map((d) => <option key={d.code} value={d.code}>{d.label} ({d.code})</option>)}
                </select>
              </div>

              <Link to="/studios" className="block border-2 border-encre bg-surface p-4 hover:border-primary">
                <span className="block font-bold text-[17px]">Vous cherchez un studio ?</span>
                <span className="block mt-1 text-[15px]">Studios et agences ont leur propre rubrique <span aria-hidden>→</span></span>
              </Link>
            </aside>

            {/* Résultats */}
            <section aria-label="Résultats" className="border-t-2 border-encre pt-5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-filet">
                <p className="text-[16px]" aria-live="polite">{isLoading ? "Chargement…" : summary}</p>
                {hasFilters && (
                  <button onClick={clear} className="min-h-[44px] font-bold text-[15px] underline underline-offset-4">Effacer les filtres</button>
                )}
              </div>

              {!isLoading && filtered.length === 0 && (
                <p className="py-10 text-lg">Personne ne correspond encore à cette recherche. Essayez d'enlever un filtre.</p>
              )}

              <ul className="divide-y divide-filet border-b border-filet">
                {filtered.slice(0, visible).map((p) => {
                  const name = fullName(p.prenom, p.nom) || p.nom_podcast || "Membre";
                  const city = cleanCity(p.city_name);
                  const href = ficheHref(p);
                  const cherche = (p.cherche_choix || []).slice(0, 3).map(collabLabel).join(", ");
                  const apporte = (besoins.length
                    ? [...(p.apporte_choix || [])].sort((a, b) => Number(besoins.includes(b)) - Number(besoins.includes(a)))
                    : p.apporte_choix || []
                  ).slice(0, 3).map(apporteLabel).join(", ");
                  return (
                    <li key={p.id} className="grid grid-cols-[56px_1fr] sm:grid-cols-[64px_1fr_auto] gap-x-4 sm:gap-x-5 gap-y-2 py-5">
                      {(() => { const a = avatarFor(p, profiles); return <MemberAvatar prenom={p.prenom} nom={p.nom} photoUrl={a?.url} alt={a?.alt} />; })()}
                      <div className="min-w-0">
                        <h2 className="text-[19px] sm:text-[21px] leading-tight font-bold [font-stretch:100%]">
                          <Link to={href} className="hover:underline underline-offset-4">{name}</Link>
                          <span className="font-normal text-muted-foreground text-[15px]">
                            {" "}— {p.type_profil === "pro_podcast" && p.metier_principal ? p.metier_principal : ROLE[p.type_profil] || "membre"}{city ? `, ${city}` : ""}
                          </span>
                        </h2>
                        {(cherche || apporte) && (
                          <div className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                            {cherche && (
                              <div>
                                <p className="text-sm font-bold text-primary">Cherche</p>
                                <p className="text-[16px]">{cherche}</p>
                              </div>
                            )}
                            {apporte && (
                              <div>
                                <p className="text-sm font-bold text-accent-text">Apporte</p>
                                <p className="text-[16px]">{apporte}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {p.type_profil === "podcasteur" && p.nom_podcast && (
                          <p className="mt-2 text-sm text-muted-foreground">Podcast : {p.nom_podcast}</p>
                        )}
                      </div>
                      <Link to={href} className="col-start-2 sm:col-start-auto inline-flex min-h-[44px] sm:min-h-0 items-start font-bold text-[15px] underline underline-offset-4 whitespace-nowrap" aria-label={`Voir le profil de ${name}`}>
                        Voir le profil
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {filtered.length > visible && (
                <div className="flex justify-center mt-10">
                  <button onClick={() => setVisible((v) => v + PAGE)} className={btnSecondary}>Afficher plus de profils</button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Annuaire;
