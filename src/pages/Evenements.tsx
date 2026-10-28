import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import EventRow, { eventHref } from "@/components/agenda/EventRow";
import ProposerEvenementForm from "@/components/agenda/ProposerEvenementForm";
import { isOnline, isOrganizedByPds, type HomeEvent } from "@/components/home/useHomeData";
import { btnListen, container, formatShortDate } from "@/lib/pds";
import photo1 from "@/assets/photos/09-rencontre-inseec-cercle.jpg.asset.json";
import photo2 from "@/assets/photos/16-rencontre-mur-rouge-trio.jpg.asset.json";
import photo3 from "@/assets/photos/03-studio-installation-lumieres.jpg.asset.json";

const FALLBACK_PHOTOS = [
  { url: photo1.url, alt: "Des membres assis en cercle échangent pendant une rencontre." },
  { url: photo2.url, alt: "Trois membres posent ensemble devant un mur rouge." },
  { url: photo3.url, alt: "Installation des lumières et des caméras dans un studio." },
];

type AgendaEvent = HomeEvent & {
  description: string | null;
  date_fin: string | null;
  image_url: string | null;
};

const FILTERS = [
  { key: "tous", label: "Tous", test: () => true },
  { key: "ligne", label: "En ligne", test: (e: AgendaEvent) => isOnline(e) },
  { key: "place", label: "Sur place", test: (e: AgendaEvent) => !isOnline(e) },
  { key: "pds", label: "Organisés par PDS", test: (e: AgendaEvent) => isOrganizedByPds(e) },
  { key: "membres", label: "Proposés par les membres", test: (e: AgendaEvent) => !isOrganizedByPds(e) },
  { key: "ateliers", label: "Ateliers", test: (e: AgendaEvent) => e.type === "atelier" },
] as const;

const SITE = "https://www.les-podcasteur-euses-du-sud.fr";
const FIELDS = "id, titre, sous_titre, description, date_debut, date_fin, lieu, adresse, type, slug, lien_externe, inscription_activee, image_url";

const Evenements = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("tous");

  const { data: upcoming = [], isLoading } = useQuery({
    queryKey: ["agenda-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase.from("evenements").select(FIELDS).eq("publie", true)
        .gte("date_debut", new Date().toISOString()).order("date_debut", { ascending: true });
      if (error) throw error;
      return (data || []) as AgendaEvent[];
    },
  });

  const { data: past = [] } = useQuery({
    queryKey: ["agenda-past"],
    queryFn: async () => {
      const { data, error } = await supabase.from("evenements").select(FIELDS).eq("publie", true)
        .lt("date_debut", new Date().toISOString()).order("date_debut", { ascending: false }).limit(6);
      if (error) throw error;
      return (data || []) as AgendaEvent[];
    },
  });

  const test = FILTERS.find((f) => f.key === filter)!.test;
  const groups = useMemo(() => {
    const m = new Map<string, AgendaEvent[]>();
    upcoming.filter((e) => test(e)).forEach((e) => {
      const key = new Date(e.date_debut).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      m.set(key, [...(m.get(key) || []), e]);
    });
    return Array.from(m.entries());
  }, [upcoming, test]);

  const jsonLd = upcoming.map((e) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.titre,
    description: e.sous_titre || e.description?.split("\n---")[0] || "Événement podcast en Région Sud",
    startDate: e.date_debut,
    ...(e.date_fin && { endDate: e.date_fin }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: isOnline(e) ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    location: isOnline(e)
      ? { "@type": "VirtualLocation", url: e.lien_externe || `${SITE}${eventHref(e)}` }
      : { "@type": "Place", name: e.lieu || "Lieu à préciser", ...(e.adresse && { address: { "@type": "PostalAddress", streetAddress: e.adresse, addressRegion: "Provence-Alpes-Côte d'Azur", addressCountry: "FR" } }) },
    ...(e.image_url && { image: e.image_url }),
    url: `${SITE}${eventHref(e)}`,
    organizer: { "@type": "Organization", name: "Les Podcasteur·euses du Sud", url: SITE },
  }));

  let rowIndex = 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Agenda podcast à Marseille et en Région Sud : apéros écoute, ateliers, rencontres"
        description="Apéros écoute le 9 de chaque mois, ateliers, lives et rencontres podcast à Marseille, en Région Sud et en ligne. Chaque membre peut proposer un événement."
        path="/agenda"
        jsonLd={jsonLd.length ? jsonLd : undefined}
      />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <div className={`${container} pt-10 md:pt-14`}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="title-page text-[64px] sm:text-[96px]">Agenda</h1>
              <p className="mt-4 text-lg max-w-[54ch]">
                Apéros écoute, ateliers, lives et rencontres podcast en Région Sud et en ligne. Chaque membre peut proposer un événement.
              </p>
            </div>
            <a href="#proposer" className={`${btnListen} px-6 self-start md:self-auto`}>
              <Plus className="w-4 h-4" aria-hidden /> Proposer un événement
            </a>
          </div>
        </div>

        <section aria-label="Le rendez-vous mensuel" className="mt-8 bg-primary text-primary-foreground">
          <div className={`${container} py-7 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8`}>
            <p className="title-section text-primary-foreground text-[48px] sm:text-[56px] shrink-0">Le 9</p>
            <p className="text-[17px] sm:text-lg">
              de chaque mois, l'apéro écoute des Podcasteur·euses du Sud. Ouvert à toustes, entrée libre.
            </p>
          </div>
        </section>

        <div className={`${container} pt-8`}>
          <div role="group" aria-label="Filtrer les événements" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`min-h-[44px] px-4 border font-semibold text-[15px] ${filter === f.key ? "bg-encre text-surface border-encre" : "border-encre bg-surface hover:bg-muted"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="py-10 font-mono text-sm text-muted-foreground">Chargement…</p>
          ) : groups.length === 0 ? (
            <p className="py-10 text-lg border-b border-filet">
              Aucun événement à venir dans cette catégorie pour l'instant. Le prochain apéro écoute a lieu le 9 du mois.
            </p>
          ) : (
            groups.map(([month, events]) => (
              <section key={month} className="mt-10" aria-label={month}>
                <h2 className="title-section text-[30px] sm:text-[36px] capitalize pb-3 border-b-2 border-encre">{month}</h2>
                <ul className="divide-y divide-filet border-b border-filet">
                  {events.map((e) => <EventRow key={e.id} e={e} primary={rowIndex++ === 0} cta="Voir" />)}
                </ul>
              </section>
            ))
          )}
        </div>

        <section id="proposer" className="mt-16 md:mt-24 bg-surface border-y border-filet scroll-mt-20" aria-labelledby="proposer-title">
          <div className={`${container} py-14 md:py-20 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16`}>
            <div>
              <h2 id="proposer-title" className="title-section text-[44px] sm:text-[56px]">Proposer un événement</h2>
              <p className="mt-4 text-[17px]">Un atelier, un live, une projection d'écoute, une rencontre : si ça parle podcast ou création sonore, il a sa place ici.</p>
              <p className="mt-3 text-[15px] text-muted-foreground">Chaque proposition est relue par l'équipe avant publication, sous 48 à 72 heures.</p>
            </div>
            <ProposerEvenementForm />
          </div>
        </section>

        {past.length > 0 && (
          <section id="passes" className={`${container} py-16 md:py-20 scroll-mt-20`} aria-labelledby="passes-title">
            <h2 id="passes-title" className="title-section text-[40px] sm:text-[52px]">Déjà passés</h2>
            <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((e, i) => {
                const fb = FALLBACK_PHOTOS[i % FALLBACK_PHOTOS.length];
                return (
                  <li key={e.id}>
                    <Link to={eventHref(e)} className="group block">
                      <span className="block aspect-[4/3] bg-muted overflow-hidden">
                        <img src={e.image_url || fb.url} alt={e.image_url ? `Visuel de l'événement ${e.titre}` : fb.alt} className="w-full h-full object-cover" loading="lazy" />
                      </span>
                      <span className="block mt-3 font-mono text-xs text-muted-foreground">{formatShortDate(e.date_debut)}{e.lieu ? ` · ${e.lieu}` : ""}</span>
                      <span className="block mt-1 font-bold text-[18px] leading-tight group-hover:underline underline-offset-4">{e.titre}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Evenements;
