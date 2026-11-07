import { planById, productById, serviceById, servicePrice } from '@/data/catalog'
import type { BookingLine, Customer, CustomerPackage, ProductLine } from '@/data/types'
import type { BookingDraft } from './draft'

export interface Summary {
  services: BookingLine[]
  products: ProductLine[]
  servicesTotal: number
  productsTotal: number
  offerSavings: number
  packageSavings: number
  due: number
  total: number
  durationMin: number
}

export const remaining = (p: CustomerPackage) => Math.max(0, p.total - p.used)

/** Packages that still have sessions and haven't expired. */
export function activePackages(customer: Customer | null) {
  if (!customer) return []
  const today = new Date().toISOString().slice(0, 10)
  return customer.packages.filter((p) => remaining(p) > 0 && p.expiresOn >= today)
}

export function summarize(draft: BookingDraft, customer: Customer | null): Summary {
  const usable = activePackages(customer).filter((p) => draft.packageChoice[p.id] === 'use')
  let offerSavings = 0
  let packageSavings = 0
  let durationMin = 0

  const services: BookingLine[] = draft.serviceIds.flatMap((id) => {
    const s = serviceById(id)
    if (!s) return []
    durationMin += s.durationMin
    const pkg = usable.find((p) => planById(p.planId)?.serviceId === id)
    if (pkg) {
      packageSavings += servicePrice(s)
      return [{ serviceId: id, name: s.name, price: 0, coveredByPackageId: pkg.id }]
    }
    if (s.offerPrice) offerSavings += s.price - s.offerPrice
    return [{ serviceId: id, name: s.name, price: servicePrice(s) }]
  })

  const products: ProductLine[] = Object.entries(draft.products).flatMap(([id, qty]) => {
    const p = productById(id)
    return p && qty > 0 ? [{ productId: id, name: p.name, qty, price: p.price }] : []
  })

  const servicesTotal = services.reduce((a, l) => a + l.price, 0)
  const productsTotal = products.reduce((a, l) => a + l.price * l.qty, 0)
  const due = customer?.due && draft.clearDue ? customer.due.amount : 0

  return {
    services,
    products,
    servicesTotal,
    productsTotal,
    offerSavings,
    packageSavings,
    due,
    total: servicesTotal + productsTotal + due,
    durationMin,
  }
}
