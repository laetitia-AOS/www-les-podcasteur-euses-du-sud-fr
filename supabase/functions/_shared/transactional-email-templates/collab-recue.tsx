/// <reference types="npm:@types/react@18.3.1" />
// Notification seulement : aucun texte écrit par la personne qui envoie (la proposition se lit dans l'espace membre).
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; fiche?: string; date?: string }

const CollabRecue = ({ prenom, fiche, date }: Props) => (
  <Layout preview="Une proposition de collab vous attend dans votre espace membre." kicker="Proposition de collab" titre={`Une collab vous tend les bras${prenom ? `, ${prenom}` : ''} !`}>
    <Text style={s.text}>
      Bonne nouvelle : quelqu'un a lu {fiche ? <>votre fiche « {fiche} »</> : 'votre fiche'} et vous propose de travailler ensemble.
    </Text>
    <Fiche>
      <Ligne label="Type">Proposition de collab</Ligne>
      {fiche && <Ligne label="Depuis la fiche">{fiche}</Ligne>}
      {date && <Ligne label="Reçue le">{date}</Ligne>}
    </Fiche>
    <Text style={s.text}>
      Le détail de la proposition et le bouton « Répondre » sont dans votre espace membre.
      Par sécurité, nous ne recopions jamais le message dans cet e-mail.
    </Text>
    <Bouton href={`${SITE}/mon-espace#demandes`}>Voir la proposition</Bouton>
  </Layout>
)

export const template = {
  component: CollabRecue,
  subject: 'Une proposition de collab vous attend',
  displayName: 'Proposition de collab reçue',
  previewData: { prenom: 'Alix', fiche: 'Un Pas Dehors', date: '29 octobre 2026' },
} satisfies TemplateEntry
