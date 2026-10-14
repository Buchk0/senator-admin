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

// Promotions are the source of truth for seasonal/always coupons: saving a
// promotion mirrors the same fields into coupons/{id} (same doc id), and
// deleting a promotion deletes that mirrored coupon too. See
// src/pages/promotions/PromotionForm.tsx.
export type PromotionType = Extract<CouponType, 'seasonal' | 'always'>

export interface Promotion {
  id: string
  type: PromotionType
  emoji: string
  restaurant: Restaurant
  active: boolean
  imageUrl: string
  title: LocalizedField
  description: LocalizedField
  terms: LocalizedField
  createdAt: Timestamp
}

export type PromotionFormData = Omit<Promotion, 'id' | 'createdAt'>

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

// Conference hall menus: coffee breaks and business lunches share one
// collection (conferenceMenus) and are told apart by `type`.
export type ConferenceMenuType = 'coffee_break' | 'business_lunch'

export interface ConferenceMenu {
  id: string
  type: ConferenceMenuType
  /** "1 вариант" for coffee breaks, "№1" badge for business lunches */
  title: LocalizedField
  /** Price per person in KZT, as displayed, e.g. "4 500" */
  price: string
  /** One dish per line */
  items: LocalizedField
  /** Coffee break only: drinks, one per line */
  drinks: LocalizedField
  imageUrl: string
  order: number
  active: boolean
  createdAt: Timestamp
}

export type ConferenceMenuFormData = Omit<ConferenceMenu, 'id' | 'createdAt'>
