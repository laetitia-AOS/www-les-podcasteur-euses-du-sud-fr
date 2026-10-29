import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConnexionShell } from "@/components/ConnexionShell";
import { field, labelCls } from "@/components/adherer/fields";
import { btnPrimary, btnSecondary, linkUnderline } from "@/lib/pds";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  // Si une session admin existe déjà (ex. retour de réinitialisation), on entre directement
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: hasAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (hasAdmin) navigate("/admin", { replace: true });
    });
  }, [navigate]);


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setResetSent(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Adresse e-mail ou mot de passe incorrect."
          : authError.message === "Email not confirmed"
          ? "Confirmez d'abord votre adresse e-mail."
          : authError.message
      );
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: hasAdmin } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!hasAdmin) {
        await supabase.auth.signOut();
        setError("Ce compte n'a pas accès à l'administration.");
        setLoading(false);
        return;
      }
    }

    navigate("/admin");
  };

  return (
    <ConnexionShell espace="Administration">
      <SEOHead title="Connexion administration — Les Podcasteur·euses du Sud" description="Accès réservé à l'équipe de l'association." path="/admin/login" noindex />
      <h1 className="title-page text-[52px] sm:text-[72px]">Administration</h1>
      <p className="mt-4 text-lg">{resetMode ? "Recevez un lien pour choisir un nouveau mot de passe." : "Accès réservé à l'équipe de l'association."}</p>

      {resetSent ? (
        <div className="mt-10 bg-surface border border-filet p-6 space-y-3" role="status">
          <h2 className="title-section text-[28px]">Lien envoyé</h2>
          <p className="text-[15px]">
            Un lien a été envoyé à <strong className="break-all">{email}</strong>. Regardez votre boîte de réception, et vos courriers indésirables.
          </p>
          <button type="button" className={`${btnSecondary} mt-2`} onClick={() => { setResetMode(false); setResetSent(false); }}>
            Retour à la connexion
          </button>
        </div>
      ) : (
        <form onSubmit={resetMode ? handleResetPassword : handleLogin} className="mt-10 space-y-5">
          <div>
            <label htmlFor="admin-email" className={labelCls}>Adresse e-mail</label>
            <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} required />
          </div>
          {!resetMode && (
            <div>
              <label htmlFor="admin-password" className={labelCls}>Mot de passe</label>
              <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={field} required />
            </div>
          )}
          {error && <p className="text-sm font-bold text-destructive" role="alert">{error}</p>}
          <button type="submit" className={`${btnPrimary} w-full`} disabled={loading}>
            {loading ? (resetMode ? "Envoi en cours…" : "Connexion…") : (resetMode ? "Recevoir le lien" : "Se connecter")}
          </button>
          <button
            type="button"
            className={`${linkUnderline} text-[15px] min-h-[44px] inline-flex items-center`}
            onClick={() => { setResetMode(!resetMode); setError(""); }}
          >
            {resetMode ? "Retour à la connexion" : "Mot de passe oublié ?"}
          </button>
        </form>
      )}
    </ConnexionShell>
  );
};

export default AdminLogin;
