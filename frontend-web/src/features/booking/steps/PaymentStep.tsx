import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CalendarDays, CreditCard, Crown, Lock, MapPin, ShieldCheck, Smartphone, Wallet } from 'lucide-react'
import { Card } from '@/components/ui'
import { createBooking } from '@/data/api'
import { ANY_STYLIST, branchById, stylistById } from '@/data/catalog'
import type { PaymentMethod } from '@/data/types'
import { appointmentLabel, cn, formatPhone, money } from '@/lib/format'
import { useTokenModal } from '@/features/token/TokenModal'
import { useDraft } from '../draft'
import { StepFooter, StepHeading, useDraftCustomer, useSummary } from '../parts'
import { PaymentGateway } from './PaymentGateway'

const METHODS: { id: Exclude<PaymentMethod, 'none'>; label: string; note: string }[] = [
  { id: 'card', label: 'Debit / credit card', note: 'Visa, Mastercard, Amex' },
  { id: 'apple_pay', label: 'Apple Pay', note: 'Pay with Face ID / Touch ID' },
  { id: 'google_pay', label: 'Google Pay', note: 'Pay with your Google wallet' },
]

export function PaymentStep() {
  const d = useDraft()
  const customer = useDraftCustomer()
  const summary = useSummary()
  const navigate = useNavigate()
  const showToken = useTokenModal((s) => s.show)
  const [method, setMethod] = useState<Exclude<PaymentMethod, 'none'>>('card')
  const [gatewayOpen, setGatewayOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const free = summary.total === 0
  const stylist = d.stylistId === ANY_STYLIST ? 'First available stylist' : stylistById(d.stylistId)?.name

  const finish = async (m: PaymentMethod, ref: string | null) => {
    if (!customer) return
    const booking = await createBooking(d, customer.id, { method: m, ref })
    d.reset()
    navigate('/bookings', { replace: true })
    showToken(booking.id, true)
  }

  const confirmFree = async () => {
    setConfirming(true)
    setError(null)
    try {
      await finish('none', null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm the booking.')
      setConfirming(false)
    }
  }

  return (
    <div>
      <StepHeading eyebrow="Step 5 of 5" title="Review & pay">
        Your token is generated as soon as the payment goes through.
      </StepHeading>

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-wine-50 bg-wine-50/50 p-5 sm:grid-cols-2">
          <Info icon={<CalendarDays className="size-4" />} label="Appointment" value={d.date && d.time ? appointmentLabel(d.date, d.time) : '—'} />
          <Info icon={<MapPin className="size-4" />} label="Salon & stylist" value={`${branchById(d.branchId)?.name} · ${stylist}`} />
        </div>
        <div className="divide-y divide-wine-50 text-sm">
          {summary.services.map((l) => (
            <Line
              key={l.serviceId}
              label={l.name}
              sub={l.coveredByPackageId ? 'Covered by your package' : undefined}
              value={l.coveredByPackageId ? 'QAR 0' : money(l.price)}
              icon={l.coveredByPackageId ? <Crown className="size-4 text-sun-500" /> : undefined}
            />
          ))}
          {summary.products.map((l) => (
            <Line key={l.productId} label={l.name} sub={`Qty ${l.qty} · collect at reception`} value={money(l.price * l.qty)} />
          ))}
          {summary.due > 0 && <Line label="Previous due" sub={customer?.due?.note} value={money(summary.due)} />}
        </div>
        <div className="space-y-1.5 border-t border-dashed border-wine-100 bg-white p-5 text-sm">
          {summary.offerSavings > 0 && <Total label="Offer savings" value={`− ${money(summary.offerSavings)}`} accent />}
          {summary.packageSavings > 0 && <Total label="Package savings" value={`− ${money(summary.packageSavings)}`} accent />}
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-bold text-wine-950">Total to pay</span>
            <span className="text-2xl font-extrabold text-wine-950">{money(summary.total)}</span>
          </div>
          {customer && <p className="text-xs text-stone-500">Token will be shareable to WhatsApp {formatPhone(customer.dial, customer.phone)}</p>}
        </div>
      </Card>

      {!free && (
        <>
          <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">Pay with</h2>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition',
                  method === m.id ? 'border-wine-600 ring-4 ring-wine-50' : 'border-wine-100 hover:border-wine-200',
                )}
              >
                <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', method === m.id ? 'bg-wine-700 text-white' : 'bg-wine-50 text-wine-700')}>
                  {m.id === 'card' ? <CreditCard className="size-5" /> : m.id === 'apple_pay' ? <Wallet className="size-5" /> : <Smartphone className="size-5" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-wine-950">{m.label}</span>
                  <span className="block text-xs text-stone-500">{m.note}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
            <ShieldCheck className="size-4 text-wine-600" /> You'll pay in a secure checkout window. Your token is created right after.
          </p>
        </>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <StepFooter
        primary={
          free ? (
            'Confirm booking'
          ) : (
            <>
              <Lock className="size-4" /> Pay {money(summary.total)}
            </>
          )
        }
        loading={confirming}
        onPrimary={() => (free ? confirmFree() : setGatewayOpen(true))}
        secondary="Back"
        onSecondary={() => d.set({ step: 'products' })}
      />

      <PaymentGateway
        open={gatewayOpen}
        method={method}
        amount={summary.total}
        onClose={() => setGatewayOpen(false)}
        onPaid={(ref) => finish(method, ref)}
      />
    </div>
  )
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-wine-700 ring-1 ring-wine-100">{icon}</span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
        <p className="font-semibold text-wine-950">{value}</p>
      </div>
    </div>
  )
}

function Line({ label, sub, value, icon }: { label: string; sub?: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-3.5">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-semibold text-wine-950">
          {icon}
          {label}
        </p>
        {sub && <p className="text-xs text-stone-500">{sub}</p>}
      </div>
      <span className="shrink-0 font-semibold text-wine-950">{value}</span>
    </div>
  )
}

function Total({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-500">{label}</span>
      <span className={cn('font-semibold', accent ? 'text-wine-600' : 'text-wine-950')}>{value}</span>
    </div>
  )
}
