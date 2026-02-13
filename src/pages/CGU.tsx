import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CGU = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl mb-10">Conditions générales d'utilisation</h1>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="font-serif text-xl text-foreground">1. Objet</h2>
              <p>
                Les présentes conditions générales d'utilisation (ci-après « CGU ») ont pour objet de définir
                les modalités d'accès et d'utilisation du site <strong>Les Podcasteur·euses du Sud</strong>,
                édité par l'association loi 1901 du même nom.
              </p>
              <p>
                L'utilisation du site implique l'acceptation pleine et entière des présentes CGU.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">2. Accès au site</h2>
              <p>
                Le site est accessible gratuitement à tout utilisateur disposant d'un accès à Internet.
                L'association se réserve le droit de suspendre ou d'interrompre l'accès au site pour des raisons
                de maintenance ou de mise à jour, sans préavis ni indemnité.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">3. Référencement de podcast</h2>
              <p>
                Le formulaire de référencement permet aux créateurs audio de la Région Sud de s'inscrire
                dans le répertoire. En soumettant le formulaire, l'utilisateur :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Certifie l'exactitude des informations transmises</li>
                <li>Autorise l'association à conserver et utiliser ces données conformément à la politique de confidentialité</li>
                <li>S'engage à ne pas transmettre de contenus illicites, diffamatoires ou portant atteinte aux droits de tiers</li>
              </ul>
              <p>
                L'association se réserve le droit de refuser ou supprimer tout référencement qui ne respecterait pas
                ces conditions ou la charte éditoriale du projet.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">4. Visibilité et mise en avant</h2>
              <p>
                Le référencement dans la base de données est gratuit et ouvert à tous.
                La mise en avant éditoriale et la diffusion sur le flux du site sont réservées aux membres
                adhérents de l'association Les Podcasteur·euses du Sud. Cette distinction vise à préserver
                une ligne éditoriale cohérente et à valoriser l'engagement collectif.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">5. Propriété intellectuelle</h2>
              <p>
                Chaque utilisateur reste propriétaire des contenus qu'il soumet (nom, description, vignette de son podcast).
                En soumettant ces contenus, l'utilisateur accorde à l'association une licence non exclusive, gratuite
                et pour la durée du référencement, aux fins d'affichage sur le site et les supports de communication
                de l'association.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">6. Responsabilités</h2>
              <p>
                L'association ne saurait être tenue responsable des contenus soumis par les utilisateurs.
                Chaque utilisateur est seul responsable des informations qu'il publie et garantit qu'elles
                ne portent pas atteinte aux droits de tiers.
              </p>
              <p>
                L'association décline toute responsabilité en cas d'interruption du service, de perte de données
                ou de tout dommage indirect lié à l'utilisation du site.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">7. Données personnelles</h2>
              <p>
                Le traitement des données personnelles est régi par notre
                <a href="/politique-de-confidentialite" className="text-primary hover:underline ml-1">politique de confidentialité</a>,
                qui constitue une partie intégrante des présentes CGU.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">8. Suppression de compte et données</h2>
              <p>
                Tout utilisateur peut demander la suppression de son référencement et de ses données personnelles
                à tout moment en envoyant un email à
                <a href="mailto:contact@podcasteusesdusud.fr" className="text-primary hover:underline ml-1">contact@podcasteusesdusud.fr</a>.
                La suppression sera effective dans un délai raisonnable n'excédant pas un mois.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">9. Modification des CGU</h2>
              <p>
                L'association se réserve le droit de modifier les présentes CGU à tout moment.
                Les modifications prennent effet dès leur publication sur le site. L'utilisation continue du site
                après modification vaut acceptation des nouvelles CGU.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">10. Droit applicable et juridiction</h2>
              <p>
                Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative de
                résolution amiable, les tribunaux compétents seront ceux du ressort du siège social de l'association.
              </p>
            </section>

            <p className="text-xs text-muted-foreground/60 pt-4">
              Dernière mise à jour : février 2026
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CGU;
