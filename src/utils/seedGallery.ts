import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

const TOTAL = 20

async function uploadSeedImage(docId: string, publicPath: string): Promise<string> {
  const res = await fetch(publicPath)
  if (!res.ok) throw new Error(`Fetch failed for ${publicPath}: ${res.status}`)
  const blob = await res.blob()
  const filename = publicPath.split('/').pop() || 'photo.jpg'
  const storageRef = ref(storage, `gallery/${docId}/${filename}`)
  await uploadBytes(storageRef, blob)
  return await getDownloadURL(storageRef)
}

export async function seedGallery(): Promise<{ created: number }> {
  let created = 0
  for (let i = 1; i <= TOTAL; i++) {
    const num = i.toString().padStart(2, '0')
    const path = `/seed-assets/gallery/${num}.jpg`
    const newRef = doc(collection(db, 'gallery'))
    const imageUrl = await uploadSeedImage(newRef.id, path)
    await setDoc(newRef, {
      imageUrl,
      order: i,
      active: true,
      createdAt: serverTimestamp(),
    })
    created += 1
  }
  return { created }
}
