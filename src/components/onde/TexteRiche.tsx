import { Fragment } from "react";
import { Link } from "react-router-dom";
import { decouperLigne, paragraphes } from "@/lib/onde";
import { linkUnderline } from "@/lib/pds";

/** Affiche un texte de L'Onde : paragraphes, **gras**, *italique* et liens. Aucun HTML n'est interprété. */
const TexteRiche = ({ texte, className = "" }: { texte: string; className?: string }) => (
  <div className={`space-y-4 ${className}`}>
    {paragraphes(texte).map((lignes, i) => (
      <p key={i}>
        {lignes.map((ligne, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {decouperLigne(ligne).map((m, k) =>
              m.t === "gras" ? <strong key={k}>{m.v}</strong>
              : m.t === "italique" ? <em key={k}>{m.v}</em>
              : m.t === "lien" ? (
                m.href.startsWith("/") ? (
                  <Link key={k} to={m.href} className={linkUnderline}>{m.v}</Link>
                ) : (
                  <a key={k} href={m.href} target="_blank" rel="noopener noreferrer" className={linkUnderline}>
                    {m.v}<span className="sr-only"> (nouvel onglet)</span>
                  </a>
                )
              )
              : <Fragment key={k}>{m.v}</Fragment>,
            )}
          </Fragment>
        ))}
      </p>
    ))}
  </div>
);

export default TexteRiche;
