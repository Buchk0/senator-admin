import { useEffect, useState } from 'react'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { db } from '../firebase'

interface Stats {
  totalCoupons: number
  activeCoupons: number
  totalEvents: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalCoupons: 0, activeCoupons: 0, totalEvents: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    </div>
  )
}
