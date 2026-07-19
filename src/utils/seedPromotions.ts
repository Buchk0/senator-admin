import { doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// Same ids as the seasonal/always entries that used to live directly in
// seedCoupons.ts — writing through these ids keeps the mirrored coupon in
// sync instead of creating duplicates.
const SEED_PROMOTIONS = [
  // ─── Seasonal ──────────────────────────────────────────────────────────────
  {
    id: 's1',
    type: 'seasonal' as const,
    emoji: '🌷',
    restaurant: 'Senator' as const,
    active: true,
    title:       { en: 'Spring Taste – −15%',      ru: 'Spring Taste – −15%',       kz: 'Spring Taste – −15%' },
    description: {
      en: '15% off the seasonal menu.',
      ru: '−15% на сезонное меню.',
      kz: 'Маусымдық мәзірге −15%.',
    },
    terms: {
      en: 'Valid during the season. Cannot be combined.',
      ru: 'Действует в период сезона. Не суммируется.',
      kz: 'Маусым кезінде жарамды. Қосылмайды.',
    },
  },
  {
    id: 's2',
    type: 'seasonal' as const,
    emoji: '🍓',
    restaurant: 'Balkon' as const,
    active: true,
    title:       { en: 'Strawberry Dessert Gift',  ru: 'Strawberry Dessert Gift',   kz: 'Strawberry Dessert Gift' },
    description: {
      en: 'Free strawberry dessert with any main course.',
      ru: 'Десерт с клубникой бесплатно.',
      kz: 'Кез келген негізгі тағаммен тегін құлпынай десерті.',
    },
    terms: {
      en: 'When ordering a main course. 1 dessert per table.',
      ru: 'При заказе основного блюда. 1 десерт на стол.',
      kz: 'Негізгі тағам тапсырыс берген кезде. 1 десерт.',
    },
  },
  {
    id: 's3',
    type: 'seasonal' as const,
    emoji: '🍷',
    restaurant: 'Senator' as const,
    active: true,
    title:       { en: 'Wine & Dinner',            ru: 'Wine & Dinner',             kz: 'Wine & Dinner' },
    description: {
      en: 'Free glass of wine with dinner.',
      ru: 'Бокал вина бесплатно к ужину.',
      kz: 'Кешкі аспен тегін бір стақан шарап.',
    },
    terms: {
      en: '18+. When ordering a main course. 1 glass.',
      ru: '18+. При заказе основного блюда. 1 бокал.',
      kz: '18+. Негізгі тағам тапсырыс берген кезде. 1 стақан.',
    },
  },
  {
    id: 's4',
    type: 'seasonal' as const,
    emoji: '🍫',
    restaurant: 'Balkon' as const,
    active: true,
    title:       { en: 'Hot Chocolate Treat',      ru: 'Hot Chocolate Treat',       kz: 'Hot Chocolate Treat' },
    description: {
      en: 'Free hot chocolate.',
      ru: 'Горячий шоколад бесплатно.',
      kz: 'Тегін ыстық шоколад.',
    },
    terms: {
      en: '1 per guest per visit.',
      ru: '1 раз на гостя за визит.',
      kz: 'Бір келушіге бір рет.',
    },
  },

  // ─── Always ────────────────────────────────────────────────────────────────
  {
    id: 'a1',
    type: 'always' as const,
    emoji: '🍹',
    restaurant: 'Senator' as const,
    active: true,
    title:       { en: 'Happy Hour – −20%',        ru: 'Happy Hour – −20%',         kz: 'Happy Hour – −20%' },
    description: {
      en: '20% off cocktails from 5 pm to 7 pm.',
      ru: '−20% на коктейли с 17:00 до 19:00.',
      kz: 'Сағат 17:00–19:00 арасында коктейльдерге −20%.',
    },
    terms: {
      en: 'Valid daily during stated hours. 18+.',
      ru: 'Действует ежедневно в указанные часы. 18+.',
      kz: 'Күн сайын белгіленген уақытта жарамды. 18+.',
    },
  },
  {
    id: 'a2',
    type: 'always' as const,
    emoji: '🍾',
    restaurant: 'Balkon' as const,
    active: true,
    title:       { en: 'Romantic Dinner',          ru: 'Romantic Dinner',           kz: 'Romantic Dinner' },
    description: {
      en: 'Free champagne for two when booking a table.',
      ru: 'Бесплатный бокал шампанского для двоих.',
      kz: 'Екеуіне үстел брондаған кезде тегін шампан шарабы.',
    },
    terms: {
      en: 'When booking a table for two. 18+.',
      ru: 'При бронировании стола на двоих. 18+.',
      kz: 'Екеуіне үстел брондаған кезде. 18+.',
    },
  },
  {
    id: 'a3',
    type: 'always' as const,
    emoji: '🥗',
    restaurant: 'All' as const,
    active: true,
    title:       { en: 'Lunch Offer – −15%',       ru: 'Lunch Offer – −15%',        kz: 'Lunch Offer – −15%' },
    description: {
      en: '15% off business lunch on weekdays.',
      ru: '−15% на бизнес-ланч.',
      kz: 'Жұмыс күндері бизнес-ланчқа −15%.',
    },
    terms: {
      en: 'Valid on weekdays. Check hours in Info.',
      ru: 'Действует в будние дни. Время уточняйте в «Инфо».',
      kz: 'Жұмыс күндері жарамды. Уақытты «Ақпараттан» тексеріңіз.',
    },
  },
  {
    id: 'a4',
    type: 'always' as const,
    emoji: '🍽',
    restaurant: 'Senator' as const,
    active: true,
    title:       { en: "Chef's Recommendation",   ru: "Chef's Recommendation",     kz: "Chef's Recommendation" },
    description: {
      en: 'Free compliment from the chef.',
      ru: 'Бесплатный комплимент от шефа.',
      kz: 'Аспаздан тегін комплимент.',
    },
    terms: {
      en: "Limited availability. At the restaurant's discretion.",
      ru: 'Количество ограничено. На усмотрение ресторана.',
      kz: 'Саны шектеулі. Мейрамхананың қалауы бойынша.',
    },
  },
]

export async function seedPromotions(): Promise<{ created: number }> {
  const batch = writeBatch(db)
  SEED_PROMOTIONS.forEach(({ id, ...promotion }) => {
    batch.set(doc(db, 'promotions', id), { ...promotion, createdAt: serverTimestamp() })
    batch.set(doc(db, 'coupons', id), { ...promotion, oneTime: false, createdAt: serverTimestamp() })
  })
  await batch.commit()
  return { created: SEED_PROMOTIONS.length }
}
