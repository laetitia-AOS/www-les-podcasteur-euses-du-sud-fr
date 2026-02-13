import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PolitiqueConfidentialite = () => {
  useEffect(() => { document.title = "Politique de confidentialité — Les Podcasteur·euses du Sud"; }, []);
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl mb-10">Politique de confidentialité</h1>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="font-serif text-xl text-foreground">1. Responsable du traitement</h2>
              <p>
                Le responsable du traitement des données personnelles est l'association loi 1901
                « Les Podcasteur·euses du Sud », joignable à l'adresse :
                <a href="mailto:contact@podcasteusesdusud.fr" className="text-primary hover:underline ml-1">contact@podcasteusesdusud.fr</a>.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">2. Données collectées</h2>
              <p>Nous collectons les données suivantes dans le cadre du référencement de podcasts :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Données d'identification</strong> : prénom, nom, adresse email, numéro de téléphone (facultatif)</li>
                <li><strong>Données relatives au podcast</strong> : nom du podcast, lien d'écoute, description, vignette, thématique, type, fréquence de publication, niveau d'avancement, monétisation</li>
                <li><strong>Données de localisation</strong> : département, commune (code INSEE, code postal)</li>
                <li><strong>Données de profil</strong> : besoins exprimés, priorité actuelle, structure éventuelle</li>
                <li><strong>Consentements</strong> : acceptation du contact, acceptation de la mise en relation</li>
              </ul>
              <p>
                Dans le cadre du formulaire de contact, nous collectons : prénom, nom, email, profil, objet et message.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">3. Finalités du traitement</h2>
              <p>Les données sont collectées pour les finalités suivantes :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Référencement des podcasts dans le répertoire régional</li>
                <li>Mise en relation entre créateurs audio et acteurs de l'écosystème (sous réserve de consentement)</li>
                <li>Communication associative et animation de la communauté</li>
                <li>Évaluation interne (scores calculés automatiquement, non communiqués aux utilisateurs) pour le pilotage de la dynamique associative</li>
                <li>Réponse aux demandes de contact</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">4. Base légale du traitement</h2>
              <p>
                Conformément à l'article 6 du Règlement (UE) 2016/679 (RGPD), les traitements reposent sur :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Le consentement</strong> de la personne concernée (article 6.1.a) — pour le contact et la mise en relation</li>
                <li><strong>L'intérêt légitime</strong> de l'association (article 6.1.f) — pour le référencement et l'animation du répertoire</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">5. Durée de conservation</h2>
              <p>
                Les données sont conservées pendant toute la durée du référencement du podcast et au maximum
                <strong> 3 ans après le dernier contact</strong> avec la personne concernée. Les données de contact
                issues du formulaire de contact sont conservées 1 an après traitement de la demande.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">6. Destinataires des données</h2>
              <p>
                Les données sont accessibles uniquement aux membres habilités du bureau de l'association.
                Elles ne sont ni vendues, ni cédées, ni louées à des tiers.
              </p>
              <p>
                Les sous-traitants techniques (hébergement, base de données) sont soumis au RGPD ou à des
                garanties équivalentes (clauses contractuelles types).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">7. Transferts hors UE</h2>
              <p>
                En principe, les données sont hébergées au sein de l'Union européenne. Si un transfert hors UE
                devait avoir lieu (infrastructure technique), il serait encadré par des clauses contractuelles types
                approuvées par la Commission européenne (article 46.2.c du RGPD).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">8. Vos droits</h2>
              <p>
                Conformément aux articles 15 à 22 du RGPD et aux articles 39 et suivants de la loi
                « Informatique et Libertés » du 6 janvier 1978 modifiée, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Droit d'accès</strong> : obtenir la confirmation que vos données sont traitées et en obtenir une copie</li>
                <li><strong>Droit de rectification</strong> : faire corriger des données inexactes ou incomplètes</li>
                <li><strong>Droit à l'effacement</strong> (« droit à l'oubli ») : demander la suppression de vos données</li>
                <li><strong>Droit à la limitation</strong> du traitement</li>
                <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré et lisible</li>
                <li><strong>Droit d'opposition</strong> : vous opposer au traitement fondé sur l'intérêt légitime</li>
                <li><strong>Droit de retrait du consentement</strong> à tout moment, sans affecter la licéité du traitement antérieur</li>
              </ul>
              <p>
                Pour exercer vos droits, contactez-nous à :
                <a href="mailto:contact@podcasteusesdusud.fr" className="text-primary hover:underline ml-1">contact@podcasteusesdusud.fr</a>.
                Nous nous engageons à répondre dans un délai d'un mois.
              </p>
              <p>
                En cas de difficulté, vous pouvez introduire une réclamation auprès de la
                <strong> Commission Nationale de l'Informatique et des Libertés (CNIL)</strong> :
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">www.cnil.fr</a>.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">9. Cookies</h2>
              <p>
                Ce site n'utilise pas de cookies publicitaires ni de traceurs tiers. Seuls des cookies
                strictement nécessaires au fonctionnement technique du site peuvent être déposés
                (session, préférences). Conformément à l'article 82 de la loi « Informatique et Libertés »,
                ces cookies sont exemptés de consentement.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">10. Sécurité</h2>
              <p>
                L'association met en œuvre les mesures techniques et organisationnelles appropriées pour
                garantir la sécurité et la confidentialité des données personnelles, conformément à l'article 32
                du RGPD (chiffrement en transit et au repos, contrôle d'accès, sauvegardes régulières).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">11. Mise à jour</h2>
              <p>
                La présente politique de confidentialité peut être modifiée à tout moment. La version en vigueur
                est celle accessible sur le site. Dernière mise à jour : février 2026.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PolitiqueConfidentialite;
