import { useState } from "react";
import { Flag, Star } from "lucide-react";
import { btnPrimary, btnSecondary, formatName, formatShortDate } from "@/lib/pds";
import {
  AVIS_MAX,
  MOTIFS_SIGNALEMENT,
  envoyerAvis,
  resumeAvis,
  signalerAvis,
  useAvis,
  utiliserRafraichissementAvis,
  verifierAvis,
  type Avis,
  type AvisErreurs,
} from "@/lib/avis";

const fieldClass =
  "w-full min-h-[48px] px-3 bg-surface border-2 border-encre text-[16px] focus:outline-none focus-visible:outline-[3px] focus-visible:outline-accent";

/** 5 étoiles, pleines jusqu'à la note. Décoratif : le texte chiffré est à côté. */
const Etoiles = ({ note, size = "w-5 h-5" }: { note: number; size?: string }) => (
  <span className="inline-flex gap-0.5 text-accent" aria-hidden>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={size} strokeWidth={1.5} fill={i <= Math.round(note) ? "currentColor" : "none"} />
    ))}
  </span>
);

const libelleNote = (n: number) => `${n} ${n > 1 ? "étoiles" : "étoile"}`;

/**
 * Avis laissés sous la fiche d'un podcast : moyenne, liste, signalement et formulaire.
 * L'avis est publié tout de suite ; l'équipe peut le retirer. L'e-mail n'est jamais affiché.
 */
const AvisSection = ({ podcastId, podcastTitre }: { podcastId: string; podcastTitre: string }) => {
  const { data: avis = [], isLoading } = useAvis(podcastId);
  const rafraichir = utiliserRafraichissementAvis();

  const [saisie, setSaisie] = useState({ nom: "", email: "", note: 0, commentaire: "", website: "" });
  const [erreurs, setErreurs] = useState<AvisErreurs>({});
  const [etat, setEtat] = useState<"idle" | "envoi" | "envoye" | "erreur">("idle");
  const [messageServeur, setMessageServeur] = useState("");

  const [signalementOuvert, setSignalementOuvert] = useState<string | null>(null);
  const [signales, setSignales] = useState<string[]>([]);
  const [signalementErreur, setSignalementErreur] = useState("");

  const { moyenne, nb } = resumeAvis(avis);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaisie((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saisie.website) return; // champ piège anti-robots
    const errs = verifierAvis(saisie);
    setErreurs(errs);
    if (Object.keys(errs).length) return;
    setEtat("envoi");
    setMessageServeur("");
    try {
      await envoyerAvis(podcastId, saisie, saisie.website);
      setEtat("envoye");
      rafraichir(podcastId);
    } catch (err) {
      setMessageServeur(err instanceof Error ? err.message : "Votre avis n'a pas pu être envoyé. Réessayez dans un instant.");
      setEtat("erreur");
    }
  };

  const signaler = async (a: Avis, motif: string) => {
    setSignalementErreur("");
    try {
      await signalerAvis(a.id, motif);
      setSignales((s) => [...s, a.id]);
      setSignalementOuvert(null);
    } catch (err) {
      setSignalementErreur(err instanceof Error ? err.message : "Le signalement n'a pas pu être transmis.");
    }
  };

  return (
    <section className={`${"mx-auto w-full max-w-[1240px] px-5 sm:px-8"} pt-14 pb-4`} aria-labelledby="avis-title">
      <h2 id="avis-title" className="title-section text-[40px] sm:text-[52px] pb-4 border-b-2 border-encre">
        Avis sur {podcastTitre}
      </h2>

      <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[17px]">
        {nb > 0 ? (
          <>
            <strong className="font-mono text-[22px]">{moyenne.toLocaleString("fr-FR", { minimumFractionDigits: 1 })}/5</strong>
            <Etoiles note={moyenne} />
            <span className="text-muted-foreground">
              {nb} avis {nb > 1 ? "laissé" : "laissé"}{nb > 1 ? "s" : ""}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">
            {isLoading ? "Chargement des avis…" : "Aucun avis pour l'instant. Soyez la première ou la première à donner le vôtre."}
          </span>
        )}
      </p>

      {avis.length > 0 && (
        <ul className="mt-6 divide-y divide-filet border-y border-filet">
          {avis.map((a) => (
            <li key={a.id} className="py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold text-[17px]">{formatName(a.nom)}</span>
                {a.membre && (
                  <span className="border border-primary px-2 py-0.5 font-mono text-xs text-primary">Membre</span>
                )}
                <Etoiles note={a.note} size="w-4 h-4" />
                <span className="font-mono text-xs text-muted-foreground">{formatShortDate(a.created_at)}</span>
              </div>
              <p className="mt-2 text-[17px] leading-relaxed max-w-[70ch] whitespace-pre-line">{a.commentaire}</p>

              {signales.includes(a.id) ? (
                <p className="mt-2 text-sm text-muted-foreground">Signalement transmis à l'équipe.</p>
              ) : signalementOuvert === a.id ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">Pourquoi ce signalement ?</span>
                  {MOTIFS_SIGNALEMENT.map((m) => (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => signaler(a, m.code)}
                      className="min-h-[36px] border-2 border-encre px-3 text-sm font-semibold hover:bg-encre hover:text-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
                    >
                      {m.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSignalementOuvert(null)}
                    className="min-h-[36px] px-2 text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setSignalementErreur(""); setSignalementOuvert(a.id); }}
                  className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden /> Signaler
                </button>
              )}
              {signalementErreur && signalementOuvert === a.id && (
                <p role="alert" className="mt-2 text-sm text-destructive">{signalementErreur}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {etat === "envoye" ? (
        <div role="status" className="mt-6 border-2 border-encre bg-surface p-6">
          <p className="font-bold text-xl">Votre avis est en ligne.</p>
          <p className="mt-2 text-[17px]">
            Il apparaît sous la fiche de {podcastTitre} et dans sa note moyenne. Merci !
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-6 border-2 border-encre bg-surface p-6 sm:p-8">
          <h3 className="title-section text-[26px] sm:text-[30px]">Votre avis sur ce podcast</h3>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-[65ch]">
            Publié tout de suite, sans compte à créer. Votre e-mail sert uniquement à vérifier que vous n'avez pas déjà
            noté ce podcast : il n'est jamais affiché.
          </p>

          <div className="mt-5">
            <span className="block text-sm font-bold mb-1.5">Votre note</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={libelleNote(n)}
                  aria-pressed={saisie.note === n}
                  onClick={() => setSaisie((s) => ({ ...s, note: n }))}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    saisie.note >= n ? "border-accent bg-accent/10 text-accent" : "border-filet text-muted-foreground hover:border-encre"
                  }`}
                >
                  <Star className="w-6 h-6" strokeWidth={1.5} fill={saisie.note >= n ? "currentColor" : "none"} aria-hidden />
                </button>
              ))}
            </div>
            {erreurs.note && <p className="mt-1 text-sm text-destructive">{erreurs.note}</p>}
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="avis-nom" className="block text-sm font-bold mb-1.5">Votre nom</label>
              <input
                id="avis-nom" name="nom" value={saisie.nom} onChange={onChange} autoComplete="name"
                className={fieldClass} aria-invalid={!!erreurs.nom}
                aria-describedby={erreurs.nom ? "avis-nom-err" : undefined}
              />
              {erreurs.nom && <p id="avis-nom-err" className="mt-1 text-sm text-destructive">{erreurs.nom}</p>}
            </div>
            <div>
              <label htmlFor="avis-email" className="block text-sm font-bold mb-1.5">Votre e-mail</label>
              <input
                id="avis-email" name="email" type="email" value={saisie.email} onChange={onChange} autoComplete="email"
                className={fieldClass} aria-invalid={!!erreurs.email}
                aria-describedby={erreurs.email ? "avis-email-err" : undefined}
              />
              {erreurs.email && <p id="avis-email-err" className="mt-1 text-sm text-destructive">{erreurs.email}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="avis-commentaire" className="block text-sm font-bold mb-1.5">Votre commentaire</label>
            <textarea
              id="avis-commentaire" name="commentaire" rows={4} maxLength={AVIS_MAX} value={saisie.commentaire}
              onChange={onChange} placeholder="Ce que vous avez aimé, ce que vous avez moins aimé, en quelques lignes."
              className={`${fieldClass} py-2 resize-y`} aria-invalid={!!erreurs.commentaire}
              aria-describedby={`avis-commentaire-count${erreurs.commentaire ? " avis-commentaire-err" : ""}`}
            />
            <p id="avis-commentaire-count" className="mt-1 font-mono text-sm text-muted-foreground">
              {saisie.commentaire.length}/{AVIS_MAX} caractères
            </p>
            {erreurs.commentaire && <p id="avis-commentaire-err" className="mt-1 text-sm text-destructive">{erreurs.commentaire}</p>}
          </div>

          <div className="hidden" aria-hidden>
            <label htmlFor="avis-website">Site web</label>
            <input id="avis-website" name="website" tabIndex={-1} autoComplete="off" value={saisie.website} onChange={onChange} />
          </div>

          {etat === "erreur" && <p role="alert" className="mt-4 text-destructive font-semibold">{messageServeur}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={etat === "envoi"} className={`${btnPrimary} px-7`}>
              {etat === "envoi" ? "Envoi…" : "Publier mon avis"}
            </button>
            <span className={`${btnSecondary} pointer-events-none border-transparent`}>
              Note et commentaire publiés immédiatement
            </span>
          </div>
        </form>
      )}
    </section>
  );
};

export default AvisSection;
