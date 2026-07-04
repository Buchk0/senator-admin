import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import type { MenuPage, PhotoRestaurant } from '../../types'

type Filter = 'All' | PhotoRestaurant

export default function MenuList() {
  const [pages, setPages] = useState<MenuPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')

  const fetchPages = async () => {
    try {
      const q = query(collection(db, 'menu'), orderBy('order', 'asc'))
      const snap = await getDocs(q)
      setPages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuPage)))
    } catch (err) {
      setError('Не удалось загрузить меню.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPages() }, [])

  const handleToggleActive = async (page: MenuPage) => {
    setTogglingId(page.id)
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, active: !p.active } : p)))
    try {
      await updateDoc(doc(db, 'menu', page.id), { active: !page.active })
    } catch (err) {
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, active: page.active } : p)))
      setError('Не удалось обновить страницу.')
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить страницу меню?')) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, 'menu', id))
      setPages((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError('Не удалось удалить страницу.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = filter === 'All' ? pages : pages.filter((p) => p.restaurant === filter)

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Меню</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} страниц</p>
        </div>
        <Link
          to="/menu/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a2035' }}
        >
          + Добавить страницу
        </Link>
      </div>

      <div className="flex gap-2 mb-5">
        {(['All', 'Senator', 'Balkon'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
            style={filter === f ? { backgroundColor: '#1a2035' } : {}}
          >
            {f === 'All' ? 'Все' : f}
          </button>
        ))}
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">📖</span>
            <p className="text-sm">Страниц меню пока нет.</p>
            <Link to="/menu/new" className="mt-3 text-sm font-medium" style={{ color: '#c69c6d' }}>
              Добавить первую страницу
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Страница</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Ресторан</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Порядок</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Активно</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    {page.imageUrl ? (
                      <img src={page.imageUrl} alt={`page-${page.order}`} className="w-12 h-16 object-cover rounded-md" />
                    ) : (
                      <div className="w-12 h-16 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">—</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-800">{page.restaurant}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{page.order}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(page)}
                      disabled={togglingId === page.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        page.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          page.active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/menu/${page.id}`}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        Изменить
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id)}
                        disabled={deletingId === page.id}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === page.id ? '...' : 'Удалить'}
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
