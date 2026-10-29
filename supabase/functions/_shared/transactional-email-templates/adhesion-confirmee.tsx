/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'

interface Props { prenom?: string; annee?: number; formule?: string; montant?: number }

const AdhesionConfirmee = ({ prenom, annee, formule, montant }: Props) => {
  const a = annee || new Date().getFullYear()
  return (
    <Layout preview={`C'est officiel : vous êtes membre ${a}. Valable jusqu'au 31 décembre ${a}.`} kicker={`Adhésion ${a}`} titre={`${prenom ? `${prenom}, c` : 'C'}'est officiel : vous êtes membre ${a} !`}>
      <Text style={s.text}>
        Votre paiement est bien arrivé, et toute l'équipe est ravie de vous compter parmi les podcasteur·euses
        du Sud. Merci : votre adhésion fait vivre les rencontres, l'annuaire et les écoutes partagées.
      </Text>
      <Fiche>
        <Ligne label="Statut">Membre {a}</Ligne>
        <Ligne label="Validité">Valable jusqu'au 31 décembre {a}</Ligne>
        {formule && <Ligne label="Formule">{formule === 'studio' ? 'Studio ou agence' : 'Personne'}{montant ? ` · ${montant} €` : ''}</Ligne>}
      </Fiche>
      <Text style={s.text}>
        <span style={s.strong}>Et maintenant ?</span> Votre fiche et vos podcasts deviennent visibles dans
        l'annuaire et dans « Écouter ». Soignez votre photo, dites ce que vous cherchez et ce que vous
        apportez : c'est comme ça que les collabs se font.
      </Text>
      <Bouton href={`${SITE}/mon-espace`}>Ouvrir mon espace membre</Bouton>
    </Layout>
  )
}

export const template = {
  component: AdhesionConfirmee,
  subject: (d: Record<string, any>) => `Bienvenue parmi les membres ${d.annee || new Date().getFullYear()} !`,
  displayName: 'Adhésion confirmée',
  previewData: { prenom: 'Alix', annee: 2026, formule: 'personne', montant: 20 },
} satisfies TemplateEntry
