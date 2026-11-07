export type CategoryId = 'hair' | 'nails' | 'skin' | 'makeup'

export interface Category {
  id: CategoryId
  name: string
  blurb: string
  tokenLetter: string
  photo: string
}

export interface Service {
  id: string
  category: CategoryId
  name: string
  durationMin: number
  price: number
  offerPrice?: number
  popular?: boolean
}

export interface Product {
  id: string
  name: string
  size: string
  price: number
  image: string
  categories: CategoryId[]
  why: string
}

export interface Stylist {
  id: string
  name: string
  role: string
  categories: CategoryId[]
}

export interface Branch {
  id: string
  name: string
  area: string
}

export interface PackagePlan {
  id: string
  name: string
  serviceId: string
  sessions: number
  price: number
  validityDays: number
  perks: string
}

export const CATEGORIES: Category[] = [
  { id: 'hair', name: 'Hair', blurb: 'Cuts, styling, colour & more', tokenLetter: 'A', photo: '/img/stylist-blowdry.jpg' },
  { id: 'nails', name: 'Nails', blurb: 'Manicure, pedicure & nail art', tokenLetter: 'B', photo: '/img/product-nail-care.jpg' },
  { id: 'skin', name: 'Skin', blurb: 'Facials, cleansing & skin care', tokenLetter: 'C', photo: '/img/salon-relax.jpg' },
  { id: 'makeup', name: 'Makeup', blurb: 'Everyday, party & bridal looks', tokenLetter: 'D', photo: '/img/hero-woman.jpg' },
]

export const SERVICES: Service[] = [
  { id: 'hair-cut-blowdry', category: 'hair', name: 'Haircut & Blow-dry', durationMin: 60, price: 120, popular: true },
  { id: 'hair-blowdry', category: 'hair', name: 'Blow-dry', durationMin: 30, price: 80, popular: true },
  { id: 'hair-styling', category: 'hair', name: 'Hair styling', durationMin: 45, price: 150 },
  { id: 'hair-colour', category: 'hair', name: 'Root colour', durationMin: 90, price: 250 },
  { id: 'hair-keratin', category: 'hair', name: 'Keratin treatment', durationMin: 150, price: 450 },
  { id: 'hair-spa', category: 'hair', name: 'Hair spa', durationMin: 60, price: 180 },

  { id: 'nails-manicure', category: 'nails', name: 'Classic manicure', durationMin: 40, price: 90, popular: true },
  { id: 'nails-gel', category: 'nails', name: 'Gel manicure', durationMin: 60, price: 140 },
  { id: 'nails-pedicure', category: 'nails', name: 'Classic pedicure', durationMin: 50, price: 110 },
  { id: 'nails-art', category: 'nails', name: 'Nail art (full set)', durationMin: 45, price: 120 },

  { id: 'skin-hydrafacial', category: 'skin', name: 'Hydra facial', durationMin: 60, price: 350, offerPrice: 280, popular: true },
  { id: 'skin-cleansing', category: 'skin', name: 'Deep cleansing facial', durationMin: 50, price: 220, offerPrice: 176 },
  { id: 'skin-brightening', category: 'skin', name: 'Brightening facial', durationMin: 60, price: 260, offerPrice: 208 },
  { id: 'skin-threading', category: 'skin', name: 'Eyebrow threading', durationMin: 15, price: 40 },

  { id: 'makeup-everyday', category: 'makeup', name: 'Everyday makeup', durationMin: 45, price: 200 },
  { id: 'makeup-party', category: 'makeup', name: 'Party makeup', durationMin: 75, price: 350, popular: true },
  { id: 'makeup-bridal-trial', category: 'makeup', name: 'Bridal trial', durationMin: 120, price: 600 },
  { id: 'makeup-lash-lift', category: 'makeup', name: 'Lash lift', durationMin: 45, price: 180 },
]

export const PRODUCTS: Product[] = [
  {
    id: 'p-argan-serum',
    name: 'Argan repair hair serum',
    size: '30 ml',
    price: 95,
    image: '/img/product-hair-serum.jpg',
    categories: ['hair'],
    why: 'Keeps your blow-dry glossy and frizz-free for days.',
  },
  {
    id: 'p-heat-mist',
    name: 'Heat protect styling mist',
    size: '150 ml',
    price: 75,
    image: '/img/product-heat-spray.jpg',
    categories: ['hair'],
    why: 'Shields hair from heat before every styling at home.',
  },
  {
    id: 'p-nail-trio',
    name: 'Cuticle oil & polish trio',
    size: '4 × 10 ml',
    price: 85,
    image: '/img/product-nail-care.jpg',
    categories: ['nails'],
    why: 'Touch up chips and keep cuticles soft between visits.',
  },
  {
    id: 'p-vitc-serum',
    name: 'Vitamin C glow serum',
    size: '30 ml',
    price: 140,
    image: '/img/product-vitc-serum.jpg',
    categories: ['skin'],
    why: 'Extends the glow of your facial with daily brightening.',
  },
  {
    id: 'p-spf50',
    name: 'Mineral sunscreen SPF 50',
    size: '50 ml',
    price: 90,
    image: '/img/product-sunscreen.jpg',
    categories: ['skin', 'makeup'],
    why: 'Freshly treated skin needs sun protection for a week.',
  },
  {
    id: 'p-lip-trio',
    name: 'Lipstick trio & setting mist',
    size: '3 × 3.5 g + 100 ml',
    price: 160,
    image: '/img/product-lipstick.jpg',
    categories: ['makeup'],
    why: 'Re-create your look and make it last all evening.',
  },
]

export const STYLISTS: Stylist[] = [
  { id: 'st-amal', name: 'Amal Nasser', role: 'Senior hair stylist', categories: ['hair'] },
  { id: 'st-reem', name: 'Reem Khalid', role: 'Colour specialist', categories: ['hair'] },
  { id: 'st-lina', name: 'Lina Farouk', role: 'Nail artist', categories: ['nails'] },
  { id: 'st-maya', name: 'Maya Haddad', role: 'Skin therapist', categories: ['skin'] },
  { id: 'st-hana', name: 'Hana Yousef', role: 'Makeup artist', categories: ['makeup', 'skin'] },
]

export const ANY_STYLIST = 'any'

export const BRANCHES: Branch[] = [
  { id: 'west-bay', name: 'West Bay', area: 'Diplomatic Area, Doha' },
  { id: 'the-pearl', name: 'The Pearl', area: 'Porto Arabia, Doha' },
  { id: 'lusail', name: 'Lusail', area: 'Marina District, Lusail' },
]

export const PACKAGE_PLANS: PackagePlan[] = [
  { id: 'pk-glow', name: 'Glow Care Pass', serviceId: 'skin-hydrafacial', sessions: 3, price: 750, validityDays: 120, perks: '3 Hydra facials · save QAR 300' },
  { id: 'pk-blowdry', name: 'Blow-dry Bundle', serviceId: 'hair-blowdry', sessions: 6, price: 400, validityDays: 90, perks: '6 blow-dries · save QAR 80' },
  { id: 'pk-nails', name: 'Nail Care Club', serviceId: 'nails-manicure', sessions: 4, price: 300, validityDays: 90, perks: '4 manicures · save QAR 60' },
  { id: 'pk-spa', name: 'Hair Spa Ritual', serviceId: 'hair-spa', sessions: 3, price: 450, validityDays: 120, perks: '3 hair spas · save QAR 90' },
]

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id)
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)
export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!
export const branchById = (id: string) => BRANCHES.find((b) => b.id === id)
export const stylistById = (id: string) => STYLISTS.find((s) => s.id === id)
export const planById = (id: string) => PACKAGE_PLANS.find((p) => p.id === id)

export const servicePrice = (s: Service) => s.offerPrice ?? s.price
