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
          <h1 className="font-serif text-3xl sm:text-4xl mb-4">Politique de confidentialité</h1>
          <p className="text-muted-foreground mb-10">
            La protection de vos données personnelles est une priorité pour l'association Les Podcasteur·euses du Sud. La présente politique vous informe de manière transparente sur la façon dont vos données sont collectées, utilisées et protégées.
          </p>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="font-serif text-xl text-foreground">1. Responsable du traitement</h2>
              <p>
                Le responsable du traitement des données à caractère personnel est :
              </p>
              <ul className="list-none pl-0 space-y-1 mt-2">
                <li><strong>LES PODCASTEUR·EUSES DU SUD</strong></li>
                <li>Association régie par la loi du 1er juillet 1901</li>
                <li>18 rue Saint Suffren, 13006 Marseille, France</li>
                <li>SIRET : 935 024 661 00016</li>
                <li>Courriel : <a href="mailto:contact@podcasteusesdusud.fr" className="text-primary hover:underline">contact@podcasteusesdusud.fr</a></li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">2. Données susceptibles d'être collectées</h2>
              <p>Dans le cadre de son activité et du fonctionnement du site, l'association est susceptible de collecter les catégories de données suivantes :</p>

              <h3 className="font-semibold text-foreground mt-4 mb-2">Via le formulaire de référencement de podcast :</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Données d'identification :</strong> prénom, nom, adresse de courriel, numéro de téléphone (facultatif), structure éventuelle</li>
                <li><strong>Données relatives au podcast :</strong> nom du podcast, lien d'écoute, description, vignette, thématique, type de podcast, fréquence de publication, niveau d'avancement, monétisation</li>
                <li><strong>Données de localisation :</strong> département, commune (code INSEE, code postal)</li>
                <li><strong>Données de profil :</strong> besoins exprimés, priorité actuelle</li>
                <li><strong>Consentements :</strong> acceptation du contact par l'association, acceptation de la mise en relation avec d'autres acteurs de l'écosystème</li>
              </ul>

              <h3 className="font-semibold text-foreground mt-4 mb-2">Via le formulaire de contact :</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Prénom, nom, adresse de courriel, profil, structure (facultatif), objet et message</li>
              </ul>

              <h3 className="font-semibold text-foreground mt-4 mb-2">Via la navigation sur le site :</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Données techniques strictement nécessaires au fonctionnement (cookies de session). Aucun traceur publicitaire n'est utilisé.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">3. Finalités des traitements</h2>
              <p>Les données personnelles collectées sont utilisées aux fins suivantes :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Référencement des podcasts dans le répertoire régional</li>
                <li>Animation de la communauté et communication associative</li>
                <li>Mise en relation entre créateurs audio et acteurs de l'écosystème (sous réserve du consentement explicite de la personne concernée)</li>
                <li>Réponse aux demandes formulées via le formulaire de contact</li>
                <li>Gestion interne de la vie associative et pilotage de la dynamique du réseau</li>
                <li>Évaluation interne automatisée (scoring) à des fins de pilotage associatif, non communiquée aux utilisateurs</li>
              </ul>
              <p className="mt-2">
                En aucun cas les données ne sont utilisées à des fins de prospection commerciale ou cédées à des tiers à des fins marchandes.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">4. Base légale des traitements</h2>
              <p>
                Conformément à l'article 6 du Règlement (UE) 2016/679 (RGPD), les traitements de données mis en œuvre par l'association reposent sur les bases légales suivantes :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Le consentement</strong> de la personne concernée (article 6.1.a du RGPD) — notamment pour la mise en relation et le contact direct</li>
                <li><strong>L'intérêt légitime</strong> de l'association (article 6.1.f du RGPD) — pour le référencement des podcasts, l'animation du répertoire et la gestion de la vie associative</li>
                <li><strong>L'exécution de mesures précontractuelles</strong> (article 6.1.b du RGPD) — pour le traitement des demandes d'adhésion</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">5. Durée de conservation des données</h2>
              <p>Les données personnelles sont conservées pour les durées suivantes :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Données de référencement podcast :</strong> pendant toute la durée du référencement et au maximum 3 ans après le dernier contact avec la personne concernée</li>
                <li><strong>Données du formulaire de contact :</strong> 1 an après le traitement de la demande</li>
                <li><strong>Données d'adhésion :</strong> pendant la durée de l'adhésion et 3 ans après son expiration à des fins de gestion associative</li>
              </ul>
              <p className="mt-2">
                À l'issue de ces durées, les données sont supprimées ou anonymisées de manière irréversible.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">6. Destinataires des données</h2>
              <p>
                Les données personnelles sont accessibles exclusivement aux membres habilités du bureau de l'association, dans la stricte limite de ce qui est nécessaire à l'exercice de leurs fonctions.
              </p>
              <p>
                <strong>Les données ne sont ni vendues, ni louées, ni cédées à des tiers à des fins commerciales.</strong>
              </p>
              <p>
                Les sous-traitants techniques intervenant dans l'hébergement et le traitement des données (infrastructure cloud) sont soumis au RGPD ou à des garanties équivalentes (clauses contractuelles types approuvées par la Commission européenne).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">7. Sécurité des données</h2>
              <p>
                L'association met en œuvre les mesures techniques et organisationnelles appropriées pour garantir un niveau de sécurité adapté au risque, conformément à l'article 32 du RGPD :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Chiffrement des données en transit (protocole HTTPS/TLS)</li>
                <li>Chiffrement des données au repos</li>
                <li>Contrôle d'accès par authentification et gestion des rôles</li>
                <li>Sauvegardes régulières et redondantes</li>
                <li>Hébergement au sein de centres de données conformes aux normes de sécurité européennes</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">8. Vos droits</h2>
              <p>
                Conformément aux articles 15 à 22 du Règlement (UE) 2016/679 (RGPD) et aux articles 39 et suivants de la loi n° 78-17 du 6 janvier 1978 modifiée dite « Informatique et Libertés », vous disposez des droits suivants sur vos données personnelles :
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li><strong>Droit d'accès</strong> (article 15 du RGPD) : obtenir la confirmation que vos données sont traitées et en recevoir une copie</li>
                <li><strong>Droit de rectification</strong> (article 16 du RGPD) : faire corriger des données inexactes ou compléter des données incomplètes</li>
                <li><strong>Droit à l'effacement</strong> (article 17 du RGPD, dit « droit à l'oubli ») : demander la suppression de vos données dans les conditions prévues par le règlement</li>
                <li><strong>Droit à la limitation du traitement</strong> (article 18 du RGPD) : obtenir la limitation du traitement dans certaines hypothèses</li>
                <li><strong>Droit à la portabilité</strong> (article 20 du RGPD) : recevoir vos données dans un format structuré, couramment utilisé et lisible par machine</li>
                <li><strong>Droit d'opposition</strong> (article 21 du RGPD) : vous opposer au traitement fondé sur l'intérêt légitime, pour des motifs tenant à votre situation particulière</li>
                <li><strong>Droit de retrait du consentement</strong> : retirer votre consentement à tout moment, sans que cela ne remette en cause la licéité du traitement effectué avant ce retrait</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">9. Modalités d'exercice des droits</h2>
              <p>
                Vous pouvez exercer l'ensemble de vos droits en adressant votre demande par courriel à :
              </p>
              <p className="mt-2">
                <a href="mailto:contact@podcasteusesdusud.fr" className="text-primary hover:underline font-medium">contact@podcasteusesdusud.fr</a>
              </p>
              <p className="mt-2">
                Afin de traiter votre demande dans les meilleures conditions, nous vous invitons à préciser la nature de votre demande et à justifier de votre identité (copie d'une pièce d'identité en cours de validité, le cas échéant).
              </p>
              <p>
                L'association s'engage à répondre à toute demande dans un délai maximum d'<strong>un mois</strong> à compter de la réception de la demande. Ce délai peut être prolongé de deux mois en cas de demande complexe ou de nombre élevé de demandes, conformément à l'article 12.3 du RGPD.
              </p>
              <p className="mt-3">
                En cas de difficulté dans l'exercice de vos droits ou si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'autorité de contrôle compétente :
              </p>
              <ul className="list-none pl-0 mt-2">
                <li><strong>Commission Nationale de l'Informatique et des Libertés (CNIL)</strong></li>
                <li>3 Place de Fontenoy — TSA 80715 — 75334 Paris Cedex 07</li>
                <li>Site internet : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a></li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">10. Transferts de données hors de l'Union européenne</h2>
              <p>
                En principe, l'ensemble des données collectées sont hébergées au sein de l'Union européenne. Dans l'hypothèse où un transfert vers un pays tiers serait rendu nécessaire par l'infrastructure technique, celui-ci serait encadré par des garanties appropriées au sens de l'article 46 du RGPD, notamment par des clauses contractuelles types approuvées par la Commission européenne.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">11. Mise à jour de la présente politique</h2>
              <p>
                La présente politique de confidentialité peut être modifiée à tout moment afin de tenir compte des évolutions légales, réglementaires ou techniques. La version en vigueur est celle accessible sur le site à la date de votre consultation.
              </p>
              <p className="mt-2">
                Nous vous invitons à consulter régulièrement cette page pour prendre connaissance des éventuelles modifications.
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

export default PolitiqueConfidentialite;
