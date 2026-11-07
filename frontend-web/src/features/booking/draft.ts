import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ANY_STYLIST, BRANCHES, type CategoryId } from '@/data/catalog'
import { DEFAULT_COUNTRY } from '@/lib/config'

export type Step = 'services' | 'mobile' | 'customer' | 'products' | 'payment'
export const STEPS: { id: Step; label: string }[] = [
  { id: 'services', label: 'Services' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'customer', label: 'Details' },
  { id: 'products', label: 'Products' },
  { id: 'payment', label: 'Payment' },
]

export interface NewCustomerForm {
  name: string
  email: string
  whatsappConfirmed: boolean
}

export interface BookingDraft {
  step: Step
  category: CategoryId
  serviceIds: string[]
  branchId: string
  stylistId: string
  date: string | null
  time: string | null
  dial: string
  phone: string
  customerId: string | null
  isNew: boolean
  newCustomer: NewCustomerForm
  packageChoice: Record<string, 'use' | 'leave'>
  /** Services added to the booking by tapping "Use now" on a package, keyed by package id. */
  addedByPackage: Record<string, string>
  clearDue: boolean
  products: Record<string, number>
  payMode: PayMode
  /** `part` plan: amount paid online; the rest is paid at the salon. */
  partOnline: number
  /** `due` plan: amount paid now (online or at the salon); the rest is kept as due. */
  duePay: number
  duePaidOnline: boolean
}

export type PayMode = 'full' | 'salon' | 'part' | 'due'

const initial = (): BookingDraft => ({
  step: 'services',
  category: 'hair',
  serviceIds: [],
  branchId: BRANCHES[0].id,
  stylistId: ANY_STYLIST,
  date: null,
  time: null,
  dial: DEFAULT_COUNTRY.dial,
  phone: '',
  customerId: null,
  isNew: false,
  newCustomer: { name: '', email: '', whatsappConfirmed: false },
  packageChoice: {},
  addedByPackage: {},
  clearDue: true,
  products: {},
  payMode: 'full',
  partOnline: 0,
  duePay: 0,
  duePaidOnline: true,
})

interface DraftStore extends BookingDraft {
  set: (patch: Partial<BookingDraft>) => void
  toggleService: (id: string) => void
  setProductQty: (id: string, qty: number) => void
  reset: (patch?: Partial<BookingDraft>) => void
}

export const useDraft = create<DraftStore>()(
  persist(
    (set) => ({
      ...initial(),
      set: (patch) => set(patch),
      toggleService: (id) =>
        set((s) => ({
          serviceIds: s.serviceIds.includes(id) ? s.serviceIds.filter((x) => x !== id) : [...s.serviceIds, id],
        })),
      setProductQty: (id, qty) =>
        set((s) => {
          const products = { ...s.products }
          if (qty <= 0) delete products[id]
          else products[id] = Math.min(qty, 9)
          return { products }
        }),
      reset: (patch) => set({ ...initial(), ...patch }),
    }),
    { name: 'beaudesk-booking-draft', storage: createJSONStorage(() => sessionStorage) },
  ),
)
