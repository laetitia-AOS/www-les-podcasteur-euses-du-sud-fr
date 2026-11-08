// Rapport du lundi : chiffres de la semaine écoulée (lundi → dimanche, heure de Paris), envoyés à l'adresse de l'équipe.
// Appelée par la tâche planifiée du lundi matin. Le destinataire est fixé dans le modèle, jamais lu dans la requête ;
// la clé d'idempotence (une par semaine) empêche tout second envoi pour la même semaine.
import { createClient } from 'npm:@supabase/supabase-js@2.45.0'
import { envoyer } from '../_shared/notifications.ts'
import { DESTINATAIRE_RAPPORT } from '../_shared/transactional-email-templates/rapport-semaine.tsx'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Lundi de la dernière semaine complète (heure de Paris), au format AAAA-MM-JJ. */
export const lundiPrecedent = (maintenant = new Date()) => {
  const ymd = maintenant.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  const d = new Date(`${ymd}T12:00:00Z`)
  const depuisLundi = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - depuisLundi - 7)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const debut = lundiPrecedent()
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data, error } = await admin.rpc('rapport_semaine', { _debut: debut })
  if (error || !data) {
    console.error('rapport_semaine :', error?.message?.slice(0, 200))
    return json({ sent: false }, 500)
  }
  const sent = await envoyer('rapport-semaine', DESTINATAIRE_RAPPORT, data as Record<string, unknown>, `rapport-semaine-${debut}`)
  return json({ sent, semaine: debut })
})
