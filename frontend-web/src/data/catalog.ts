export type CategoryId = 'hair' | 'nails' | 'skin' | 'makeup'

export interface Category {
  id: CategoryId
  name: string
  blurb: string
  photo: string
}

export interface Service {
  id: string
  category: CategoryId
  name: string
  description: string
  durationMin: number
  price: number
  offerPrice?: number
  popular?: boolean
  /** Set for salon machines booked by the session; `units` is how many each branch has. */
  machine?: { units: number; photo: string }
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
  photo: string
}

export const CATEGORIES: Category[] = [
  { id: 'hair', name: 'Hair', blurb: 'Cuts, styling, colour & more', photo: '/img/stylist-blowdry.jpg' },
  { id: 'nails', name: 'Nails', blurb: 'Manicure, pedicure & nail art', photo: '/img/product-nail-care.jpg' },
  { id: 'skin', name: 'Skin', blurb: 'Facials, cleansing & skin care', photo: '/img/salon-relax.jpg' },
  { id: 'makeup', name: 'Makeup', blurb: 'Everyday, party & bridal looks', photo: '/img/hero-woman.jpg' },
]

export const SERVICES: Service[] = [
  { id: 'hair-cut-blowdry', category: 'hair', name: 'Haircut & Blow-dry', description: 'Consultation, wash, precision cut and a smooth blow-dry finish.', durationMin: 60, price: 120, popular: true },
  { id: 'hair-blowdry', category: 'hair', name: 'Blow-dry', description: 'Wash and a sleek or bouncy blow-dry, styled the way you like.', durationMin: 30, price: 80, popular: true },
  { id: 'hair-styling', category: 'hair', name: 'Hair styling', description: 'Curls, waves or an elegant updo for events and evenings out.', durationMin: 45, price: 150 },
  { id: 'hair-colour', category: 'hair', name: 'Root colour', description: 'Root touch-up matched to your shade, finished with a gloss.', durationMin: 90, price: 250 },
  { id: 'hair-keratin', category: 'hair', name: 'Keratin treatment', description: 'Smoothing treatment that tames frizz for weeks of easy styling.', durationMin: 150, price: 450 },
  { id: 'hair-spa', category: 'hair', name: 'Hair spa', description: 'Deep-conditioning mask, scalp massage and steam for soft hair.', durationMin: 60, price: 180 },

  { id: 'nails-manicure', category: 'nails', name: 'Classic manicure', description: 'Shaping, cuticle care, hand massage and polish of your choice.', durationMin: 40, price: 90, popular: true },
  { id: 'nails-gel', category: 'nails', name: 'Gel manicure', description: 'Chip-resistant gel colour with a long-lasting high-shine finish.', durationMin: 60, price: 140 },
  { id: 'nails-pedicure', category: 'nails', name: 'Classic pedicure', description: 'Foot soak, scrub, nail shaping, massage and polish.', durationMin: 50, price: 110 },
  { id: 'nails-art', category: 'nails', name: 'Nail art (full set)', description: 'Custom designs, chrome or French tips across a full set.', durationMin: 45, price: 120 },

  { id: 'skin-hydrafacial', category: 'skin', name: 'Hydra facial', description: 'Cleanse, exfoliate, extract and hydrate for an instant glow.', durationMin: 60, price: 350, offerPrice: 280, popular: true },
  { id: 'skin-cleansing', category: 'skin', name: 'Deep cleansing facial', description: 'Steam, extraction and a purifying mask for congested skin.', durationMin: 50, price: 220, offerPrice: 176 },
  { id: 'skin-brightening', category: 'skin', name: 'Brightening facial', description: 'Vitamin C treatment to even out tone and boost radiance.', durationMin: 60, price: 260, offerPrice: 208 },
  { id: 'skin-threading', category: 'skin', name: 'Eyebrow threading', description: 'Precise brow shaping with thread for clean, defined arches.', durationMin: 15, price: 40 },

  { id: 'makeup-everyday', category: 'makeup', name: 'Everyday makeup', description: 'A fresh, natural look for work, brunch or daytime events.', durationMin: 45, price: 200 },
  { id: 'makeup-party', category: 'makeup', name: 'Party makeup', description: 'Full glam with lashes, contour and a long-wear finish.', durationMin: 75, price: 350, popular: true },
  { id: 'makeup-bridal-trial', category: 'makeup', name: 'Bridal trial', description: 'Plan and test your bridal look with your artist before the day.', durationMin: 120, price: 600 },
  { id: 'makeup-lash-lift', category: 'makeup', name: 'Lash lift', description: 'Lift and tint your natural lashes — no extensions needed.', durationMin: 45, price: 180 },
]

/** Salon machines a customer can reserve for a session at a chosen time. */
export const MACHINES: Service[] = [
  { id: 'mc-hair-steamer', category: 'hair', name: 'Ozone hair steamer', description: 'Warm ozone steam that opens the cuticle so masks and treatments soak in.', durationMin: 30, price: 60, machine: { units: 3, photo: '/img/machine-hair-steamer.jpg' } },
  { id: 'mc-hair-rollerball', category: 'hair', name: 'Rollerball colour processor', description: 'Infrared heat that speeds up colour and treatment processing evenly.', durationMin: 30, price: 50, machine: { units: 2, photo: '/img/machine-rollerball.jpg' } },
  { id: 'mc-hair-hood-dryer', category: 'hair', name: 'Hooded hair dryer', description: 'Gentle, even hood drying for rollers, sets and deep-conditioning masks.', durationMin: 30, price: 40, machine: { units: 4, photo: '/img/machine-hood-dryer.jpg' } },
  { id: 'mc-hair-scalp-mist', category: 'hair', name: 'Scalp micro-mist machine', description: 'Nano-mist that hydrates the scalp and helps treatments absorb deeper.', durationMin: 30, price: 80, machine: { units: 2, photo: '/img/machine-scalp-mist.jpg' } },

  { id: 'mc-nails-pedi-spa', category: 'nails', name: 'Pedicure spa chair', description: 'Massage chair with a whirlpool foot bath for a deep, relaxing soak.', durationMin: 45, price: 70, machine: { units: 4, photo: '/img/machine-pedicure-spa.jpg' } },
  { id: 'mc-nails-led', category: 'nails', name: 'LED gel curing station', description: 'Fast LED lamp station that cures gel polish evenly in minutes.', durationMin: 20, price: 30, machine: { units: 4, photo: '/img/machine-led-gel.jpg' } },
  { id: 'mc-nails-paraffin', category: 'nails', name: 'Paraffin wax bath', description: 'Warm paraffin dip that softens hands and feet and soothes dry skin.', durationMin: 20, price: 45, machine: { units: 3, photo: '/img/machine-paraffin.jpg' } },
  { id: 'mc-nails-efile', category: 'nails', name: 'Nail drill (e-file) station', description: 'Precision e-file for shaping, gel removal and smooth cuticle prep.', durationMin: 30, price: 50, machine: { units: 3, photo: '/img/machine-nail-drill.jpg' } },

  { id: 'mc-skin-microderm', category: 'skin', name: 'Microdermabrasion machine', description: 'Diamond-tip exfoliation that lifts dead skin for a smoother, brighter look.', durationMin: 45, price: 220, machine: { units: 2, photo: '/img/machine-microderm.jpg' } },
  { id: 'mc-skin-led', category: 'skin', name: 'LED light therapy panel', description: 'Red and blue light to calm, clear and rejuvenate the skin.', durationMin: 20, price: 90, machine: { units: 2, photo: '/img/machine-led-therapy.jpg' } },
  { id: 'mc-skin-steamer', category: 'skin', name: 'Facial steamer (vapozone)', description: 'Warm ozone steam that opens pores before cleansing and extractions.', durationMin: 20, price: 60, machine: { units: 3, photo: '/img/machine-facial-steamer.jpg' } },
  { id: 'mc-skin-rf', category: 'skin', name: 'RF skin-tightening machine', description: 'Radiofrequency warmth that firms and lifts for a smoother contour.', durationMin: 40, price: 260, machine: { units: 1, photo: '/img/machine-rf-tightening.jpg' } },

  { id: 'mc-makeup-airbrush', category: 'makeup', name: 'Airbrush makeup station', description: 'Feather-light airbrush foundation with a flawless, long-wear finish.', durationMin: 45, price: 180, machine: { units: 1, photo: '/img/machine-airbrush.jpg' } },
  { id: 'mc-makeup-vanity', category: 'makeup', name: 'Pro-lit vanity station', description: 'Ring-lit mirror station for your own touch-ups before an event.', durationMin: 30, price: 40, machine: { units: 3, photo: '/img/machine-vanity.jpg' } },
  { id: 'mc-makeup-spray-tan', category: 'makeup', name: 'Spray-tan booth', description: 'Private booth with a fine-mist spray for an even, natural-looking glow.', durationMin: 20, price: 150, machine: { units: 1, photo: '/img/machine-spray-tan.jpg' } },
  { id: 'mc-makeup-lash', category: 'makeup', name: 'Lash & brow lamp station', description: 'Lash bed with a magnifying LED lamp for lash, brow and tint work.', durationMin: 30, price: 60, machine: { units: 2, photo: '/img/machine-lash-lamp.jpg' } },
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
  { id: 'pk-glow', name: 'Glow Care Pass', serviceId: 'skin-hydrafacial', sessions: 3, price: 750, validityDays: 120, perks: '3 Hydra facials · save QAR 300', photo: '/img/salon-relax.jpg' },
  { id: 'pk-blowdry', name: 'Blow-dry Bundle', serviceId: 'hair-blowdry', sessions: 6, price: 400, validityDays: 90, perks: '6 blow-dries · save QAR 80', photo: '/img/stylist-blowdry.jpg' },
  { id: 'pk-nails', name: 'Nail Care Club', serviceId: 'nails-manicure', sessions: 4, price: 300, validityDays: 90, perks: '4 manicures · save QAR 60', photo: '/img/product-nail-care.jpg' },
  { id: 'pk-spa', name: 'Hair Spa Ritual', serviceId: 'hair-spa', sessions: 3, price: 450, validityDays: 120, perks: '3 hair spas · save QAR 90', photo: '/img/product-hair-serum.jpg' },
  { id: 'pk-pedi-spa', name: 'Spa Chair Pass', serviceId: 'mc-nails-pedi-spa', sessions: 5, price: 280, validityDays: 90, perks: '5 spa-chair sessions · save QAR 70', photo: '/img/machine-pedicure-spa.jpg' },
  { id: 'pk-microderm', name: 'Microderm Glow Plan', serviceId: 'mc-skin-microderm', sessions: 4, price: 700, validityDays: 120, perks: '4 microderm sessions · save QAR 180', photo: '/img/machine-microderm.jpg' },
  { id: 'pk-hair-steam', name: 'Hair Steam Pass', serviceId: 'mc-hair-steamer', sessions: 5, price: 240, validityDays: 90, perks: '5 steamer sessions · save QAR 60', photo: '/img/machine-hair-steamer.jpg' },
]

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id) ?? MACHINES.find((s) => s.id === id)
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id)
export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!
export const branchById = (id: string) => BRANCHES.find((b) => b.id === id)
export const stylistById = (id: string) => STYLISTS.find((s) => s.id === id)
export const planById = (id: string) => PACKAGE_PLANS.find((p) => p.id === id)

export const servicePrice = (s: Service) => s.offerPrice ?? s.price
export const offerPercent = (s: Service) => (s.offerPrice ? Math.round((1 - s.offerPrice / s.price) * 100) : 0)
