/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { studio?: string; expediteur?: string; besoins?: string; format?: string; periode?: string; departement?: string; extrait?: string }

const DevisRecu = ({ studio, expediteur, besoins, format, periode, departement, extrait }: Props) => (
  <Layout preview={`Nouvelle demande de devis${studio ? ` pour ${studio}` : ''}.`} kicker="Demande de devis" titre="Un projet frappe à la porte du studio !">
    <Text style={s.text}>
      <span style={s.strong}>{expediteur || 'Un·e porteur·euse de projet'}</span> cherche un studio{studio ? <> et a pensé à <span style={s.strong}>{studio}</span></> : ''}.
      Voici l'essentiel de sa demande :
    </Text>
    <Fiche>
      {besoins && <Ligne label="Besoins">{besoins}</Ligne>}
      {format && <Ligne label="Format">{format}</Ligne>}
      {periode && <Ligne label="Période">{periode}</Ligne>}
      {departement && <Ligne label="Département">{departement}</Ligne>}
      {extrait && <Text style={s.quote}>{extrait}</Text>}
    </Fiche>
    <Text style={s.text}>Les coordonnées et le détail complet sont dans votre espace membre. Une réponse rapide fait toute la différence.</Text>
    <Bouton href={`${SITE}/mon-espace#demandes`}>Voir la demande</Bouton>
  </Layout>
)

export const template = {
  component: DevisRecu,
  subject: (d: Record<string, any>) => `Nouvelle demande de devis${d.studio ? ` pour ${d.studio}` : ''}`,
  displayName: 'Demande de devis reçue',
  previewData: { studio: 'Studio Fictif', expediteur: 'Camille Martin', besoins: 'Enregistrement, mixage', format: 'Interview', periode: 'Janvier', departement: 'Bouches-du-Rhône', extrait: 'Six épisodes de 30 minutes, deux voix.' },
} satisfies TemplateEntry
