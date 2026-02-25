import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Adhesion = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-2 text-center">
            Adhérer à l'association
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            Rejoignez Les Podcasteur·euses du Sud et participez à la dynamique podcast régionale.
          </p>
          <iframe
            id="haWidget"
            allowTransparency={true}
            src="https://www.helloasso.com/associations/les-podcasteur-euses-du-sud/adhesions/adherer-a-l-association/widget"
            style={{ width: "100%", border: "none", minHeight: 800 }}
            title="Formulaire d'adhésion HelloAsso"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Adhesion;
