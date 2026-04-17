import { useEffect, useState } from 'react'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import { seedCoupons } from '../utils/seedCoupons'
import { seedSpaServices } from '../utils/seedSpaServices'

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
        setError('Failed to load stats.')
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
      setSeedMsg('All 12 coupons seeded successfully!')
    } catch (err) {
      setSeedMsg('Error seeding coupons. Check console.')
      console.error(err)
    } finally {
      setSeeding(false)
    }
  }

  const handleSeedSpa = async () => {
    setSeedingSpa(true)
    setSeedSpaMsg('')
    try {
      await seedSpaServices()
      setSeedSpaMsg('6 spa services seeded successfully!')
    } catch (err) {
      setSeedSpaMsg('Error seeding spa services. Check console.')
      console.error(err)
    } finally {
      setSeedingSpa(false)
    }
  }

  const statCards = [
    { label: 'Total Coupons', value: stats.totalCoupons, icon: '🎟', color: '#1a2035' },
    { label: 'Active Coupons', value: stats.activeCoupons, icon: '✅', color: '#16a34a' },
    { label: 'Total Events', value: stats.totalEvents, icon: '📅', color: '#7c3aed' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back to the Senator Hotel admin panel.</p>
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
        <h2 className="text-base font-semibold text-gray-700 mb-4">Database Tools</h2>
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
              <p className="font-semibold text-gray-900">Seed Spa Services</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                Push 6 default spa services to Firestore. Images can be added via the Spa section.
              </p>
              <button
                onClick={handleSeedSpa}
                disabled={seedingSpa}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#1a2035' }}
              >
                {seedingSpa ? 'Seeding...' : 'Seed Spa Services'}
              </button>
              {seedSpaMsg && (
                <p className={`mt-3 text-sm font-medium ${seedSpaMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedSpaMsg}
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
              <p className="font-semibold text-gray-900">Seed Default Coupons</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                Push all 12 default coupons (Welcome, Seasonal, Always) to Firestore.
                Safe to run multiple times — existing coupons will be overwritten.
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: '#1a2035' }}
              >
                {seeding ? 'Seeding...' : 'Seed Coupons'}
              </button>
              {seedMsg && (
                <p className={`mt-3 text-sm font-medium ${seedMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {seedMsg}
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
