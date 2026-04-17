import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const SEED_SPA_SERVICES = [
  {
    id: 't1',
    name: { en: 'Aroma Relax Massage', ru: 'Аромарелакс Массаж', kz: 'Арома Релакс Массаж' },
    duration: '60 min',
    price: 'от 18 000 Т',
    imageUrl: '',
    active: true,
  },
  {
    id: 't2',
    name: { en: 'Hot Stone Massage', ru: 'Массаж горячими камнями', kz: 'Ыстық тастармен массаж' },
    duration: '75 min',
    price: 'от 22 000 Т',
    imageUrl: '',
    active: true,
  },
  {
    id: 't3',
    name: { en: 'Deep Tissue Massage', ru: 'Глубокотканный массаж', kz: 'Терең тіндік массаж' },
    duration: '60 min',
    price: 'от 20 000 Т',
    imageUrl: '',
    active: true,
  },
  {
    id: 't4',
    name: { en: 'Hydrating Facial', ru: 'Увлажняющий уход за лицом', kz: 'Ылғалдандырушы бет күтімі' },
    duration: '50 min',
    price: 'от 16 000 Т',
    imageUrl: '',
    active: true,
  },
  {
    id: 't5',
    name: { en: 'Body Wrap', ru: 'Обёртывание тела', kz: 'Дене орауы' },
    duration: '60 min',
    price: 'от 19 000 Т',
    imageUrl: '',
    active: true,
  },
  {
    id: 't6',
    name: { en: 'Hammam Ritual', ru: 'Хаммам Ритуал', kz: 'Хаммам Ритуалы' },
    duration: '90 min',
    price: 'от 28 000 Т',
    imageUrl: '',
    active: true,
  },
]

export async function seedSpaServices(): Promise<void> {
  await Promise.all(
    SEED_SPA_SERVICES.map((service) =>
      setDoc(doc(db, 'spa_services', service.id), {
        ...service,
        createdAt: serverTimestamp(),
      })
    )
  )
}
