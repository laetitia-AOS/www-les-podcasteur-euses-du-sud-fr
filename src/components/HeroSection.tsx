import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecentProfile {
  id: string;
  slug: string | null;
  prenom: string | null;
  nom: string | null;
  type_profil: string;
  city_name: string | null;
  metier_principal: string | null;
  consent_mise_en_relation: boolean;
  vignette_url: string | null;
}

const avatarColors: Record<string, string> = {
  podcasteur: "bg-primary/15 text-primary",
  pro_podcast: "bg-bleu/15 text-bleu",
  studio: "bg-turquoise/15 text-turquoise",
  structure_eco: "bg-olive/15 text-olive",
  soutien: "bg-coral/15 text-terre",
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
          .select("id, slug, prenom, nom, type_profil, city_name, metier_principal, consent_mise_en_relation, vignette_url")
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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden" style={{ backgroundColor: "#F6F1E8" }}>
      <div className="relative z-10 container mx-auto px-6 max-w-6xl pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — Text */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Réseau pro · Région Sud PACA
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl leading-[1.1] mb-6"
            >
              <span className="font-display font-bold text-foreground">La scène podcast</span>
              <br />
              <span className="font-display font-bold text-foreground">du Sud,</span>
              <br />
              <span className="font-display font-bold italic text-primary">visible.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="text-base max-w-[400px] leading-relaxed mb-8 text-muted-foreground"
              style={{ lineHeight: 1.8 }}
            >
              Le réseau des podcasteur·euses et professionnel·les de l'audio en Région Sud. Trouvez, collaborez, créez.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4"
            >
              <button
                onClick={() => navigate("/annuaire-podcasts")}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-pill bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-all"
                style={{ boxShadow: "0 4px 14px rgba(184,92,56,0.2)" }}
              >
                Explorer l'annuaire
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/podcasts")}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover transition-colors underline underline-offset-4 decoration-primary/30 hover:decoration-primary"
              >
                Découvrir les podcasts
              </button>
            </motion.div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex items-center gap-4 mt-4"
            >
              <a
                href="https://www.instagram.com/lespodcasteusesdusud/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                Instagram
              </a>
              <span className="w-1 h-1 rounded-full bg-primary/20" />
              <a
                href="https://www.linkedin.com/company/les-podcasteur-euses-du-sud/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex items-center gap-8 sm:gap-10 text-sm pt-8 mt-8"
              style={{ borderTop: "1px solid rgba(184,92,56,0.15)" }}
            >
              {[
                { value: `${profileCount}+`, label: "CRÉATEURS" },
                { value: "6", label: "DÉPARTEMENTS" },
                { value: "∞", label: "FORMATS" },
                { value: "1", label: "ÉCOSYSTÈME" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-xl font-display font-bold text-primary">{stat.value}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Profiles */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex flex-col gap-3 relative"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider mb-1 text-muted-foreground/60">Profils récemment actifs</p>
            {recentProfiles.map((p, i) => {
              const colorClass = avatarColors[p.type_profil] || "bg-primary/15 text-primary";
              const initials = `${(p.prenom || "")[0] || ""}${(p.nom || "")[0] || ""}`.toUpperCase();
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/podcasteur/${p.slug || p.id}`)}
                  className={`w-full flex items-center gap-3 rounded-[14px] p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    i === 0 ? "border-primary/25" : "border-primary/10"
                  }`}
                  style={{
                    backgroundColor: "#FDFAF5",
                    border: `1px solid rgba(184,92,56,${i === 0 ? 0.25 : 0.1})`,
                    boxShadow: "0 2px 8px rgba(184,92,56,0.04)",
                  }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${colorClass}`}>
                    {p.vignette_url ? (
                      <img src={p.vignette_url} alt={`${p.prenom} ${p.nom}`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[p.type_profil] || p.type_profil}
                      {p.city_name && ` · ${p.city_name.replace(/\s+\d+(er?|e)?\s+Arrondissement$/i, "").replace(/\s+\d+$/, "")}`}
                    </p>
                  </div>
                  {p.consent_mise_en_relation && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(61,107,79,0.12)", color: "hsl(148 28% 40%)" }}>
                      ● Dispo
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Search bar sub-component rendered below hero
export const HeroSearchBar = () => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: "#EDE3D3", borderTop: "1px solid rgba(184,92,56,0.08)" }}>
      <div className="container mx-auto px-6 max-w-6xl py-6">
        <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "#FDFAF5", border: "1px solid rgba(184,92,56,0.15)" }}>
          <Search className="w-5 h-5 text-muted-foreground shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Chercher un monteur son à Marseille…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate("/annuaire-podcasts");
            }}
          />
          <button
            onClick={() => navigate("/annuaire-podcasts")}
            className="px-5 py-2.5 rounded-pill bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-all"
          >
            Rechercher
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {["Monteur·euse", "Studio Marseille", "Voix off", "Coach podcast", "Sound design"].map((tag) => (
            <button
              key={tag}
              onClick={() => navigate("/annuaire-podcasts")}
              className="px-3.5 py-1.5 rounded-pill text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground"
              style={{ border: "1px solid rgba(184,92,56,0.2)", color: "hsl(16 53% 47%)" }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
