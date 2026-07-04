import { useEffect, useRef, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase'
import type { MenuPageFormData, PhotoRestaurant } from '../../types'

const defaultForm: MenuPageFormData = {
  restaurant: 'Senator',
  imageUrl: '',
  order: 1,
  active: true,
}

export default function MenuForm() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const [form, setForm] = useState<MenuPageFormData>(defaultForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isNew) return
    const fetchPage = async () => {
      try {
        const snap = await getDoc(doc(db, 'menu', id!))
        if (snap.exists()) {
          const data = snap.data()
          setForm({
            restaurant: data.restaurant,
            imageUrl: data.imageUrl,
            order: data.order ?? 1,
            active: data.active,
          })
          setImagePreview(data.imageUrl || '')
        } else {
          setError('Страница не найдена.')
        }
      } catch (err) {
        setError('Не удалось загрузить страницу.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [id, isNew])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = (docId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!imageFile) { resolve(form.imageUrl); return }
      const storageRef = ref(storage, `menu/${docId}/${imageFile.name}`)
      const uploadTask = uploadBytesResumable(storageRef, imageFile)
      uploadTask.on(
        'state_changed',
        (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
        (err) => reject(err),
        async () => resolve(await getDownloadURL(uploadTask.snapshot.ref)),
      )
    })
  }

  const validate = (): string | null => {
    if (isNew && !imageFile && !form.imageUrl) return 'Изображение обязательно.'
    if (form.order < 1) return 'Порядок должен быть 1 или больше.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setSaving(true)
    setError('')

    try {
      if (isNew) {
        const newRef = doc(collection(db, 'menu'))
        const imageUrl = await uploadImage(newRef.id)
        await setDoc(newRef, { ...form, imageUrl, createdAt: serverTimestamp() })
      } else {
        const imageUrl = await uploadImage(id!)
        await updateDoc(doc(db, 'menu', id!), { ...form, imageUrl })
      }
      navigate('/menu')
    } catch (err) {
      setError('Не удалось сохранить страницу.')
      console.error(err)
      setSaving(false)
      setUploadProgress(null)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-6">
        <button onClick={() => navigate('/menu')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
          ← Назад к меню
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Добавить страницу' : 'Редактировать страницу'}</h1>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ресторан</label>
          <div className="flex gap-2">
            {(['Senator', 'Balkon'] as PhotoRestaurant[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, restaurant: r })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.restaurant === r ? 'text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
                style={form.restaurant === r ? { backgroundColor: '#1a2035' } : {}}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Порядок (номер страницы)</label>
          <input
            type="number"
            min={1}
            value={form.order}
            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
            className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Изображение {isNew && <span className="text-red-500">*</span>}
          </label>
          {imagePreview && (
            <div className="mb-3">
              <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-contain rounded-lg border border-gray-200 bg-gray-50" />
            </div>
          )}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <p className="text-sm text-gray-500">{imageFile ? imageFile.name : 'Нажмите, чтобы выбрать изображение'}</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP до 10 МБ</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {uploadProgress !== null && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, backgroundColor: '#c69c6d' }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}% загружено</p>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="w-4 h-4 rounded accent-navy"
          />
          Активно
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#1a2035' }}
          >
            {saving ? (uploadProgress !== null ? `Загрузка ${uploadProgress}%...` : 'Сохранение...') : isNew ? 'Создать страницу' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
