/// <reference types="npm:@types/react@18.3.1" />
// Rapport du lundi pour l'équipe : fréquentation du site et activité de la semaine écoulée.
import * as React from 'npm:react@18.3.1'
import { Column, Row, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, C, Fiche, Layout, SITE, s } from './_layout.tsx'

export const DESTINATAIRE_RAPPORT = 'podcastsdusud@gmail.com'

interface Ligne { nom?: string; page?: string; n?: number; vues?: number; ecoutes?: number }
interface Props {
  debut?: string
  fin?: string
  comptage_depuis?: string | null
  visiteurs?: number
  visiteurs_avant?: number
  pages_vues?: number
  pages_vues_avant?: number
  provenances?: Ligne[]
  pages?: Ligne[]
  vues_fiches?: number
  vues_fiches_avant?: number
  ecoutes?: number
  ecoutes_avant?: number
  fiches?: Ligne[]
  messages?: number
  collabs?: number
  devis?: number
  demandes_avant?: number
  inscriptions?: number
  adhesions?: number
  nouvelles_fiches?: number
  propositions?: number
}

const MONO = '"IBM Plex Mono", "Courier New", Courier, monospace'
const SANS = 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'

const jour = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })
}

const PROVENANCES: Record<string, string> = {
  direct: 'Accès direct ou lien partagé',
  google: 'Google',
  bing: 'Bing',
  'autre-moteur': 'Autre moteur de recherche',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  x: 'X (Twitter)',
  'autre-site': 'Un autre site',
}

const RUBRIQUES: Record<string, string> = {
  '': 'Accueil',
  ecouter: 'Écouter',
  annuaire: 'Annuaire',
  studios: 'Studios',
  structures: 'Structures',
  agenda: 'Agenda',
  adherer: 'Adhérer',
  partenaires: 'Partenaires',
  contact: 'Contact',
  'proposer-evenement-podcast': 'Proposer un événement',
  'referencer-mon-podcast': 'Référencer mon podcast',
}

/** « /agenda/atelier-ecoute-2026 » → « Agenda · atelier ecoute 2026 ». */
export const nomPage = (page = '/') => {
  const [rubrique = '', ...reste] = page.replace(/^\//, '').split('/')
  const nom = RUBRIQUES[rubrique] ?? rubrique.replace(/-/g, ' ')
  const detail = reste.join(' ').replace(/-/g, ' ').trim()
  return detail ? `${nom} · ${detail}` : nom
}

/** « +12 % par rapport à la semaine d'avant », ou rien si la comparaison n'a pas de sens. */
export const evolution = (n = 0, avant = 0) => {
  if (!avant) return ''
  const p = Math.round(((n - avant) / avant) * 100)
  if (p === 0) return 'Comme la semaine d\'avant'
  return `${p > 0 ? '+' : ''}${p} % par rapport à la semaine d'avant (${avant})`
}

const Chiffre = ({ label, n = 0, avant }: { label: string; n?: number; avant?: number }) => (
  <Section style={{ borderBottom: `1px solid #DDDCD6`, padding: '12px 0' }}>
    <Row>
      <Column style={{ verticalAlign: 'top' }}>
        <Text style={{ ...s.label, margin: '0 0 2px' }}>{label}</Text>
        {avant !== undefined && evolution(n, avant) && (
          <Text style={{ fontFamily: SANS, fontSize: '13px', color: C.pale, margin: 0 }}>{evolution(n, avant)}</Text>
        )}
      </Column>
      <Column style={{ width: '90px', textAlign: 'right', verticalAlign: 'top' }}>
        <Text style={{ fontFamily: SANS, fontSize: '28px', fontWeight: 900, color: C.bleu, margin: 0, lineHeight: '1' }}>{n}</Text>
      </Column>
    </Row>
  </Section>
)

const Liste = ({ titre, lignes }: { titre: string; lignes: { nom: string; n: string }[] }) =>
  lignes.length === 0 ? null : (
    <>
      <Text style={{ ...s.label, color: C.bleu, margin: '26px 0 8px' }}>{titre}</Text>
      {lignes.map((l, i) => (
        <Row key={i}>
          <Column><Text style={{ fontFamily: SANS, fontSize: '15px', color: C.encre, margin: '0 0 6px' }}>{l.nom}</Text></Column>
          <Column style={{ width: '170px', textAlign: 'right' }}>
            <Text style={{ fontFamily: MONO, fontSize: '13px', color: C.gris, margin: '0 0 6px' }}>{l.n}</Text>
          </Column>
        </Row>
      ))}
    </>
  )

const RapportSemaine = (p: Props) => {
  const periode = p.debut && p.fin ? `du ${jour(p.debut)} au ${jour(p.fin)}` : 'de la semaine'
  const demandes = (p.messages || 0) + (p.collabs || 0) + (p.devis || 0)
  const comptageRecent = !!p.comptage_depuis && !!p.debut && p.comptage_depuis > p.debut
  const aucunComptage = !p.comptage_depuis
  return (
    <Layout preview={`${p.visiteurs || 0} visiteur·ices et ${demandes} demande${demandes > 1 ? 's' : ''} reçue${demandes > 1 ? 's' : ''} par les membres, ${periode}.`} kicker="Rapport de la semaine" titre={`La semaine ${periode}`}>
      <Text style={s.text}>Voici ce qui s'est passé sur le site la semaine dernière.</Text>
      {(aucunComptage || comptageRecent) && (
        <Fiche>
          <Text style={{ ...s.text, margin: 0 }}>
            {aucunComptage
              ? 'Le comptage des visites démarre dès la mise en ligne de la nouvelle version : les premiers chiffres arriveront dans le prochain rapport.'
              : `Le comptage des visites a commencé le ${jour(p.comptage_depuis)} : cette semaine n'est pas complète.`}
          </Text>
        </Fiche>
      )}

      <Text style={{ ...s.label, color: C.bleu, margin: '10px 0 0' }}>Fréquentation</Text>
      <Chiffre label="Visiteur·ices" n={p.visiteurs} avant={p.visiteurs_avant} />
      <Chiffre label="Pages vues" n={p.pages_vues} avant={p.pages_vues_avant} />
      <Chiffre label="Vues des fiches" n={p.vues_fiches} avant={p.vues_fiches_avant} />
      <Chiffre label="Écoutes lancées" n={p.ecoutes} avant={p.ecoutes_avant} />

      <Liste titre="D'où viennent les visiteur·ices" lignes={(p.provenances || []).map((l) => ({ nom: PROVENANCES[l.nom || ''] || 'Autre', n: `${l.n}` }))} />
      <Liste titre="Pages les plus vues" lignes={(p.pages || []).map((l) => ({ nom: nomPage(l.page), n: `${l.n} vue${(l.n || 0) > 1 ? 's' : ''}` }))} />
      <Liste titre="Fiches les plus regardées" lignes={(p.fiches || []).map((l) => ({ nom: l.nom || 'Sans titre', n: `${l.vues} vue${(l.vues || 0) > 1 ? 's' : ''}${l.ecoutes ? ` · ${l.ecoutes} écoute${l.ecoutes > 1 ? 's' : ''}` : ''}` }))} />

      <Text style={{ ...s.label, color: C.bleu, margin: '30px 0 0' }}>Mises en relation</Text>
      <Chiffre label="Demandes reçues par les membres" n={demandes} avant={p.demandes_avant} />
      <Liste titre="Dans le détail" lignes={[
        { nom: 'Messages', n: `${p.messages || 0}` },
        { nom: 'Propositions de collab', n: `${p.collabs || 0}` },
        { nom: 'Demandes de devis studio', n: `${p.devis || 0}` },
      ]} />

      <Text style={{ ...s.label, color: C.bleu, margin: '30px 0 0' }}>Vie de l'association</Text>
      <Chiffre label="Nouvelles adhésions" n={p.adhesions} />
      <Chiffre label="Nouvelles fiches dans l'annuaire" n={p.nouvelles_fiches} />
      <Chiffre label="Inscriptions aux événements" n={p.inscriptions} />
      <Chiffre label="Événements proposés par les membres" n={p.propositions} />

      <Text style={{ ...s.text, margin: '26px 0 18px' }}>
        Une personne qui revient plusieurs jours compte une fois par jour. Les robots et les pages de l'administration ne sont pas comptés.
      </Text>
      <Bouton href={`${SITE}/admin`}>Ouvrir l'administration</Bouton>
    </Layout>
  )
}

export const template = {
  component: RapportSemaine,
  subject: (d: Record<string, any>) => `Le site cette semaine : ${d.visiteurs || 0} visiteur·ices, ${(d.messages || 0) + (d.collabs || 0) + (d.devis || 0)} demandes`,
  displayName: 'Rapport de la semaine (équipe)',
  to: DESTINATAIRE_RAPPORT,
  previewData: {
    debut: '2026-11-02', fin: '2026-11-08', comptage_depuis: '2026-10-29',
    visiteurs: 312, visiteurs_avant: 260, pages_vues: 1104, pages_vues_avant: 980,
    provenances: [{ nom: 'google', n: 140 }, { nom: 'direct', n: 92 }, { nom: 'linkedin', n: 48 }, { nom: 'instagram', n: 32 }],
    pages: [{ page: '/', n: 380 }, { page: '/annuaire', n: 190 }, { page: '/agenda/atelier-ecoute-cultureshock-2026-11-09', n: 120 }],
    vues_fiches: 210, vues_fiches_avant: 150, ecoutes: 34, ecoutes_avant: 20,
    fiches: [{ nom: 'Parla Studio Marseille', vues: 32, ecoutes: 0 }, { nom: "Chroniques d'Insectopia", vues: 21, ecoutes: 9 }],
    messages: 3, collabs: 2, devis: 1, demandes_avant: 4, inscriptions: 12, adhesions: 4, nouvelles_fiches: 2, propositions: 1,
  },
} satisfies TemplateEntry
