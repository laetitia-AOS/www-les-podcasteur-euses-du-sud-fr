/// <reference types="npm:@types/react@18.3.1" />
// Notification seulement : aucun texte écrit par la personne qui envoie (le message se lit dans l'espace membre).
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; fiche?: string; date?: string }

const MessageRecu = ({ prenom, fiche, date }: Props) => (
  <Layout preview="Un nouveau message vous attend dans votre espace membre." kicker="Nouveau message" titre={`${prenom ? `${prenom}, q` : 'Q'}uelqu'un a pensé à vous !`}>
    <Text style={s.text}>
      Une personne vous a écrit depuis {fiche ? <>votre fiche « {fiche} »</> : 'votre fiche'} sur le site des Podcasteur·euses du Sud.
    </Text>
    <Fiche>
      <Ligne label="Type">Message</Ligne>
      {fiche && <Ligne label="Depuis la fiche">{fiche}</Ligne>}
      {date && <Ligne label="Reçu le">{date}</Ligne>}
    </Fiche>
    <Text style={s.text}>
      Le message, le nom de la personne et le bouton « Répondre » vous attendent dans votre espace membre.
      Par sécurité, nous ne recopions jamais le message dans cet e-mail.
    </Text>
    <Bouton href={`${SITE}/mon-espace#demandes`}>Lire le message</Bouton>
  </Layout>
)

export const template = {
  component: MessageRecu,
  subject: 'Vous avez reçu un nouveau message',
  displayName: 'Message reçu',
  previewData: { prenom: 'Alix', fiche: 'Un Pas Dehors', date: '29 octobre 2026' },
} satisfies TemplateEntry
