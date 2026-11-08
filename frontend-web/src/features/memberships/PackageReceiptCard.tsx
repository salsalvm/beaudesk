import { Sparkles } from 'lucide-react'
import { planById, serviceById, servicePrice } from '@/data/catalog'
import type { Customer, CustomerPackage } from '@/data/types'
import { ReceiptSheet } from '@/features/token/ReceiptSheet'
import { METHOD_LABEL } from '@/features/token/share'
import { longDate, money, shortDate, timeLabel } from '@/lib/format'
import { isMachinePlan } from './PlanPhoto'

/** Package purchase receipt, rendered off-screen and sent to WhatsApp. */
export function PackageReceiptCard({ customer, pkg }: { customer: Customer; pkg: CustomerPackage }) {
  const plan = planById(pkg.planId)
  if (!plan || !pkg.purchase) return null
  const service = serviceById(plan.serviceId)
  const worth = service ? servicePrice(service) * plan.sessions : 0
  const at = new Date(pkg.purchase.at)
  const method = METHOD_LABEL[pkg.purchase.method]

  return (
    <ReceiptSheet
      badge={{ label: 'Paid', paid: true }}
      kicker={isMachinePlan(plan) ? 'Machine package receipt' : 'Package receipt'}
      title={plan.name}
      meta={[longDate(pkg.purchase.at.slice(0, 10)), timeLabel(`${at.getHours()}:${String(at.getMinutes()).padStart(2, '0')}`)]}
      customer={customer}
      lines={[
        {
          key: 'plan',
          label: `${plan.sessions} × ${service?.name ?? 'session'}`,
          sub: `Valid till ${shortDate(pkg.expiresOn)} · ${plan.validityDays} days`,
          value: money(plan.price),
        },
        ...(worth > plan.price ? [{ key: 'save', label: 'Package saving', sub: `Normally ${money(worth)}`, value: `− ${money(worth - plan.price)}` }] : []),
      ]}
      total={plan.price}
      rows={[
        { label: `Paid online${method ? ` · ${method}` : ''}`, value: money(pkg.purchase.price), tone: 'paid' },
        { label: 'Payment ref', value: pkg.purchase.ref, tone: 'muted' },
      ]}
      note={
        <p className="flex items-center gap-2 text-[14px] font-semibold text-wine-800">
          <Sparkles className="size-4 text-sun-500" /> {pkg.total} sessions ready — tap “Use now” when you book
        </p>
      }
    />
  )
}
