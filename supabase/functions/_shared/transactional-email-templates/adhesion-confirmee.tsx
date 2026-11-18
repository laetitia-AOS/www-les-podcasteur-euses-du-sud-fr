/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { Bouton, Fiche, Layout, Ligne, SITE, s } from './_layout.tsx'
import { ACCUEIL_APERCU, AccueilSections } from './_accueil.tsx'
import type { DonneesAccueil } from '../accueil-donnees.ts'

interface Props { prenom?: string; annee?: number; formule?: string; montant?: number; accueil?: DonneesAccueil }

/** Confirmation de paiement (inchangée), suivie de l'accueil quand c'est la première fois que la personne arrive. */
const AdhesionConfirmee = ({ prenom, annee, formule, montant, accueil }: Props) => {
  const a = annee || new Date().getFullYear()
  const recap = (
    <Fiche>
      <Ligne label="Statut">Membre {a}</Ligne>
      <Ligne label="Validité">Valable jusqu'au 31 décembre {a}</Ligne>
      {formule && <Ligne label="Formule">{formule === 'studio' ? 'Studio ou agence' : 'Personne'}{montant ? ` · ${montant} €` : ''}</Ligne>}
    </Fiche>
  )
  if (accueil) {
    return (
      <Layout preview={`C'est officiel : tu es membre ${a}. Le groupe WhatsApp de ton département t'attend.`} kicker={`Adhésion ${a}`} titre={`${prenom ? `${prenom}, b` : 'B'}ienvenue chez les Podcasteur·euses du Sud !`}>
        <Text style={s.text}>
          Ton paiement est bien arrivé : tu es membre {a}. Être membre, c'est faire partie de la dynamique du collectif.
        </Text>
        {recap}
        <AccueilSections d={accueil} annee={a} />
      </Layout>
    )
  }
  return (
    <Layout preview={`C'est officiel : vous êtes membre ${a}. Valable jusqu'au 31 décembre ${a}.`} kicker={`Adhésion ${a}`} titre={`${prenom ? `${prenom}, c` : 'C'}'est officiel : vous êtes membre ${a} !`}>
      <Text style={s.text}>
        Votre paiement est bien arrivé, et toute l'équipe est ravie de vous compter parmi les podcasteur·euses
        du Sud. Merci : votre cotisation soutient le projet associatif des Podcasteur·euses du Sud.
      </Text>
      {recap}
      <Text style={s.text}>
        <span style={s.strong}>Et maintenant ?</span> L'annuaire, « Écouter » et « Qui cherche quoi » sont mis
        à disposition des membres, tant que l'association les propose : votre fiche y apparaît une fois relue par
        l'équipe. Soignez votre photo, dites ce que vous cherchez et ce que vous apportez : c'est comme ça que les
        collabs se font.
      </Text>
      <Bouton href={`${SITE}/mon-espace`}>Ouvrir mon espace membre</Bouton>
    </Layout>
  )
}

export const template = {
  component: AdhesionConfirmee,
  subject: (d: Record<string, any>) => `Bienvenue parmi les membres ${d.annee || new Date().getFullYear()} !`,
  displayName: 'Adhésion confirmée',
  previewData: { prenom: 'Alix', annee: 2026, formule: 'personne', montant: 20, accueil: ACCUEIL_APERCU },
} satisfies TemplateEntry
