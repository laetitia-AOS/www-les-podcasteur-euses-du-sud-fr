import { Mic2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-14 border-t border-border bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-2.5">
            <Mic2 className="w-5 h-5 text-primary" />
            <span className="font-serif text-xl text-foreground">
              Podcasteur·euses du Sud
            </span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
            Initiative dédiée à la visibilité et à la structuration
            de la scène podcast en Région Sud.
          </p>
          <div className="section-divider w-24 my-2" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="mailto:contact@podcasteusesdusud.fr"
              className="hover:text-primary transition-colors"
            >
              Contact
            </a>
            <span className="text-border">·</span>
            <a href="#" className="hover:text-primary transition-colors">
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
