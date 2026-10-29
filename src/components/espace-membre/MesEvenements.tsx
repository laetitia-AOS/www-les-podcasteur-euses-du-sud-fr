import { useState } from "react";
import { fullName } from "@/lib/pds";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { readableTitle } from "@/lib/events";
import { formatLongDate } from "@/lib/espaceMembre";
import { linkUnderline } from "@/lib/pds";
import ProposerEvenementForm, { type PropositionInitiale } from "@/components/agenda/ProposerEvenementForm";

export type MonEvenement = {
  id: string; titre: string; slug: string | null; date_debut: string; publie: boolean;
  statut: string; motif_refus: string | null; nb_venues: number;
};

const STATUT: Record<string, { label: string; cls: string }> = {
  en_relecture: { label: "En relecture", cls: "border border-encre" },
  publie: { label: "Publié", cls: "bg-primary text-primary-foreground" },
  refuse: { label: "Refusé", cls: "bg-encre text-surface" },
};

type Venue = { prenom: string; nom: string; email: string; created_at: string };

/** « Mes événements » : statut de chaque proposition, modification tant qu'elle est en relecture, liste des venues. */
const MesEvenements = ({ evenements, onChange }: { evenements: MonEvenement[]; onChange: () => void }) => {
  const [editing, setEditing] = useState<PropositionInitiale | null>(null);
  const [venues, setVenues] = useState<Record<string, Venue[]>>({});

  const ouvrirEdition = async (id: string) => {
    const { data, error } = await supabase.from("evenements")
      .select("id, titre, sous_titre, description, date_debut, date_fin, lieu, adresse, type, format, lien_connexion, lien_externe, tarif, places, image_url")
      .eq("id", id).maybeSingle();
    if (error || !data) { toast.error("La proposition n'a pas pu être ouverte."); return; }
    setEditing(data as PropositionInitiale);
  };

  const retirer = async (id: string) => {
    if (!window.confirm("Retirer cette proposition ? Elle sera supprimée.")) return;
    const { error } = await supabase.from("evenements").delete().eq("id", id);
    if (error) { toast.error("La proposition n'a pas pu être retirée."); return; }
    toast.success("Proposition retirée.");
    onChange();
  };

  const voirVenues = async (id: string) => {
    if (venues[id]) { setVenues((v) => { const n = { ...v }; delete n[id]; return n; }); return; }
    const { data, error } = await supabase.rpc("mes_venues", { _evenement_id: id });
    if (error) { toast.error("La liste n'a pas pu être chargée."); return; }
    setVenues((v) => ({ ...v, [id]: (data as Venue[]) || [] }));
  };

  if (editing) {
    return (
      <div className="mt-5">
        <p className="font-bold mb-4">Modifier « {readableTitle(editing.titre)} »</p>
        <ProposerEvenementForm initial={editing} onDone={() => { setEditing(null); onChange(); }} />
      </div>
    );
  }

  if (evenements.length === 0) {
    return <p className="mt-4 text-[15px] text-muted-foreground">Vous n'avez pas encore proposé d'événement.</p>;
  }

  return (
    <ul>
      {evenements.map((ev) => {
        const st = STATUT[ev.statut] || STATUT.en_relecture;
        const list = venues[ev.id];
        return (
          <li key={ev.id} className="border-b border-filet py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {ev.statut === "publie" && ev.slug ? (
                  <Link to={`/agenda/${ev.slug}`} className="font-bold hover:underline underline-offset-4">{readableTitle(ev.titre)}</Link>
                ) : (
                  <p className="font-bold">{readableTitle(ev.titre)}</p>
                )}
                <p className="font-mono text-xs text-muted-foreground mt-0.5">{formatLongDate(ev.date_debut)}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
            </div>
            {ev.statut === "refuse" && ev.motif_refus && (
              <p className="mt-2 text-[15px] border-l-[3px] border-accent pl-3"><span className="font-bold">Motif de l'équipe : </span>{ev.motif_refus}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              {ev.statut === "en_relecture" && (
                <>
                  <button type="button" onClick={() => ouvrirEdition(ev.id)} className={`${linkUnderline} min-h-[44px]`}>Modifier</button>
                  <button type="button" onClick={() => retirer(ev.id)} className="underline underline-offset-4 min-h-[44px]">Retirer</button>
                </>
              )}
              {ev.statut === "publie" && (
                <button type="button" onClick={() => voirVenues(ev.id)} className={`${linkUnderline} min-h-[44px]`} aria-expanded={!!list}>
                  {ev.nb_venues} personne{ev.nb_venues > 1 ? "s" : ""} vien{ev.nb_venues > 1 ? "nent" : "t"} {list ? "· masquer" : "· voir la liste"}
                </button>
              )}
            </div>
            {list && (
              list.length === 0 ? <p className="text-sm text-muted-foreground">Personne pour l'instant.</p> : (
                <ul className="mt-2 text-sm divide-y divide-filet border border-filet bg-surface">
                  {list.map((v) => (
                    <li key={v.email} className="px-3 py-2 flex flex-wrap justify-between gap-2">
                      <span className="font-semibold">{fullName(v.prenom, v.nom)}</span>
                      <a href={`mailto:${encodeURIComponent(v.email)}`} className="underline underline-offset-4">{v.email}</a>
                    </li>
                  ))}
                </ul>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default MesEvenements;
