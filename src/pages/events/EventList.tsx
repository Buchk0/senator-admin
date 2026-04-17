import { useEffect, useState } from 'react'
import { collection, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import type { HotelEvent } from '../../types'

export default function EventList() {
  const [events, setEvents] = useState<HotelEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HotelEvent)))
    } catch (err) {
      setError('Failed to load events.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const handleToggleActive = async (event: HotelEvent) => {
    setTogglingId(event.id)
    // Optimistic update
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, active: !e.active } : e))
    )
    try {
      await updateDoc(doc(db, 'events', event.id), { active: !event.active })
    } catch (err) {
      // Revert on failure
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, active: event.active } : e))
      )
      setError('Failed to update event.')
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, 'events', id))
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError('Failed to delete event.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} total</p>
        </div>
        <Link
          to="/events/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1a2035' }}
        >
          + Add Event
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
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">📅</span>
            <p className="text-sm">No events yet.</p>
            <Link to="/events/new" className="mt-3 text-sm font-medium" style={{ color: '#c69c6d' }}>
              Add your first event
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Image</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Active</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title.en}
                        className="w-12 h-9 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-9 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-800">{event.title.en || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(event)}
                      disabled={togglingId === event.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        event.active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={event.active ? 'Deactivate' : 'Activate'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          event.active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/events/${event.id}`}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === event.id ? '...' : 'Delete'}
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
