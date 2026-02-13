import { Mic2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-background">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mic2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-serif text-lg text-foreground block leading-tight">
                Les Podcasteur·euses du Sud
              </span>
              <span className="text-xs text-muted-foreground">
                Écosystème podcast · Région Sud
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="mailto:contact@podcasteusesdusud.fr"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <span className="w-1 h-1 rounded-full bg-border" />
            <a href="#" className="hover:text-foreground transition-colors">
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
