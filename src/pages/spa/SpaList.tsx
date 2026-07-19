import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import type { SpaService } from '../../types'

export default function SpaList() {
  const [services, setServices] = useState<SpaService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchServices = async () => {
    try {
      const q = query(collection(db, 'spa_services'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SpaService)))
    } catch (err) {
      setError('Не удалось загрузить услуги.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  const handleToggleActive = async (service: SpaService) => {
    setTogglingId(service.id)
    const updated = { ...service, active: !service.active }
    setServices((prev) => prev.map((s) => s.id === service.id ? updated : s))
    try {
      await updateDoc(doc(db, 'spa_services', service.id), { active: !service.active })
    } catch (err) {
      setServices((prev) => prev.map((s) => s.id === service.id ? service : s))
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту услугу?')) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, 'spa_services', id))
      setServices((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError('Не удалось удалить услугу.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Услуги спа</h1>
          <p className="text-sm text-gray-500 mt-1">{services.length} услуг</p>
        </div>
        <Link
          to="/spa/new"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a2035' }}
        >
          + Добавить услугу
        </Link>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#c69c6d', borderTopColor: 'transparent' }} />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-3">🧖</p>
          <p className="text-gray-500 text-sm">Услуг пока нет.</p>
          <Link to="/spa/new" className="mt-4 inline-block text-sm font-semibold" style={{ color: '#c69c6d' }}>
            Добавить первую услугу →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Фото</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Название</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Длительность</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Цена</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Активен</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name.en}
                        className="w-12 h-9 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-9 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">—</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-800">{service.name.en || '—'}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{service.duration || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{service.price || '—'}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(service)}
                      disabled={togglingId === service.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        service.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          service.active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/spa/${service.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#1a2035' }}
                      >
                        Изменить
                      </Link>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                        className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === service.id ? 'Удаление…' : 'Удалить'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
