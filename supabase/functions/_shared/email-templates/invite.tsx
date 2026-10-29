/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Votre invitation</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO} alt="Les Podcasteur·euses du Sud" width="64" height="64" style={logo} />
        <Heading style={h1}>Vous êtes invité·e</Heading>
        <Text style={text}>
          L'équipe des Podcasteur·euses du Sud vous a créé un accès. Cliquez sur
          le bouton ci-dessous pour l'activer et choisir votre mot de passe.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Activer mon accès
        </Button>
        <Text style={footer}>
          Vous ne vous attendiez pas à cette invitation ? Ignorez cet e-mail.
          <br />L'équipe des Podcasteur·euses du Sud
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const LOGO = 'https://www.les-podcasteur-euses-du-sud.fr/favicon.png'
const main = { backgroundColor: '#ffffff', fontFamily: 'Archivo, Helvetica, Arial, sans-serif' }
const container = { padding: '28px 25px', maxWidth: '560px' }
const logo = { width: '64px', height: '64px', margin: '0 0 24px' }
const h1 = {
  fontSize: '26px',
  fontWeight: 800 as const,
  color: '#0F0F12',
  lineHeight: '1.15',
  margin: '0 0 18px',
}
const text = {
  fontSize: '15px',
  color: '#3A3A42',
  lineHeight: '1.55',
  margin: '0 0 24px',
}
const button = {
  backgroundColor: '#1530B8',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700 as const,
  border: '2px solid #1530B8',
  borderRadius: '0px',
  padding: '14px 22px',
  textDecoration: 'none',
}
const code = {
  fontFamily: "'IBM Plex Mono', Courier, monospace",
  fontSize: '28px',
  fontWeight: 600 as const,
  color: '#1530B8',
  letterSpacing: '4px',
  margin: '0 0 24px',
}
const footer = { fontSize: '12px', color: '#77777F', margin: '32px 0 0', lineHeight: '1.5' }
// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ffffff !important; color: #1530B8 !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ffffff !important; color: #1530B8 !important; }
  [data-ogsb] .dm-btn { background-color: #ffffff !important; color: #1530B8 !important; }
`
