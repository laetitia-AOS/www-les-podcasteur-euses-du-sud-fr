/// <reference types="npm:@types/react@18.3.1" />
// Question posée depuis une fiche studio : le message complet arrive chez le studio (props échappées par React).
// « Répondre » dans la messagerie écrit directement à la personne (adresse de réponse fixée à l'envoi).
import * as React from 'npm:react@18.3.1'
import { Link, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, C, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { studio?: string; nom?: string; email?: string; message?: string; date?: string }

const mailto = (email: string, studio?: string) =>
  `mailto:${email}?subject=${encodeURIComponent(`Votre question${studio ? ` — ${studio}` : ''}`)}`

const QuestionStudio = ({ studio, nom, email, message, date }: Props) => (
  <Layout preview={`${nom || 'Une personne'} vous pose une question${studio ? ` sur ${studio}` : ''}.`} kicker="Question au studio" titre="On a une question pour vous !">
    <Text style={s.text}>
      {nom ? <span style={s.strong}>{nom}</span> : 'Une personne'} vous a écrit depuis {studio ? <>la fiche <span style={s.strong}>{studio}</span></> : 'votre fiche'} sur le site des Podcasteur·euses du Sud.
    </Text>
    <Fiche>
      {nom && <Ligne label="De la part de">{nom}</Ligne>}
      {email && <Ligne label="E-mail"><Link href={`mailto:${email}`} style={{ color: C.bleu, textDecoration: 'underline' }}>{email}</Link></Ligne>}
      {date && <Ligne label="Reçue le">{date}</Ligne>}
    </Fiche>
    {message && (
      <>
        <Text style={s.label}>La question</Text>
        <Text style={{ ...s.quote, margin: '0 0 26px', padding: '0 0 0 16px', borderLeft: `3px solid ${C.bleu}` }}>{message}</Text>
      </>
    )}
    <Text style={s.text}>
      Pour répondre, cliquez sur « Répondre » dans votre messagerie : votre réponse part directement à {nom || 'cette personne'}.
    </Text>
    {email ? <Bouton href={mailto(email, studio)}>Répondre {nom ? `à ${nom}` : 'à la question'}</Bouton> : <Bouton href={`${SITE}/mon-espace#demandes`}>Voir la question</Bouton>}
    <Text style={{ ...s.text, fontSize: '14px', margin: '22px 0 18px' }}>
      La question est aussi gardée dans votre <Link href={`${SITE}/mon-espace#demandes`} style={{ color: C.bleu, textDecoration: 'underline' }}>espace membre</Link>.
    </Text>
  </Layout>
)

export const template = {
  component: QuestionStudio,
  subject: (d: Record<string, any>) => `Nouvelle question${d.studio ? ` pour ${d.studio}` : ''}`,
  displayName: 'Question posée à un studio',
  previewData: {
    studio: 'Studio Fictif', nom: 'Camille Exemple', email: 'camille@exemple.test', date: '11 novembre 2026',
    message: "Bonjour, est-ce que le studio est accessible le samedi ?\nEt peut-on venir à trois voix ?",
  },
} satisfies TemplateEntry
