/// <reference types="npm:@types/react@18.3.1" />
// La demande de devis complète arrive chez le studio. Le texte saisi passe uniquement par des props (échappées par React).
// « Répondre » dans la messagerie écrit directement à la personne (adresse de réponse fixée à l'envoi).
import * as React from 'npm:react@18.3.1'
import { Link, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, C, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props {
  studio?: string; nom?: string; email?: string; format?: string; periode?: string
  besoins?: string; departement?: string; description?: string; date?: string
}

const mailto = (email: string, studio?: string) =>
  `mailto:${email}?subject=${encodeURIComponent(`Votre demande de devis${studio ? ` — ${studio}` : ''}`)}`

const DevisRecu = ({ studio, nom, email, format, periode, besoins, departement, description, date }: Props) => (
  <Layout preview={`Nouvelle demande de devis${nom ? ` de ${nom}` : ''}${studio ? ` pour ${studio}` : ''}.`} kicker="Demande de devis" titre="Un projet frappe à la porte du studio !">
    <Text style={s.text}>
      {nom ? <span style={s.strong}>{nom}</span> : 'Une personne'} cherche un studio
      {studio ? <> et a pensé à <span style={s.strong}>{studio}</span></> : ''}. Voici sa demande, envoyée depuis le site de l'association.
    </Text>
    <Fiche>
      {nom && <Ligne label="De la part de">{nom}</Ligne>}
      {email && <Ligne label="E-mail"><Link href={`mailto:${email}`} style={{ color: C.bleu, textDecoration: 'underline' }}>{email}</Link></Ligne>}
      {besoins && <Ligne label="Besoins">{besoins}</Ligne>}
      {format && <Ligne label="Format">{format}</Ligne>}
      {periode && <Ligne label="Période">{periode}</Ligne>}
      {departement && <Ligne label="Département">{departement}</Ligne>}
      {date && <Ligne label="Reçue le">{date}</Ligne>}
    </Fiche>
    {description && (
      <>
        <Text style={s.label}>Le projet</Text>
        <Text style={{ ...s.quote, margin: '0 0 26px', padding: '0 0 0 16px', borderLeft: `3px solid ${C.bleu}` }}>{description}</Text>
      </>
    )}
    <Text style={s.text}>
      Pour lui répondre, il suffit de cliquer sur « Répondre » dans votre messagerie : votre réponse part directement à {nom || 'cette personne'}. Une réponse rapide fait toute la différence.
    </Text>
    {email ? <Bouton href={mailto(email, studio)}>Répondre {nom ? `à ${nom}` : 'à la demande'}</Bouton> : <Bouton href={`${SITE}/mon-espace#demandes`}>Voir la demande</Bouton>}
    <Text style={{ ...s.text, fontSize: '14px', margin: '22px 0 18px' }}>
      La demande est aussi gardée dans votre <Link href={`${SITE}/mon-espace#demandes`} style={{ color: C.bleu, textDecoration: 'underline' }}>espace membre</Link>.
    </Text>
  </Layout>
)

export const template = {
  component: DevisRecu,
  subject: (d: Record<string, any>) => `Nouvelle demande de devis${d.studio ? ` pour ${d.studio}` : ''}`,
  displayName: 'Demande de devis reçue',
  previewData: {
    studio: 'Studio Fictif', nom: 'Camille Exemple', email: 'camille@exemple.test', format: 'Podcast audio, 6 épisodes',
    periode: 'Janvier 2027', besoins: 'enregistrement audio, montage', departement: 'Bouches-du-Rhône (13)',
    description: "Bonjour, je prépare un podcast d'entretiens et je cherche un studio pour enregistrer à deux voix.\nPouvez-vous m'envoyer vos tarifs ?",
    date: '11 novembre 2026',
  },
} satisfies TemplateEntry
