import type { ConferenceMenuType } from '../../types'

// URL segment (/conference/:kind) → Firestore `type` value and UI labels.
export const CONFERENCE_KINDS: Record<string, { type: ConferenceMenuType; title: string; item: string }> = {
  'coffee-break': { type: 'coffee_break', title: 'Кофе-брейк', item: 'вариант кофе-брейка' },
  'business-lunch': { type: 'business_lunch', title: 'Бизнес-ланч', item: 'бизнес-ланч' },
}
