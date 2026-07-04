import { Timestamp } from 'firebase/firestore'

export type Lang = 'en' | 'ru' | 'kz'

export interface LocalizedField {
  en: string
  ru: string
  kz: string
}

export type CouponType = 'welcome' | 'seasonal' | 'always'
export type Restaurant = 'All' | 'Senator' | 'Balkon'

export interface Coupon {
  id: string
  type: CouponType
  emoji: string
  restaurant: Restaurant
  oneTime: boolean
  active: boolean
  imageUrl: string
  title: LocalizedField
  description: LocalizedField
  terms: LocalizedField
  createdAt: Timestamp
}

export type CouponFormData = Omit<Coupon, 'id' | 'createdAt'>

export interface HotelEvent {
  id: string
  title: LocalizedField
  imageUrl: string
  active: boolean
  createdAt: Timestamp
}

export type EventFormData = Omit<HotelEvent, 'id' | 'createdAt'>

export interface SpaService {
  id: string
  name: LocalizedField
  duration: string
  price: string
  imageUrl: string
  active: boolean
  createdAt: Timestamp
}

export type SpaServiceFormData = Omit<SpaService, 'id' | 'createdAt'>

export interface AdminUser {
  uid: string
  email: string | null
  role: string
}

export type PhotoRestaurant = 'Senator' | 'Balkon'

export interface RestaurantPhoto {
  id: string
  restaurant: PhotoRestaurant
  imageUrl: string
  active: boolean
  createdAt: Timestamp
}

export type RestaurantPhotoFormData = Omit<RestaurantPhoto, 'id' | 'createdAt'>

export interface MenuPage {
  id: string
  restaurant: PhotoRestaurant
  imageUrl: string
  order: number
  active: boolean
  createdAt: Timestamp
}

export type MenuPageFormData = Omit<MenuPage, 'id' | 'createdAt'>

export interface GalleryPhoto {
  id: string
  imageUrl: string
  order: number
  active: boolean
  createdAt: Timestamp
}

export type GalleryPhotoFormData = Omit<GalleryPhoto, 'id' | 'createdAt'>
