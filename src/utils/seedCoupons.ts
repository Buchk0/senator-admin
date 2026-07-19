import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const SEED_COUPONS = [
  // ─── Welcome ───────────────────────────────────────────────────────────────
  {
    id: 'w1',
    type: 'welcome' as const,
    emoji: '🍸',
    restaurant: 'Senator' as const,
    oneTime: true,
    active: true,
    title:       { en: 'Welcome Drink',        ru: 'Welcome Drink',          kz: 'Welcome Drink' },
    description: {
      en: 'Free signature cocktail at the bar.',
      ru: 'Бесплатный фирменный коктейль в рестробаре.',
      kz: 'Мейрамханада тегін фирмалық коктейль.',
    },
    terms: {
      en: 'Available once after check-in. 18+.',
      ru: 'Доступен один раз после регистрации. 18+.',
      kz: 'Тіркелгеннен кейін бір рет қол жетімді. 18+.',
    },
  },
  {
    id: 'w2',
    type: 'welcome' as const,
    emoji: '🍰',
    restaurant: 'Balkon' as const,
    oneTime: true,
    active: true,
    title:       { en: 'Welcome Dessert',       ru: 'Welcome Dessert',        kz: 'Welcome Dessert' },
    description: {
      en: 'Free dessert when ordering a main course.',
      ru: 'Бесплатный десерт при заказе основного блюда.',
      kz: 'Негізгі тағам тапсырыс берген кезде тегін десерт.',
    },
    terms: {
      en: 'Available once after check-in. 1 dessert per table.',
      ru: 'Один раз после регистрации. 1 десерт на стол.',
      kz: 'Тіркелгеннен кейін бір рет. Үстелге 1 десерт.',
    },
  },
  {
    id: 'w3',
    type: 'welcome' as const,
    emoji: '🍽️',
    restaurant: 'All' as const,
    oneTime: true,
    active: true,
    title:       { en: '−10% on First Dinner',  ru: '−10% на первый ужин',   kz: 'Бірінші кешкі асқа −10%' },
    description: {
      en: '10% discount on your first dinner. One time only.',
      ru: 'Скидка −10% действует только один раз.',
      kz: 'Бірінші кешкі асқа −10% жеңілдік. Тек бір рет.',
    },
    terms: {
      en: 'Cannot be combined with other offers. 1 use.',
      ru: 'Не суммируется с другими акциями. 1 раз.',
      kz: 'Басқа акциялармен қосылмайды. 1 рет.',
    },
  },
  {
    id: 'w4',
    type: 'welcome' as const,
    emoji: '☕️',
    restaurant: 'Senator' as const,
    oneTime: true,
    active: true,
    title:       { en: 'Breakfast Upgrade',     ru: 'Breakfast Upgrade',      kz: 'Breakfast Upgrade' },
    description: {
      en: 'Free specialty coffee or fresh juice with breakfast.',
      ru: 'Бесплатный кофе specialty или свежий сок к завтраку.',
      kz: 'Таңғы асқа тегін specialty кофе немесе шырын.',
    },
    terms: {
      en: 'Available once after check-in.',
      ru: 'Доступно один раз после регистрации.',
      kz: 'Тіркелгеннен кейін бір рет қол жетімді.',
    },
  },
]

export async function seedCoupons(): Promise<void> {
  await Promise.all(
    SEED_COUPONS.map((coupon) =>
      setDoc(doc(db, 'coupons', coupon.id), {
        ...coupon,
        createdAt: serverTimestamp(),
      })
    )
  )
}
