import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import type { ConferenceMenuType } from '../types'

// Content taken from the Figma design. Only RU is filled in — the mobile app
// falls back to RU when EN/KZ are empty; translations can be added in the form.

interface SeedMenu {
  title: string
  price: string
  image: string
  items: string[]
  drinks?: string[]
  /** Incomplete entries are created inactive so they don't show up in the app */
  active?: boolean
}

const BREAK_DRINKS = ['Кофе натуральный', 'Чай пакетированный', 'Вода «Turan»', 'Молоко', 'Лимон']
const LUNCH_DRINKS = ['Сок в ассортименте', 'Кофе/чай', 'Молоко/Лимон/Вода']

const COFFEE_BREAKS: SeedMenu[] = [
  {
    title: '1 вариант',
    price: '4 500',
    image: 'break/break1.png',
    items: ['Канапе с семгой', 'Канапе с бастурмой, огурцом и вяленым томатом', 'Мини-пирожные в ассортименте', 'Печенье ореховое'],
    drinks: BREAK_DRINKS,
  },
  {
    title: '2 вариант',
    price: '4 500',
    image: 'break/break2.png',
    items: ['Канапе из блинов с лососем и сливочным сыром', 'Канапе с бастурмой, огурцом и вяленым томатом', 'Мини-пирожные в ассортименте', 'Печенье буше, ореховое'],
    drinks: BREAK_DRINKS,
  },
  {
    // Only partly visible in the design — fill in and activate in the admin
    title: '1 вариант',
    price: '5 500',
    image: 'break/break3.png',
    items: ['Мини-самса с курицей', 'Мини-самса с семгой', 'Мини-пирожные в ассортименте'],
    drinks: ['Кофе натуральный', 'Чай пакетированный', 'Вода «Turan»'],
    active: false,
  },
  {
    // Not in the design yet — fill in and activate in the admin
    title: '2 вариант',
    price: '5 500',
    image: 'break/break4.png',
    items: [],
    drinks: [],
    active: false,
  },
  {
    title: '1 вариант',
    price: '7 500',
    image: 'break/break5.png',
    items: ['Шашлычки из курицы / из овощей', 'Мини-самса с курицей / с семгой', 'Канапе с кониной', 'Мини-пирожные в ассортименте', 'Печенье ореховое'],
    drinks: ['Сок в ассортименте', ...BREAK_DRINKS],
  },
  {
    title: '2 вариант',
    price: '7 500',
    image: 'break/break6.png',
    items: ['Куриное филе на шпажках по-тайски', 'Мини-самса с семгой', 'Мини-чебуреки с куриным филе и грибами', 'Мини сэндвич с ветчиной', 'Канапе из блинов с лососем и сливочным сыром', 'Мини-пирожные в ассортименте'],
    drinks: ['Печенье буше/ореховое', 'Сок в ассортименте', ...BREAK_DRINKS],
  },
]

const BUSINESS_LUNCHES: SeedMenu[] = [
  { title: '№1', price: '12 900', image: 'lunch/lunch1.png', items: ['Салат «Фермерский»', 'Пряный куриный бульон с лапшой', 'Бефстроганов из телятины в сливочном соусе с картофельными дольками', 'Хлебная корзина', ...LUNCH_DRINKS] },
  { title: '№2', price: '11 900', image: 'lunch/lunch2.png', items: ['Салат «Фермерский»', 'Пряный куриный бульон с лапшой', 'Медальоны из конины с булгуром', 'Хлебная корзина', ...LUNCH_DRINKS] },
  { title: '№3', price: '12 900', image: 'lunch/lunch3.png', items: ['Салат «А-ля Цезарь с курицей»', 'Суп «Кеспе» на говяжьем бульоне', 'Рыбные биточки', 'Хлебная корзина', ...LUNCH_DRINKS] },
  { title: '№4', price: '11 900', image: 'lunch/lunch4.png', items: ['Салат «Греческий»', 'Суп «Кеспе» на говяжьем бульоне', 'Рыбные биточки', 'Хлебная корзина', ...LUNCH_DRINKS] },
  { title: '№5', price: '12 900', image: 'lunch/lunch5.png', items: ['Салат «А-ля Цезарь с курицей»', 'Уха из трех видов рыбы', 'Медальоны из конины с булгуром', 'Хлебная корзина', ...LUNCH_DRINKS] },
  { title: '№6', price: '10 900', image: 'lunch/lunch6.png', items: ['Салат «Греческий»', 'Уха из трех видов рыбы', 'Куриные инвольтини', 'Хлебная корзина', ...LUNCH_DRINKS] },
  { title: '№7', price: '12 900', image: 'lunch/lunch7.png', items: ['Салат «Фермерский»', 'Бефстроганов из телятины в сливочном соусе с картофельными дольками', 'Хлебная корзина', ...LUNCH_DRINKS, 'Десерт «Наполеон»'] },
  { title: '№8', price: '11 900', image: 'lunch/lunch8.png', items: ['Салат «Фермерский»', 'Медальоны из конины с булгуром', 'Хлебная корзина', ...LUNCH_DRINKS, 'Десерт «Фисташковый рулет»'] },
  { title: '№9', price: '12 900', image: 'lunch/lunch9.png', items: ['Салат «А-ля Цезарь с курицей»', 'Рыбные биточки', 'Хлебная корзина', ...LUNCH_DRINKS, 'Десерт «Чизкейк»'] },
  { title: '№10', price: '11 900', image: 'lunch/lunch10.png', items: ['Салат «Греческий»', 'Рыбные биточки', 'Хлебная корзина', ...LUNCH_DRINKS, 'Десерт «Чизкейк»'] },
  { title: '№11', price: '12 900', image: 'lunch/lunch11.png', items: ['Салат «А-ля Цезарь с курицей»', 'Медальоны из конины с булгуром', 'Хлебная корзина', ...LUNCH_DRINKS, 'Десерт «Наполеон»'] },
  { title: '№12', price: '10 900', image: 'lunch/lunch12.png', items: ['Салат «Греческий»', 'Куриные инвольтини', 'Хлебная корзина', ...LUNCH_DRINKS, 'Десерт «Фисташковый рулет»'] },
]

const ruOnly = (text: string) => ({ en: '', ru: text, kz: '' })

async function uploadSeedImage(docId: string, publicPath: string): Promise<string> {
  const res = await fetch(publicPath)
  if (!res.ok) throw new Error(`Fetch failed for ${publicPath}: ${res.status}`)
  const blob = await res.blob()
  const filename = publicPath.split('/').pop() || 'photo.png'
  const storageRef = ref(storage, `conferenceMenus/${docId}/${filename}`)
  await uploadBytes(storageRef, blob)
  return await getDownloadURL(storageRef)
}

export async function seedConferenceMenus(type: ConferenceMenuType): Promise<{ created: number }> {
  const menus = type === 'coffee_break' ? COFFEE_BREAKS : BUSINESS_LUNCHES
  let created = 0
  for (const [index, menu] of menus.entries()) {
    const newRef = doc(collection(db, 'conferenceMenus'))
    const imageUrl = await uploadSeedImage(newRef.id, `/seed-assets/conference/${menu.image}`)
    await setDoc(newRef, {
      type,
      title: ruOnly(menu.title),
      price: menu.price,
      items: ruOnly(menu.items.join('\n')),
      drinks: ruOnly((menu.drinks ?? []).join('\n')),
      imageUrl,
      order: index + 1,
      active: menu.active ?? true,
      createdAt: serverTimestamp(),
    })
    created += 1
  }
  return { created }
}
