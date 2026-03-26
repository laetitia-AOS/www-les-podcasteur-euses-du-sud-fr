import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const EspaceMembre = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event !== "PASSWORD_RECOVERY") {
        navigate("/mon-espace");
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/mon-espace");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/mon-espace`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Erreur lors de l'envoi du lien. Vérifiez votre email.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">Espace membre</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Connectez-vous pour modifier vos fiches et vos photos
          </p>
        </div>

        {sent ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
            <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display font-bold text-lg text-foreground">Lien envoyé !</h2>
            <p className="text-sm text-muted-foreground">
              Un lien de connexion a été envoyé à <span className="font-medium text-foreground">{email}</span>.
              Vérifiez votre boîte de réception (et vos spams).
            </p>
            <Button variant="outline" className="mt-2" onClick={() => setSent(false)}>
              Renvoyer le lien
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Adresse email
              </label>
              <Input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Utilisez l'email avec lequel vous avez rempli le formulaire de référencement
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi en cours…" : "Recevoir un lien de connexion"}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EspaceMembre;
