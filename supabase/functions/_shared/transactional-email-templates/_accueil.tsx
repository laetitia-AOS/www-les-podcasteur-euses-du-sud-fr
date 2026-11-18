/// <reference types="npm:@types/react@18.3.1" />
// Contenu commun de l'e-mail de bienvenue (création de profil ou première cotisation), au « tu ».
// Le QR code est dessiné en tableau (aucune image à stocker ni à charger) ; le bouton reste le chemin principal.
import * as React from 'npm:react@18.3.1'
import { Link, Section, Text } from 'npm:@react-email/components@0.0.22'
import { Bouton, C, Fiche, SITE, s } from './_layout.tsx'
import { ATELIERS_RYTHME, CONTACT_ACCUEIL, INSTAGRAM_PDS, LINKEDIN_PDS, PHRASE_SOUTIEN, plagesQr } from '../accueil.ts'
import { matriceQr } from '../accueil-qr.ts'
import type { DonneesAccueil } from '../accueil-donnees.ts'

const MONO = '"IBM Plex Mono", "Courier New", Courier, monospace'
const SANS = 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
const h2 = { fontFamily: SANS, fontSize: '22px', fontWeight: 900 as const, color: C.encre, margin: '30px 0 12px', lineHeight: '1.15', textTransform: 'uppercase' as const }
const item = { ...s.text, margin: '0 0 10px' }
const lien = { color: C.bleu, textDecoration: 'underline' }

export const QrTableau = ({ lien: url, taille = 5 }: { lien: string; taille?: number }) => {
  let m: boolean[][] = []
  try { m = matriceQr(url) } catch { return null }
  const n = m.length
  // Cases blanches sans style (fond du tableau), seules les noires sont colorées : e-mail léger
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width={n * taille}
      style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: `${n * taille}px`, fontSize: '1px', lineHeight: '1px', backgroundColor: '#ffffff', border: `2px solid ${C.encre}` }}>
      <colgroup>{m[0].map((_, i) => <col key={i} width={taille} />)}</colgroup>
      <tbody>
        {plagesQr(m).map((r, y) => (
          <tr key={y} style={{ height: `${taille}px` }}>
            {r.map((p, i) => (p.noir
              ? <td key={i} colSpan={p.n} style={{ backgroundColor: C.encre }} />
              : <td key={i} colSpan={p.n} />))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const AccueilSections = ({ d, annee }: { d: DonneesAccueil; annee?: number | null }) => (
  <>
    <Text style={s.text}>
      Les Podcasteur·euses du Sud, c'est une association loi 1901 qui relie celles et ceux qui font le son dans toute
      la Région Sud. <span style={s.strong}>« Le podcast est l'outil, la création sonore est la matière. »</span>
    </Text>

    <Text style={h2}>Ce qui se passe dans le collectif</Text>
    <Text style={item}>— {ATELIERS_RYTHME.charAt(0).toUpperCase() + ATELIERS_RYTHME.slice(1)}.</Text>
    <Text style={item}>— L'Onde du Sud, la lettre du collectif, le 1er de chaque mois.</Text>

    <Text style={h2}>Ce que le collectif met à disposition de ses membres</Text>
    <Text style={{ ...s.text, margin: '0 0 12px' }}>Réservé aux membres, tant que l'association le propose :</Text>
    <Text style={item}>— L'annuaire et « Qui cherche quoi », pour se trouver entre membres.</Text>
    <Text style={item}>— Les dépôts dans L'Onde du Sud (avant le 25 de chaque mois).</Text>
    <Text style={item}>— Les propositions du moment, comme les passages radio avec Maritima ou les appels à création. Elles circulent dans le groupe et dans L'Onde.</Text>

    <Text style={h2}>Comment participer</Text>
    <Text style={item}><span style={s.strong}>1.</span> <Link href={`${SITE}/mon-espace#profil`} style={lien}>Complète ta fiche</Link> (photo, ce que tu cherches, ce que tu apportes).</Text>
    <Text style={item}><span style={s.strong}>2.</span> Rejoins le groupe WhatsApp de ton département (juste en dessous).</Text>
    <Text style={item}><span style={s.strong}>3.</span> Présente-toi dans le groupe : ton message est prêt plus bas.</Text>
    <Text style={item}>
      <span style={s.strong}>4.</span> Viens au prochain atelier d'écoute
      {d.atelier
        ? <> : <Link href={d.atelier.href} style={lien}>{d.atelier.date}</Link>{d.atelier.lieu ? `, ${d.atelier.lieu}` : ''}.</>
        : <> : les dates sont dans <Link href={`${SITE}/agenda`} style={lien}>l'agenda</Link>.</>}
    </Text>

    <Text style={h2}>Ton groupe WhatsApp</Text>
    {d.groupe ? (
      <Section style={{ margin: '0 0 8px' }}>
        <Text style={s.text}>Le groupe de ton département : <span style={s.strong}>{d.groupe.nom}</span>.</Text>
        <Bouton href={d.groupe.lien}>Rejoindre le groupe {d.groupe.nom}</Bouton>
        <Text style={{ ...s.label, margin: '20px 0 8px' }}>Ou scanne ce QR code avec ton téléphone</Text>
        <QrTableau lien={d.groupe.lien} />
      </Section>
    ) : (
      <Section style={{ margin: '0 0 8px' }}>
        <Text style={s.text}>
          On ne connaît pas encore ton département : <Link href={d.lienEspace} style={lien}>indique-le dans ton espace membre</Link>.
          En attendant, la règle : <span style={s.strong}>{d.regle}</span>.
        </Text>
        {d.groupes.map((g) => (
          <Section key={g.lien} style={{ margin: '0 0 12px' }}><Bouton href={g.lien}>Rejoindre le groupe {g.nom}</Bouton></Section>
        ))}
      </Section>
    )}
    <Text style={{ ...s.text, margin: '18px 0 0' }}>
      C'est fait ? <Link href={d.lienRejoint} style={lien}>Dis-nous que tu as rejoint le groupe</Link> : on ne te relancera pas.
    </Text>

    <Text style={h2}>Ton message de présentation</Text>
    <Text style={s.text}>Copie-le, complète ce qui est entre crochets, et envoie-le dans le groupe :</Text>
    <Fiche><Text style={s.quote}>{d.presentation}</Text></Fiche>

    <Text style={{ ...s.text, fontSize: '14px' }}>{PHRASE_SOUTIEN}</Text>
    <Text style={{ ...s.text, fontSize: '14px' }}>
      {annee ? <>Ton adhésion court jusqu'au 31 décembre {annee}. </> : null}
      Une question ? Écris-nous : <Link href={`mailto:${CONTACT_ACCUEIL}`} style={lien}>{CONTACT_ACCUEIL}</Link>.
      <br />
      <span style={{ fontFamily: MONO, fontSize: '12px' }}>
        <Link href={INSTAGRAM_PDS} style={lien}>Instagram</Link> · <Link href={LINKEDIN_PDS} style={lien}>LinkedIn</Link>
      </span>
    </Text>
  </>
)

/** Données fictives pour l'aperçu des modèles. */
export const ACCUEIL_APERCU: DonneesAccueil = {
  prenom: 'Alix',
  departement: '13',
  groupe: { nom: 'Les Podcasteur·euses du Sud', lien: 'https://chat.whatsapp.com/exempleexempleexemple' },
  groupes: [],
  regle: '06 ou Monaco → 06 podcasts ; ailleurs → Les Podcasteur·euses du Sud',
  presentation: 'Bonjour à toutes et à tous ! Je suis Alix, je fais un podcast à Marseille. Mon projet : Sons du quartier (https://exemple.fr). Je cherche : montage. Je peux apporter : voix off. Ravi·e de vous rejoindre !',
  atelier: { titre: "Atelier d'écoute à Marseille", date: 'mercredi 9 décembre, 18h30', lieu: 'Marseille centre-ville', href: `${SITE}/agenda` },
  lienRejoint: `${SITE}/bienvenue/rejoint?jeton=exemple`,
  lienEspace: `${SITE}/mon-espace#whatsapp`,
}
