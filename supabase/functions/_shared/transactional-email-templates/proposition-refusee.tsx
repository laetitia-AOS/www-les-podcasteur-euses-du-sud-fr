/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; titre?: string; motif?: string }

const PropositionRefusee = ({ prenom, titre, motif }: Props) => (
  <Layout preview={`Des nouvelles de votre proposition « ${titre || 'événement'} ».`} kicker="Agenda" titre={`Merci pour votre proposition${prenom ? `, ${prenom}` : ''}`}>
    <Text style={s.text}>
      Merci d'avoir pensé à l'agenda des Podcasteur·euses du Sud. Cette fois, l'équipe n'a pas pu publier
      votre proposition, mais l'envie d'organiser, elle, est précieuse : gardez-la !
    </Text>
    <Fiche>
      <Ligne label="Proposition">{titre || 'Votre événement'}</Ligne>
      {motif && <Ligne label="Le mot de l'équipe">{motif}</Ligne>}
    </Fiche>
    <Text style={s.text}>Vous pouvez proposer un nouveau rendez-vous quand vous le souhaitez, depuis votre espace membre.</Text>
    <Bouton href={`${SITE}/mon-espace#evenements`}>Ouvrir mon espace membre</Bouton>
  </Layout>
)

export const template = {
  component: PropositionRefusee,
  subject: 'Des nouvelles de votre proposition d\'événement',
  displayName: 'Proposition d\'événement non retenue',
  previewData: { prenom: 'Alix', titre: 'Atelier montage audio', motif: 'La date tombe le même soir que notre apéro écoute : on en reparle pour décembre ?' },
} satisfies TemplateEntry
