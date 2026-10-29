/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; expediteur?: string; extrait?: string; fiche?: string }

const MessageRecu = ({ prenom, expediteur, extrait, fiche }: Props) => (
  <Layout preview={`${expediteur || "Quelqu'un"} vous a écrit depuis le site.`} kicker="Nouveau message" titre={`${prenom ? `${prenom}, q` : 'Q'}uelqu'un a pensé à vous !`}>
    <Text style={s.text}>
      <span style={s.strong}>{expediteur || 'Un·e visiteur·ice'}</span> vous a écrit depuis {fiche ? <>votre fiche « {fiche} »</> : 'votre fiche'} sur le site.
      Voici le début de son message :
    </Text>
    <Fiche><Text style={s.quote}>{extrait || '…'}</Text></Fiche>
    <Text style={s.text}>Le message complet et le bouton « Répondre » vous attendent dans votre espace membre.</Text>
    <Bouton href={`${SITE}/mon-espace#demandes`}>Lire et répondre</Bouton>
  </Layout>
)

export const template = {
  component: MessageRecu,
  subject: (d: Record<string, any>) => `${d.expediteur || "Quelqu'un"} vous a écrit`,
  displayName: 'Message reçu',
  previewData: { prenom: 'Alix', expediteur: 'Camille Martin', fiche: 'Un Pas Dehors', extrait: "Bonjour ! J'ai adoré votre dernier épisode et j'aimerais vous proposer…" },
} satisfies TemplateEntry
