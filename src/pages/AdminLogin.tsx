import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

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
          ? "Email ou mot de passe incorrect"
          : authError.message === "Email not confirmed"
          ? "Veuillez confirmer votre email avant de vous connecter"
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
        setError("Ce compte n'a pas les droits administrateur");
        setLoading(false);
        return;
      }
    }

    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={resetMode ? handleResetPassword : handleLogin} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">Espace admin</h1>
          <p className="text-muted-foreground mt-1">
            {resetMode ? "Réinitialisez votre mot de passe" : "Connectez-vous avec votre compte"}
          </p>
        </div>
        {resetSent ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Un email de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception.
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={() => { setResetMode(false); setResetSent(false); }}>
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!resetMode && (
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (resetMode ? "Envoi…" : "Connexion…") : (resetMode ? "Envoyer le lien" : "Se connecter")}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-sm text-muted-foreground"
              onClick={() => { setResetMode(!resetMode); setError(""); }}
            >
              {resetMode ? "Retour à la connexion" : "Mot de passe oublié ?"}
            </Button>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour au site
        </Button>
      </form>
    </div>
  );
};

export default AdminLogin;
