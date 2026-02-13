const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-background">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <p className="font-serif text-xl text-foreground mb-2">Podcasteur·euses du Sud</p>
        <p className="text-muted-foreground text-sm mb-6">
          Initiative dédiée aux créateurs et productions audio du territoire
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <a href="mailto:contact@podcasteusesdusud.fr" className="hover:text-primary transition-colors">
            Contact
          </a>
          <span className="text-border">·</span>
          <a href="#" className="hover:text-primary transition-colors">
            Mentions légales
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
