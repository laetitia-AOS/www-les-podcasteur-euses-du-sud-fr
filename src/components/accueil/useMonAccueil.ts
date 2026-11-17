import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FichePresentation } from "@/lib/accueil";

export type MonAccueil = { departement: string | null; groupe_nom: string | null; groupe_lien: string | null; whatsapp_rejoint_le: string | null };
export type ProchainAtelier = { titre: string; date_debut: string; lieu: string | null; slug: string | null };

const COLONNES = "prenom, type_profil, metier_principal, city_name, ville, nom_podcast, lien_ecoute, cherche_choix, apporte_choix, cherche_precision, apporte_precision";

/**
 * Accueil de la personne connectée : son département, son groupe (lu par `mon_accueil`, jamais sans connexion),
 * ses fiches pour le message de présentation, et le prochain atelier d'écoute de l'agenda.
 */
export const useMonAccueil = () => {
  const [chargement, setChargement] = useState(true);
  const [connecte, setConnecte] = useState(false);
  const [connu, setConnu] = useState(false);
  const [accueil, setAccueil] = useState<MonAccueil | null>(null);
  const [fiches, setFiches] = useState<FichePresentation[]>([]);
  const [atelier, setAtelier] = useState<ProchainAtelier | null>(null);

  const charger = useCallback(async () => {
    const [{ data: { session } }, at] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from("evenements").select("titre, date_debut, lieu, slug").eq("statut", "publie").eq("type", "apero_ecoute")
        .gt("date_debut", new Date().toISOString()).order("date_debut", { ascending: true }).limit(1).maybeSingle(),
    ]);
    setAtelier((at.data as ProchainAtelier | null) || null);
    const mail = session?.user.email?.toLowerCase();
    setConnecte(!!mail);
    if (!mail) { setChargement(false); return; }
    const [a, f] = await Promise.all([
      supabase.rpc("mon_accueil"),
      supabase.from("podcasts").select(COLONNES).eq("email", mail).order("created_at", { ascending: true }),
    ]);
    const ligne = ((a.data as MonAccueil[] | null) || [])[0] || null;
    setConnu(!!ligne);
    setAccueil(ligne);
    setFiches((f.data as FichePresentation[] | null) || []);
    setChargement(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const definirDepartement = async (code: string) => {
    const { error } = await supabase.rpc("definir_mon_departement", { _departement: code });
    if (error) throw error;
    await charger();
  };
  const rejoindre = async () => {
    const { data, error } = await supabase.rpc("j_ai_rejoint_whatsapp");
    if (error) throw error;
    setAccueil((x) => (x ? { ...x, whatsapp_rejoint_le: (data as string) || new Date().toISOString() } : x));
  };
  return { chargement, connecte, connu, accueil, fiches, atelier, definirDepartement, rejoindre, recharger: charger };
};
