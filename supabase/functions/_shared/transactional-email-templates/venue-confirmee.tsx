/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; titre?: string; date?: string; lieu?: string; slug?: string; enLigne?: boolean }

const VenueConfirmee = ({ prenom, titre, date, lieu, slug, enLigne }: Props) => (
  <Layout preview={`C'est noté, on vous garde une place${titre ? ` pour ${titre}` : ''}.`} kicker="Vous venez" titre={`${prenom ? `${prenom}, o` : 'O'}n a hâte de vous voir !`}>
    <Text style={s.text}>
      C'est noté : vous venez. Préparez vos oreilles, vos idées et quelques cartes de visite, la soirée
      s'annonce belle.
    </Text>
    <Fiche>
      <Ligne label="Rendez-vous">{titre || 'Événement'}</Ligne>
      {date && <Ligne label="Quand">{date}</Ligne>}
      <Ligne label="Où">{enLigne ? 'En ligne : le lien est sur la page de l\'événement' : lieu || 'Le lieu est indiqué sur la page de l\'événement'}</Ligne>
    </Fiche>
    <Text style={s.text}>Sur la page de l'événement, ajoutez-le à votre agenda en un clic.</Text>
    <Bouton href={slug ? `${SITE}/agenda/${slug}` : `${SITE}/agenda`}>Voir l'événement</Bouton>
  </Layout>
)

export const template = {
  component: VenueConfirmee,
  subject: (d: Record<string, any>) => `C'est noté : on vous attend${d.titre ? ` à « ${d.titre} »` : ''} !`,
  displayName: 'Venue confirmée (« Je viens »)',
  previewData: { prenom: 'Alix', titre: 'Apéro écoute chez CultureShock', date: 'lundi 9 novembre 2026, 18h30', lieu: 'CultureShock, Marseille', slug: 'atelier-ecoute-cultureshock-2026-11-09' },
} satisfies TemplateEntry
