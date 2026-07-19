import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import type { PhotoRestaurant } from '../types'

interface PhotoSeedItem {
  restaurant: PhotoRestaurant
  path: string   // relative to /public
}

const SEED_PHOTOS: PhotoSeedItem[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    restaurant: 'Senator' as const,
    path: `/seed-assets/restaurantPhotos/senator/${i + 1}.jpg`,
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    restaurant: 'Balkon' as const,
    path: `/seed-assets/restaurantPhotos/balkon/${i + 1}.jpg`,
  })),
]

async function uploadSeedImage(docId: string, publicPath: string): Promise<string> {
  const res = await fetch(publicPath)
  if (!res.ok) throw new Error(`Fetch failed for ${publicPath}: ${res.status}`)
  const blob = await res.blob()
  const filename = publicPath.split('/').pop() || 'photo.jpg'
  const storageRef = ref(storage, `restaurantPhotos/${docId}/${filename}`)
  await uploadBytes(storageRef, blob)
  return await getDownloadURL(storageRef)
}

export async function seedRestaurantPhotos(): Promise<{ created: number }> {
  let created = 0
  for (const item of SEED_PHOTOS) {
    const newRef = doc(collection(db, 'restaurantPhotos'))
    const imageUrl = await uploadSeedImage(newRef.id, item.path)
    await setDoc(newRef, {
      restaurant: item.restaurant,
      imageUrl,
      active: true,
      createdAt: serverTimestamp(),
    })
    created += 1
  }
  return { created }
}
