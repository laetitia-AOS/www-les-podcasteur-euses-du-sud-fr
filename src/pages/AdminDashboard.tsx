import { Link } from "react-router-dom";
import { ArrowRight, CalendarPlus, Download, Mail } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useATraiter, type ATraiter } from "@/components/admin/useATraiter";

type Tache = { cle: keyof ATraiter; un: string; plusieurs: string; aide: string; to: string };

const TACHES: Tache[] = [
  { cle: "fiches", un: "fiche à valider", plusieurs: "fiches à valider", aide: "Pas encore visibles dans l'annuaire.", to: "/admin/annuaire?onglet=a-valider" },
  { cle: "images", un: "image à valider", plusieurs: "images à valider", aide: "Envoyées sans connexion, invisibles en attendant.", to: "/admin/annuaire?onglet=a-valider" },
  { cle: "propositions", un: "proposition d'événement", plusieurs: "propositions d'événements", aide: "Envoyées par des membres, en relecture.", to: "/admin/agenda?onglet=relecture" },
  { cle: "paiements", un: "paiement à vérifier", plusieurs: "paiements à vérifier", aide: "À contrôler sur HelloAsso avant validation.", to: "/admin/membres?onglet=paiements" },
  { cle: "contacts", un: "message du formulaire de contact", plusieurs: "messages du formulaire de contact", aide: "Statut « Nouveau ».", to: "/admin/messages?onglet=site" },
  { cle: "messages_membres", un: "message pour un·e membre", plusieurs: "messages pour des membres", aide: "Messages, collabs et devis à suivre.", to: "/admin/messages?onglet=membres" },
  { cle: "flux", un: "flux d'épisodes à confirmer", plusieurs: "flux d'épisodes à confirmer", aide: "Trouvés automatiquement, à vérifier.", to: "/admin/annuaire?onglet=flux" },
];

const RACCOURCIS = [
  { label: "Nouvel événement", to: "/admin/agenda?onglet=a-venir&nouveau=1", icon: CalendarPlus },
  { label: "Relance collective", to: "/admin/membres?onglet=relances", icon: Mail },
  { label: "Fiches à compléter", to: "/admin/annuaire?onglet=a-completer", icon: ArrowRight },
  { label: "Export des membres", to: "/admin/membres?onglet=membres", icon: Download },
];

const AdminDashboard = () => {
  const { data, isLoading } = useATraiter();
  const enAttente = TACHES.filter((t) => (data?.[t.cle] ?? 0) > 0);
  const calmes = TACHES.filter((t) => (data?.[t.cle] ?? 0) === 0);

  return (
    <AdminLayout titre="À traiter" description="Tout ce qui attend une action de l'équipe. Un clic ouvre le bon onglet.">
      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : (
        <>
          {enAttente.length === 0 ? (
            <p className="border-2 border-foreground bg-card p-6 font-display font-bold text-xl mb-10">Rien en attente : tout est à jour.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-10">
              {enAttente.map((t) => {
                const n = data![t.cle];
                return (
                  <li key={t.cle}>
                    <Link
                      to={t.to}
                      className="group flex h-full flex-col border-2 border-foreground bg-card p-5 transition-colors motion-reduce:transition-none hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span className="font-display font-black text-5xl leading-none text-primary group-hover:text-accent">{n}</span>
                      <span className="mt-2 font-display font-bold text-lg leading-snug">{n > 1 ? t.plusieurs : t.un}</span>
                      <span className="mt-1 text-sm text-muted-foreground group-hover:text-background/80">{t.aide}</span>
                      <span className="mt-auto pt-4 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest">
                        Ouvrir <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <section aria-labelledby="raccourcis-titre">
              <h2 id="raccourcis-titre" className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">Raccourcis</h2>
              <ul className="flex flex-wrap gap-2">
                {RACCOURCIS.map((r) => (
                  <li key={r.label}>
                    <Link to={r.to} className="inline-flex items-center gap-2 border-2 border-primary bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      <r.icon className="w-4 h-4" aria-hidden /> {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            {calmes.length > 0 && (
              <section aria-labelledby="ajour-titre">
                <h2 id="ajour-titre" className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">À jour</h2>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {calmes.map((t) => <li key={t.cle}><span className="font-mono">0</span> {t.plusieurs}</li>)}
                </ul>
              </section>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
