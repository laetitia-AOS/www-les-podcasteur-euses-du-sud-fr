/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

type Relance = '1dec' | '20dec' | '15jan' | 'sursis'
interface Props { relance?: Relance; base?: number; cible?: number; prenom?: string; email?: string }

const SUJETS: Record<Relance, (b: number, c: number) => string> = {
  '1dec': (_b, c) => `Renouvelez votre adhésion pour ${c}`,
  '20dec': (_b, c) => `Adhésion ${c} : pensez à renouveler`,
  '15jan': () => 'Votre fiche sera masquée le 1er février',
  sursis: (_b, c) => `Votre fiche dans l'annuaire : adhésion ${c}`,
}

const Renouvellement = ({ relance = '1dec', base, cible, prenom, email }: Props) => {
  const y = new Date().getFullYear()
  const b = base || y
  const c = cible || y + 1
  const lien = `${SITE}/rejoindre-association?etape=adhesion&pour=${c}`
  const titres: Record<Relance, string> = {
    '1dec': `${prenom ? `${prenom}, on` : 'On'} repart pour ${c} ensemble ?`,
    '20dec': `${prenom ? `${prenom}, plus` : 'Plus'} que quelques jours pour ${c} !`,
    '15jan': `${prenom ? `${prenom}, votre` : 'Votre'} fiche vous attend encore un peu`,
    sursis: `${prenom ? `${prenom}, votre` : 'Votre'} fiche est en ligne, il manque l'adhésion`,
  }
  const intro: Record<Relance, string> = {
    '1dec': `Votre adhésion est valable jusqu'au 31 décembre ${b}. Le renouvellement pour ${c} est ouvert dès aujourd'hui : un paiement, et vous gardez votre place dans l'annuaire toute l'année prochaine.`,
    '20dec': `Votre adhésion ${b} se termine le 31 décembre. Pour que votre fiche et vos podcasts restent visibles en ${c}, c'est le bon moment pour renouveler.`,
    '15jan': `Votre adhésion ${b} est terminée depuis le 31 décembre. Votre fiche reste visible jusqu'au 31 janvier ; sans renouvellement, elle sera masquée du site le 1er février. Rien n'est supprimé : elle réapparaît dès votre paiement.`,
    sursis: `Votre fiche est visible dans l'annuaire des Podcasteur·euses du Sud, mais votre adhésion ${c} n'est pas encore réglée. L'adhésion fait vivre les rencontres, l'annuaire et les écoutes partagées.`,
  }
  return (
    <Layout preview={SUJETS[relance](b, c)} kicker={`Adhésion ${c}`} titre={titres[relance]}>
      <Text style={s.text}>{intro[relance]}</Text>
      <Fiche>
        <Ligne label="Validité">Jusqu'au 31 décembre {c}</Ligne>
        <Ligne label="Montant">20 € par an pour une personne (dès 1 €), 100 € pour un studio ou une agence</Ligne>
        {email && <Ligne label="Adresse à utiliser">{email}</Ligne>}
      </Fiche>
      <Text style={s.text}>
        Utilisez la même adresse e-mail que pour votre fiche : c'est elle qui relie le paiement à votre profil.
      </Text>
      <Bouton href={lien}>{relance === 'sursis' || relance === '15jan' ? `Adhérer pour ${c}` : `Renouveler pour ${c}`}</Bouton>
      <Text style={{ ...s.text, fontSize: '14px', margin: '22px 0 0' }}>
        Votre espace membre : <a href={`${SITE}/espace-membre`} style={{ color: '#1530B8' }}>les-podcasteur-euses-du-sud.fr/espace-membre</a>
      </Text>
    </Layout>
  )
}

export const template = {
  component: Renouvellement,
  subject: (d: Record<string, any>) => {
    const y = new Date().getFullYear()
    return SUJETS[(d.relance as Relance) || '1dec'](d.base || y, d.cible || y + 1)
  },
  displayName: 'Renouvellement d’adhésion (envoi individuel)',
  previewData: { relance: '1dec', base: 2026, cible: 2027, prenom: 'Alix', email: 'alix@exemple.fr' },
} satisfies TemplateEntry
