import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { btnListen, btnPrimary, btnSecondary, cleanCity, container } from "@/lib/pds";

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

// « J'ai besoin de » : chaque bouton correspond à un service ou un usage déclaré par les studios
const BESOINS: { label: string; test: (sd: StudioData, services: string[]) => boolean }[] = [
  { label: "Louer un studio", test: (_sd, s) => s.includes("Mise à disposition du studio") },
  { label: "Enregistrer en audio", test: (_sd, s) => s.includes("Enregistrement audio") },
  { label: "Filmer un vidéo-podcast", test: (sd, s) => s.includes("Enregistrement vidéo podcast") || !!sd.usages?.includes("Vidéo podcast") },
  { label: "Montage", test: (_sd, s) => s.includes("Montage") },
  { label: "Réalisation", test: (_sd, s) => s.includes("Réalisation") },
  { label: "Direct / live", test: (sd) => !!sd.usages?.includes("Livestream") },
  { label: "Studio mobile", test: (sd) => sd.type_lieu === "Lieu d'enregistrement mobile" },
];

const FORMATS = ["Audio", "Vidéo", "Audio et vidéo", "Direct / live"];

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
const fieldDark = "w-full min-h-[48px] px-3 bg-encre text-surface border-2 border-surface/70 text-[16px] placeholder:text-surface/55 focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

const devisSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre prénom et votre nom.").max(100),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  format: z.string(),
  quand: z.string().trim().max(120),
  projet: z.string().trim().min(10, "Décrivez votre projet en quelques mots (10 caractères minimum).").max(2500),
});

const AgencesStudios = () => {
  const [dept, setDept] = useState("");
  const [type, setType] = useState("");
  const [besoin, setBesoin] = useState("");
  const [devisFor, setDevisFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", format: FORMATS[0], quand: "", projet: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendMsg, setSendMsg] = useState("");

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
  const structures = profiles.filter((p) => p.type_profil === "structure_eco");

  const filtered = useMemo(() => {
    const b = BESOINS.find((x) => x.label === besoin);
    return studios.filter((p) => {
      const sd = sdOf(p);
      const services = sd.services_studio || p.services_3 || [];
      if (dept && p.department_code !== dept) return false;
      if (type && sd.type_lieu !== type) return false;
      if (b && !b.test(sd, services)) return false;
      return true;
    });
  }, [studios, dept, type, besoin]);

  // Destinataires du devis : le studio choisi, sinon tous les studios affichés
  const recipients = (devisFor ? studios.filter((s) => s.id === devisFor) : filtered).filter((s) => s.consent_contact);

  const openDevis = (id: string | null) => {
    setDevisFor(id);
    setSendState("idle");
    document.getElementById("devis")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => document.getElementById("devis-name")?.focus({ preventScroll: true }), 400);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submitDevis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.website) return;
    const parsed = devisSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    if (!recipients.length) {
      setSendMsg("Aucun studio ne correspond à vos filtres. Élargissez la recherche puis réessayez.");
      setSendState("error");
      return;
    }
    setErrors({});
    setSendState("sending");
    const d = parsed.data;
    const message = `Demande de devis\nFormat : ${d.format}${d.quand ? `\nQuand : ${d.quand}` : ""}\n\nLe projet :\n${d.projet}`;
    // Un seul envoi pour tous les studios choisis
    const result = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-membre`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ recipient_ids: recipients.map((r) => r.id), sender_name: d.name, sender_email: d.email, message }),
    })
      .then(async (res) => ({ ok: res.ok, body: (await res.json().catch(() => ({}))) as { error?: string; count?: number } }))
      .catch(() => ({ ok: false, body: {} as { error?: string; count?: number } }));
    if (!result.ok) {
      setSendMsg(result.body?.error || "La demande n'a pas pu partir. Réessayez dans un instant.");
      setSendState("error");
      return;
    }
    const okCount = result.body?.count ?? recipients.length;
    setSendMsg(
      okCount === 1
        ? "Votre demande est enregistrée. L'équipe la transmet au studio, qui vous répondra directement."
        : `Votre demande est enregistrée pour ${okCount} studios. L'équipe la leur transmet, ils vous répondront directement.`,
    );
    setSendState("sent");
  };

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Studios et agences podcast en Région Sud",
    itemListElement: studios.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.les-podcasteur-euses-du-sud.fr/annuaire-podcasts/studios/${s.slug || s.id}`,
      name: s.nom_podcast,
    })),
  }), [studios]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Studios podcast et agences à Marseille et en Région Sud — Les Podcasteur·euses du Sud"
        description="Où enregistrer, avec qui produire, qui peut monter ou réaliser votre podcast en Région Sud : studios audio, plateaux vidéo, agences. Demandez un devis en une fois."
        path="/studios-podcast"
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
              {BESOINS.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setBesoin(besoin === b.label ? "" : b.label)}
                  aria-pressed={besoin === b.label}
                  className={`min-h-[44px] px-4 border font-semibold text-[15px] ${besoin === b.label ? "bg-encre text-surface border-encre" : "border-encre bg-surface hover:bg-muted"}`}
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
              const services = sd.services_studio || p.services_3 || [];
              const photo = sd.galerie_urls?.[0] || p.vignette_url;
              const href = `/annuaire-podcasts/studios/${p.slug || p.id}`;
              const accroche = sd.accroche || sd.phrase_accroche || p.description || p.bio_750 || "";
              const meta = [
                { k: "Tarif", v: sd.indication_tarifaire },
                { k: "Capacité", v: sd.capacite },
                { k: "Accès", v: sd.accessibilite?.filter((a) => a !== "Autre").slice(0, 2).join(", ") },
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
                  : <>Une seule demande, envoyée {recipients.length > 1 ? `aux ${recipients.length} studios` : "au studio"} qui correspond{recipients.length > 1 ? "ent" : ""} à vos filtres. Vous comparez, vous choisissez.</>}
              </p>
              {devisFor && (
                <button onClick={() => setDevisFor(null)} className="mt-3 inline-flex min-h-[44px] items-center font-bold underline underline-offset-4">
                  Envoyer plutôt à tous les studios affichés
                </button>
              )}
              {!devisFor && recipients.length > 0 && (
                <p className="mt-3 text-sm text-surface/70">{recipients.map((r) => r.nom_podcast).join(" · ")}</p>
              )}
            </div>

            {sendState === "sent" ? (
              <div role="status" className="self-center">
                <p className="font-bold text-2xl">Demande envoyée.</p>
                <p className="mt-2 text-[17px] text-surface/85">{sendMsg}</p>
              </div>
            ) : (
              <form onSubmit={submitDevis} noValidate className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="devis-name" className="block text-sm font-bold mb-1.5">Prénom et nom</label>
                  <input id="devis-name" name="name" value={form.name} onChange={onChange} autoComplete="name" className={fieldDark} aria-invalid={!!errors.name} />
                  {errors.name && <p className="mt-1 text-sm text-accent">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="devis-email" className="block text-sm font-bold mb-1.5">E-mail</label>
                  <input id="devis-email" name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" className={fieldDark} aria-invalid={!!errors.email} />
                  {errors.email && <p className="mt-1 text-sm text-accent">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="devis-format" className="block text-sm font-bold mb-1.5">Format</label>
                  <select id="devis-format" name="format" value={form.format} onChange={onChange} className={fieldDark}>
                    {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="devis-quand" className="block text-sm font-bold mb-1.5">Quand</label>
                  <input id="devis-quand" name="quand" value={form.quand} onChange={onChange} placeholder="Date ou période" className={fieldDark} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="devis-projet" className="block text-sm font-bold mb-1.5">Votre projet</label>
                  <textarea id="devis-projet" name="projet" rows={4} value={form.projet} onChange={onChange} placeholder="Nombre de voix, nombre d'épisodes, montage ou non…" className={`${fieldDark} py-2 resize-y`} aria-invalid={!!errors.projet} />
                  {errors.projet && <p className="mt-1 text-sm text-accent">{errors.projet}</p>}
                </div>
                <div className="hidden" aria-hidden>
                  <label htmlFor="devis-website">Site web</label>
                  <input id="devis-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={onChange} />
                </div>
                {sendState === "error" && <p role="alert" className="sm:col-span-2 font-semibold text-accent">{sendMsg}</p>}
                <div className="sm:col-span-2">
                  <button type="submit" disabled={sendState === "sending"} className={`${btnListen} px-7`}>
                    {sendState === "sending" ? "Envoi…" : "Envoyer ma demande"}
                  </button>
                </div>
              </form>
            )}
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
                  <Link to={`/annuaire-podcasts/structures/${s.slug || s.id}`} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 group">
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
            <Link to="/rejoindre-association?profil=studio#inscription" className={`${btnSecondary} shrink-0`}>Référencer ma structure</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AgencesStudios;
