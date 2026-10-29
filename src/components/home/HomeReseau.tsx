import { PHRASE_ADHESION } from "@/lib/inscription";
import { Link } from "react-router-dom";
import { btnPrimary, btnSecondary, container } from "@/lib/pds";

const HomeReseau = () => (
  <section className="pb-16 md:pb-24" aria-labelledby="reseau-title">
    <div className={`${container} grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-10 lg:gap-16 items-start`}>
      <div>
        <h2 id="reseau-title" className="title-section text-[48px] sm:text-[64px]">Entrer dans le réseau</h2>
        <p className="mt-5 text-lg max-w-[36ch]">{PHRASE_ADHESION}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <article className="border-2 border-encre bg-surface p-6 flex flex-col">
          <p className="text-sm font-mono">1 · Gratuit</p>
          <h3 className="title-section text-[32px] mt-2">Profil</h3>
          <ul className="mt-4 space-y-2 text-[17px] list-disc pl-5 flex-1">
            <li>Enregistré dans la base</li>
            <li>Validé à la main par l'équipe</li>
            <li>Pas visible sur le site</li>
          </ul>
          <Link to="/adherer#inscription" className={`${btnSecondary} mt-6 self-start`}>Créer mon profil</Link>
        </article>

        <article className="border-[3px] border-primary bg-surface p-6 flex flex-col">
          <p className="text-sm font-mono text-primary font-semibold">2 · 20 € par an</p>
          <h3 className="title-section text-[32px] mt-2">Membre</h3>
          <ul className="mt-4 space-y-2 text-[17px] list-disc pl-5 flex-1">
            <li>Visible dans l'annuaire et dans « Écouter »</li>
            <li>Accès à « Qui cherche quoi »</li>
            <li>Rencontres et apéros écoute</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Le prix est un frein ? Adhérez à partir de 1 €. Studios et agences : 100 € par an.
          </p>
          <Link to="/adherer" className={`${btnPrimary} mt-5 self-start px-7`}>Adhérer</Link>
        </article>
      </div>
    </div>
  </section>
);

export default HomeReseau;
