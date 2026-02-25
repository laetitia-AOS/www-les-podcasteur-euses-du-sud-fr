import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PolitiqueCookies = () => {
  useEffect(() => { document.title = "Politique de cookies — Les Podcasteur·euses du Sud"; }, []);
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl mb-4">Politique de cookies</h1>
          <p className="text-muted-foreground mb-10">
            La présente politique vous informe de manière claire et transparente sur l'utilisation des cookies et technologies similaires sur le site de l'association Les Podcasteur·euses du Sud.
          </p>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="font-serif text-xl text-foreground">1. Qu'est-ce qu'un cookie ?</h2>
              <p>
                Un cookie est un petit fichier texte déposé sur le terminal de l'utilisateur (ordinateur, tablette, téléphone mobile) lors de la visite d'un site internet. Il permet au site de mémoriser des informations relatives à la navigation de l'utilisateur, facilitant ainsi ses visites ultérieures et rendant le site plus convivial.
              </p>
              <p>
                Les cookies ne contiennent pas d'informations personnelles permettant de vous identifier directement. Ils ont une durée de vie limitée et sont gérés par votre navigateur.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">2. Types de cookies utilisés sur ce site</h2>
              <p>Le site de l'association utilise exclusivement des cookies strictement nécessaires à son fonctionnement technique :</p>

              <h3 className="font-semibold text-foreground mt-4 mb-2">Cookies techniques (essentiels)</h3>
              <p>
                Ces cookies sont indispensables au bon fonctionnement du site. Ils permettent notamment :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>La gestion de la session de navigation</li>
                <li>La mémorisation des préférences d'affichage (thème clair/sombre)</li>
                <li>L'authentification sécurisée pour les espaces réservés (espace podcasteur, espace administrateur)</li>
                <li>Le fonctionnement des formulaires (protection contre les soumissions multiples)</li>
              </ul>
              <p className="mt-2">
                Conformément à l'article 82 de la loi n° 78-17 du 6 janvier 1978 modifiée (dite « Informatique et Libertés ») et aux recommandations de la CNIL, ces cookies étant strictement nécessaires à la fourniture du service, ils sont <strong>exemptés du recueil préalable du consentement</strong>.
              </p>

              <h3 className="font-semibold text-foreground mt-4 mb-2">Cookies de mesure d'audience</h3>
              <p>
                À la date de rédaction de la présente politique, le site <strong>n'utilise aucun outil de mesure d'audience</strong> déposant des cookies (type Google Analytics, Matomo, etc.).
              </p>
              <p>
                Si un tel outil venait à être mis en place, il serait configuré dans le respect des recommandations de la CNIL relatives aux cookies de mesure d'audience exemptés de consentement, ou un bandeau de consentement serait préalablement mis en place.
              </p>

              <h3 className="font-semibold text-foreground mt-4 mb-2">Cookies publicitaires ou de suivi</h3>
              <p>
                <strong>Ce site n'utilise aucun cookie publicitaire, cookie de ciblage ou traceur à des fins de profilage commercial.</strong> Aucune donnée de navigation n'est transmise à des régies publicitaires ou à des tiers à des fins de marketing.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">3. Finalité des cookies</h2>
              <p>Les cookies déposés sur le site ont pour seule finalité :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>D'assurer le bon fonctionnement technique du site</li>
                <li>De garantir la sécurité des échanges de données</li>
                <li>De permettre l'authentification des utilisateurs disposant d'un espace personnel</li>
                <li>De mémoriser les préférences d'affichage de l'utilisateur</li>
              </ul>
              <p className="mt-2">
                Aucun cookie n'est utilisé à des fins de prospection commerciale, de profilage ou de revente de données.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">4. Gestion et paramétrage des cookies</h2>
              <p>
                Bien que les cookies utilisés sur ce site soient strictement techniques et exemptés de consentement, vous conservez la possibilité de les gérer et de les supprimer à tout moment via les paramètres de votre navigateur.
              </p>
              <p className="mt-2">
                Voici comment procéder selon votre navigateur :
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Google Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies et autres données de site</li>
                <li><strong>Mozilla Firefox :</strong> Paramètres → Vie privée et sécurité → Cookies et données de sites</li>
                <li><strong>Safari :</strong> Préférences → Confidentialité → Gestion des cookies</li>
                <li><strong>Microsoft Edge :</strong> Paramètres → Cookies et autorisations de site</li>
              </ul>
              <p className="mt-3">
                <strong>Attention :</strong> la désactivation des cookies techniques peut entraîner des difficultés de navigation sur le site, notamment l'impossibilité d'utiliser les formulaires ou d'accéder aux espaces authentifiés.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">5. Cookies tiers</h2>
              <p>
                Certaines pages du site intègrent des contenus tiers (widget HelloAsso pour l'adhésion en ligne, liens vers des plateformes de podcasts). Ces services tiers sont susceptibles de déposer leurs propres cookies, sur lesquels l'association n'a aucun contrôle.
              </p>
              <p>
                Nous vous invitons à consulter les politiques de cookies de ces services tiers pour en savoir plus sur leurs pratiques :
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>HelloAsso : <a href="https://www.helloasso.com/confidentialite" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">politique de confidentialité HelloAsso</a></li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">6. Mise à jour de la présente politique</h2>
              <p>
                La présente politique de cookies peut être modifiée à tout moment afin de refléter les évolutions techniques, légales ou réglementaires. La version en vigueur est celle accessible sur le site à la date de votre consultation.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">7. Contact</h2>
              <p>
                Pour toute question relative à l'utilisation des cookies sur ce site, vous pouvez nous contacter à l'adresse suivante :
              </p>
              <p className="mt-2">
                <a href="mailto:contact@podcasteusesdusud.fr" className="text-primary hover:underline font-medium">contact@podcasteusesdusud.fr</a>
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

export default PolitiqueCookies;
