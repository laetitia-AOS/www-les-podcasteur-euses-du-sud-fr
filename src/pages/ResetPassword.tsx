import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConnexionEnCours, ConnexionShell } from "@/components/ConnexionShell";
import { field, hintCls, labelCls } from "@/components/adherer/fields";
import { btnPrimary } from "@/lib/pds";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [expire, setExpire] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });
    // Also check hash for type=recovery
    if (window.location.hash.includes("type=recovery")) {
      setReady(true);
    }
    // Une session déjà active (lien de récupération consommé) suffit
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    // Sans lien valide après quelques secondes : on l'explique au lieu d'attendre indéfiniment
    const t = setTimeout(() => setExpire(true), 8000);
    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    toast.success("Mot de passe mis à jour !");
    // Redirection selon le rôle : admin -> /admin, sinon espace membre
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: hasAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      navigate(hasAdmin ? "/admin" : "/mon-espace", { replace: true });
      return;
    }
    navigate("/admin/login", { replace: true });
  };

  if (!ready && expire) {
    return (
      <ConnexionShell espace="Mot de passe">
        <SEOHead title="Nouveau mot de passe — Les Podcasteur·euses du Sud" description="Choisir un nouveau mot de passe." path="/reset-password" noindex />
        <h1 className="title-page text-[40px] sm:text-[56px]">Lien expiré</h1>
        <p className="mt-4 text-lg">Ce lien n'est plus valable : il ne sert qu'une fois et pendant une heure. Demandez-en un nouveau.</p>
        <Link to="/admin/login" className={`${btnPrimary} mt-8`}>Demander un nouveau lien</Link>
      </ConnexionShell>
    );
  }

  if (!ready) {
    return (
      <>
        <SEOHead title="Nouveau mot de passe — Les Podcasteur·euses du Sud" description="Choisir un nouveau mot de passe." path="/reset-password" noindex />
        <ConnexionEnCours />
      </>
    );
  }

  return (
    <ConnexionShell espace="Mot de passe">
      <SEOHead title="Nouveau mot de passe — Les Podcasteur·euses du Sud" description="Choisir un nouveau mot de passe." path="/reset-password" noindex />
      <h1 className="title-page text-[44px] sm:text-[64px]">Nouveau mot de passe</h1>
      <p className="mt-4 text-lg">Choisissez votre nouveau mot de passe.</p>
      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <div>
          <label htmlFor="reset-password" className={labelCls}>Nouveau mot de passe</label>
          <input id="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={field} required />
          <p className={hintCls}>Au moins 6 caractères.</p>
        </div>
        <div>
          <label htmlFor="reset-confirm" className={labelCls}>Confirmer le mot de passe</label>
          <input id="reset-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={field} required />
        </div>
        {error && <p className="text-sm font-bold text-destructive" role="alert">{error}</p>}
        <button type="submit" className={`${btnPrimary} w-full`} disabled={loading}>
          {loading ? "Mise à jour…" : "Enregistrer le mot de passe"}
        </button>
      </form>
    </ConnexionShell>
  );
};

export default ResetPassword;
