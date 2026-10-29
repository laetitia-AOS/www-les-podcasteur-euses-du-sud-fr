/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; annee?: number; email?: string }

const FicheACreer = ({ prenom, annee, email }: Props) => {
  const a = annee || new Date().getFullYear()
  return (
    <Layout
      preview={`Votre adhésion ${a} est bien là : il ne manque que votre fiche dans l'annuaire.`}
      kicker={`Membre ${a}`}
      titre={`${prenom ? `${prenom}, votre` : 'Votre'} place dans l'annuaire vous attend !`}
    >
      <Text style={s.text}>
        Merci pour votre adhésion : elle est bien arrivée, et on est ravi·es de vous compter parmi les membres {a}.
        Il reste une dernière étape pour que les autres membres, les studios et les auditeur·ices puissent vous trouver :
        <span style={s.strong}> créer votre fiche</span>.
      </Text>
      <Fiche>
        <Ligne label="Ce que vous y mettez">Une photo, quelques lignes sur vous, votre podcast si vous en avez un</Ligne>
        <Ligne label="Et surtout">Ce que vous cherchez et ce que vous apportez : c'est ce qui fait naître les collabs</Ligne>
        {email && <Ligne label="Adresse à utiliser">{email}</Ligne>}
      </Fiche>
      <Text style={s.text}>
        Utilisez bien la même adresse e-mail que pour votre paiement : c'est elle qui relie votre adhésion à votre fiche.
        Comptez dix minutes, pas plus.
      </Text>
      <Bouton href={`${SITE}/adherer`}>Créer ma fiche</Bouton>
    </Layout>
  )
}

export const template = {
  component: FicheACreer,
  subject: (d: Record<string, any>) => `${d.prenom ? `${d.prenom}, il` : 'Il'} ne manque que votre fiche !`,
  displayName: 'Fiche à créer (adhérent·e sans fiche)',
  previewData: { prenom: 'Alix', annee: 2026, email: 'alix@exemple.fr' },
} satisfies TemplateEntry
