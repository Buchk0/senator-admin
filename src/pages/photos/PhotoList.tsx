import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query, where } from 'firebase/firestore'
import { Link, useParams, Navigate } from 'react-router-dom'
import { db } from '../../firebase'
import type { RestaurantPhoto, PhotoRestaurant } from '../../types'

const RESTAURANT_BY_SLUG: Record<string, PhotoRestaurant> = {
  senator: 'Senator',
  balkon: 'Balkon',
}

export default function PhotoList() {
  const { restaurant: slug } = useParams<{ restaurant: string }>()
  const restaurant = slug ? RESTAURANT_BY_SLUG[slug] : undefined

  const [photos, setPhotos] = useState<RestaurantPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchPhotos = async () => {
    if (!restaurant) return
    try {
      const q = query(
        collection(db, 'restaurantPhotos'),
        where('restaurant', '==', restaurant),
        orderBy('createdAt', 'desc'),
      )
      const snap = await getDocs(q)
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RestaurantPhoto)))
    } catch (err) {
      setError('Не удалось загрузить фотографии.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPhotos() }, [restaurant])

  if (!restaurant) return <Navigate to="/photos/senator" replace />

  const handleToggleActive = async (photo: RestaurantPhoto) => {
    setTogglingId(photo.id)
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, active: !p.active } : p)))
    try {
      await updateDoc(doc(db, 'restaurantPhotos', photo.id), { active: !photo.active })
    } catch (err) {
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, active: photo.active } : p)))
      setError('Не удалось обновить фото.')
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить фото? Это действие нельзя отменить.')) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, 'restaurantPhotos', id))
      setPhotos((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError('Не удалось удалить фото.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Фотографии — {restaurant}</h1>
          <p className="text-sm text-gray-500 mt-1">{photos.length} всего</p>
        </div>
        <Link
          to={`/photos/${slug}/new`}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a2035' }}
        >
          + Добавить фото
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
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">📷</span>
            <p className="text-sm">Фотографий пока нет.</p>
            <Link to={`/photos/${slug}/new`} className="mt-3 text-sm font-medium" style={{ color: '#c69c6d' }}>
              Добавить первое фото
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Фото</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Активно</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {photos.map((photo) => (
                <tr key={photo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    {photo.imageUrl ? (
                      <img
                        src={photo.imageUrl}
                        alt={photo.restaurant}
                        className="w-16 h-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(photo)}
                      disabled={togglingId === photo.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        photo.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={photo.active ? 'Деактивировать' : 'Активировать'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          photo.active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/photos/${slug}/${photo.id}`}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        Изменить
                      </Link>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        disabled={deletingId === photo.id}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === photo.id ? '...' : 'Удалить'}
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
