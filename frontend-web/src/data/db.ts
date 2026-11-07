import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isClosedDay, isoDate } from '@/lib/format'
import type { Booking, Customer } from './types'

/** Past demo visits, moved off closed days so seed history stays realistic. */
const daysFromNow = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  while (isClosedDay(isoDate(d))) d.setDate(d.getDate() - 1)
  return isoDate(d)
}

/** Demo customers so the existing-customer path can be tried without a backend. */
export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cus-sara',
    name: 'Sara Al-Mansoori',
    dial: '974',
    phone: '55512345',
    email: 'sara@example.com',
    whatsappConfirmed: true,
    memberSince: '2024-03-14',
    points: 220,
    due: { amount: 120, note: 'Balance from your last visit (Root colour)', date: daysFromNow(-18) },
    packages: [
      { id: 'cp-sara-glow', planId: 'pk-glow', used: 2, total: 3, expiresOn: daysFromNow(40) },
      { id: 'cp-sara-blow', planId: 'pk-blowdry', used: 3, total: 6, expiresOn: daysFromNow(55) },
    ],
    history: [
      { date: daysFromNow(-18), services: ['Root colour', 'Blow-dry'], amount: 330 },
      { date: daysFromNow(-41), services: ['Hydra facial'], amount: 0 },
      { date: daysFromNow(-70), services: ['Gel manicure'], amount: 140 },
    ],
  },
  {
    id: 'cus-noor',
    name: 'Noor Haddad',
    dial: '974',
    phone: '66678901',
    whatsappConfirmed: true,
    memberSince: '2025-08-02',
    points: 60,
    due: null,
    packages: [{ id: 'cp-noor-nails', planId: 'pk-nails', used: 2, total: 4, expiresOn: daysFromNow(30) }],
    history: [{ date: daysFromNow(-12), services: ['Classic manicure'], amount: 0 }],
  },
  {
    id: 'cus-priya',
    name: 'Priya Nair',
    dial: '91',
    phone: '9876543210',
    whatsappConfirmed: true,
    memberSince: '2025-11-20',
    points: 35,
    due: { amount: 45, note: 'Product balance (Heat protect mist)', date: daysFromNow(-9) },
    packages: [],
    history: [{ date: daysFromNow(-9), services: ['Haircut & Blow-dry'], amount: 120 }],
  },
]

interface DbState {
  customers: Customer[]
  bookings: Booking[]
  tokenCounters: Record<string, number>
  currentCustomerId: string | null
  upsertCustomer: (c: Customer) => void
  addBooking: (b: Booking) => void
  nextToken: (letter: string) => string
  setCurrentCustomer: (id: string | null) => void
}

export const useDb = create<DbState>()(
  persist(
    (set, get) => ({
      customers: DEMO_CUSTOMERS,
      bookings: [],
      tokenCounters: {},
      currentCustomerId: null,
      upsertCustomer: (c) =>
        set((s) => ({
          customers: s.customers.some((x) => x.id === c.id)
            ? s.customers.map((x) => (x.id === c.id ? c : x))
            : [...s.customers, c],
        })),
      addBooking: (b) => set((s) => ({ bookings: [b, ...s.bookings] })),
      nextToken: (letter) => {
        const n = (get().tokenCounters[letter] ?? 41) + 1
        set((s) => ({ tokenCounters: { ...s.tokenCounters, [letter]: n } }))
        return `${letter}-${String(n).padStart(3, '0')}`
      },
      setCurrentCustomer: (id) => set({ currentCustomerId: id }),
    }),
    {
      name: 'beaudesk-db',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as DbState
        if (version < 2) {
          state.bookings = state.bookings.map((b) => ({
            ...b,
            paidOnline: b.paymentMethod === 'none' ? 0 : b.total,
            payAtSalon: 0,
            dueKept: 0,
          }))
        }
        return state
      },
    },
  ),
)

export const useCurrentCustomer = () =>
  useDb((s) => s.customers.find((c) => c.id === s.currentCustomerId) ?? null)
