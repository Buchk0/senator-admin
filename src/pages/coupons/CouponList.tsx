import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import type { Coupon } from '../../types'

export default function CouponList() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchCoupons = async () => {
    try {
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)))
    } catch (err) {
      setError('Не удалось загрузить купоны.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon.id)
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
    )
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { active: !coupon.active })
    } catch (err) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: coupon.active } : c))
      )
      setError('Не удалось обновить купон.')
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот купон? Это действие нельзя отменить.')) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, 'coupons', id))
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError('Не удалось удалить купон.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const typeColors: Record<string, string> = {
    welcome: 'bg-blue-100 text-blue-700',
    seasonal: 'bg-purple-100 text-purple-700',
    always: 'bg-green-100 text-green-700',
  }

  const typeLabels: Record<string, string> = {
    welcome: 'приветственный',
    seasonal: 'сезонный',
    always: 'постоянный',
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Купоны</h1>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} всего</p>
        </div>
        <Link
          to="/coupons/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a2035' }}
        >
          + Добавить купон
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
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">🎟</span>
            <p className="text-sm">Купонов пока нет.</p>
            <Link to="/coupons/new" className="mt-3 text-sm font-medium" style={{ color: '#c69c6d' }}>
              Добавить первый купон
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[580px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Купон</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Тип</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Ресторан</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Разовый</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Активен</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{coupon.emoji}</span>
                      <span className="font-medium text-gray-800">{coupon.title.en || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[coupon.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {typeLabels[coupon.type] ?? coupon.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{coupon.restaurant}</td>
                  <td className="px-5 py-3 text-gray-600">{coupon.oneTime ? 'Да' : 'Нет'}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      disabled={togglingId === coupon.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        coupon.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={coupon.active ? 'Деактивировать' : 'Активировать'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          coupon.active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/coupons/${coupon.id}`}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        Изменить
                      </Link>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        disabled={deletingId === coupon.id}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === coupon.id ? '...' : 'Удалить'}
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
