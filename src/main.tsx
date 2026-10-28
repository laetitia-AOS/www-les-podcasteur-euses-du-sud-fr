import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Une image envoyée sans connexion n'existe à son adresse publique qu'après validation par un·e admin :
// en attendant, on la masque au lieu d'afficher une image cassée.
document.addEventListener(
  "error",
  (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement && t.src.includes("/storage/v1/object/public/")) {
      t.style.visibility = "hidden";
    }
  },
  true,
);

createRoot(document.getElementById("root")!).render(<App />);
