export interface CustomerPackage {
  id: string
  planId: string
  used: number
  total: number
  expiresOn: string
}

export interface Visit {
  date: string
  services: string[]
  amount: number
}

export interface Due {
  amount: number
  note: string
  date: string
}

export interface Customer {
  id: string
  name: string
  dial: string
  phone: string
  email?: string
  whatsappConfirmed: boolean
  memberSince: string
  points: number
  due: Due | null
  packages: CustomerPackage[]
  history: Visit[]
}

export interface BookingLine {
  serviceId: string
  name: string
  price: number
  coveredByPackageId?: string
}

export interface ProductLine {
  productId: string
  name: string
  qty: number
  price: number
}

export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'none'

export interface Booking {
  id: string
  token: string
  customerId: string
  customerName: string
  dial: string
  phone: string
  services: BookingLine[]
  products: ProductLine[]
  dueCleared: number
  total: number
  paymentMethod: PaymentMethod
  paymentRef: string | null
  branchId: string
  stylistId: string
  date: string
  time: string
  createdAt: string
  status: 'confirmed' | 'cancelled'
}
