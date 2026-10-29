/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; titre?: string; date?: string; slug?: string }

const PropositionPubliee = ({ prenom, titre, date, slug }: Props) => (
  <Layout preview={`${titre || 'Votre événement'} est publié dans l'agenda.`} kicker="Agenda" titre={`Votre événement est en ligne${prenom ? `, ${prenom}` : ''} !`}>
    <Text style={s.text}>
      L'équipe a relu votre proposition et elle a toute sa place dans l'agenda. Bravo, et merci de faire
      vivre la scène audio du Sud !
    </Text>
    <Fiche>
      <Ligne label="Événement">{titre || 'Votre événement'}</Ligne>
      {date && <Ligne label="Quand">{date}</Ligne>}
    </Fiche>
    <Text style={s.text}>
      Partagez la page autour de vous : chaque « Je viens » s'affiche sur la page, et vous retrouvez la liste
      des personnes inscrites dans votre espace membre.
    </Text>
    <Bouton href={slug ? `${SITE}/agenda/${slug}` : `${SITE}/agenda`}>Voir la page de l'événement</Bouton>
  </Layout>
)

export const template = {
  component: PropositionPubliee,
  subject: (d: Record<string, any>) => `C'est en ligne : « ${d.titre || 'votre événement'} »`,
  displayName: 'Proposition d\'événement publiée',
  previewData: { prenom: 'Alix', titre: 'Atelier montage audio', date: 'samedi 21 novembre 2026, 14h', slug: 'atelier-montage' },
} satisfies TemplateEntry
