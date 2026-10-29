import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { field, hintCls, labelCls } from "@/components/adherer/fields";
import { btnPrimary, btnSecondary, linkUnderline } from "@/lib/pds";
import logoPds from "@/assets/logo-pds.png";

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
      toast.error("Le lien n'a pas pu être envoyé. Vérifiez votre adresse e-mail.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Connexion à l'espace membre — Les Podcasteur·euses du Sud"
        description="Connectez-vous pour modifier votre profil, vos podcasts et suivre votre adhésion."
        path="/espace-membre"
        noindex
      />
      <header className="border-b border-encre">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8 min-h-[64px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-h-[44px]" aria-label="Retour à l'accueil des Podcasteur·euses du Sud">
            <img src={logoPds} alt="" className="w-10 h-10 object-cover" width="40" height="40" />
            <span className="font-bold text-[17px]">Espace membre</span>
          </Link>
          <Link to="/" className={`${linkUnderline} text-sm min-h-[44px] inline-flex items-center`}>Retour au site</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[520px] px-5 sm:px-8 py-14 sm:py-20">
        <h1 className="title-page text-[52px] sm:text-[72px]">Espace membre</h1>
        <p className="mt-4 text-lg">Modifiez votre profil, vos podcasts et suivez votre adhésion.</p>

        {sent ? (
          <div className="mt-10 bg-surface border border-filet p-6 space-y-3" role="status">
            <h2 className="title-section text-[28px]">Lien envoyé</h2>
            <p className="text-[15px]">
              Un lien de connexion a été envoyé à <strong className="break-all">{email}</strong>. Regardez votre boîte de réception, et vos courriers indésirables.
            </p>
            <button type="button" className={`${btnSecondary} mt-2`} onClick={() => setSent(false)}>
              Renvoyer le lien
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label htmlFor="login-email" className={labelCls}>Adresse e-mail</label>
              <input
                id="login-email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={field}
                required
              />
              <p className={hintCls}>Celle utilisée pour créer votre profil.</p>
            </div>
            <button type="submit" className={`${btnPrimary} w-full`} disabled={loading}>
              {loading ? "Envoi en cours…" : "Recevoir un lien de connexion"}
            </button>
          </form>
        )}

        <p className="mt-10 text-[15px]">
          Pas encore de profil ? <Link to="/adherer#inscription" className={linkUnderline}>Créer mon profil</Link>
        </p>
      </main>
    </div>
  );
};

export default EspaceMembre;
