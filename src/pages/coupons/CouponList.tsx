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
      setError('Failed to load coupons.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleToggleActive = async (coupon: Coupon) => {
    setTogglingId(coupon.id)
    // Optimistic update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
    )
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { active: !coupon.active })
    } catch (err) {
      // Revert on failure
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: coupon.active } : c))
      )
      setError('Failed to update coupon.')
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, 'coupons', id))
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError('Failed to delete coupon.')
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} total</p>
        </div>
        <Link
          to="/coupons/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a2035' }}
        >
          + Add Coupon
        </Link>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">🎟</span>
            <p className="text-sm">No coupons yet.</p>
            <Link to="/coupons/new" className="mt-3 text-sm font-medium" style={{ color: '#c69c6d' }}>
              Add your first coupon
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Coupon</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Restaurant</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">One-time</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Active</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
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
                      {coupon.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{coupon.restaurant}</td>
                  <td className="px-5 py-3 text-gray-600">{coupon.oneTime ? 'Yes' : 'No'}</td>
                  <td className="px-5 py-3">
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      disabled={togglingId === coupon.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        coupon.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={coupon.active ? 'Deactivate' : 'Activate'}
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
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        disabled={deletingId === coupon.id}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === coupon.id ? '...' : 'Delete'}
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
