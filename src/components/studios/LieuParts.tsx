// Éléments partagés des fiches studio et structure.
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fullName } from "@/lib/pds";
import { formatDateCourte, type Faq, type PodcastLie } from "@/lib/lieux";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Colonnes publiques d'une fiche studio ou structure : jamais l'e-mail ni le téléphone. */
export const LIEU_COLUMNS =
  "id, slug, type_profil, nom_podcast, city_name, department_code, department_label, bio_750, description, vignette_url, lien_principal, lien_linkedin, consent_contact, metier_principal, studio_data";

export type LieuRow = {
  id: string;
  slug: string | null;
  type_profil: string;
  nom_podcast: string;
  city_name: string | null;
  department_code: string | null;
  department_label: string | null;
  bio_750: string | null;
  description: string | null;
  vignette_url: string | null;
  lien_principal: string | null;
  lien_linkedin: string | null;
  consent_contact: boolean;
  metier_principal: string | null;
  // deno-lint-ignore no-explicit-any
  studio_data: Record<string, any> | string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sdOf = (p?: { studio_data: LieuRow["studio_data"] } | null): Record<string, any> => {
  if (!p?.studio_data) return {};
  if (typeof p.studio_data === "string") { try { return JSON.parse(p.studio_data); } catch { return {}; } }
  return p.studio_data;
};

export const useLieu = (type: "studio" | "structure_eco", slug?: string) =>
  useQuery({
    queryKey: ["lieu", type, slug],
    queryFn: async () => {
      let q = supabase.from("podcasts").select(LIEU_COLUMNS).eq("valide", true).eq("type_profil", type);
      q = UUID_RE.test(slug!) ? q.eq("id", slug!) : q.eq("slug", slug!);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return (data as unknown as LieuRow) || null;
    },
    enabled: !!slug,
  });

/** Podcasts membres liés (« Enregistrés ici », « Membres accompagnés »…) avec leur nom et leur fiche. */
export const usePodcastsLies = (lies: PodcastLie[]) =>
  useQuery({
    queryKey: ["podcasts-lies", lies.map((l) => l.id).join(",")],
    queryFn: async () => {
      const { data } = await supabase
        .from("podcasts")
        .select("id, slug, nom_podcast, prenom, nom, vignette_url, photo_profil_url, type_profil")
        .in("id", lies.map((l) => l.id))
        .eq("valide", true);
      const byId = new Map((data || []).map((p) => [p.id, p]));
      return lies.filter((l) => byId.has(l.id)).map((l) => ({ ...l, p: byId.get(l.id)! }));
    },
    enabled: lies.length > 0,
  });

export const PodcastsLiesList = ({ lies }: { lies: PodcastLie[] }) => {
  const { data = [] } = usePodcastsLies(lies);
  if (!data.length) return null;
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(({ p, date, url }) => {
        const name = p.type_profil === "podcasteur" && p.nom_podcast && p.nom_podcast !== "—" ? p.nom_podcast : fullName(p.prenom, p.nom) || p.nom_podcast;
        const img = p.type_profil === "podcasteur" ? p.vignette_url : p.photo_profil_url || p.vignette_url;
        return (
          <li key={p.id} className="flex items-center gap-3 border border-filet bg-surface p-3">
            {img ? <img src={img} alt="" className="w-14 h-14 object-cover shrink-0" loading="lazy" /> : <span className="w-14 h-14 bg-muted shrink-0" />}
            <div className="min-w-0">
              <Link to={`/podcasteur/${p.slug || p.id}`} className="font-bold leading-tight hover:underline underline-offset-4 line-clamp-2">{name}</Link>
              <p className="text-sm text-muted-foreground">
                {[formatDateCourte(date), p.type_profil === "podcasteur" ? fullName(p.prenom, p.nom) : null].filter(Boolean).join(" · ")}
              </p>
              {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4">Écouter<span className="sr-only"> (nouvel onglet)</span></a>}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export const FaqList = ({ faq }: { faq: Faq[] }) => (
  <div className="divide-y divide-filet border-y border-filet">
    {faq.map((f) => (
      <details key={f.q} className="group py-4">
        <summary className="cursor-pointer font-bold text-[18px] list-none flex justify-between gap-4 [&::-webkit-details-marker]:hidden">
          {f.q}<span aria-hidden className="font-mono group-open:rotate-45 motion-safe:transition-transform">+</span>
        </summary>
        <p className="mt-2 text-[16px] whitespace-pre-line">{f.r}</p>
      </details>
    ))}
  </div>
);

export const faqJsonLd = (faq: Faq[]) =>
  faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.r } })),
      }
    : null;

/** Lien « Voir le plan » : ouvre l'adresse dans l'application de cartes du visiteur. */
export const planUrl = (adresse: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
