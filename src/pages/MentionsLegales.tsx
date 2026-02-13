import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MentionsLegales = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl mb-10">Mentions légales</h1>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="font-serif text-xl text-foreground">1. Éditeur du site</h2>
              <p>
                Le site <strong>Les Podcasteur·euses du Sud</strong> est édité par :
              </p>
              <ul className="list-none pl-0 space-y-1 mt-2">
                <li><strong>Dénomination :</strong> LES PODCASTEUR·EUSES DU SUD</li>
                <li><strong>Forme juridique :</strong> Association déclarée (loi 1901)</li>
                <li><strong>SIREN :</strong> 935 024 661</li>
                <li><strong>SIRET (siège) :</strong> 935 024 661 00016</li>
                <li><strong>Code NAF/APE :</strong> 94.12Z — Activités des organisations professionnelles</li>
                <li><strong>Siège social :</strong> 18 rue Saint Suffren, 13006 Marseille</li>
                <li><strong>Date de création :</strong> 18 avril 2024</li>
                <li><strong>Label :</strong> ESS — Économie Sociale et Solidaire</li>
              </ul>
              <p className="mt-3">
                Email de contact : <a href="mailto:contact@podcasteusesdusud.fr" className="text-primary hover:underline">contact@podcasteusesdusud.fr</a>
              </p>
              <p>Directeur de la publication : le ou la président(e) de l'association.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">2. Hébergement</h2>
              <p>
                Le site est hébergé par <strong>Lovable / Supabase</strong> — infrastructure cloud sécurisée.
                Les données sont stockées au sein de l'Union européenne ou dans des pays assurant un niveau de protection adéquat
                au sens du Règlement (UE) 2016/679 (RGPD).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">3. Propriété intellectuelle</h2>
              <p>
                L'ensemble des contenus du site (textes, images, graphismes, logo, icônes, structure) est la propriété
                de l'association Les Podcasteur·euses du Sud ou de ses partenaires et est protégé par le droit de la
                propriété intellectuelle. Toute reproduction, représentation ou diffusion, en tout ou partie, sans
                autorisation écrite préalable, est interdite et constitue une contrefaçon sanctionnée par les articles
                L.335-2 et suivants du Code de la propriété intellectuelle.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">4. Limitation de responsabilité</h2>
              <p>
                L'association s'efforce de fournir des informations aussi précises que possible. Toutefois, elle ne saurait
                être tenue responsable des omissions, inexactitudes ou carences dans la mise à jour. L'utilisateur est seul
                responsable de l'utilisation qu'il fait des informations et contenus du site.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">5. Liens hypertextes</h2>
              <p>
                Le site peut contenir des liens vers d'autres sites (HelloAsso, plateformes de podcasts, etc.).
                L'association ne saurait être tenue responsable du contenu de ces sites tiers.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">6. Droit applicable</h2>
              <p>
                Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux
                compétents seront ceux du ressort du siège social de l'association.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MentionsLegales;
