import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CityAutocomplete, { type CityResult } from "@/components/CityAutocomplete";
import { ChoiceList, ImagePicker, field, hintCls, labelCls } from "@/components/adherer/fields";
import { APPORTE_OPTIONS, CHERCHE_OPTIONS, DEPARTEMENTS, DISPONIBILITES, SERVICES, uploadImage } from "@/lib/inscription";
import { roleLabel } from "@/lib/espaceMembre";
import { btnPrimary, formatName } from "@/lib/pds";
import { cardCls, sectionTitle, type FicheMembre } from "./types";

type Props = {
  profil: FicheMembre;
  fiches: FicheMembre[];
  onSaved: (patch: Partial<FicheMembre>, ownPatch: Partial<FicheMembre>) => void;
};

const ProfilCard = ({ profil, fiches, onSaved }: Props) => {
  const isPro = profil.type_profil === "pro_podcast";
  const initialPhoto = profil.photo_profil_url || (profil.type_profil !== "podcasteur" ? profil.vignette_url : null);

  const [prenom, setPrenom] = useState(formatName(profil.prenom));
  const [nom, setNom] = useState(formatName(profil.nom));
  const [telephone, setTelephone] = useState(profil.telephone || "");
  const [bio, setBio] = useState(profil.bio_750 || "");
  const [linkedin, setLinkedin] = useState(profil.lien_linkedin || "");
  const [site, setSite] = useState(profil.lien_principal || "");
  const [dept, setDept] = useState(profil.department_code || "");
  const [city, setCity] = useState<CityResult | null>(
    profil.city_name ? { city_name: profil.city_name, city_insee_code: profil.city_insee_code || "", city_postcode: profil.city_postcode || "" } : null,
  );
  const [cherche, setCherche] = useState<string[]>(profil.cherche_collaboration || []);
  const [apporte, setApporte] = useState<string[]>(profil.peut_apporter || []);
  const [metier, setMetier] = useState(profil.metier_principal || "");
  const [services, setServices] = useState<string[]>(profil.services_3 || []);
  const [dispo, setDispo] = useState(profil.disponibilite || "");
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const dispoOptions = dispo && !DISPONIBILITES.includes(dispo) ? [dispo, ...DISPONIBILITES] : DISPONIBILITES;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim() || !nom.trim()) { toast.error("Indiquez votre prénom et votre nom."); return; }
    if (dept && !city?.city_name) { toast.error("Choisissez une ville dans la liste."); return; }
    setSaving(true);
    try {
      let photoUrl = photo;
      if (photoFile) photoUrl = await uploadImage(photoFile);
      const deptInfo = DEPARTEMENTS.find((d) => d.code === dept);
      // Infos de profil : identiques sur toutes les fiches de la personne.
      const commun: Partial<FicheMembre> = {
        prenom: formatName(prenom),
        nom: formatName(nom),
        telephone: telephone.trim() || null,
        bio_750: bio.trim() || null,
        lien_linkedin: linkedin.trim() || null,
        lien_principal: site.trim() || null,
        photo_profil_url: photoUrl || null,
        cherche_collaboration: cherche.length ? cherche : null,
        peut_apporter: apporte.length ? apporte : null,
        department_code: dept || null,
        department_label: deptInfo?.label || null,
        city_name: city?.city_name || null,
        city_insee_code: city?.city_insee_code || null,
        city_postcode: city?.city_postcode || null,
        ville: city ? `${city.city_name}, ${deptInfo?.label || dept}` : null,
      };
      const { error } = await supabase.from("podcasts").update(commun).in("id", fiches.map((f) => f.id));
      if (error) throw error;
      let own: Partial<FicheMembre> = {};
      if (isPro) {
        own = { metier_principal: metier || null, services_3: services.length ? services : null, disponibilite: dispo || null };
        const { error: e2 } = await supabase.from("podcasts").update(own).eq("id", profil.id);
        if (e2) throw e2;
      }
      setPrenom(commun.prenom || "");
      setNom(commun.nom || "");
      setPhoto(photoUrl);
      setPhotoFile(null);
      onSaved(commun, own);
      toast.success("Profil enregistré.");
    } catch (err) {
      console.error(err);
      toast.error("L'enregistrement n'a pas abouti. Réessayez dans un instant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={`${cardCls} space-y-6`} aria-labelledby="mon-profil-title" noValidate>
      <h2 id="mon-profil-title" className={sectionTitle}>Mon profil</h2>

      <ImagePicker
        id="em-photo"
        label="Photo de profil"
        hint="Une photo de vous, affichée dans l'annuaire. JPG, PNG ou WebP, 5 Mo maximum."
        preview={photo}
        round
        onPick={(file, url) => { setPhotoFile(file); setPhoto(url); }}
        onClear={() => { setPhotoFile(null); setPhoto(null); }}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="em-prenom" className={labelCls}>Prénom</label>
          <input id="em-prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} onBlur={() => setPrenom(formatName(prenom))} className={field} autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="em-nom" className={labelCls}>Nom</label>
          <input id="em-nom" value={nom} onChange={(e) => setNom(e.target.value)} onBlur={() => setNom(formatName(nom))} className={field} autoComplete="family-name" />
        </div>
        <div>
          <p className={labelCls}>Rôle affiché</p>
          <p className="min-h-[48px] px-3 flex items-center border-2 border-filet bg-background text-[16px]">{roleLabel(profil.type_profil)}</p>
          <p className={hintCls}>Pour changer de rôle, écrivez à l'équipe.</p>
        </div>
        <div>
          <label htmlFor="em-tel" className={labelCls}>Téléphone</label>
          <input id="em-tel" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className={field} autoComplete="tel" placeholder="06 00 00 00 00" />
        </div>
        <div>
          <label htmlFor="em-dept" className={labelCls}>Département</label>
          <select id="em-dept" value={dept} onChange={(e) => { setDept(e.target.value); setCity(null); }} className={field}>
            <option value="">Choisir</option>
            {DEPARTEMENTS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
          </select>
        </div>
        <div>
          {dept ? (
            <CityAutocomplete departmentCode={dept} value={city} onChange={setCity} inputClass={field} labelClass={labelCls} />
          ) : (
            <>
              <p className={labelCls}>Ville</p>
              <p className="min-h-[48px] flex items-center text-sm text-muted-foreground">Choisissez d'abord un département.</p>
            </>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="em-bio" className={labelCls}>Présentation</label>
        <textarea id="em-bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 750))} rows={5} className={`${field} py-2`} />
        <p className={`${hintCls} text-right font-mono`}>{bio.length}/750</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="em-linkedin" className={labelCls}>LinkedIn ou réseau social</label>
          <input id="em-linkedin" type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={field} placeholder="https://linkedin.com/in/…" />
        </div>
        <div>
          <label htmlFor="em-site" className={labelCls}>Site internet ou portfolio</label>
          <input id="em-site" type="url" value={site} onChange={(e) => setSite(e.target.value)} className={field} placeholder="https://…" />
        </div>
      </div>

      {isPro && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="em-metier" className={labelCls}>Métier principal</label>
              <select id="em-metier" value={metier} onChange={(e) => setMetier(e.target.value)} className={field}>
                <option value="">Choisir</option>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="em-dispo" className={labelCls}>Disponibilité</label>
              <select id="em-dispo" value={dispo} onChange={(e) => setDispo(e.target.value)} className={field}>
                <option value="">Choisir</option>
                {dispoOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <ChoiceList legend="Services proposés" options={SERVICES} selected={services} onChange={setServices} max={5} />
        </div>
      )}

      <div className="grid gap-6">
        <div className="[&_legend]:text-primary">
          <ChoiceList legend="Je cherche" options={CHERCHE_OPTIONS} selected={cherche} onChange={setCherche} max={3} />
        </div>
        <div className="[&_legend]:text-accent-text">
          <ChoiceList legend="J'apporte" options={APPORTE_OPTIONS} selected={apporte} onChange={setApporte} max={3} />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Votre e-mail et votre téléphone ne sont jamais affichés. Les visiteurs vous écrivent via un formulaire.
      </p>

      <button type="submit" className={btnPrimary} disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
};

export default ProfilCard;
