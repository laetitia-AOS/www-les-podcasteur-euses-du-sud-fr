/** Logo d'un partenaire dans un cadre carré clair ; sans logo, l'initiale du nom. */
const LogoPartenaire = ({ src, nom, className = "w-28 h-28" }: { src?: string | null; nom: string; className?: string }) =>
  src ? (
    <span className={`${className} shrink-0 inline-flex items-center justify-center bg-surface border border-filet p-[10%]`}>
      <img src={src} alt={`Logo de ${nom}`} className="max-w-full max-h-full object-contain" loading="lazy" />
    </span>
  ) : (
    <span
      className={`${className} shrink-0 inline-flex items-center justify-center bg-primary text-primary-foreground font-display font-black text-[2em]`}
      aria-hidden
    >
      {nom.trim().charAt(0).toUpperCase()}
    </span>
  );

export default LogoPartenaire;
