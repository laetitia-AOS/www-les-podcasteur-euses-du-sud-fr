import type { ComponentType } from 'npm:react@18.3.1'
import { template as t0 } from './adhesion-confirmee.tsx'
import { template as t1 } from './message-recu.tsx'
import { template as t2 } from './collab-recue.tsx'
import { template as t3 } from './devis-recu.tsx'
import { template as t4 } from './venue-confirmee.tsx'
import { template as t5 } from './proposition-publiee.tsx'
import { template as t6 } from './proposition-refusee.tsx'
import { template as t7 } from './profil-a-completer.tsx'
import { template as t8 } from './fiche-a-creer.tsx'
import { template as t9 } from './renouvellement.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome.tsx'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'adhesion-confirmee': t0,
  'message-recu': t1,
  'collab-recue': t2,
  'devis-recu': t3,
  'venue-confirmee': t4,
  'proposition-publiee': t5,
  'proposition-refusee': t6,
  'profil-a-completer': t7,
  'fiche-a-creer': t8,
  'renouvellement': t9,
}
