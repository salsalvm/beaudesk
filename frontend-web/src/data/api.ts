/**
 * Mock API. The backend is not built yet, so these functions simulate network
 * calls against the persisted demo store in `db.ts`. Keep their signatures
 * when swapping in real HTTP calls.
 */
import { SALON } from '@/lib/config'
import { categoryById, serviceById } from './catalog'
import { useDb } from './db'
import type { Booking, Customer, PaymentMethod } from './types'
import type { BookingDraft } from '@/features/booking/draft'
import { summarize } from '@/features/booking/pricing'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

export async function lookupCustomer(dial: string, phone: string): Promise<Customer | null> {
  await wait(700)
  return useDb.getState().customers.find((c) => c.dial === dial && c.phone === phone) ?? null
}

export async function registerCustomer(input: {
  name: string
  email: string
  dial: string
  phone: string
  whatsappConfirmed: boolean
}): Promise<Customer> {
  await wait(500)
  if (!input.whatsappConfirmed) throw new Error('Please confirm this is your WhatsApp number.')
  const existing = useDb.getState().customers.find((c) => c.dial === input.dial && c.phone === input.phone)
  if (existing) return existing
  const customer: Customer = {
    id: uid('cus'),
    name: input.name.trim(),
    email: input.email.trim() || undefined,
    dial: input.dial,
    phone: input.phone,
    whatsappConfirmed: true,
    memberSince: new Date().toISOString().slice(0, 10),
    points: 0,
    due: null,
    packages: [],
    history: [],
  }
  useDb.getState().upsertCustomer(customer)
  return customer
}

export interface PaymentInput {
  method: PaymentMethod
  amount: number
}

/** Simulated gateway: always approves after a short delay. */
export async function chargePayment(input: PaymentInput): Promise<{ ref: string }> {
  await wait(1600)
  if (input.amount < 0) throw new Error('Invalid amount')
  return { ref: `PAY-${Date.now().toString(36).toUpperCase()}` }
}

export async function createBooking(
  draft: BookingDraft,
  customerId: string,
  payment: { method: PaymentMethod; ref: string | null },
): Promise<Booking> {
  await wait(400)
  const db = useDb.getState()
  const customer = db.customers.find((c) => c.id === customerId)
  if (!customer) throw new Error('Customer not found')
  if (!draft.date || !draft.time || draft.serviceIds.length === 0) throw new Error('Booking is incomplete')

  const summary = summarize(draft, customer)
  const firstService = serviceById(draft.serviceIds[0])!
  const token = db.nextToken(categoryById(firstService.category).tokenLetter)
  const covered = new Set(summary.services.map((l) => l.coveredByPackageId).filter(Boolean))

  const booking: Booking = {
    id: uid('bk'),
    token,
    customerId,
    customerName: customer.name,
    dial: customer.dial,
    phone: customer.phone,
    services: summary.services,
    products: summary.products,
    dueCleared: summary.due,
    total: summary.total,
    paymentMethod: payment.method,
    paymentRef: payment.ref,
    branchId: draft.branchId,
    stylistId: draft.stylistId,
    date: draft.date,
    time: draft.time,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  }

  db.upsertCustomer({
    ...customer,
    due: summary.due > 0 ? null : customer.due,
    points: customer.points + Math.floor((summary.servicesTotal + summary.productsTotal) * SALON.pointsPerCurrencyUnit),
    packages: customer.packages.map((p) => (covered.has(p.id) ? { ...p, used: p.used + 1 } : p)),
  })
  db.addBooking(booking)
  db.setCurrentCustomer(customerId)
  return booking
}
