// Envoi des e-mails du site (e-mails intégrés Lovable, domaine de l'association).
// Un e-mail = un·e destinataire, pour un événement précis ; un échec d'envoi ne bloque jamais l'action.
import { sendTemplateEmail } from './transactional-email-templates/send-email.ts'

export async function envoyer(template: string, to: string | null | undefined, data: Record<string, unknown>, cle: string): Promise<boolean> {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to) || to.endsWith('@invalid')) return false
  try {
    const r = await sendTemplateEmail(template, to, { templateData: data, idempotencyKey: cle })
    return r.sent
  } catch (e) {
    console.error(`E-mail « ${template} » non envoyé :`, e instanceof Error ? e.message.slice(0, 200) : 'inconnu')
    return false
  }
}

/** « 29 octobre 2026 » (heure de Paris), pour dater une notification. */
export const jourDuJour = () =>
  new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

/** Au-delà de 10 demandes reçues en 24 h, un·e membre n'est plus prévenu·e par e-mail (les demandes restent dans son espace). */
export const MAX_NOTIFS_JOUR = 10
// deno-lint-ignore no-explicit-any
export async function tropDeNotifs(admin: any, recipientId: string): Promise<boolean> {
  const depuis = new Date(Date.now() - 24 * 3600_000).toISOString()
  const { count } = await admin.from('contact_requests').select('id', { count: 'exact', head: true }).eq('recipient_id', recipientId).gte('created_at', depuis)
  return (count || 0) > MAX_NOTIFS_JOUR
}

/** « lundi 9 novembre 2026, 18h30 » (heure de Paris). */
export const dateLongue = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const jour = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', 'h')
  return `${jour}, ${heure}`
}

export const premierPrenom = (prenom?: string | null) => {
  const p = (prenom || '').trim().split(/\s+/)[0] || ''
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : ''
}

export const extrait = (t: string | null | undefined, n = 280) => {
  const s = (t || '').trim()
  return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s
}
