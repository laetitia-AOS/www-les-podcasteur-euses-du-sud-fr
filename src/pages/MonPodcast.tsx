import { useEffect, useMemo, useState } from "react";
import MesEvenements, { type MonEvenement } from "@/components/espace-membre/MesEvenements";
import LieuEditor from "@/components/studios/LieuEditor";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import ProfilCard from "@/components/espace-membre/ProfilCard";
import PodcastCard from "@/components/espace-membre/PodcastCard";
import { FICHE_COLUMNS, cardCls, sectionTitle, type FicheMembre } from "@/components/espace-membre/types";
import { anneeEnCours, formatLongDate, ilYA, libelleValidite, lienRenouveler, periodeRenouvellement, publicProfilePath, type EtatServeur } from "@/lib/espaceMembre";
import SupprimerDonnees from "@/components/espace-membre/SupprimerDonnees";
import { readableTitle } from "@/lib/events";
import { btnPrimary, btnSecondary, formatName, linkUnderline } from "@/lib/pds";
import logoPds from "@/assets/logo-pds.png";

type Adhesion = { date_adhesion: string | null; type_adhesion: string | null; statut: string | null; montant: number | null; formule: string | null; annee: number | null; etat: EtatServeur; annee_renouvellement: number | null };
type Stats = { vues: number; ecoutes: number; demandes: number };
type Demande = { id: string; recipient_id: string; sender_name: string; sender_email: string; message: string; created_at: string; type: string; lu_le: string | null };

const TYPE_DEMANDE: Record<string, { label: string; sujet: string }> = {
  collab: { label: "Collab", sujet: "Re : votre proposition de collab" },
  devis: { label: "Devis", sujet: "Re : votre demande de devis" },
  message: { label: "Message", sujet: "Re : votre message via Les Podcasteur·euses du Sud" },
};


const SECTIONS = [
  { id: "tableau", label: "Tableau de bord" },
  { id: "profil", label: "Mon profil" },
  { id: "podcasts", label: "Mes podcasts" },
  { id: "demandes", label: "Demandes reçues" },
  { id: "evenements", label: "Mes événements" },
  { id: "adhesion", label: "Adhésion" },
  { id: "suppression", label: "Mes données" },
];


const MonEspace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fiches, setFiches] = useState<FicheMembre[]>([]);
  const [adhesion, setAdhesion] = useState<Adhesion | null>(null);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [evenements, setEvenements] = useState<MonEvenement[]>([]);
  const [active, setActive] = useState("tableau");
  const [stats, setStats] = useState<Stats | null>(null);

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
      const [f, a, d, e, st] = await Promise.all([
        supabase.from("podcasts").select(FICHE_COLUMNS).eq("email", mail).order("created_at", { ascending: true }),
        supabase.rpc("mon_adhesion"),
        supabase.rpc("mes_demandes"),
        supabase.rpc("mes_evenements"),
        supabase.rpc("mes_stats"),
      ]);
      if (f.error) { console.error(f.error); toast.error("Vos fiches n'ont pas pu être chargées."); }
      setFiches((f.data as unknown as FicheMembre[]) || []);
      setAdhesion(((a.data as Adhesion[] | null) || [])[0] || null);
      setDemandes((d.data as Demande[] | null) || []);
      setEvenements((e.data as MonEvenement[] | null) || []);
      setStats(((st.data as Stats[] | null) || [])[0] || null);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const nonLues = demandes.filter((d) => !d.lu_le).length;
  const rechargerEvenements = async () => {
    const { data } = await supabase.rpc("mes_evenements");
    setEvenements((data as MonEvenement[] | null) || []);
  };
  // Ouvrir ou répondre à une demande la marque comme lue (côté serveur, uniquement les siennes)
  const marquerLue = (id: string) => {
    const d = demandes.find((x) => x.id === id);
    if (!d || d.lu_le) return;
    setDemandes((list) => list.map((x) => (x.id === id ? { ...x, lu_le: new Date().toISOString() } : x)));
    supabase.rpc("marquer_demande_lue", { _id: id }).then(({ error }) => { if (error) console.error(error); });
  };

  // Section en cours de lecture : surlignée dans le menu
  useEffect(() => {
    if (loading) return;
    const onScroll = () => {
      let current = SECTIONS[0].id;
      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el && el.getBoundingClientRect().top <= 140) current = sec.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = SECTIONS[SECTIONS.length - 1].id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, fiches.length]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/espace-membre");
  };

  const profil = useMemo(() => fiches.find((f) => f.type_profil !== "podcasteur") || fiches[0], [fiches]);
  const podcasts = useMemo(() => fiches.filter((f) => f.type_profil === "podcasteur"), [fiches]);
  const etat: EtatServeur = adhesion?.etat || "aucune";
  // Visible : année en cours payée, ou année précédente pendant le mois de janvier (même règle que le serveur)
  const aJour = etat === "a_jour" || etat === "tolerance";
  const annee = adhesion?.annee ?? null;
  const y = anneeEnCours();
  const anneeRenouv = adhesion?.annee_renouvellement ?? y;
  // En décembre, un membre de l'année renouvelle tout de suite pour l'année suivante
  const renouvelerBientot = etat === "a_jour" && annee === y && periodeRenouvellement();
  const ADHERER = lienRenouveler(adhesion?.formule, anneeRenouv);
  // Le renouvellement s'ouvre le 1er décembre : avant, un membre à jour n'a rien à payer
  const peutRenouveler = !(etat === "a_jour" && !periodeRenouvellement());
  // Fiche publique seulement si elle est validée et l'adhésion à jour (même règle que le serveur)
  const publicPath = profil && profil.valide && aJour ? publicProfilePath(profil.type_profil, profil.slug) : null;
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
                  {s.id === "demandes" && nonLues > 0 && (
                    <span className="font-mono text-xs bg-accent text-accent-foreground px-1.5 py-0.5" aria-label={`${nonLues} non lue${nonLues > 1 ? "s" : ""}`}>{nonLues}</span>
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
                  {etat === "a_jour" ? (
                    <>
                      <span className="px-2 py-1 text-xs font-bold bg-primary text-primary-foreground">Membre {annee}</span>
                      <span>{annee && annee > y ? `Déjà renouvelé pour ${annee}` : libelleValidite(annee ?? y)}</span>
                    </>
                  ) : etat === "tolerance" ? (
                    <>
                      <span className="px-2 py-1 text-xs font-bold bg-accent text-accent-foreground">Membre {annee}</span>
                      <span>À renouveler pour {y}</span>
                    </>
                  ) : etat === "verification" ? (
                    <>
                      <span className="px-2 py-1 text-xs font-bold border-2 border-encre">Paiement en vérification</span>
                      <span>reçu le <span className="font-mono">{formatLongDate(adhesion?.date_adhesion)}</span></span>
                    </>
                  ) : etat === "terminee" ? (
                    <>
                      <span className="px-2 py-1 text-xs font-bold border-2 border-encre">{annee ? `Membre ${annee}` : "Adhésion terminée"}</span>
                      <span>À renouveler pour {y}</span>
                    </>
                  ) : (
                    <span className="px-2 py-1 text-xs font-bold border-2 border-encre">Profil sans adhésion</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {publicPath && <Link to={publicPath} className={btnSecondary}>Voir mon profil public</Link>}
{peutRenouveler &&                 <Link to={ADHERER} className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 font-bold text-[15px] leading-none bg-encre text-surface border-2 border-encre hover:bg-surface hover:text-foreground transition-colors">{adhesion ? `Renouveler pour ${anneeRenouv}` : "Adhérer"}</Link>}
              </div>
            </div>

            {(renouvelerBientot || etat === "tolerance" || etat === "terminee") && (
              <div role="status" className="mt-6 border-2 border-accent bg-accent/10 p-5 sm:p-6">
                <p className="font-bold text-[17px]">
                  {renouvelerBientot
                    ? `Votre adhésion ${annee} se termine le 31 décembre`
                    : etat === "tolerance"
                      ? `Votre adhésion ${annee} est terminée : votre fiche reste visible jusqu'au 31 janvier`
                      : "Votre fiche n'est plus visible sur le site"}
                </p>
                <p className="mt-2 text-[15px] max-w-[62ch]">
                  {renouvelerBientot
                    ? `Vous pouvez renouveler dès maintenant pour ${anneeRenouv}. Votre paiement couvrira toute l'année ${anneeRenouv}, jusqu'au 31 décembre.`
                    : etat === "tolerance"
                      ? `Renouvelez pour ${anneeRenouv} avant le 1er février : sans paiement, votre fiche et vos podcasts seront masqués du site à cette date. Rien n'est supprimé.`
                      : "Votre adhésion n'est plus à jour. Rien n'est supprimé : votre fiche réapparaît dès votre paiement."}
                </p>
                <Link to={ADHERER} className={`${btnPrimary} mt-4`}>Renouveler pour {anneeRenouv}</Link>
              </div>
            )}
            {etat === "verification" && (
              <div role="status" className="mt-6 border-2 border-encre bg-surface p-5 sm:p-6">
                <p className="font-bold text-[17px]">Votre paiement est en cours de vérification</p>
                <p className="mt-2 text-[15px] max-w-[62ch]">L'équipe le confirme avec HelloAsso. Votre fiche devient visible dès la confirmation, jusqu'au 31 décembre de l'année payée.</p>
              </div>
            )}
            {etat === "aucune" && (
              <div className="mt-6 border-2 border-primary bg-primary/5 p-5 sm:p-6">
                <p className="font-bold text-[17px]">Adhérez pour activer votre visibilité</p>
                <p className="mt-2 text-[15px] max-w-[62ch]">
                  Votre profil est enregistré, mais il n'apparaît pas publiquement. Avec l'adhésion, votre fiche et vos podcasts sont visibles dans l'annuaire et dans « Écouter », et les autres membres peuvent vous écrire.
                </p>
                <Link to={ADHERER} className={`${btnPrimary} mt-4`}>Adhérer maintenant</Link>
              </div>
            )}

            <p className="mt-8 font-mono text-xs text-muted-foreground">Ce mois-ci · chiffres visibles par vous seul·e</p>
            <dl className="mt-2 grid grid-cols-3 border border-filet bg-surface">
              {[
                { label: "Vues du profil", value: stats?.vues ?? 0 },
                { label: "Écoutes lancées depuis le site", value: stats?.ecoutes ?? 0 },
                { label: "Demandes reçues", value: stats?.demandes ?? 0 },
              ].map((s, i) => (
                <div key={s.label} className={`p-3 sm:p-5 ${i > 0 ? "border-l border-filet" : ""}`}>
                  <dt className="text-xs sm:text-sm text-muted-foreground leading-tight">{s.label}</dt>
                  <dd className="title-section text-[32px] sm:text-[40px] mt-1">{s.value}</dd>
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

          {/* Mon studio / Ma structure */}
          {fiches.filter((x) => x.type_profil === "studio" || x.type_profil === "structure_eco").map((lieu) => (
            <section key={lieu.id} id={`lieu-${lieu.id}`} aria-labelledby={`lieu-title-${lieu.id}`} className="scroll-mt-6">
              <h2 id={`lieu-title-${lieu.id}`} className={`${sectionTitle} pb-3 border-b-2 border-encre mb-5`}>
                {lieu.type_profil === "studio" ? "Mon studio" : "Ma structure"} : {lieu.nom_podcast}
              </h2>
              <LieuEditor podcastId={lieu.id} type={lieu.type_profil as "studio" | "structure_eco"} nom={lieu.nom_podcast || ""} />
            </section>
          ))}

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
                Aucune demande pour l'instant. Les propositions de collab, messages et devis envoyés depuis votre fiche publique apparaîtront ici.
              </p>
            ) : (
              <ul>
                {demandes.map((d) => {
                  const t = TYPE_DEMANDE[d.type] || TYPE_DEMANDE.message;
                  const fiche = nomFiche(d.recipient_id);
                  const via = fiche && fiche.type_profil === "podcasteur" && podcasts.length > 1 ? fiche.nom_podcast : null;
                  return (
                    <li key={d.id} className="border-b border-filet py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="font-bold flex flex-wrap items-center gap-2">
                          {!d.lu_le && <span className="w-2 h-2 rounded-full bg-accent" aria-hidden />}
                          <span className="font-mono text-xs font-normal border border-encre px-1.5 py-0.5">{t.label}</span>
                          {formatName(d.sender_name)}
                          {!d.lu_le && <span className="sr-only">(non lue)</span>}
                          {via && <span className="font-normal text-muted-foreground"> · via {via}</span>}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs text-muted-foreground">{ilYA(d.created_at)}</span>
                          <a
                            href={`mailto:${encodeURIComponent(d.sender_email)}?subject=${encodeURIComponent(t.sujet)}`}
                            onClick={() => marquerLue(d.id)}
                            className={`${linkUnderline} text-sm min-h-[44px] inline-flex items-center`}
                          >
                            Répondre<span className="sr-only"> à {formatName(d.sender_name)}</span>
                          </a>
                        </div>
                      </div>
                      <details className="mt-1 group" onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) marquerLue(d.id); }}>
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
            <MesEvenements evenements={evenements} onChange={rechargerEvenements} />
          </section>

          {/* Adhésion */}
          <section id="adhesion" aria-labelledby="adhesion-title" className="scroll-mt-6">
            <div className={cardCls}>
              <h2 id="adhesion-title" className={sectionTitle}>Adhésion</h2>
              {adhesion?.date_adhesion ? (
                <dl className="mt-5 grid sm:grid-cols-4 gap-4 text-[15px]">
                  <div>
                    <dt className="text-sm text-muted-foreground">Dernier paiement</dt>
                    <dd className="font-mono mt-1">{formatLongDate(adhesion.date_adhesion)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Formule</dt>
                    <dd className="mt-1 font-semibold">{adhesion.formule === "studio" ? "Studio ou agence" : "Personne"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Montant payé</dt>
                    <dd className="mt-1 font-mono">{adhesion.montant != null ? `${Number(adhesion.montant)} €` : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Année couverte</dt>
                    <dd className="mt-1 font-semibold">{annee ? <>Membre {annee}<span className="block font-normal text-sm">{libelleValidite(annee)}</span></> : etat === "verification" ? "après vérification" : "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-[15px]">Aucune adhésion n'est enregistrée avec l'adresse <strong className="break-all">{email}</strong>.</p>
              )}
              <p className="mt-5 text-sm text-muted-foreground max-w-[62ch]">
                L'adhésion suit l'année civile : elle est valable jusqu'au 31 décembre de l'année payée, quelle que soit la date de paiement. Le renouvellement ouvre le 1er décembre. Sans renouvellement, votre fiche reste visible en janvier, puis elle est masquée le 1er février, sans être supprimée. Vous avez payé avec une autre adresse e-mail ou un autre nom ? Écrivez-nous depuis la page Contact pour que l'équipe relie votre paiement à votre profil.
              </p>
              {peutRenouveler && <Link to={ADHERER} className={`${btnPrimary} mt-5`}>{adhesion ? `Renouveler pour ${anneeRenouv}` : "Adhérer"}</Link>}
            </div>
          </section>

          <SupprimerDonnees />
        </main>
      </div>
    </div>
  );
};

export default MonEspace;
