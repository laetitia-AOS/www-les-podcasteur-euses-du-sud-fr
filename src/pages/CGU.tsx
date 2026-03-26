import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CGU = () => {
  useEffect(() => { document.title = "CGU — Les Podcasteur·euses du Sud"; }, []);
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-10">Conditions Générales d'Utilisation et Règlement de Soumission des Podcasts</h1>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="font-display font-bold text-xl text-foreground">1. Objet</h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation du site édité par l'association <strong>Les Podcasteur·euses du Sud</strong>, ainsi que les règles applicables à la soumission de contenus audio et podcasts.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">2. Acceptation des conditions</h2>
              <p>
                Toute navigation sur le site implique l'acceptation pleine, entière et sans réserve des présentes conditions.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">3. Accès au site</h2>
              <p>
                Le site est accessible librement. L'association ne saurait être tenue responsable des interruptions, indisponibilités ou dysfonctionnements liés à des contraintes techniques ou de maintenance.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">4. Statut de membre et cotisation</h2>
              <p>
                L'adhésion à l'association et le paiement de la cotisation annuelle confèrent exclusivement la qualité de membre.
              </p>
              <p>
                Ils ne constituent pas l'achat d'un service et ne garantissent en aucun cas la diffusion, la publication ou la mise en avant d'un podcast sur le site ou les supports de l'association.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">5. Soumission de podcasts</h2>
              <p>Toute personne soumettant un podcast ou un contenu audio garantit :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>être titulaire des droits nécessaires à sa diffusion</li>
                <li>respecter les droits de propriété intellectuelle</li>
                <li>respecter la législation en vigueur</li>
              </ul>
              <p className="mt-2">Le soumetteur demeure seul responsable des contenus transmis.</p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">6. Conditions de diffusion et liberté éditoriale</h2>
              <p>
                L'association Les Podcasteur·euses du Sud conserve une <strong>liberté éditoriale totale</strong>.
              </p>
              <p>
                La publication, la non-publication, la mise en avant ou le retrait d'un podcast relèvent de la seule appréciation de l'association, notamment au regard de sa ligne éditoriale, de contraintes techniques, juridiques ou éthiques.
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Aucun droit automatique à diffusion n'est accordé.</li>
                <li>Aucune indemnité, remboursement ou compensation ne pourra être réclamée en cas de refus ou de retrait d'un contenu.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">7. Responsabilités</h2>
              <p>L'association ne saurait être tenue responsable :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>des contenus publiés par les utilisateurs</li>
                <li>de l'utilisation faite du site</li>
                <li>des décisions éditoriales</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">8. Propriété intellectuelle</h2>
              <p>
                Les éléments du site sont protégés par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">9. Comportements interdits</h2>
              <p>Sont notamment interdits :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>contenus illicites ou frauduleux</li>
                <li>atteintes aux droits de tiers</li>
                <li>tentatives d'intrusion ou d'abus technique</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">10. Modification des conditions</h2>
              <p>
                L'association se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication sur le site.
              </p>
            </section>

            <section>
              <h2 className="font-display font-bold text-xl text-foreground">11. Droit applicable</h2>
              <p>
                Les présentes conditions sont soumises au droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux compétents seront ceux du ressort du Tribunal judiciaire de Marseille.
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
