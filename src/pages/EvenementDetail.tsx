import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import EvenementInscriptionForm from "@/components/EvenementInscriptionForm";
import PodcastsInvitesDisplay from "@/components/PodcastsInvitesDisplay";
import { eventHref } from "@/components/agenda/EventRow";
import { cityFromAddress, isOnline, isOrganizedByPds, type HomeEvent } from "@/components/home/useHomeData";
import { withUtm } from "@/lib/utm";
import { btnPrimary, btnSecondary, container, linkUnderline } from "@/lib/pds";
import { cleanAddress, downloadIcs, publicDescription, readableTitle } from "@/lib/events";
import bande from "@/assets/photos/bande-accueil-mur-rouge.jpg.asset.json";

const SITE = "https://www.les-podcasteur-euses-du-sud.fr";

// Libellé du type d'événement pour le titre principal « [Type] à [Ville] : [Titre] »
const H1_TYPE: Record<string, string> = {
  rencontre: "Rencontre podcast",
  atelier: "Atelier podcast",
  evenement: "Événement podcast",
  partenaire: "Événement podcast",
};
const LABEL_TYPE: Record<string, string> = {
  rencontre: "Rencontre",
  atelier: "Atelier",
  evenement: "Événement",
  partenaire: "Événement partenaire",
};

type Evt = HomeEvent & {
  description: string | null;
  date_fin: string | null;
  image_url: string | null;
  places: number | null;
  podcasts_invites: unknown;
};

const hour = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase("fr-FR") + s.slice(1);

const EvenementDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: evt, isLoading } = useQuery({
    queryKey: ["evenement-detail", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("id, titre, sous_titre, description, date_debut, date_fin, lieu, adresse, type, slug, lien_externe, inscription_activee, image_url, places, podcasts_invites")
        .eq("slug", slug!)
        .eq("publie", true)
        .maybeSingle();
      if (error) throw error;
      return data as Evt | null;
    },
  });

  const { data: next = [] } = useQuery({
    queryKey: ["evenement-next", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("id, titre, sous_titre, date_debut, lieu, adresse, type, slug, lien_externe, inscription_activee")
        .eq("publie", true)
        .gte("date_debut", new Date().toISOString())
        .neq("slug", slug!)
        .order("date_debut", { ascending: true })
        .limit(3);
      if (error) throw error;
      return (data || []) as HomeEvent[];
    },
  });

  const view = useMemo(() => {
    if (!evt) return null;
    const start = new Date(evt.date_debut);
    const end = evt.date_fin ? new Date(evt.date_fin) : null;
    const online = isOnline(evt);
    const pds = isOrganizedByPds(evt);
    const city = online ? "" : cityFromAddress(evt.adresse) || (evt.lieu && /marseille/i.test(evt.lieu) ? "Marseille" : "");
    const titre = readableTitle(evt.titre);
    const h1 = `${H1_TYPE[evt.type] || "Événement podcast"} ${online ? "en ligne" : city ? `à ${city}` : ""} : ${titre}`.replace(/\s+:/, " :");
    const dateLong = capitalize(start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    const horaires = end ? `de ${hour(start)} à ${hour(end)}` : `à partir de ${hour(start)}`;
    const lieuPhrase = online ? "en ligne" : evt.lieu ? `chez ${evt.lieu}${city ? ` (${city})` : ""}` : city ? `à ${city}` : "";
    const tarif = pds ? "Entrée libre" : "";
    const intro = `${dateLong}, ${horaires}${lieuPhrase ? `, ${lieuPhrase}` : ""}.${evt.sous_titre ? ` ${evt.sous_titre.replace(/\.$/, "")}.` : ""}${tarif ? ` ${tarif}.` : ""}`;
    const isPast = (end || start) < new Date();
    const url = `${SITE}${eventHref(evt)}`;
    return { start, end, online, pds, city, titre, h1, dateLong, horaires, tarif, intro, isPast, url, description: publicDescription(evt.description) };
  }, [evt]);

  const jsonLd = useMemo(() => {
    if (!evt || !view) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: view.h1,
      description: view.description || view.intro,
      startDate: evt.date_debut,
      ...(evt.date_fin && { endDate: evt.date_fin }),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: view.online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
      location: view.online
        ? { "@type": "VirtualLocation", url: evt.lien_externe || view.url }
        : {
            "@type": "Place",
            name: evt.lieu || view.city || "Lieu à préciser",
            address: { "@type": "PostalAddress", ...(evt.adresse && { streetAddress: cleanAddress(evt.adresse) }), ...(view.city && { addressLocality: view.city }), addressRegion: "Provence-Alpes-Côte d'Azur", addressCountry: "FR" },
          },
      image: evt.image_url || `${SITE}/og-image.jpg`,
      url: view.url,
      ...(view.pds && { isAccessibleForFree: true, offers: { "@type": "Offer", price: 0, priceCurrency: "EUR", availability: "https://schema.org/InStock", url: view.url } }),
      ...(evt.places && { maximumAttendeeCapacity: evt.places }),
      organizer: { "@type": "Organization", name: "Les Podcasteur·euses du Sud", url: SITE },
    };
  }, [evt, view]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 md:pt-[76px]"><p className={`${container} py-20 font-mono text-muted-foreground`}>Chargement…</p></main>
      </div>
    );
  }

  if (!evt || !view) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Événement introuvable — Les Podcasteur·euses du Sud" description="Cet événement n'existe pas ou n'est plus publié." path={`/agenda/${slug}`} />
        <Navbar />
        <main className={`${container} pt-32 pb-24`}>
          <h1 className="title-page text-[52px]">Événement introuvable</h1>
          <p className="mt-4 text-lg">Cet événement n'existe pas, ou il n'est plus publié.</p>
          <Link to="/agenda" className={`${btnSecondary} mt-8`}>Voir l'agenda</Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Partage : lien servi par la fonction d'aperçu (image et titre de l'événement pour les réseaux)
  const ogShareUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-evenement/${evt.slug}?v=${Date.now()}`;
  const shareText = `${view.titre} — Les Podcasteur·euses du Sud`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(ogShareUrl); toast.success("Lien copié."); }
    catch { toast.error("Le lien n'a pas pu être copié."); }
  };
  const openShare = (u: string) => window.open(u, "_blank", "noopener,noreferrer,width=600,height=600");

  const mapsQuery = evt.adresse || evt.lieu;
  const invites = Array.isArray(evt.podcasts_invites) ? (evt.podcasts_invites as never[]) : [];
  const canRegister = evt.inscription_activee && !view.isPast;
  const day = view.start.toLocaleDateString("fr-FR", { weekday: "long" });
  const monthYear = view.start.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }).replace(".", "");

  const faq = view.pds
    ? [
        { q: "Faut-il payer pour venir ?", a: "Non, l'entrée est libre. Les consommations sont à votre charge." },
        { q: "Faut-il faire un podcast pour venir ?", a: "Non. Créateur·ices, auditeur·ices, curieux·ses : l'apéro écoute est ouvert à toustes." },
        { q: "Faut-il réserver ?", a: canRegister ? "Oui, inscrivez-vous avec le formulaire de cette page : cela nous aide à prévoir la place." : "Non, venez directement." },
        { q: "Comment faire écouter mon podcast lors d'un apéro ?", a: "Écrivez à l'équipe depuis la page Contact en présentant votre podcast : elle choisit les écoutes de chaque soirée." },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${view.h1} — ${view.start.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
        description={view.intro.slice(0, 158)}
        path={eventHref(evt)}
        image={evt.image_url || undefined}
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="pt-16 md:pt-[76px]">
        <nav aria-label="Fil d'Ariane" className={`${container} pt-5`}>
          <ol className="flex flex-wrap items-center gap-x-2 text-sm">
            <li><Link to="/" className="underline underline-offset-4">Accueil</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/agenda" className="underline underline-offset-4">Agenda</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-muted-foreground">{view.titre}, {view.start.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</li>
          </ol>
        </nav>

        <header className={`${container} pt-6 pb-10 grid sm:grid-cols-[150px_1fr] gap-6 sm:gap-10 items-start`}>
          <div className="border-2 border-encre bg-surface w-[130px] sm:w-[150px] text-center py-3" aria-hidden>
            <p className="text-sm font-bold uppercase">{day}</p>
            <p className="title-section text-[72px] leading-none my-1">{view.start.getDate()}</p>
            <p className="text-sm font-bold uppercase">{monthYear}</p>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary">
              {LABEL_TYPE[evt.type] || "Événement"} · {view.pds ? "organisé par Les Podcasteur·euses du Sud" : "proposé par un membre"}
            </p>
            <h1 className="title-section text-[40px] sm:text-[56px] lg:text-[64px] mt-2">{view.h1}</h1>
            <p className="mt-5 text-lg max-w-[62ch]">{view.intro}</p>
            {view.isPast && <p className="mt-3 font-bold text-accent-text">Cet événement est passé.</p>}
          </div>
        </header>

        <img
          src={evt.image_url || bande.url}
          alt={evt.image_url ? `Visuel de l'événement ${view.titre}` : "Un apéro écoute des Podcasteur·euses du Sud dans une salle aux murs rouges."}
          className="w-full aspect-[16/9] sm:aspect-[1800/650] object-cover"
        />

        <div className={`${container} py-12 md:py-16 grid lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-start`}>
          {/* Infos pratiques */}
          <aside aria-labelledby="infos-title" className="border-2 border-encre bg-surface p-6 lg:sticky lg:top-24">
            <h2 id="infos-title" className="title-section text-[28px]">Infos pratiques</h2>
            <dl className="mt-4 space-y-3 text-[16px]">
              <div><dt className="text-sm font-bold">Date</dt><dd>{view.dateLong}</dd></div>
              <div><dt className="text-sm font-bold">Horaires</dt><dd className="font-mono">{hour(view.start)}{view.end ? ` – ${hour(view.end)}` : ""}</dd></div>
              <div>
                <dt className="text-sm font-bold">Lieu</dt>
                <dd>
                  {view.online ? "En ligne" : <>{evt.lieu}{evt.adresse && <><br />{cleanAddress(evt.adresse)}</>}</>}
                </dd>
              </div>
              {evt.places && <div><dt className="text-sm font-bold">Places</dt><dd className="font-mono">{evt.places}</dd></div>}
              {view.tarif && <div><dt className="text-sm font-bold">Tarif</dt><dd>{view.tarif}</dd></div>}
              <div><dt className="text-sm font-bold">Organisé par</dt><dd>{view.pds ? "Les Podcasteur·euses du Sud" : "Un membre du réseau"}</dd></div>
            </dl>

            {!view.isPast && (
              <div className="mt-6 grid gap-3">
                {canRegister ? (
                  <a href="#inscription" className={`${btnPrimary} w-full`}>Je viens</a>
                ) : evt.lien_externe ? (
                  <a href={withUtm(evt.lien_externe, "evenement")} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} w-full`}>
                    S'inscrire<span className="sr-only"> (nouvel onglet)</span>
                  </a>
                ) : null}
                <button
                  onClick={() => downloadIcs({ id: evt.id, titre: view.h1, date_debut: evt.date_debut, date_fin: evt.date_fin, lieu: evt.lieu, adresse: evt.adresse ? cleanAddress(evt.adresse) : null, url: view.url, description: view.intro })}
                  className={`${btnSecondary} w-full`}
                >
                  Ajouter à mon agenda
                </button>
                {mapsQuery && !view.online && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`} target="_blank" rel="noopener noreferrer" className={`${linkUnderline} inline-flex min-h-[44px] items-center justify-center`}>
                    Voir l'itinéraire<span className="sr-only"> (nouvel onglet)</span>
                  </a>
                )}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-filet flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Partager</span>
              <button onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ogShareUrl)}`)} className="min-h-[44px] underline underline-offset-4">LinkedIn</button>
              <button onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${ogShareUrl}`)}`)} className="min-h-[44px] underline underline-offset-4">WhatsApp</button>
              <button onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogShareUrl)}`)} className="min-h-[44px] underline underline-offset-4">Facebook</button>
              <button onClick={copy} className="min-h-[44px] underline underline-offset-4">Copier le lien</button>
            </div>
          </aside>

          <div className="min-w-0">
            {view.description && (
              <section aria-labelledby="soiree-title">
                <h2 id="soiree-title" className="title-section text-[30px] sm:text-[36px]">{view.pds ? "La soirée" : "L'événement"}</h2>
                <div className="mt-4 text-[17px] leading-relaxed whitespace-pre-line max-w-[68ch]">{view.description}</div>
              </section>
            )}

            <PodcastsInvitesDisplay podcasts={invites} />

            {canRegister && (
              <section id="inscription" className="mt-12 scroll-mt-24" aria-label="Inscription">
                <EvenementInscriptionForm evenementId={evt.id} titre={evt.titre} date_debut={evt.date_debut} lieu={evt.lieu} adresse={evt.adresse} slug={evt.slug} />
              </section>
            )}

            {faq.length > 0 && (
              <section className="mt-12" aria-labelledby="faq-title">
                <h2 id="faq-title" className="title-section text-[30px] sm:text-[36px] pb-3 border-b-2 border-encre">Questions fréquentes</h2>
                <div className="divide-y divide-filet border-b border-filet">
                  {faq.map((f, i) => (
                    <details key={f.q} open={i === 0} className="group py-3">
                      <summary className="min-h-[44px] flex items-center gap-2 cursor-pointer font-bold text-[17px] list-none [&::-webkit-details-marker]:hidden">
                        <span aria-hidden className="inline-block w-4 transition-transform group-open:rotate-90">▸</span>
                        {f.q}
                      </summary>
                      <p className="pl-6 pb-2 text-[16px]">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {next.length > 0 && (
          <section className="bg-surface border-t border-filet" aria-labelledby="next-title">
            <div className={`${container} py-12`}>
              <div className="flex items-end justify-between gap-4 pb-3 border-b-2 border-encre">
                <h2 id="next-title" className="title-section text-[30px] sm:text-[36px]">Les prochains rendez-vous</h2>
                <Link to="/agenda" className={`${linkUnderline} min-h-[44px] inline-flex items-center shrink-0`}>Tout l'agenda</Link>
              </div>
              <ul className="divide-y divide-filet border-b border-filet">
                {next.map((n) => (
                  <li key={n.id}>
                    <Link to={eventHref(n)} className="grid grid-cols-[72px_1fr] sm:grid-cols-[90px_1fr_auto] gap-x-5 py-4 items-baseline group">
                      <span className="title-section text-[26px]">{new Date(n.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }).replace("/", ".")}</span>
                      <span className="font-bold text-[17px] group-hover:underline underline-offset-4">{readableTitle(n.titre)}</span>
                      <span className="col-start-2 sm:col-start-auto font-mono text-sm text-muted-foreground">{isOnline(n) ? "En ligne" : n.lieu}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EvenementDetail;
