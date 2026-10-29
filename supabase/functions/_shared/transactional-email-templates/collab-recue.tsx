/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; expediteur?: string; extrait?: string }

const CollabRecue = ({ prenom, expediteur, extrait }: Props) => (
  <Layout preview={`${expediteur || "Quelqu'un"} vous propose une collab.`} kicker="Proposition de collab" titre={`Une collab vous tend les bras${prenom ? `, ${prenom}` : ''} !`}>
    <Text style={s.text}>
      Bonne nouvelle : <span style={s.strong}>{expediteur || 'un·e membre du réseau'}</span> a lu votre fiche et a envie
      de faire quelque chose avec vous. Voici son idée :
    </Text>
    <Fiche><Text style={s.quote}>{extrait || '…'}</Text></Fiche>
    <Text style={s.text}>Prenez le temps de lire la proposition en entier, puis répondez directement depuis votre espace membre.</Text>
    <Bouton href={`${SITE}/mon-espace#demandes`}>Découvrir la proposition</Bouton>
  </Layout>
)

export const template = {
  component: CollabRecue,
  subject: (d: Record<string, any>) => `${d.expediteur || "Quelqu'un"} vous propose une collab`,
  displayName: 'Proposition de collab reçue',
  previewData: { prenom: 'Alix', expediteur: 'Sam Durand', extrait: "Je monte une série sur les quartiers nord et je cherche une voix…" },
} satisfies TemplateEntry
