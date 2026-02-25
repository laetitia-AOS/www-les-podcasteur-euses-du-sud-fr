import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MentionsLegales = () => {
  useEffect(() => { document.title = "Mentions légales — Les Podcasteur·euses du Sud"; }, []);
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl mb-10">Mentions légales</h1>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="font-serif text-xl text-foreground">1. Identification de l'éditeur du site</h2>
              <p>
                Le présent site internet est édité par :
              </p>
              <ul className="list-none pl-0 space-y-1 mt-2">
                <li><strong>Dénomination :</strong> LES PODCASTEUR·EUSES DU SUD</li>
                <li><strong>Forme juridique :</strong> Association régie par la loi du 1er juillet 1901 et le décret du 16 août 1901</li>
                <li><strong>SIREN :</strong> 935 024 661</li>
                <li><strong>SIRET (siège) :</strong> 935 024 661 00016</li>
                <li><strong>Code APE / NAF :</strong> 94.12Z — Activités des organisations professionnelles</li>
                <li><strong>Siège social :</strong> 18 rue Saint Suffren, 13006 Marseille, France</li>
                <li><strong>Date de création :</strong> 18 avril 2024</li>
                <li><strong>Statut :</strong> Structure relevant de l'Économie Sociale et Solidaire (ESS)</li>
              </ul>
              <p className="mt-3">
                Courriel : <a href="mailto:contact@podcasteusesdusud.fr" className="text-primary hover:underline">contact@podcasteusesdusud.fr</a>
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">2. Directeur de la publication</h2>
              <p>
                Le directeur de la publication est <strong>Madame Armange Laetitia</strong>, en sa qualité de Présidente de l'association Les Podcasteur·euses du Sud.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">3. Hébergement du site</h2>
              <p>
                Le site est hébergé par <strong>Lovable / Supabase</strong>, infrastructure cloud sécurisée.
              </p>
              <p>
                Les données sont stockées au sein de l'Union européenne ou dans des pays assurant un niveau de protection adéquat au sens du Règlement (UE) 2016/679 relatif à la protection des données à caractère personnel (RGPD).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">4. Propriété intellectuelle</h2>
              <p>
                L'ensemble des éléments constituant le site (textes, photographies, illustrations, graphismes, logos, icônes, sons, logiciels, architecture et mise en page) est la propriété exclusive de l'association Les Podcasteur·euses du Sud ou fait l'objet d'une autorisation d'utilisation.
              </p>
              <p>
                Ces éléments sont protégés par les dispositions du Code de la propriété intellectuelle, notamment les articles L.111-1 et suivants, L.335-2 et suivants.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle, de l'un quelconque de ces éléments, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation écrite préalable de l'association, à l'exception de l'usage strictement privé du copiste au sens de l'article L.122-5 du Code de la propriété intellectuelle.
              </p>
              <p>
                Toute exploitation non autorisée sera constitutive d'une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">5. Responsabilité</h2>
              <p>
                L'association s'efforce de fournir sur le site des informations aussi précises et actualisées que possible. Toutefois, elle ne saurait garantir l'exactitude, la complétude ou l'actualité des informations diffusées.
              </p>
              <p>
                En conséquence, l'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive. L'association ne pourra en aucun cas être tenue responsable de tout dommage direct ou indirect résultant de l'utilisation du site ou de l'impossibilité d'y accéder.
              </p>
              <p>
                L'association se réserve le droit de modifier, corriger ou supprimer le contenu du site à tout moment et sans préavis.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">6. Liens hypertextes</h2>
              <p>
                Le site peut contenir des liens hypertextes vers des sites tiers (plateformes d'écoute de podcasts, services de paiement HelloAsso, réseaux sociaux, etc.). L'association n'exerce aucun contrôle sur le contenu de ces sites et décline toute responsabilité quant à leur contenu, leurs pratiques en matière de protection des données ou les services qu'ils proposent.
              </p>
              <p>
                La mise en place de liens hypertextes vers le site de l'association est autorisée sous réserve de ne pas porter atteinte à l'image de l'association et d'en informer préalablement l'éditeur par courriel.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">7. Conditions de diffusion des podcasts</h2>
              <p>
                L'association Les Podcasteur·euses du Sud met à disposition de ses membres un espace de visibilité sur le site internet pour la présentation de leurs podcasts. Les conditions suivantes régissent cette diffusion :
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  <strong>Liberté éditoriale :</strong> L'association dispose d'une entière liberté éditoriale quant au choix des podcasts mis en avant, diffusés ou retirés du site. Cette liberté s'exerce dans le respect de l'objet social de l'association et de sa ligne éditoriale.
                </li>
                <li>
                  <strong>Nature de la cotisation :</strong> La cotisation versée par les membres constitue une participation au fonctionnement de l'association et à la poursuite de son objet social. Elle ne saurait en aucun cas être assimilée à l'achat d'une prestation de service, ni conférer un droit automatique à la publication ou à la mise en avant d'un podcast sur le site.
                </li>
                <li>
                  <strong>Absence de droit automatique à la publication :</strong> Le référencement d'un podcast dans la base de données de l'association n'emporte pas de droit à sa diffusion sur le flux public du site. La mise en ligne est subordonnée à la validation par l'association, selon des critères de qualité, de complétude des informations et de conformité à la ligne éditoriale.
                </li>
                <li>
                  <strong>Droit de refus et de retrait :</strong> L'association se réserve le droit de refuser la mise en ligne d'un podcast ou de retirer à tout moment un contenu déjà publié, sans avoir à justifier sa décision, notamment en cas de contenu jugé inapproprié, incomplet, contraire aux valeurs de l'association ou portant atteinte aux droits de tiers.
                </li>
                <li>
                  <strong>Absence de remboursement ou d'indemnité :</strong> Le refus de publication, le retrait d'un podcast ou la non-mise en avant d'un contenu ne saurait ouvrir droit à un quelconque remboursement de la cotisation, à une indemnisation ou à un dédommagement de quelque nature que ce soit.
                </li>
              </ul>
              <p className="mt-3">
                En procédant à son inscription et au versement de sa cotisation, le membre reconnaît avoir pris connaissance des présentes conditions et les accepte sans réserve.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground">8. Droit applicable et juridiction compétente</h2>
              <p>
                Les présentes mentions légales sont régies par le droit français. En cas de litige relatif à l'interprétation ou à l'exécution des présentes, et après tentative de résolution amiable, les tribunaux compétents seront ceux du ressort du Tribunal judiciaire de Marseille.
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

export default MentionsLegales;
