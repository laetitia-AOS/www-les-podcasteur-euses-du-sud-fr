/// <reference types="npm:@types/react@18.3.1" />
// Bienvenue envoyée une seule fois par personne, à la création de sa fiche (sans cotisation).
import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { Layout } from './_layout.tsx'
import { ACCUEIL_APERCU, AccueilSections } from './_accueil.tsx'
import type { DonneesAccueil } from '../accueil-donnees.ts'

const BienvenueMembre = ({ accueil }: { accueil?: DonneesAccueil }) => {
  const d = accueil || ACCUEIL_APERCU
  return (
    <Layout
      preview="Le collectif, le groupe WhatsApp de ton département et ton message de présentation."
      kicker="Bienvenue"
      titre={`${d.prenom ? `${d.prenom}, b` : 'B'}ienvenue chez les Podcasteur·euses du Sud !`}
    >
      <AccueilSections d={d} />
    </Layout>
  )
}

export const template = {
  component: BienvenueMembre,
  subject: 'Bienvenue chez les Podcasteur·euses du Sud',
  displayName: 'Bienvenue (création de profil)',
  previewData: { accueil: ACCUEIL_APERCU },
} satisfies TemplateEntry
