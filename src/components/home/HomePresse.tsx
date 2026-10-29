import { container } from "@/lib/pds";

const ARTICLES = [
  {
    date: "17.05.2026",
    source: "Maritima · La Famille Maritima",
    title: "Les Podcasteur·euses du Sud au micro Maritima",
    href: "https://maritima.fr/actualites/culture/region-sud/13253/les-podcasteureuses-du-sud-au-micro-maritima",
  },
  {
    date: "11.10.2026",
    source: "Maritima · un membre à l'antenne",
    title: "Podcast « L'unconnu » : Arnaud Casali casse les codes",
    href: "https://maritima.fr/actualites/culture/marseille/15982/podcast-lunconnu-arnaud-casali-casse-les-codes-sur-maritima",
  },
];

// Le plus récent en premier (dates au format JJ.MM.AAAA)
const cle = (d: string) => d.split(".").reverse().join("");
const ARTICLES_RECENTS = [...ARTICLES].sort((a, b) => cle(b.date).localeCompare(cle(a.date)));

const PARTNERS = [
  { name: "Maritima", desc: "Radio · des membres invités à l'antenne", href: "https://maritima.fr/" },
  { name: "CultureShock", desc: "Lieu des apéros écoute · Marseille", href: null },
  { name: "PodOuest", desc: "Collectif podcast et son du Sud-Ouest", href: "https://podouest.vercel.app/" },
];

const HomePresse = () => (
  <section className="py-16 md:py-24" aria-label="Presse et partenaires">
    <div className={`${container} grid lg:grid-cols-[2fr_1fr] gap-12 lg:gap-16`}>
      <div>
        <h2 className="title-section text-[44px] sm:text-[56px] pb-5 border-b-2 border-encre">On parle de nous</h2>
        <ul className="divide-y divide-filet border-b border-filet">
          {ARTICLES_RECENTS.map((a) => (
            <li key={a.href}>
              <a href={a.href} target="_blank" rel="noopener noreferrer" className="grid grid-cols-1 sm:grid-cols-[110px_1fr_auto] gap-x-6 gap-y-1 py-5 group">
                <span className="font-mono text-sm text-muted-foreground">{a.date}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-primary">{a.source}</span>
                  <span className="block font-bold text-[19px] sm:text-[21px] leading-tight group-hover:underline underline-offset-4">{a.title}</span>
                </span>
                <span className="font-bold text-[15px]">Lire <span aria-hidden>→</span><span className="sr-only"> (nouvel onglet)</span></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="title-section text-[44px] sm:text-[56px] pb-5 border-b-2 border-encre">Partenaires</h2>
        <ul className="divide-y divide-filet border-b border-filet">
          {PARTNERS.map((p) => (
            <li key={p.name} className="py-4">
              {p.href ? (
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="font-bold text-[19px] hover:underline underline-offset-4 inline-flex min-h-[32px] items-center">
                  {p.name} <span aria-hidden>&nbsp;→</span>
                </a>
              ) : (
                <p className="font-bold text-[19px]">{p.name}</p>
              )}
              <p className="text-muted-foreground text-[15px]">{p.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default HomePresse;
