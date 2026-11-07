import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CalendarDays,
  CreditCard,
  Crown,
  Hourglass,
  Lock,
  MapPin,
  Percent,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Store,
  Wallet,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { createBooking } from '@/data/api'
import { ANY_STYLIST, branchById, stylistById } from '@/data/catalog'
import type { PaymentMethod } from '@/data/types'
import { SALON } from '@/lib/config'
import { appointmentLabel, cn, formatPhone, money } from '@/lib/format'
import { useTokenModal } from '@/features/token/TokenModal'
import { useDraft, type PayMode } from '../draft'
import { StepFooter, StepHeading, useDraftCustomer, useSummary } from '../parts'
import { paymentSplit } from '../pricing'
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
  const split = paymentSplit(summary.total, d)
  const payOnline = split.online > 0
  const stylist = d.stylistId === ANY_STYLIST ? 'First available stylist' : stylistById(d.stylistId)?.name

  const finish = async (m: PaymentMethod, ref: string | null) => {
    if (!customer) return
    const booking = await createBooking(d, customer.id, { method: m, ref })
    d.reset()
    navigate('/bookings', { replace: true })
    showToken(booking.id, true)
  }

  const confirmWithoutPayment = async () => {
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
        Pay all now, part now, or at the salon — your token is generated right after.
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
            <span className="text-base font-bold text-wine-950">Total</span>
            <span className="text-2xl font-extrabold text-wine-950">{money(summary.total)}</span>
          </div>
          {customer && <p className="text-xs text-stone-500">Token will be shareable to WhatsApp {formatPhone(customer.dial, customer.phone)}</p>}
        </div>
      </Card>

      {!free && <PayPlan total={summary.total} />}

      {payOnline && (
        <>
          <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">Pay {money(split.online)} with</h2>
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
          payOnline ? (
            <>
              <Lock className="size-4" /> Pay {money(split.online)} now
            </>
          ) : (
            'Confirm booking'
          )
        }
        total={{ label: payOnline ? 'Pay now' : 'Pay at salon', value: money(payOnline ? split.online : split.atSalon) }}
        loading={confirming}
        onPrimary={() => (payOnline ? setGatewayOpen(true) : confirmWithoutPayment())}
        secondary="Back"
        onSecondary={() => d.set({ step: 'products' })}
      />

      <PaymentGateway
        open={gatewayOpen}
        method={method}
        amount={split.online}
        onClose={() => setGatewayOpen(false)}
        onPaid={(ref) => finish(method, ref)}
      />
    </div>
  )
}

const PLANS: { id: PayMode; label: string; icon: typeof Wallet }[] = [
  { id: 'full', label: 'Pay in full', icon: Wallet },
  { id: 'half', label: 'Pay half now', icon: Percent },
  { id: 'custom', label: 'Choose amount', icon: SlidersHorizontal },
  { id: 'salon', label: 'Pay at salon', icon: Store },
]

function PayPlan({ total }: { total: number }) {
  const d = useDraft()
  const split = paymentSplit(total, d)
  const rest = total - split.online
  const [keepSome, setKeepSome] = useState(d.keepDue > 0)
  const pct = (n: number) => `${(n / total) * 100}%`

  const choose = (payMode: PayMode) => {
    setKeepSome(false)
    d.set({ payMode, keepDue: 0, customPayNow: payMode === 'custom' && d.payMode !== 'custom' ? Math.ceil(total / 2) : d.customPayNow })
  }
  const planNote = (id: PayMode) =>
    id === 'full'
      ? money(total)
      : id === 'half'
        ? money(Math.ceil(total / 2))
        : id === 'custom'
          ? d.payMode === 'custom'
            ? money(split.online)
            : 'You decide'
          : 'Nothing now'

  return (
    <>
      <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">How would you like to pay?</h2>
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {PLANS.map(({ id, label, icon: Icon }) => {
            const on = d.payMode === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => choose(id)}
                aria-pressed={on}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition',
                  on ? 'border-wine-700 bg-wine-700 text-white shadow-[0_10px_24px_-14px_rgb(116_32_58/0.9)]' : 'border-wine-100 bg-white hover:border-wine-300',
                )}
              >
                <span className={cn('grid size-9 place-items-center rounded-xl', on ? 'bg-sun-400 text-wine-950' : 'bg-wine-50 text-wine-700')}>
                  <Icon className="size-[18px]" />
                </span>
                <span>
                  <span className={cn('block text-sm font-bold', on ? 'text-white' : 'text-wine-950')}>{label}</span>
                  <span className={cn('block text-xs', on ? 'text-sun-300' : 'text-stone-500')}>{planNote(id)}</span>
                </span>
              </button>
            )
          })}
        </div>

        {d.payMode === 'custom' && (
          <AmountSlider
            label="Pay online now"
            value={split.online}
            max={total}
            onChange={(v) => d.set({ customPayNow: v, keepDue: Math.min(d.keepDue, total - v) })}
          />
        )}

        {rest > 0 && (
          <div className="mt-5">
            <p className="text-sm font-bold text-wine-950">
              Remaining {money(rest)} — how will you settle it?
            </p>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <Choice
                on={!keepSome}
                icon={<Store className="size-[18px]" />}
                title="Pay at the salon"
                note={`Pay ${money(rest)} at reception on your visit`}
                onClick={() => {
                  setKeepSome(false)
                  d.set({ keepDue: 0 })
                }}
              />
              <Choice
                on={keepSome}
                icon={<Hourglass className="size-[18px]" />}
                title="Keep some as due"
                note="Added to your account — settle on a later visit"
                onClick={() => {
                  setKeepSome(true)
                  d.set({ keepDue: rest })
                }}
              />
            </div>
            {keepSome && (
              <AmountSlider label="Keep as due" value={split.due} max={rest} onChange={(v) => d.set({ keepDue: v })} />
            )}
          </div>
        )}

        <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-wine-50 ring-1 ring-wine-100">
          <span className="bg-wine-700 transition-all duration-300" style={{ width: pct(split.online) }} />
          <span className="bg-sun-400 transition-all duration-300" style={{ width: pct(split.atSalon) }} />
          <span
            className="bg-[repeating-linear-gradient(135deg,var(--color-wine-300)_0_6px,var(--color-wine-200)_6px_12px)] transition-all duration-300"
            style={{ width: pct(split.due) }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <Legend dot="bg-wine-700" label="Online now" value={money(split.online)} />
          <Legend dot="bg-sun-400" label="At salon" value={money(split.atSalon)} />
          <Legend dot="bg-wine-300" label="Kept as due" value={money(split.due)} />
        </div>
      </Card>
    </>
  )
}

function AmountSlider({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="mt-4 rounded-2xl bg-wine-50/60 p-4 ring-1 ring-wine-100">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-wine-950">{label}</span>
        <label className="flex h-10 items-center gap-1.5 rounded-xl border border-wine-200 bg-white px-3 focus-within:border-wine-400 focus-within:ring-4 focus-within:ring-wine-100">
          <span className="text-xs font-semibold text-stone-400">{SALON.currency}</span>
          <input
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(Math.min(max, Number(e.target.value.replace(/\D/g, '') || 0)))}
            className="w-16 bg-transparent text-right text-[15px] font-bold text-wine-950 outline-none"
            aria-label={label}
          />
        </label>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full accent-wine-700"
        aria-label={`${label} slider`}
      />
      <div className="mt-1 flex justify-between text-[11px] font-medium text-stone-400">
        <span>{money(0)}</span>
        <span>{money(max)}</span>
      </div>
    </div>
  )
}

function Choice({ on, icon, title, note, onClick }: { on: boolean; icon: React.ReactNode; title: string; note: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-left transition',
        on ? 'border-wine-600 ring-4 ring-wine-50' : 'border-wine-100 hover:border-wine-200',
      )}
    >
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', on ? 'bg-wine-700 text-white' : 'bg-wine-50 text-wine-700')}>{icon}</span>
      <span>
        <span className="block text-sm font-semibold text-wine-950">{title}</span>
        <span className="block text-xs text-stone-500">{note}</span>
      </span>
    </button>
  )
}

function Legend({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-2.5 py-2 ring-1 ring-wine-100">
      <span className="flex items-center gap-1.5 text-stone-500">
        <span className={cn('size-2 rounded-full', dot)} /> {label}
      </span>
      <span className="mt-0.5 block text-sm font-bold text-wine-950">{value}</span>
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
