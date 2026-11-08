/**
 * Mock API. The backend is not built yet, so these functions simulate network
 * calls against the persisted demo store in `db.ts`. Keep their signatures
 * when swapping in real HTTP calls.
 */
import { SALON } from '@/lib/config'
import { isClosedDay, isoDate } from '@/lib/format'
import { planById, serviceById } from './catalog'
import { useDb } from './db'
import { machineFree } from './machines'
import type { Booking, Customer, CustomerPackage, PaymentMethod } from './types'
import type { BookingDraft } from '@/features/booking/draft'
import { paymentError, paymentSplit, summarize } from '@/features/booking/pricing'

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

/** Adds a paid package to the customer, valid from today for the plan's validity period. */
export async function subscribePackage(
  customerId: string,
  planId: string,
  payment: { method: PaymentMethod; ref: string },
): Promise<CustomerPackage> {
  await wait(400)
  const db = useDb.getState()
  const customer = db.customers.find((c) => c.id === customerId)
  const plan = planById(planId)
  if (!customer) throw new Error('Customer not found')
  if (!plan) throw new Error('Package not found')
  if (!payment.ref) throw new Error('Payment was not completed')
  const expires = new Date()
  expires.setDate(expires.getDate() + plan.validityDays)
  const pkg: CustomerPackage = {
    id: uid('cp'),
    planId,
    used: 0,
    total: plan.sessions,
    expiresOn: isoDate(expires),
    purchase: { price: plan.price, method: payment.method, ref: payment.ref, at: new Date().toISOString() },
  }
  db.upsertCustomer({ ...customer, packages: [...customer.packages, pkg] })
  return pkg
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
  if (draft.date !== isoDate(new Date())) throw new Error('Tokens can only be generated for today.')
  if (isClosedDay(draft.date)) throw new Error(`The salon is closed today (closed on ${SALON.closedDaysLabel}). Please come back tomorrow.`)
  const full = draft.serviceIds.find((id) => serviceById(id)?.machine && machineFree(db.bookings, id, draft.date!, draft.time!, draft.branchId) === 0)
  if (full) throw new Error(`${serviceById(full)?.name} is fully booked at this time. Please pick another time.`)

  const summary = summarize(draft, customer)
  const payError = paymentError(summary.total, draft)
  if (payError) throw new Error(payError)
  const split = paymentSplit(summary.total, draft)
  if (split.online > 0 && !payment.ref) throw new Error('Payment was not completed')
  const token = db.nextToken()
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
    paidOnline: split.online,
    payAtSalon: split.atSalon,
    dueKept: split.due,
    paymentMethod: split.online > 0 ? payment.method : 'none',
    paymentRef: split.online > 0 ? payment.ref : null,
    branchId: draft.branchId,
    stylistId: draft.stylistId,
    date: draft.date,
    time: draft.time,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  }

  const carried = summary.due > 0 ? null : customer.due
  const due =
    split.due > 0
      ? {
          amount: (carried?.amount ?? 0) + split.due,
          note: carried ? `Earlier balance + kept from token ${token}` : `Balance kept from token ${token}`,
          date: booking.date,
        }
      : carried

  db.upsertCustomer({
    ...customer,
    due,
    points: customer.points + Math.floor((summary.servicesTotal + summary.productsTotal) * SALON.pointsPerCurrencyUnit),
    packages: customer.packages.map((p) => (covered.has(p.id) ? { ...p, used: p.used + 1 } : p)),
  })
  db.addBooking(booking)
  return booking
}
