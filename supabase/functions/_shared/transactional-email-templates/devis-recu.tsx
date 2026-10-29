/// <reference types="npm:@types/react@18.3.1" />
// Notification seulement : besoins et département viennent de listes fixes ; le texte libre se lit dans l'espace membre.
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { studio?: string; besoins?: string; departement?: string; date?: string }

const DevisRecu = ({ studio, besoins, departement, date }: Props) => (
  <Layout preview={`Nouvelle demande de devis${studio ? ` pour ${studio}` : ''}.`} kicker="Demande de devis" titre="Un projet frappe à la porte du studio !">
    <Text style={s.text}>
      Une personne cherche un studio{studio ? <> et a pensé à <span style={s.strong}>{studio}</span></> : ''}. Voici ce dont elle a besoin :
    </Text>
    <Fiche>
      {besoins && <Ligne label="Besoins">{besoins}</Ligne>}
      {departement && <Ligne label="Département">{departement}</Ligne>}
      {date && <Ligne label="Reçue le">{date}</Ligne>}
    </Fiche>
    <Text style={s.text}>
      La description du projet, le format, la période et les coordonnées sont dans votre espace membre. Une réponse rapide fait toute la différence.
    </Text>
    <Bouton href={`${SITE}/mon-espace#demandes`}>Voir la demande</Bouton>
  </Layout>
)

export const template = {
  component: DevisRecu,
  subject: (d: Record<string, any>) => `Nouvelle demande de devis${d.studio ? ` pour ${d.studio}` : ''}`,
  displayName: 'Demande de devis reçue',
  previewData: { studio: 'Studio Fictif', besoins: 'Enregistrement, mixage', departement: 'Bouches-du-Rhône (13)', date: '29 octobre 2026' },
} satisfies TemplateEntry
