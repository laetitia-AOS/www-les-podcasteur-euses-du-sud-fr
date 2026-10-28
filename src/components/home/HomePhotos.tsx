import bande from "@/assets/photos/bande-accueil-mur-rouge.jpg.asset.json";
import cercle from "@/assets/photos/vignette-cercle.jpg.asset.json";
import trio from "@/assets/photos/vignette-trio.jpg.asset.json";
import studio from "@/assets/photos/vignette-studio.jpg.asset.json";
import { container } from "@/lib/pds";

const HomePhotos = () => (
  <section aria-labelledby="photos-title" className="pb-16 md:pb-24">
    <figure>
      <img
        src={bande.url}
        alt="Un apéro écoute des Podcasteur·euses du Sud : une vingtaine de personnes assises écoutent deux intervenant·es debout, dans une salle aux murs rouges."
        className="w-full aspect-[16/9] sm:aspect-[1800/787] object-cover"
        width={1800}
        height={787}
        loading="lazy"
      />
      <figcaption className={`${container} flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pt-4`}>
        <h2 id="photos-title" className="title-section text-[24px] sm:text-[30px]">
          On se retrouve tous les mois pour écouter ensemble, en vrai.
        </h2>
        <span className="font-mono text-sm text-muted-foreground shrink-0">Apéro écoute · Marseille</span>
      </figcaption>
    </figure>
    <ul className={`${container} mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5`}>
      <li>
        <img src={cercle.url} alt="Quatre membres assis en cercle échangent pendant une rencontre." className="w-full aspect-[4/3] object-cover" loading="lazy" width={900} height={675} />
      </li>
      <li>
        <img src={trio.url} alt="Trois membres du réseau posent ensemble devant un mur rouge." className="w-full aspect-[4/3] object-cover" loading="lazy" width={900} height={675} />
      </li>
      <li>
        <img src={studio.url} alt="Une créatrice filme dans un studio équipé de lumières et de caméras." className="w-full aspect-[4/3] object-cover" loading="lazy" width={900} height={675} />
      </li>
    </ul>
  </section>
);

export default HomePhotos;
