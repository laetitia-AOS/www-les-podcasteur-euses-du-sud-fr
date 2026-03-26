import { motion } from "framer-motion";
import { Search, Hand, ArrowRight, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileCount { count: number }

interface RecentProfile {
  id: string;
  slug: string | null;
  prenom: string | null;
  nom: string | null;
  type_profil: string;
  city_name: string | null;
  metier_principal: string | null;
  consent_mise_en_relation: boolean;
}

const avatarColors: Record<string, string> = {
  podcasteur: "bg-primary/20 text-primary",
  pro_podcast: "bg-lavande/20 text-lavande",
  studio: "bg-turquoise/20 text-turquoise",
  structure_eco: "bg-pin/20 text-pin",
  soutien: "bg-sable/20 text-terre",
};

const roleLabels: Record<string, string> = {
  podcasteur: "Podcasteur·euse",
  pro_podcast: "Pro écosystème",
  studio: "Studio",
  structure_eco: "Structure",
  soutien: "Soutien",
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [recentProfiles, setRecentProfiles] = useState<RecentProfile[]>([]);
  const [profileCount, setProfileCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("podcasts")
          .select("id, slug, prenom, nom, type_profil, city_name, metier_principal, consent_mise_en_relation")
          .eq("valide", true)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("podcasts")
          .select("*", { count: "exact", head: true })
          .eq("valide", true),
      ]);
      if (data) setRecentProfiles(data as RecentProfile[]);
      if (count !== null) setProfileCount(count);
    };
    fetchData();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: "hsl(40 20% 8%)" }}>
      <div className="relative z-10 container mx-auto px-6 max-w-6xl pt-20 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-8rem)]">
          {/* Left — Text */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border tracking-wide"
                style={{
                  background: "rgba(200,116,42,0.10)",
                  borderColor: "rgba(200,116,42,0.25)",
                  color: "hsl(33 40% 62%)",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Réseau pro · Région Sud PACA
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] leading-[1.08] mb-7 tracking-tight"
            >
              <span className="font-display font-extrabold text-white">Tu cherches.</span>
              <br />
              <span className="font-display font-extrabold text-white">Tu proposes.</span>
              <br />
              <span className="font-display font-extrabold text-sable">Tu crées.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-base max-w-[380px] leading-relaxed mb-10"
              style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}
            >
              Le réseau des podcasteur·euses et professionnel·les de l'audio en Région Sud. Trouvez, collaborez, créez.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 gap-3 max-w-md"
            >
              <button
                onClick={() => navigate("/annuaire-podcasts")}
                className="group flex flex-col items-start gap-2 bg-primary text-primary-foreground rounded-2xl p-5 hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
              >
                <Search className="w-5 h-5" />
                <span className="font-display font-bold text-sm">Je cherche un profil</span>
                <span className="text-xs opacity-70">Explorer l'annuaire</span>
              </button>
              <button
                onClick={() => navigate("/referencer-mon-podcast")}
                className="group flex flex-col items-start gap-2 rounded-2xl p-5 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Hand className="w-5 h-5 text-sable" />
                <span className="font-display font-bold text-sm text-white">Je veux être trouvé·e</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Créer mon profil</span>
              </button>
            </motion.div>
          </div>

          {/* Right — Profiles + Search */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex flex-col gap-5 relative"
          >
            {/* Radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full" style={{
              background: "radial-gradient(circle, rgba(200,116,42,0.06) 0%, transparent 70%)"
            }} />

            {/* Recent profiles */}
            <div className="relative space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Profils récents</p>
              {recentProfiles.map((p, i) => {
                const colorClass = avatarColors[p.type_profil] || "bg-primary/20 text-primary";
                const initials = `${(p.prenom || "")[0] || ""}${(p.nom || "")[0] || ""}`.toUpperCase();
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/podcasteur/${p.slug || p.id}`)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all hover:scale-[1.02] ${i === 0 ? "border border-primary/30" : ""}`}
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${colorClass}`}>
                      {initials}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.prenom} {p.nom}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {roleLabels[p.type_profil] || p.type_profil}
                        {p.city_name && ` · ${p.city_name.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "")}`}
                      </p>
                    </div>
                    {p.consent_mise_en_relation && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(61,107,79,0.2)", color: "hsl(148 28% 50%)" }}>
                        ● Dispo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search bar */}
            <div className="relative mt-4">
              <div className="flex items-center gap-3 bg-background-pure rounded-xl p-3 shadow-lg">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Chercher un monteur son à Marseille…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate("/annuaire-podcasts");
                  }}
                />
                <button
                  onClick={() => navigate("/annuaire-podcasts")}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all"
                >
                  Rechercher
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["Monteur·euse", "Studio Marseille", "Voix off", "Coach podcast"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate("/annuaire-podcasts")}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-primary/15"
                    style={{ background: "rgba(200,116,42,0.08)", color: "hsl(33 40% 62%)" }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex items-center gap-8 sm:gap-12 text-sm pt-8 mt-4"
          style={{ borderTop: "1px solid rgba(200,116,42,0.15)" }}
        >
          {[
            { value: "14+", label: "CRÉATEURS" },
            { value: "6", label: "DÉPARTEMENTS" },
            { value: "∞", label: "FORMATS" },
            { value: "1", label: "ÉCOSYSTÈME" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-2xl font-display font-extrabold text-primary">{stat.value}</span>
              <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
