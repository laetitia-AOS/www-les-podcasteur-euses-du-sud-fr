import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User, Users } from "lucide-react";

const Adhesion = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-2 text-center">
            Adhérer à l'association
          </h1>
          <p className="text-muted-foreground text-center mb-4">
            Rejoignez Les Podcasteur·euses du Sud et participez à la dynamique podcast régionale.
          </p>
          <a
            href="/annuaire"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors block text-center mb-10"
          >
            ← Retour à l'annuaire
          </a>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {/* Carte 1 — Profil */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <User className="w-8 h-8 text-primary mb-2" />
              <h2 className="font-serif text-lg text-foreground font-semibold">Référencer mon profil</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ouvert à toustes. Intégrez l'annuaire de l'écosystème podcast
                Région Sud. La publication est validée manuellement par notre équipe.
              </p>
              <a
                href="/formulaire"
                className="inline-flex items-center gap-2 border border-border rounded-xl px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent/10 transition-colors"
              >
                Créer mon profil →
              </a>
            </div>

            {/* Carte 2 — Adhésion */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <Users className="w-8 h-8 text-primary mb-2" />
              <h2 className="font-serif text-lg text-foreground font-semibold">Adhérer au collectif</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La cotisation associative vous donne accès aux rencontres, aux ressources
                membres et à une mise en avant prioritaire dans l'annuaire et sur le flux.
              </p>
              <span className="inline-block text-xs text-muted-foreground font-medium">
                Formulaire ci-dessous ↓
              </span>
            </div>
          </div>

          <iframe
            id="haWidget"
            allowTransparency={true}
            src="https://www.helloasso.com/associations/les-podcasteur-euses-du-sud/adhesions/adherer-a-l-association/widget?redirectUrl=https://www.les-podcasteur-euses-du-sud.fr/bienvenue"
            style={{ width: "100%", border: "none", minHeight: 800 }}
            title="Formulaire d'adhésion HelloAsso"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Adhesion;
