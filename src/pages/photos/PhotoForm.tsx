import { useEffect, useRef, useState, FormEvent } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { db, storage } from '../../firebase'
import type { RestaurantPhotoFormData, PhotoRestaurant } from '../../types'

const RESTAURANT_BY_SLUG: Record<string, PhotoRestaurant> = {
  senator: 'Senator',
  balkon: 'Balkon',
}

export default function PhotoForm() {
  const { restaurant: slug, id } = useParams<{ restaurant: string; id?: string }>()
  const restaurant = slug ? RESTAURANT_BY_SLUG[slug] : undefined
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const [form, setForm] = useState<RestaurantPhotoFormData>({
    restaurant: restaurant ?? 'Senator',
    imageUrl: '',
    active: true,
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isNew || !id) return
    const fetchPhoto = async () => {
      try {
        const snap = await getDoc(doc(db, 'restaurantPhotos', id))
        if (snap.exists()) {
          const data = snap.data()
          setForm({
            restaurant: data.restaurant,
            imageUrl: data.imageUrl,
            active: data.active,
          })
          setImagePreview(data.imageUrl || '')
        } else {
          setError('Фото не найдено.')
        }
      } catch (err) {
        setError('Не удалось загрузить фото.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPhoto()
  }, [id, isNew])

  if (!restaurant) return <Navigate to="/photos/senator" replace />

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = (docId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!imageFile) { resolve(form.imageUrl); return }
      const storageRef = ref(storage, `restaurantPhotos/${docId}/${imageFile.name}`)
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
        const newRef = doc(collection(db, 'restaurantPhotos'))
        const imageUrl = await uploadImage(newRef.id)
        await setDoc(newRef, { ...form, restaurant, imageUrl, createdAt: serverTimestamp() })
      } else {
        const imageUrl = await uploadImage(id!)
        await updateDoc(doc(db, 'restaurantPhotos', id!), { ...form, restaurant, imageUrl })
      }
      navigate(`/photos/${slug}`)
    } catch (err) {
      setError('Не удалось сохранить фото.')
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
        <button
          onClick={() => navigate(`/photos/${slug}`)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Назад к фотографиям
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? `Добавить фото — ${restaurant}` : `Редактировать фото — ${restaurant}`}
        </h1>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Изображение {isNew && <span className="text-red-500">*</span>}
          </label>
          {imagePreview && (
            <div className="mb-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <p className="text-sm text-gray-500">
              {imageFile ? imageFile.name : 'Нажмите, чтобы выбрать изображение'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP до 10 МБ</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploadProgress !== null && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${uploadProgress}%`, backgroundColor: '#c69c6d' }}
                />
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
            {saving ? (uploadProgress !== null ? `Загрузка ${uploadProgress}%...` : 'Сохранение...') : isNew ? 'Создать фото' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/photos/${slug}`)}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
