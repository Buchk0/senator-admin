import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore'
import { Link, Navigate, useParams } from 'react-router-dom'
import { db } from '../../firebase'
import type { ConferenceMenu } from '../../types'
import { CONFERENCE_KINDS } from './kinds'
import { seedConferenceMenus } from '../../utils/seedConferenceMenus'

export default function ConferenceMenuList() {
  const { kind = '' } = useParams<{ kind: string }>()
  const config = CONFERENCE_KINDS[kind]

  const [menus, setMenus] = useState<ConferenceMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!config) return
    const fetchMenus = async () => {
      setLoading(true)
      try {
        // Sorted client-side so this list needs no extra composite index
        const q = query(collection(db, 'conferenceMenus'), where('type', '==', config.type))
        const snap = await getDocs(q)
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConferenceMenu))
        setMenus(items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
      } catch (err) {
        setError('Не удалось загрузить список.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchMenus()
  }, [config, reloadKey])

  if (!config) return <Navigate to="/" replace />

  const handleToggleActive = async (menu: ConferenceMenu) => {
    setTogglingId(menu.id)
    setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, active: !m.active } : m)))
    try {
      await updateDoc(doc(db, 'conferenceMenus', menu.id), { active: !menu.active })
    } catch (err) {
      setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, active: menu.active } : m)))
      setError('Не удалось обновить запись.')
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  // Offered only while the list is empty, so a re-seed can never duplicate or overwrite real entries
  const handleSeed = async () => {
    setSeeding(true)
    setError('')
    try {
      await seedConferenceMenus(config.type)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError('Не удалось заполнить данными из макета. Проверьте консоль.')
      console.error(err)
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.')) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, 'conferenceMenus', id))
      setMenus((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError('Не удалось удалить запись.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{menus.length} всего</p>
        </div>
        <Link
          to={`/conference/${kind}/new`}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a2035' }}
        >
          + Добавить
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
        ) : menus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">🍽</span>
            <p className="text-sm">Записей пока нет.</p>
            <Link to={`/conference/${kind}/new`} className="mt-3 text-sm font-medium" style={{ color: '#c69c6d' }}>
              Добавить первый {config.item}
            </Link>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              {seeding ? 'Заполнение...' : 'Заполнить данными из макета'}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Фото</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Название</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Цена</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Порядок</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Активен</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.title.ru || menu.title.en} className="w-12 h-9 object-cover rounded-md" />
                    ) : (
                      <div className="w-12 h-9 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">—</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-800">{menu.title.ru || menu.title.en || '—'}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{menu.price ? `${menu.price} ₸` : '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{menu.order}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(menu)}
                      disabled={togglingId === menu.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        menu.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={menu.active ? 'Деактивировать' : 'Активировать'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          menu.active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/conference/${kind}/${menu.id}`}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        Изменить
                      </Link>
                      <button
                        onClick={() => handleDelete(menu.id)}
                        disabled={deletingId === menu.id}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === menu.id ? '...' : 'Удалить'}
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
