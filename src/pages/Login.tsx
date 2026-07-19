import { useState, FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const email = `${phone.replace(/[^0-9]/g, '')}@senator.kz`

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', credential.user.uid))

      if (!snap.exists() || snap.data().role !== 'admin') {
        await auth.signOut()
        setError('Доступ запрещён. Требуются права администратора.')
        setLoading(false)
        return
      }

      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      if (message.includes('invalid-credential') || message.includes('wrong-password') || message.includes('user-not-found')) {
        setError('Неверный номер или пароль.')
      } else if (message.includes('too-many-requests')) {
        setError('Слишком много попыток. Попробуйте позже.')
      } else {
        setError('Ошибка входа. Проверьте данные.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{ backgroundColor: '#1a2035' }}
          >
            <span style={{ color: '#c69c6d' }}>S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Senator Hotel</h1>
          <p className="text-sm text-gray-500 mt-1">Панель администратора</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Номер телефона
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 777 000 00 00"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#1a2035', color: '#c69c6d' }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
