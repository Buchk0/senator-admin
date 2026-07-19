import { useEffect, useRef, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  doc,
  getDoc,
  serverTimestamp,
  collection,
  writeBatch,
} from 'firebase/firestore'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { db, storage } from '../../firebase'
import type { PromotionFormData, PromotionType, Restaurant } from '../../types'
import LangTabs from '../../components/LangTabs'

const emptyLocalized = { en: '', ru: '', kz: '' }

const defaultForm: PromotionFormData = {
  type: 'seasonal',
  emoji: '',
  restaurant: 'All',
  active: true,
  imageUrl: '',
  title: { ...emptyLocalized },
  description: { ...emptyLocalized },
  terms: { ...emptyLocalized },
}

const PROMOTION_TYPES: PromotionType[] = ['seasonal', 'always']
const RESTAURANTS: Restaurant[] = ['All', 'Senator', 'Balkon']

const EMOJI_OPTIONS = [
  '🍸','🍹','🍷','🥂','🍾','🍻','☕️','🧃','🧋','🥤',
  '🍽','🍴','🥗','🥩','🍖','🍗','🥐','🍰','🎂','🍫',
  '🍓','🍇','🍒','🍑','🌷','🎁','⭐️','✨','💎','🏨',
  '🛎','🛁','🌿','🕯','🥄','🍵','🧁','🍩','🥞','🫧',
]

export default function PromotionForm() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const [form, setForm] = useState<PromotionFormData>(defaultForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (!emojiOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [emojiOpen])
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isNew) return
    const fetchPromotion = async () => {
      try {
        const snap = await getDoc(doc(db, 'promotions', id!))
        if (snap.exists()) {
          const data = snap.data()
          setForm({
            type: data.type,
            emoji: data.emoji,
            restaurant: data.restaurant,
            active: data.active,
            imageUrl: data.imageUrl ?? '',
            title: data.title,
            description: data.description,
            terms: data.terms,
          })
          setImagePreview(data.imageUrl ?? '')
        } else {
          setError('Акция не найдена.')
        }
      } catch (err) {
        setError('Не удалось загрузить акцию.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPromotion()
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
      // Shared with the mirrored coupon doc — same id, one image.
      const storageRef = ref(storage, `coupons/${docId}/${imageFile.name}`)
      const task = uploadBytesResumable(storageRef, imageFile)
      task.on(
        'state_changed',
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref)),
      )
    })
  }

  const validate = (): string | null => {
    if (!form.emoji.trim()) return 'Выберите эмодзи.'
    if (!form.title.en.trim()) return 'Укажите заголовок (EN).'
    if (!form.description.en.trim()) return 'Укажите описание (EN).'
    if (!form.terms.en.trim()) return 'Укажите условия (EN).'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')

    try {
      const promotionRef = isNew ? doc(collection(db, 'promotions')) : doc(db, 'promotions', id!)
      const imageUrl = await uploadImage(promotionRef.id)
      const promotionData = { ...form, imageUrl }
      // Mirror into coupons/{same id} so the app picks it up through the
      // existing coupons collection — oneTime is always false for
      // promotion-derived coupons (they're recurring, not single-use).
      const couponData = { ...promotionData, oneTime: false }

      const batch = writeBatch(db)
      if (isNew) {
        batch.set(promotionRef, { ...promotionData, createdAt: serverTimestamp() })
        batch.set(doc(db, 'coupons', promotionRef.id), { ...couponData, createdAt: serverTimestamp() })
      } else {
        batch.update(promotionRef, promotionData)
        batch.update(doc(db, 'coupons', id!), couponData)
      }
      await batch.commit()

      navigate('/promotions')
    } catch (err) {
      setError('Не удалось сохранить акцию.')
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
          onClick={() => navigate('/promotions')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Назад к акциям
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Добавить акцию' : 'Редактировать акцию'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">Акция автоматически создаёт (или обновляет) купон с таким же содержимым.</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Row: emoji + type + restaurant */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative" ref={emojiRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Эмодзи <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setEmojiOpen((o) => !o)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white text-left flex items-center gap-2"
            >
              <span className="text-xl">{form.emoji || '📣'}</span>
              <span className="text-gray-400 text-xs">{form.emoji ? 'Изменить' : 'Выбрать'}</span>
            </button>
            {emojiOpen && (
              <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-8 gap-1 w-64 max-w-[calc(100vw-2rem)]">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { setForm({ ...form, emoji: e }); setEmojiOpen(false) }}
                    className={`text-xl p-1 rounded-lg hover:bg-gray-100 transition-colors ${form.emoji === e ? 'bg-amber-50 ring-1 ring-amber-300' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as PromotionType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            >
              {PROMOTION_TYPES.map((t) => (
                <option key={t} value={t}>{t === 'seasonal' ? 'сезонная' : 'постоянная'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ресторан</label>
            <select
              value={form.restaurant}
              onChange={(e) => setForm({ ...form, restaurant: e.target.value as Restaurant })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            >
              {RESTAURANTS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded accent-navy"
            />
            Активна
          </label>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
          {imagePreview && (
            <div className="mb-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
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

        <hr className="border-gray-100" />

        {/* Localized fields */}
        <LangTabs
          label="Заголовок"
          value={form.title}
          onChange={(val) => setForm({ ...form, title: val })}
          required
        />

        <LangTabs
          label="Описание"
          value={form.description}
          onChange={(val) => setForm({ ...form, description: val })}
          multiline
          required
        />

        <LangTabs
          label="Условия"
          value={form.terms}
          onChange={(val) => setForm({ ...form, terms: val })}
          multiline
          required
        />

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#1a2035' }}
          >
            {saving ? (uploadProgress !== null ? `Загрузка ${uploadProgress}%...` : 'Сохранение...') : isNew ? 'Создать акцию' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/promotions')}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
