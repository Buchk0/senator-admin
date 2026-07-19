import { useEffect, useState } from 'react'
import { collection, getDocs, doc, orderBy, query, writeBatch } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import type { Promotion } from '../../types'

export default function PromotionList() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchPromotions = async () => {
    try {
      const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setPromotions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Promotion)))
    } catch (err) {
      setError('Не удалось загрузить акции.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPromotions() }, [])

  const handleToggleActive = async (promotion: Promotion) => {
    setTogglingId(promotion.id)
    setPromotions((prev) =>
      prev.map((p) => (p.id === promotion.id ? { ...p, active: !p.active } : p))
    )
    try {
      // Keep the mirrored coupon's active flag in sync so it disappears from
      // the app the moment the promotion is deactivated, and vice versa.
      const batch = writeBatch(db)
      batch.update(doc(db, 'promotions', promotion.id), { active: !promotion.active })
      batch.update(doc(db, 'coupons', promotion.id), { active: !promotion.active })
      await batch.commit()
    } catch (err) {
      setPromotions((prev) =>
        prev.map((p) => (p.id === promotion.id ? { ...p, active: promotion.active } : p))
      )
      setError('Не удалось обновить акцию.')
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить акцию? Связанный купон тоже будет удалён. Это действие нельзя отменить.')) return
    setDeletingId(id)
    try {
      const batch = writeBatch(db)
      batch.delete(doc(db, 'promotions', id))
      batch.delete(doc(db, 'coupons', id))
      await batch.commit()
      setPromotions((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError('Не удалось удалить акцию.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const typeColors: Record<string, string> = {
    seasonal: 'bg-purple-100 text-purple-700',
    always: 'bg-green-100 text-green-700',
  }

  const typeLabels: Record<string, string> = {
    seasonal: 'сезонная',
    always: 'постоянная',
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Акции</h1>
          <p className="text-sm text-gray-500 mt-1">{promotions.length} всего · автоматически становятся купонами</p>
        </div>
        <Link
          to="/promotions/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a2035' }}
        >
          + Добавить акцию
        </Link>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">📣</span>
            <p className="text-sm">Акций пока нет.</p>
            <Link to="/promotions/new" className="mt-3 text-sm font-medium" style={{ color: '#c69c6d' }}>
              Добавить первую акцию
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Акция</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Тип</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Ресторан</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Активна</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{promotion.emoji}</span>
                      <span className="font-medium text-gray-800">{promotion.title.en || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[promotion.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {typeLabels[promotion.type] ?? promotion.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{promotion.restaurant}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(promotion)}
                      disabled={togglingId === promotion.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        promotion.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={promotion.active ? 'Деактивировать' : 'Активировать'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          promotion.active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/promotions/${promotion.id}`}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        Изменить
                      </Link>
                      <button
                        onClick={() => handleDelete(promotion.id)}
                        disabled={deletingId === promotion.id}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === promotion.id ? '...' : 'Удалить'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
