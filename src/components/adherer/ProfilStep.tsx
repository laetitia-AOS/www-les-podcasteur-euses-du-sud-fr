import { useState } from "react";
import { messageServeur } from "@/lib/inscription";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CityAutocomplete from "@/components/CityAutocomplete";
import StudioFormSection from "@/components/StudioFormSection";
import StructureEcoFormSection from "@/components/StructureEcoFormSection";
import { btnPrimary } from "@/lib/pds";
import {
  COLLAB_CHOIX, COLLAB_CHOIX_APPORTE, DEPARTEMENTS, DISPONIBILITES, LIEN_SANS_PODCAST, SERVICES, TYPES_PROFIL,
  isHttpsUrl, profilColumns, uploadImage, type ProfilData, type TypeProfil,
} from "@/lib/inscription";
import { ChoiceList, CollabField, ImagePicker, Req, field, hintCls, labelCls } from "./fields";

export type ProfilResult = { type: TypeProfil; email: string; saved: boolean; profil?: ProfilData };

const emptyProfil = (type: TypeProfil): ProfilData => ({
  typeProfil: type, prenom: "", nom: "", email: "", telephone: "", bio750: "", lienLinkedin: "", lienPrincipal: "",
  metierPrincipal: "", services: [], disponibilite: "", departementCode: "", city: null, cherche: [], apporte: [], cherchePrecision: "", apportePrecision: "",
  formatCollaboration: "", consentContact: false, consentMiseEnRelation: false, photoUrl: "",
});

/**
 * Étape 1 de l'inscription : la fiche annuaire, obligatoire pour tout le monde,
 * avec photo de profil. Studios et structures gardent leur formulaire détaillé.
 */
const ProfilStep = ({
  initialType,
  onDone,
  onTypeChange,
}: {
  initialType: TypeProfil;
  onDone: (r: ProfilResult) => void;
  onTypeChange?: (t: TypeProfil) => void;
}) => {
  const [p, setP] = useState<ProfilData>(() => emptyProfil(initialType));
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [consentCGU, setConsentCGU] = useState(false);
  const [consentAnnuaire, setConsentAnnuaire] = useState(false);
  const [cityError, setCityError] = useState("");
  const [sending, setSending] = useState(false);

  const set = <K extends keyof ProfilData>(k: K, v: ProfilData[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const onInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(e.target.name as keyof ProfilData, e.target.value as never);

  const type = p.typeProfil;
  const isPodcasteur = type === "podcasteur";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fail = (m: string) => { toast.error(m); return; };
    if (!p.prenom.trim() || !p.nom.trim() || !p.email.trim()) return fail("Indiquez votre prénom, votre nom et votre e-mail.");
    if (!photo) return fail("Ajoutez une photo de profil : elle apparaît dans l'annuaire.");
    if (p.bio750.trim().length < 10) return fail("Présentez-vous en quelques lignes (10 caractères minimum).");
    if (p.lienLinkedin && !isHttpsUrl(p.lienLinkedin)) return fail("Le lien du réseau social doit commencer par https://");
    if (p.lienPrincipal && !isHttpsUrl(p.lienPrincipal)) return fail("Le lien du site doit commencer par https://");
    if (type === "pro_podcast" && !p.metierPrincipal) return fail("Choisissez votre métier principal.");
    if (!p.departementCode) return fail("Choisissez votre département.");
    if (!p.city?.city_insee_code) { setCityError("Choisissez une ville dans la liste."); return fail("Choisissez une ville dans la liste."); }
    if (!consentCGU) return fail("Acceptez les conditions d'utilisation et la politique de confidentialité.");
    if (!consentAnnuaire) return fail("Acceptez d'apparaître dans l'annuaire.");
    if (!p.consentContact) return fail("Acceptez d'être contacté·e par l'association.");

    setSending(true);
    let photoUrl = "";
    try {
      photoUrl = await uploadImage(photo.file, p.email);
    } catch (err) {
      console.error(err);
      setSending(false);
      return fail(messageServeur(err as { code?: string; message?: string }, "La photo n'a pas pu être envoyée. Réessayez."));
    }
    const profil = { ...p, photoUrl };

    // Le profil est enregistré tout de suite, pour tout le monde : une personne qui s'arrête
    // avant l'étape « Mes podcasts » ne perd rien. Ses podcasts, ajoutés ensuite, remplacent
    // cette fiche provisoire (déclencheur `remplacer_profil_provisoire`).
    const { error } = await supabase.from("podcasts").insert({
      ...profilColumns(profil),
      nom_podcast: "—",
      lien_ecoute: LIEN_SANS_PODCAST,
      description: profil.bio750.trim(),
      // La photo de profil n'est pas une pochette : pas de vignette pour un·e podcasteur·euse sans podcast
      vignette_url: isPodcasteur ? null : photoUrl,
      metier_principal: type === "pro_podcast" ? profil.metierPrincipal : null,
      services_3: type === "pro_podcast" ? profil.services : null,
      disponibilite: type === "pro_podcast" ? profil.disponibilite || null : null,
      besoins_podcast: ["non_specifie"],
      besoin: "non_specifié",
    });
    setSending(false);
    if (error) { console.error(error); return fail(messageServeur(error, "L'enregistrement n'a pas abouti. Réessayez.")); }
    onDone({ type, email: profil.email.trim(), saved: true, profil });
  };

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-bold mb-2">Vous êtes<Req /></legend>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {TYPES_PROFIL.map((t) => (
            <label
              key={t.value}
              className={`flex items-start gap-3 p-3 border-2 cursor-pointer ${type === t.value ? "border-primary bg-surface" : "border-filet bg-surface hover:border-encre"}`}
            >
              <input
                type="radio"
                name="typeProfil"
                value={t.value}
                checked={type === t.value}
                onChange={() => { set("typeProfil", t.value); onTypeChange?.(t.value); }}
                className="mt-1 h-4 w-4 accent-primary shrink-0"
              />
              <span>
                <span className="block font-bold text-[15px] leading-tight">{t.label}</span>
                <span className="block text-sm text-muted-foreground mt-0.5">{t.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === "studio" && (
        <div className="mt-8">
          <StudioFormSection onSubmitted={(email) => onDone({ type, email, saved: true })} />
        </div>
      )}
      {type === "structure_eco" && (
        <div className="mt-8">
          <StructureEcoFormSection onSubmitted={(email) => onDone({ type, email, saved: true })} />
        </div>
      )}

      {type !== "studio" && type !== "structure_eco" && (
        <form onSubmit={submit} className="mt-8 grid sm:grid-cols-2 gap-x-4 gap-y-5" noValidate>
          <div>
            <label htmlFor="pf-prenom" className={labelCls}>Prénom<Req /></label>
            <input id="pf-prenom" name="prenom" value={p.prenom} onChange={onInput} autoComplete="given-name" className={field} required />
          </div>
          <div>
            <label htmlFor="pf-nom" className={labelCls}>Nom<Req /></label>
            <input id="pf-nom" name="nom" value={p.nom} onChange={onInput} autoComplete="family-name" className={field} required />
          </div>
          <div>
            <label htmlFor="pf-email" className={labelCls}>E-mail<Req /></label>
            <input id="pf-email" type="email" name="email" value={p.email} onChange={onInput} autoComplete="email" className={field} required />
            <p className={hintCls}>Utilisez la même adresse pour l'adhésion : c'est elle qui active votre visibilité.</p>
          </div>
          <div>
            <label htmlFor="pf-tel" className={labelCls}>Téléphone</label>
            <input id="pf-tel" type="tel" name="telephone" value={p.telephone} onChange={onInput} autoComplete="tel" className={field} />
            <p className={hintCls}>Jamais affiché sur le site.</p>
          </div>

          <div className="sm:col-span-2">
            <ImagePicker
              id="pf-photo"
              label="Photo de profil"
              hint="Une photo de vous, pas la pochette d'un podcast. JPG, PNG ou WebP, 5 Mo maximum, recadrée au carré."
              preview={photo?.preview || null}
              onPick={(file, preview) => setPhoto({ file, preview })}
              onClear={() => setPhoto(null)}
              round
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="pf-bio" className={labelCls}>Présentation<Req /></label>
            <textarea
              id="pf-bio"
              name="bio750"
              rows={5}
              value={p.bio750}
              onChange={(e) => e.target.value.length <= 750 && onInput(e)}
              className={`${field} py-2 resize-y`}
              placeholder="Qui vous êtes, votre lien avec le podcast, ce que vous faites et ce que vous cherchez aujourd'hui."
              required
            />
            <p className={`${hintCls} font-mono text-right`}>{p.bio750.length}/750</p>
          </div>
          <div>
            <label htmlFor="pf-linkedin" className={labelCls}>LinkedIn ou réseau social</label>
            <input id="pf-linkedin" name="lienLinkedin" value={p.lienLinkedin} onChange={onInput} className={field} placeholder="https://" />
          </div>
          <div>
            <label htmlFor="pf-site" className={labelCls}>Site ou portfolio</label>
            <input id="pf-site" name="lienPrincipal" value={p.lienPrincipal} onChange={onInput} className={field} placeholder="https://" />
          </div>

          {type === "pro_podcast" && (
            <>
              <div>
                <label htmlFor="pf-metier" className={labelCls}>Métier principal<Req /></label>
                <select id="pf-metier" name="metierPrincipal" value={p.metierPrincipal} onChange={onInput} className={field} required>
                  <option value="">Choisir</option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pf-dispo" className={labelCls}>Disponibilité</label>
                <select id="pf-dispo" name="disponibilite" value={p.disponibilite} onChange={onInput} className={field}>
                  <option value="">Choisir</option>
                  {DISPONIBILITES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <ChoiceList legend="Services proposés" options={SERVICES} selected={p.services} onChange={(v) => set("services", v)} max={5} />
              </div>
            </>
          )}

          <div>
            <label htmlFor="pf-dept" className={labelCls}>Département<Req /></label>
            <select
              id="pf-dept"
              name="departementCode"
              value={p.departementCode}
              onChange={(e) => { setP((prev) => ({ ...prev, departementCode: e.target.value, city: null })); setCityError(""); }}
              className={field}
              required
            >
              <option value="">Choisir</option>
              {DEPARTEMENTS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
            </select>
          </div>
          <div>
            {p.departementCode ? (
              <CityAutocomplete
                departmentCode={p.departementCode}
                value={p.city}
                onChange={(city) => { set("city", city); setCityError(""); }}
                inputClass={field}
                labelClass={labelCls}
                required
                error={cityError}
              />
            ) : (
              <>
                <p className={labelCls}>Ville<Req /></p>
                <p className="min-h-[48px] flex items-center text-sm text-muted-foreground">Choisissez d'abord un département.</p>
              </>
            )}
          </div>

          <div className="sm:col-span-2 border-t border-filet pt-5">
            <CollabField replieMobile id="pf-cherche-precision" legend="Je cherche" options={COLLAB_CHOIX} selected={p.cherche} onChange={(v) => set("cherche", v)}
              precision={p.cherchePrecision} onPrecision={(v) => set("cherchePrecision", v)} />
          </div>
          <div className="sm:col-span-2">
            <CollabField replieMobile id="pf-apporte-precision" legend="J'apporte" options={COLLAB_CHOIX_APPORTE} selected={p.apporte} onChange={(v) => set("apporte", v)}
              precision={p.apportePrecision} onPrecision={(v) => set("apportePrecision", v)} />
          </div>

          <fieldset className="sm:col-span-2 border-t border-filet pt-5 space-y-3">
            <legend className="text-sm font-bold pr-2">Consentements</legend>
            <Check checked={consentCGU} onChange={setConsentCGU} required>
              J'accepte les <Link to="/conditions-utilisation" target="_blank" className="underline underline-offset-2">conditions d'utilisation</Link> et la{" "}
              <Link to="/politique-de-confidentialite" target="_blank" className="underline underline-offset-2">politique de confidentialité</Link>
            </Check>
            <Check checked={consentAnnuaire} onChange={setConsentAnnuaire} required>J'accepte d'apparaître dans l'annuaire des Podcasteur·euses du Sud</Check>
            <Check checked={p.consentContact} onChange={(v) => set("consentContact", v)} required>J'accepte d'être contacté·e par l'association</Check>
            <Check checked={p.consentMiseEnRelation} onChange={(v) => set("consentMiseEnRelation", v)}>J'accepte d'être mis·e en relation avec d'autres membres</Check>
          </fieldset>

          <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted-foreground">Votre profil est relu par l'équipe avant d'être publié.</p>
            <button type="submit" disabled={sending} className={`${btnPrimary} px-8`}>
              {sending ? "Envoi en cours…" : isPodcasteur ? "Continuer : mes podcasts" : "Enregistrer et continuer vers l'adhésion"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export const Check = ({ checked, onChange, required, children }: { checked: boolean; onChange: (v: boolean) => void; required?: boolean; children: React.ReactNode }) => (
  <label className="flex items-start gap-3 cursor-pointer text-[15px]">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-primary shrink-0" />
    <span>{children}{required && <Req />}</span>
  </label>
);

export default ProfilStep;
