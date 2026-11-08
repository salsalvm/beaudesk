import { Star } from 'lucide-react'
import { serviceById } from '@/data/catalog'
import type { Booking } from '@/data/types'
import { longDate, minutesLabel, money, timeLabel } from '@/lib/format'
import { ReceiptSheet, type ReceiptRow } from './ReceiptSheet'
import { paymentMethodLabel, pointsEarned } from './share'
import { tokenFacts } from './TokenCard'

/** Booking payment receipt, rendered off-screen and sent as the second WhatsApp image. */
export function ReceiptCard({ booking: b }: { booking: Booking }) {
  const f = tokenFacts(b)
  const points = pointsEarned(b)
  const method = paymentMethodLabel(b)
  const rows: ReceiptRow[] = [
    ...(b.paidOnline > 0 ? [{ label: `Paid online${method ? ` · ${method}` : ''}`, value: money(b.paidOnline), tone: 'paid' as const }] : []),
    ...(b.payAtSalon > 0 ? [{ label: 'Pay at the salon', value: money(b.payAtSalon) }] : []),
    ...(b.dueKept > 0 ? [{ label: 'Kept as due', value: money(b.dueKept) }] : []),
    ...(b.paymentRef ? [{ label: 'Payment ref', value: b.paymentRef, tone: 'muted' as const }] : []),
  ]

  return (
    <ReceiptSheet
      badge={{ label: b.paidOnline > 0 ? 'Paid' : b.total === 0 ? 'Covered' : 'Confirmed', paid: b.paidOnline > 0 }}
      kicker="Payment receipt"
      title={`Token ${b.token}`}
      meta={[longDate(b.date), `${timeLabel(b.time)} · ${f.branch}`]}
      customer={{ name: b.customerName, dial: b.dial, phone: b.phone }}
      lines={[
        ...b.services.map((s) => ({
          key: s.serviceId,
          label: s.name,
          sub: s.coveredByPackageId ? 'Package session' : machineSub(s.serviceId),
          value: s.coveredByPackageId ? money(0) : money(s.price),
        })),
        ...b.products.map((p) => ({ key: p.productId, label: p.name, sub: `Qty ${p.qty}`, value: money(p.price * p.qty) })),
        ...(b.dueCleared > 0 ? [{ key: 'due', label: 'Previous due cleared', value: money(b.dueCleared) }] : []),
      ]}
      total={b.total}
      rows={rows}
      note={
        points > 0 && (
          <p className="flex items-center gap-2 text-[14px] font-semibold text-wine-800">
            <Star className="size-4 fill-sun-400 text-sun-500" /> You earned {points} loyalty points
          </p>
        )
      }
    />
  )
}

function machineSub(serviceId: string) {
  const m = serviceById(serviceId)
  return m?.machine ? `Machine session · ${minutesLabel(m.durationMin)}` : undefined
}
