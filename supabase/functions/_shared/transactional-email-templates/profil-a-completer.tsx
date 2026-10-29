/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, C, Layout, SITE, s } from './_layout.tsx'

interface Props {
  prenom?: string
  manques?: string[]
  podcastsSansPochette?: string[]
  podcastsSansRss?: string[]
}

const liste = (noms?: string[]) => (noms && noms.length ? ` (${noms.join(', ')})` : '')

const Point = ({ n, titre, children }: { n: number; titre: string; children: React.ReactNode }) => (
  <Section style={{ borderLeft: `6px solid ${C.orange}`, backgroundColor: C.fond, padding: '16px 20px', margin: '0 0 12px' }}>
    <Text style={{ ...s.label, color: C.bleu }}>{String(n).padStart(2, '0')}</Text>
    <Text style={{ ...s.value, margin: '0 0 6px' }}>{titre}</Text>
    <Text style={{ ...s.text, fontSize: '15px', margin: 0 }}>{children}</Text>
  </Section>
)

const ProfilACompleter = ({ prenom, manques = [], podcastsSansPochette, podcastsSansRss }: Props) => {
  let n = 0
  return (
    <Layout
      preview="Quelques détails et votre fiche sera au complet dans l'annuaire."
      kicker="Votre fiche annuaire"
      titre={`${prenom ? `${prenom}, il` : 'Il'} manque presque rien à votre fiche !`}
    >
      <Text style={s.text}>
        On adore voir l'annuaire se remplir, et votre fiche y a toute sa place. Il lui manque juste
        {manques.length > 1 ? ` ${manques.length} petites choses` : ' une petite chose'} pour que les autres membres, les studios et les
        auditeur·ices vous repèrent du premier coup d'œil :
      </Text>
      {manques.includes('photo') && (
        <Point n={++n} titre="Une photo de vous">
          Dans l'annuaire, on voit d'abord des visages. Pour l'instant, ce sont vos initiales qui s'affichent.
          Une photo carrée, nette et bien éclairée suffit.
        </Point>
      )}
      {manques.includes('pochette') && (
        <Point n={++n} titre={`La pochette de votre podcast${liste(podcastsSansPochette)}`}>
          C'est l'image qui accompagne vos épisodes sur la page Écouter. Celle de votre plateforme d'écoute fait très bien l'affaire.
        </Point>
      )}
      {manques.includes('rss') && (
        <Point n={++n} titre={`Le lien du flux RSS${liste(podcastsSansRss)}`}>
          Avec lui, vos derniers épisodes apparaissent tout seuls sur votre fiche et dans le lecteur du site.
          Vous le trouvez chez votre hébergeur (Ausha, Acast, Spotify for Creators…), souvent dans « Diffusion » ou « Partager ».
        </Point>
      )}
      {manques.includes('collab') && (
        <Point n={++n} titre="Ce que vous cherchez, ce que vous apportez">
          Montage, voix off, invité·es, studio… Cochez ce qui vous correspond : c'est grâce à ça que les autres membres
          vous trouvent avec le filtre « Je cherche quelqu'un pour ».
        </Point>
      )}
      <Text style={{ ...s.text, margin: '18px 0 22px' }}>
        Ça prend cinq minutes depuis votre espace membre. Connectez-vous avec l'adresse qui reçoit cet e-mail.
      </Text>
      <Bouton href={`${SITE}/espace-membre`}>Compléter ma fiche</Bouton>
    </Layout>
  )
}

export const template = {
  component: ProfilACompleter,
  subject: (d: Record<string, any>) => `${d.prenom ? `${d.prenom}, votre` : 'Votre'} fiche est presque complète !`,
  displayName: 'Fiche à compléter',
  previewData: { prenom: 'Alix', manques: ['photo', 'pochette', 'rss', 'collab'], podcastsSansPochette: ['Les Voix du Port'], podcastsSansRss: ['Les Voix du Port'] },
} satisfies TemplateEntry
