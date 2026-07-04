import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

interface MenuSeedItem {
  restaurant: 'Senator' | 'Balkon'
  order: number
  path: string   // relative to /public
}

const SEED_MENU: MenuSeedItem[] = [
  ...Array.from({ length: 8 }, (_, i) => ({
    restaurant: 'Senator' as const,
    order: i + 1,
    path: `/seed-assets/menu/senator/${i + 1}.png`,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    restaurant: 'Balkon' as const,
    order: i + 1,
    path: `/seed-assets/menu/balkon/${i + 1}.png`,
  })),
]

async function uploadSeedImage(docId: string, publicPath: string): Promise<string> {
  const res = await fetch(publicPath)
  if (!res.ok) throw new Error(`Fetch failed for ${publicPath}: ${res.status}`)
  const blob = await res.blob()
  const filename = publicPath.split('/').pop() || 'page.png'
  const storageRef = ref(storage, `menu/${docId}/${filename}`)
  await uploadBytes(storageRef, blob)
  return await getDownloadURL(storageRef)
}

export async function seedMenu(): Promise<{ created: number }> {
  let created = 0
  for (const item of SEED_MENU) {
    const newRef = doc(collection(db, 'menu'))
    const imageUrl = await uploadSeedImage(newRef.id, item.path)
    await setDoc(newRef, {
      restaurant: item.restaurant,
      imageUrl,
      order: item.order,
      active: true,
      createdAt: serverTimestamp(),
    })
    created += 1
  }
  return { created }
}
