import { ficheHref } from "@/lib/seo";
import { Link } from "react-router-dom";
import { container, cleanCity, fullName, linkUnderline } from "@/lib/pds";
import type { HomeProfile } from "./useHomeData";
import { collabLabel } from "@/lib/inscription";
import MemberAvatar, { profilePhotoFor } from "@/components/MemberAvatar";

const ROLE: Record<string, string> = {
  podcasteur: "podcasteur·euse",
  pro_podcast: "acteur·ice de l'écosystème",
  studio: "studio",
  structure_eco: "structure",
  soutien: "soutien",
};

const HomeQuiCherche = ({ profiles }: { profiles: HomeProfile[] }) => {
  const people = profiles
    .filter((p) => p.type_profil !== "studio" && p.type_profil !== "structure_eco")
    .filter((p) => (p.cherche_choix?.length || 0) > 0 && (p.apporte_choix?.length || 0) > 0)
    .slice(0, 3);

  return (
    <section className="pb-16 md:pb-24" aria-labelledby="qcq-title">
      <div className={`${container} grid lg:grid-cols-[minmax(0,5fr)_minmax(0,9fr)] gap-10 lg:gap-16`}>
        <div>
          <h2 id="qcq-title" className="title-section text-[48px] sm:text-[64px]">Qui cherche quoi</h2>
          <p className="mt-5 text-lg max-w-[38ch]">Chaque membre dit ce qu'il cherche et ce qu'il apporte. Vous croisez, vous écrivez.</p>
          <Link to="/annuaire" className={`${linkUnderline} mt-4 inline-flex min-h-[44px] items-center`}>Voir tout l'annuaire</Link>

          <Link to="/studios" className="mt-8 block border-2 border-encre bg-surface p-6 hover:border-primary group">
            <span className="title-section block text-[26px]">Besoin d'un studio ?</span>
            <span className="block mt-2 text-[17px]">
              Studios, plateaux vidéo et agences de la région. Décrivez votre projet, ils vous répondent <span aria-hidden>→</span>
            </span>
          </Link>
        </div>

        <ul className="border-t-2 border-encre divide-y divide-filet border-b border-filet">
          {people.map((p) => (
            <li key={p.id}>
              <Link to={ficheHref(p)} className="grid grid-cols-[56px_1fr] sm:grid-cols-[80px_1fr] gap-4 sm:gap-6 py-6 hover:bg-surface">
                <MemberAvatar prenom={p.prenom} nom={p.nom} photoUrl={profilePhotoFor(p, profiles)} className="w-14 h-14 sm:w-20 sm:h-20" />
                <div className="min-w-0">
                  <p className="text-[19px] sm:text-[22px] leading-tight">
                    <span className="font-bold">{fullName(p.prenom, p.nom) || p.nom_podcast}</span>
                    <span className="text-muted-foreground text-[15px] sm:text-[17px]">
                      {" "}— {ROLE[p.type_profil] || p.type_profil}{p.city_name ? `, ${cleanCity(p.city_name)}` : ""}
                    </span>
                  </p>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3 sm:gap-6">
                    <div>
                      <p className="text-sm font-bold text-primary">Cherche</p>
                      <p className="text-[17px]">{p.cherche_choix!.slice(0, 2).map(collabLabel).join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-accent-text">Apporte</p>
                      <p className="text-[17px]">{p.apporte_choix!.slice(0, 2).map(collabLabel).join(", ")}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HomeQuiCherche;
