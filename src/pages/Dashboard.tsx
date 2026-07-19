import { useEffect, useState } from 'react'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import { seedCoupons } from '../utils/seedCoupons'
import { seedSpaServices } from '../utils/seedSpaServices'
import { seedMenu } from '../utils/seedMenu'
import { seedGallery } from '../utils/seedGallery'
import { seedRestaurantPhotos } from '../utils/seedRestaurantPhotos'
import { seedPromotions } from '../utils/seedPromotions'

interface Stats {
  totalCoupons: number
  activeCoupons: number
  totalEvents: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalCoupons: 0, activeCoupons: 0, totalEvents: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')
  const [seedingSpa, setSeedingSpa] = useState(false)
  const [seedSpaMsg, setSeedSpaMsg] = useState('')
  const [seedingMenu, setSeedingMenu] = useState(false)
  const [seedMenuMsg, setSeedMenuMsg] = useState('')
  const [seedingGallery, setSeedingGallery] = useState(false)
  const [seedGalleryMsg, setSeedGalleryMsg] = useState('')
  const [seedingPhotos, setSeedingPhotos] = useState(false)
  const [seedPhotosMsg, setSeedPhotosMsg] = useState('')
  const [seedingPromotions, setSeedingPromotions] = useState(false)
  const [seedPromotionsMsg, setSeedPromotionsMsg] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [totalCouponsSnap, activeCouponsSnap, totalEventsSnap] = await Promise.all([
          getCountFromServer(collection(db, 'coupons')),
          getCountFromServer(query(collection(db, 'coupons'), where('active', '==', true))),
          getCountFromServer(collection(db, 'events')),
        ])

        setStats({
          totalCoupons: totalCouponsSnap.data().count,
          activeCoupons: activeCouponsSnap.data().count,
          totalEvents: totalEventsSnap.data().count,
        })
      } catch (err) {
        setError('Не удалось загрузить статистику.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleSeed = async () => {
    setSeeding(true)
    setSeedMsg('')
    try {
      await seedCoupons()
      setSeedMsg('4 приветственных купона успешно добавлены!')
    } catch (err) {
      setSeedMsg('Ошибка при добавлении купонов. Проверьте консоль.')
      console.error(err)
    } finally {
      setSeeding(false)
    }
  }

  const handleSeedPromotions = async () => {
    setSeedingPromotions(true)
    setSeedPromotionsMsg('')
    try {
      const { created } = await seedPromotions()
      setSeedPromotionsMsg(`${created} акций (и связанных купонов) успешно добавлены!`)
    } catch (err) {
      setSeedPromotionsMsg('Ошибка при добавлении акций. Проверьте консоль.')
      console.error(err)
    } finally {
      setSeedingPromotions(false)
    }
  }

  const handleSeedSpa = async () => {
    setSeedingSpa(true)
    setSeedSpaMsg('')
    try {
      await seedSpaServices()
      setSeedSpaMsg('6 услуг спа успешно добавлены!')
    } catch (err) {
      setSeedSpaMsg('Ошибка при добавлении услуг. Проверьте консоль.')
      console.error(err)
    } finally {
      setSeedingSpa(false)
    }
  }

  const handleSeedMenu = async () => {
    setSeedingMenu(true)
    setSeedMenuMsg('')
    try {
      const { created } = await seedMenu()
      setSeedMenuMsg(`${created} страниц меню успешно загружены!`)
    } catch (err) {
      setSeedMenuMsg('Ошибка при загрузке меню. Проверьте консоль.')
      console.error(err)
    } finally {
      setSeedingMenu(false)
    }
  }

  const handleSeedGallery = async () => {
    setSeedingGallery(true)
    setSeedGalleryMsg('')
    try {
      const { created } = await seedGallery()
      setSeedGalleryMsg(`${created} фото галереи успешно загружены!`)
    } catch (err) {
      setSeedGalleryMsg('Ошибка при загрузке галереи. Проверьте консоль.')
      console.error(err)
    } finally {
      setSeedingGallery(false)
    }
  }

  const handleSeedPhotos = async () => {
    setSeedingPhotos(true)
    setSeedPhotosMsg('')
    try {
      const { created } = await seedRestaurantPhotos()
      setSeedPhotosMsg(`${created} фото ресторанов успешно загружены!`)
    } catch (err) {
      setSeedPhotosMsg('Ошибка при загрузке фото. Проверьте консоль.')
      console.error(err)
    } finally {
      setSeedingPhotos(false)
    }
  }

  const statCards = [
    { label: 'Всего купонов', value: stats.totalCoupons, icon: '🎟', color: '#1a2035' },
    { label: 'Активных купонов', value: stats.activeCoupons, icon: '✅', color: '#16a34a' },
    { label: 'Всего событий', value: stats.totalEvents, icon: '📅', color: '#7c3aed' },
  ]

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Главная</h1>
        <p className="text-sm text-gray-500 mt-1">Добро пожаловать в панель администратора.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <div
                className="w-8 h-8 rounded-full opacity-10"
                style={{ backgroundColor: card.color }}
              />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? (
                <span className="inline-block w-8 h-7 bg-gray-200 animate-pulse rounded" />
              ) : (
                card.value
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Database tools */}
      <div className="mb-10">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Инструменты базы данных</h2>
        <div className="flex flex-col gap-4 max-w-xl">

        {/* Seed spa services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: '#e0f2f1' }}
            >
              🧖
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Заполнить услуги спа</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                Добавить 6 базовых услуг спа в Firestore. Изображения можно добавить через раздел Спа.
              </p>
              <button
                onClick={handleSeedSpa}
                disabled={seedingSpa}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#1a2035' }}
              >
                {seedingSpa ? 'Загрузка...' : 'Заполнить услуги спа'}
              </button>
              {seedSpaMsg && (
                <p className={`mt-3 text-sm font-medium ${seedSpaMsg.startsWith('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedSpaMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seed gallery */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: '#eff6ff' }}
            >
              🖼
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Заполнить галерею</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                Загрузить 20 фото галереи (Senator, Balkon, Спа, VIP, Конференц) в Firebase Storage.
                Займёт ~60-90 секунд.
              </p>
              <button
                onClick={handleSeedGallery}
                disabled={seedingGallery}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#1a2035' }}
              >
                {seedingGallery ? 'Загрузка...' : 'Заполнить галерею'}
              </button>
              {seedGalleryMsg && (
                <p className={`mt-3 text-sm font-medium ${seedGalleryMsg.startsWith('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedGalleryMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seed restaurant photos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: '#fce7f3' }}
            >
              📷
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Заполнить фото ресторанов</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                Загрузить 13 фото (Senator 8 + Balkon 5) в Firebase Storage и создать документы
                в коллекции restaurantPhotos. Займёт ~30-60 секунд.
              </p>
              <button
                onClick={handleSeedPhotos}
                disabled={seedingPhotos}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#1a2035' }}
              >
                {seedingPhotos ? 'Загрузка...' : 'Заполнить фото ресторанов'}
              </button>
              {seedPhotosMsg && (
                <p className={`mt-3 text-sm font-medium ${seedPhotosMsg.startsWith('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedPhotosMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seed menu pages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: '#fff7ed' }}
            >
              📖
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Заполнить меню</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                Загрузить 14 страниц меню (Senator 8 + Balkon 6) в Firebase Storage и создать
                документы в коллекции menu. Займёт ~30-60 секунд.
              </p>
              <button
                onClick={handleSeedMenu}
                disabled={seedingMenu}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#1a2035' }}
              >
                {seedingMenu ? 'Загрузка...' : 'Заполнить меню'}
              </button>
              {seedMenuMsg && (
                <p className={`mt-3 text-sm font-medium ${seedMenuMsg.startsWith('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedMenuMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seed coupons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: '#f59e0b' }}
            >
              🌱
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Заполнить купоны</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                Добавить 4 приветственных (разовых) купона в Firestore. Сезонные и постоянные купоны
                теперь создаются через раздел «Акции» — см. кнопку ниже. Безопасно запускать
                повторно — существующие купоны будут перезаписаны.
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#1a2035' }}
              >
                {seeding ? 'Загрузка...' : 'Заполнить купоны'}
              </button>
              {seedMsg && (
                <p className={`mt-3 text-sm font-medium ${seedMsg.startsWith('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Seed promotions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: '#ede9fe' }}
            >
              📣
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Заполнить акции</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                Добавить 8 акций (4 сезонных + 4 постоянных) — каждая автоматически создаёт
                связанный купон. Безопасно запускать повторно — существующие акции и купоны
                будут перезаписаны.
              </p>
              <button
                onClick={handleSeedPromotions}
                disabled={seedingPromotions}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#1a2035' }}
              >
                {seedingPromotions ? 'Загрузка...' : 'Заполнить акции'}
              </button>
              {seedPromotionsMsg && (
                <p className={`mt-3 text-sm font-medium ${seedPromotionsMsg.startsWith('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedPromotionsMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        </div>
      </div>

    </div>
  )
}
