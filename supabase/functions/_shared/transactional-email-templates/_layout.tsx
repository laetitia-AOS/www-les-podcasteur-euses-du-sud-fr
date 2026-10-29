/// <reference types="npm:@types/react@18.3.1" />
// Gabarit commun des e-mails du site : bandeau bleu avec logo, gros titre Archivo, trait orange,
// boutons carrés, données en IBM Plex Mono. Styles en ligne uniquement (pas de feuille de style).
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'

export const SITE = 'https://www.les-podcasteur-euses-du-sud.fr'
const LOGO = `${SITE}/favicon.png`

export const C = {
  bleu: '#1530B8',
  orange: '#F28C28',
  encre: '#0F0F12',
  fond: '#F3F2EE',
  gris: '#4A4A52',
  pale: '#77777F',
}
const SANS = 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
const MONO = '"IBM Plex Mono", "Courier New", Courier, monospace'

export const s = {
  text: { fontFamily: SANS, fontSize: '16px', lineHeight: '1.6', color: C.gris, margin: '0 0 18px' },
  strong: { color: C.encre, fontWeight: 700 as const },
  label: { fontFamily: MONO, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: C.pale, margin: '0 0 4px' },
  value: { fontFamily: SANS, fontSize: '17px', fontWeight: 700 as const, color: C.encre, margin: '0 0 14px' },
  quote: { fontFamily: SANS, fontSize: '16px', lineHeight: '1.6', color: C.encre, margin: '0', whiteSpace: 'pre-line' as const },
}

/** Encadré « fiche » : fond écru, bord gauche orange, pour les infos clés. */
export const Fiche = ({ children }: { children: React.ReactNode }) => (
  <Section style={{ backgroundColor: C.fond, borderLeft: `6px solid ${C.orange}`, padding: '18px 20px', margin: '6px 0 26px' }}>
    {children}
  </Section>
)

export const Ligne = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <>
    <Text style={s.label}>{label}</Text>
    <Text style={s.value}>{children}</Text>
  </>
)

export const Bouton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Button
    href={href}
    style={{
      backgroundColor: C.bleu,
      color: '#ffffff',
      fontFamily: SANS,
      fontSize: '16px',
      fontWeight: 800,
      padding: '16px 26px',
      borderRadius: '0px',
      border: `2px solid ${C.bleu}`,
      textDecoration: 'none',
      display: 'inline-block',
    }}
  >
    {children}
  </Button>
)

interface LayoutProps {
  preview: string
  /** Petite ligne au-dessus du titre, en capitales mono (« Adhésion 2026 »…). */
  kicker: string
  titre: string
  children: React.ReactNode
}

export const Layout = ({ preview, kicker, titre, children }: LayoutProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={{ backgroundColor: '#ffffff', margin: 0, padding: '24px 0' }}>
      <Container style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        <Section style={{ backgroundColor: C.bleu, padding: '22px 28px' }}>
          <Img src={LOGO} alt="Les Podcasteur·euses du Sud" width="56" height="56" style={{ display: 'block', border: '2px solid #ffffff' }} />
        </Section>
        <Section style={{ height: '8px', backgroundColor: C.orange, lineHeight: '8px', fontSize: '1px' }}>&nbsp;</Section>
        <Section style={{ padding: '34px 28px 10px', border: `2px solid ${C.encre}`, borderTop: 'none' }}>
          <Text style={{ fontFamily: MONO, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: C.bleu, margin: '0 0 10px' }}>
            {kicker}
          </Text>
          <Heading style={{ fontFamily: SANS, fontSize: '34px', lineHeight: '1.05', fontWeight: 900, color: C.encre, margin: '0 0 22px', letterSpacing: '-0.5px' }}>
            {titre}
          </Heading>
          {children}
          <Text style={{ fontFamily: SANS, fontSize: '16px', color: C.encre, margin: '30px 0 26px', lineHeight: '1.5' }}>
            À très vite,
            <br />
            <strong>L'équipe des Podcasteur·euses du Sud</strong>
          </Text>
        </Section>
        <Section style={{ padding: '18px 28px' }}>
          <Text style={{ fontFamily: MONO, fontSize: '11px', color: C.pale, margin: 0, lineHeight: '1.6' }}>
            Les Podcasteur·euses du Sud · réseau des créateur·ices audio de la Région Sud
            <br />
            <Link href={SITE} style={{ color: C.bleu, textDecoration: 'underline' }}>les-podcasteur-euses-du-sud.fr</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)
