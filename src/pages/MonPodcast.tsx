import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import ProfilCard from "@/components/espace-membre/ProfilCard";
import PodcastCard from "@/components/espace-membre/PodcastCard";
import { FICHE_COLUMNS, cardCls, sectionTitle, type FicheMembre } from "@/components/espace-membre/types";
import { formatLongDate, ilYA, publicProfilePath, statutAdhesion } from "@/lib/espaceMembre";
import { readableTitle } from "@/lib/events";
import { btnPrimary, btnSecondary, formatName, linkUnderline } from "@/lib/pds";
import logoPds from "@/assets/logo-pds.png";

type Adhesion = { date_adhesion: string | null; type_adhesion: string | null; statut: string | null; montant: number | null };
type Demande = { id: string; recipient_id: string; sender_name: string; sender_email: string; message: string; created_at: string };
type MonEvenement = { id: string; titre: string; slug: string | null; date_debut: string; publie: boolean };

const SECTIONS = [
  { id: "tableau", label: "Tableau de bord" },
  { id: "profil", label: "Mon profil" },
  { id: "podcasts", label: "Mes podcasts" },
  { id: "demandes", label: "Demandes reçues" },
  { id: "evenements", label: "Mes événements" },
  { id: "adhesion", label: "Adhésion" },
];

const ADHERER = "/rejoindre-association?etape=adhesion";

const MonEspace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fiches, setFiches] = useState<FicheMembre[]>([]);
  const [adhesion, setAdhesion] = useState<Adhesion | null>(null);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [evenements, setEvenements] = useState<MonEvenement[]>([]);
  const [active, setActive] = useState("tableau");

  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    return () => { robots.remove(); };
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/espace-membre"); return; }
      const mail = session.user.email || "";
      setEmail(mail);
      const [f, a, d, e] = await Promise.all([
        supabase.from("podcasts").select(FICHE_COLUMNS).eq("email", mail).order("created_at", { ascending: true }),
        supabase.rpc("mon_adhesion"),
        supabase.rpc("mes_demandes"),
        supabase.rpc("mes_evenements"),
      ]);
      if (f.error) { console.error(f.error); toast.error("Vos fiches n'ont pas pu être chargées."); }
      setFiches((f.data as unknown as FicheMembre[]) || []);
      setAdhesion(((a.data as Adhesion[] | null) || [])[0] || null);
      setDemandes((d.data as Demande[] | null) || []);
      setEvenements((e.data as MonEvenement[] | null) || []);
      setLoading(false);
    };
    init();
  }, [navigate]);

  // Section visible à l'écran : surlignée dans le menu
  useEffect(() => {
    if (loading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [loading, fiches.length]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/espace-membre");
  };

  const profil = useMemo(() => fiches.find((f) => f.type_profil !== "podcasteur") || fiches[0], [fiches]);
  const podcasts = useMemo(() => fiches.filter((f) => f.type_profil === "podcasteur"), [fiches]);
  const statut = statutAdhesion(adhesion?.date_adhesion);
  const aJour = statut.etat === "a_jour";
  const publicPath = profil && profil.valide ? publicProfilePath(profil.type_profil, profil.slug) : null;
  const nomFiche = (id: string) => fiches.find((f) => f.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Chargement de votre espace</span>
      </div>
    );
  }

  const header = (
    <header className="border-b border-encre bg-background">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 min-h-[64px] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-h-[44px]" aria-label="Retour à l'accueil des Podcasteur·euses du Sud">
          <img src={logoPds} alt="" className="w-10 h-10 object-cover" width="40" height="40" />
          <span className="font-bold text-[17px]">Espace membre</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link to="/" className={`${linkUnderline} hidden sm:inline-flex min-h-[44px] items-center text-sm`}>Retour au site</Link>
          <button type="button" onClick={logout} className={`${btnSecondary} min-h-[44px] px-4 text-sm`}>Se déconnecter</button>
        </div>
      </div>
    </header>
  );

  if (!profil) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Espace membre — Les Podcasteur·euses du Sud" description="Gérez votre profil, vos podcasts et votre adhésion." path="/mon-espace" />
        {header}
        <main className="mx-auto max-w-[640px] px-5 sm:px-8 py-16">
          <h1 className="title-page text-[48px] sm:text-[64px]">Aucun profil trouvé</h1>
          <p className="mt-5 text-lg">
            Aucun profil n'est enregistré avec l'adresse <strong className="break-all">{email}</strong>.
          </p>
          <p className="mt-3 text-muted-foreground">Vous vous êtes inscrit·e avec une autre adresse ? Déconnectez-vous et reconnectez-vous avec celle-ci.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/rejoindre-association#inscription" className={btnPrimary}>Créer mon profil</Link>
            <button type="button" onClick={logout} className={btnSecondary}>Se déconnecter</button>
          </div>
        </main>
      </div>
    );
  }

  const prenom = formatName(profil.prenom) || "à vous";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Espace membre — Les Podcasteur·euses du Sud" description="Gérez votre profil, vos podcasts et votre adhésion." path="/mon-espace" />
      {header}

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:grid lg:grid-cols-[230px_1fr] lg:gap-12 pb-24">
        {/* Menu : colonne à gauche sur ordinateur, bande défilante sur téléphone */}
        <nav aria-label="Sections de l'espace membre" className="lg:pt-10">
          <ul className="flex lg:flex-col gap-1 lg:gap-0 overflow-x-auto -mx-5 px-5 lg:mx-0 lg:px-0 py-3 lg:py-0 border-b border-filet lg:border-b-0 lg:border-t-2 lg:border-encre lg:sticky lg:top-6">
            {SECTIONS.map((s) => (
              <li key={s.id} className="lg:border-b lg:border-filet shrink-0">
                <a
                  href={`#${s.id}`}
                  aria-current={active === s.id ? "true" : undefined}
                  className={`flex items-center gap-2 min-h-[44px] px-3 lg:px-0 whitespace-nowrap font-semibold text-[15px] ${active === s.id ? "text-primary" : "hover:text-primary"}`}
                >
                  {s.label}
                  {s.id === "demandes" && demandes.length > 0 && (
                    <span className="font-mono text-xs bg-accent text-accent-foreground px-1.5 py-0.5">{demandes.length}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 space-y-14 pt-8 lg:pt-10">
          {/* Tableau de bord */}
          <section id="tableau" aria-labelledby="bonjour" className="scroll-mt-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <h1 id="bonjour" className="title-section text-[44px] sm:text-[60px]">Bonjour {prenom}</h1>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[15px]">
                  {aJour ? (
                    <>
                      <span className="px-2 py-1 text-xs font-bold bg-primary text-primary-foreground">Membre à jour</span>
                      <span>jusqu'au <span className="font-mono">{formatLongDate(statut.echeance)}</span></span>
                    </>
                  ) : statut.etat === "expiree" ? (
                    <>
                      <span className="px-2 py-1 text-xs font-bold border-2 border-encre">Adhésion à renouveler</span>
                      <span>dernier paiement le <span className="font-mono">{formatLongDate(adhesion?.date_adhesion)}</span></span>
                    </>
                  ) : (
                    <span className="px-2 py-1 text-xs font-bold border-2 border-encre">Profil sans adhésion</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {publicPath && <Link to={publicPath} className={btnSecondary}>Voir mon profil public</Link>}
                <Link to={ADHERER} className={`${btnPrimary} bg-encre hover:bg-encre/85 text-surface`}>{aJour ? "Renouveler" : "Adhérer"}</Link>
              </div>
            </div>

            {!aJour && (
              <div className="mt-6 border-2 border-primary bg-primary/5 p-5 sm:p-6">
                <p className="font-bold text-[17px]">Adhérez pour activer votre visibilité</p>
                <p className="mt-2 text-[15px] max-w-[62ch]">
                  Votre profil est enregistré, mais il n'apparaît pas publiquement. Avec l'adhésion, votre fiche et vos podcasts sont visibles dans l'annuaire et dans « Écouter », et les autres membres peuvent vous écrire.
                </p>
                <Link to={ADHERER} className={`${btnPrimary} mt-4`}>Adhérer maintenant</Link>
              </div>
            )}

            <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 border border-filet bg-surface">
              {[
                { label: "Demandes reçues", value: demandes.length },
                { label: "Podcasts référencés", value: podcasts.length },
                { label: "Événements proposés", value: evenements.length },
              ].map((s, i) => (
                <div key={s.label} className={`p-4 sm:p-5 ${i > 0 ? "border-t sm:border-t-0 sm:border-l border-filet" : ""}`}>
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="title-section text-[40px] mt-1">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Mon profil */}
          <section id="profil" className="scroll-mt-6">
            <ProfilCard
              profil={profil}
              fiches={fiches}
              onSaved={(commun, own) =>
                setFiches((prev) => prev.map((f) => ({ ...f, ...commun, ...(f.id === profil.id ? own : {}) })))
              }
            />
          </section>

          {/* Mes podcasts */}
          <section id="podcasts" aria-labelledby="podcasts-title" className="scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-encre">
              <h2 id="podcasts-title" className={sectionTitle}>Mes podcasts</h2>
              <Link to={`/referencer-mon-podcast?profil=podcasteur&ajout=1&email=${encodeURIComponent(email)}`} className={btnSecondary}>
                Ajouter un podcast
              </Link>
            </div>
            {podcasts.length === 0 ? (
              <p className="mt-4 border border-dashed border-encre p-5 text-[15px]">
                Aucun podcast pour l'instant. Ajoutez-en un avec son lien d'écoute et son flux RSS : la pochette et les épisodes s'afficheront sur le site.
              </p>
            ) : (
              <ul>
                {podcasts.map((p) => (
                  <PodcastCard
                    key={p.id}
                    fiche={p}
                    onSaved={(patch) => setFiches((prev) => prev.map((f) => (f.id === p.id ? { ...f, ...patch } : f)))}
                    onDeleted={() => setFiches((prev) => prev.filter((f) => f.id !== p.id))}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Demandes reçues */}
          <section id="demandes" aria-labelledby="demandes-title" className="scroll-mt-6">
            <h2 id="demandes-title" className={`${sectionTitle} pb-3 border-b-2 border-encre`}>Demandes reçues</h2>
            {demandes.length === 0 ? (
              <p className="mt-4 text-[15px] text-muted-foreground">
                Aucune demande pour l'instant. Les messages envoyés depuis votre fiche publique apparaîtront ici.
              </p>
            ) : (
              <ul>
                {demandes.map((d) => {
                  const fiche = nomFiche(d.recipient_id);
                  const via = fiche && fiche.type_profil === "podcasteur" && podcasts.length > 1 ? fiche.nom_podcast : null;
                  return (
                    <li key={d.id} className="border-b border-filet py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="font-bold">
                          {formatName(d.sender_name)}
                          {via && <span className="font-normal text-muted-foreground"> · via {via}</span>}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-muted-foreground">{ilYA(d.created_at)}</span>
                          <a
                            href={`mailto:${d.sender_email}?subject=${encodeURIComponent("Votre message via Les Podcasteur·euses du Sud")}`}
                            className={`${linkUnderline} text-sm min-h-[44px] inline-flex items-center`}
                          >
                            Répondre<span className="sr-only"> à {formatName(d.sender_name)}</span>
                          </a>
                        </div>
                      </div>
                      <details className="mt-1 group">
                        <summary className="cursor-pointer text-sm text-muted-foreground list-none [&::-webkit-details-marker]:hidden">
                          <span className="group-open:hidden">« {d.message.slice(0, 120)}{d.message.length > 120 ? "…" : ""} » <span className="underline">Lire</span></span>
                          <span className="hidden group-open:inline underline">Replier</span>
                        </summary>
                        <p className="mt-2 whitespace-pre-line text-[15px]">{d.message}</p>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Mes événements */}
          <section id="evenements" aria-labelledby="evenements-title" className="scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-encre">
              <h2 id="evenements-title" className={sectionTitle}>Mes événements</h2>
              <Link to="/agenda#proposer" className={btnSecondary}>Proposer un événement</Link>
            </div>
            {evenements.length === 0 ? (
              <p className="mt-4 text-[15px] text-muted-foreground">
                Vous n'avez pas encore proposé d'événement avec cette adresse e-mail.
              </p>
            ) : (
              <ul>
                {evenements.map((ev) => (
                  <li key={ev.id} className="border-b border-filet py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {ev.publie && ev.slug ? (
                        <Link to={`/agenda/${ev.slug}`} className="font-bold hover:underline underline-offset-4">{readableTitle(ev.titre)}</Link>
                      ) : (
                        <p className="font-bold">{readableTitle(ev.titre)}</p>
                      )}
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">{formatLongDate(ev.date_debut)}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold ${ev.publie ? "bg-primary text-primary-foreground" : "border border-encre"}`}>
                      {ev.publie ? "Publié" : "En relecture"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Adhésion */}
          <section id="adhesion" aria-labelledby="adhesion-title" className="scroll-mt-6">
            <div className={cardCls}>
              <h2 id="adhesion-title" className={sectionTitle}>Adhésion</h2>
              {adhesion?.date_adhesion ? (
                <dl className="mt-5 grid sm:grid-cols-3 gap-4 text-[15px]">
                  <div>
                    <dt className="text-sm text-muted-foreground">Dernier paiement</dt>
                    <dd className="font-mono mt-1">{formatLongDate(adhesion.date_adhesion)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Formule</dt>
                    <dd className="mt-1 font-semibold">{adhesion.type_adhesion || "Adhésion"}{adhesion.montant ? <span className="font-mono font-normal"> · {adhesion.montant} €</span> : null}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">{aJour ? "Valable jusqu'au" : "Statut"}</dt>
                    <dd className="mt-1 font-semibold">{aJour ? <span className="font-mono">{formatLongDate(statut.echeance)}</span> : "À renouveler"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-[15px]">Aucune adhésion n'est enregistrée avec l'adresse <strong className="break-all">{email}</strong>.</p>
              )}
              <p className="mt-5 text-sm text-muted-foreground max-w-[62ch]">
                L'adhésion est valable un an à partir du paiement. Vous avez payé avec une autre adresse e-mail ou un autre nom ? Écrivez-nous depuis la page Contact pour que l'équipe relie votre paiement à votre profil.
              </p>
              <Link to={ADHERER} className={`${btnPrimary} mt-5`}>{aJour ? "Renouveler mon adhésion" : "Adhérer"}</Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default MonEspace;
