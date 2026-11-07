import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CalendarDays,
  CircleAlert,
  CreditCard,
  Crown,
  Hourglass,
  Lock,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
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
import { minPaidFor, paymentError, paymentSplit, percentOf } from '../pricing'
import { AppleLogo, GoogleG, PaymentGateway } from './PaymentGateway'

const METHODS: { id: Exclude<PaymentMethod, 'none'>; label: string; note: string }[] = [
  { id: 'apple_pay', label: 'Apple Pay', note: 'Face ID or Touch ID' },
  { id: 'google_pay', label: 'Google Pay', note: 'Your Google wallet' },
  { id: 'card', label: 'Debit / credit card', note: 'Visa, Mastercard, Amex' },
]

export function PaymentStep() {
  const d = useDraft()
  const customer = useDraftCustomer()
  const summary = useSummary()
  const navigate = useNavigate()
  const showToken = useTokenModal((s) => s.show)
  const [method, setMethod] = useState<Exclude<PaymentMethod, 'none'>>('apple_pay')
  const [gatewayOpen, setGatewayOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const free = summary.total === 0
  const split = paymentSplit(summary.total, d)
  const payError = paymentError(summary.total, d)
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
        <Card className="mt-5 p-4 sm:p-6">
          <SectionHead icon={<Lock className="size-[18px]" />} title={`Pay ${money(split.online)} with`} sub="Choose how you'd like to pay online." />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {METHODS.map((m) => {
              const on = method === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  aria-pressed={on}
                  className={cn(
                    'relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition outline-none focus-visible:ring-4 focus-visible:ring-wine-200 sm:flex-col sm:items-start sm:p-4',
                    on ? 'border-wine-600 bg-wine-50/40 ring-4 ring-wine-50' : 'border-wine-100 bg-white hover:border-wine-300',
                  )}
                >
                  <MethodLogo id={m.id} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-wine-950">{m.label}</span>
                    <span className="block truncate text-xs text-stone-500 sm:whitespace-normal">{m.note}</span>
                  </span>
                  <span className="sm:absolute sm:right-4 sm:top-4">
                    <Radio on={on} />
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-4 flex items-center gap-1.5 border-t border-wine-50 pt-3.5 text-xs text-stone-500">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" /> You'll pay in a secure checkout window. Your token is created right after.
          </p>
        </Card>
      )}

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <StepFooter
        disabled={!!payError}
        primary={
          payError ? (
            'Fix the amount'
          ) : payOnline ? (
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
        lines={[
          { label: 'Services', value: summary.services.map((l) => l.name).join(', ') || '—' },
          ...(d.date && d.time ? [{ label: 'Appointment', value: appointmentLabel(d.date, d.time) }] : []),
          ...(split.atSalon > 0 ? [{ label: 'Pay at salon', value: money(split.atSalon) }] : []),
          ...(split.due > 0 ? [{ label: 'Kept as due', value: money(split.due) }] : []),
        ]}
        onClose={() => setGatewayOpen(false)}
        onPaid={(ref) => finish(method, ref)}
      />
    </div>
  )
}

function PayPlan({ total }: { total: number }) {
  const d = useDraft()
  const minPaid = minPaidFor(total)
  const error = paymentError(total, d)
  const known = (['full', 'salon', 'part', 'due'] as PayMode[]).includes(d.payMode)
  useEffect(() => {
    if (!known) d.set({ payMode: 'full' })
  }, [known, d])

  const choose = (payMode: PayMode) => {
    if (payMode === 'part' && (d.partOnline <= 0 || d.partOnline >= total)) d.set({ payMode, partOnline: Math.ceil(total / 2) })
    else if (payMode === 'due' && (d.duePay < minPaid || d.duePay > total)) d.set({ payMode, duePay: minPaid })
    else d.set({ payMode })
  }

  return (
    <Card className="mt-5 p-4 sm:p-6">
      <SectionHead
        icon={<Wallet className="size-[18px]" />}
        title="How would you like to pay?"
        sub="Choose a plan. You can pay part online and the rest at the salon."
      />

      <div className="grid grid-cols-2 gap-2.5">
        <QuickPlan
          on={d.payMode === 'full'}
          onClick={() => choose('full')}
          icon={<Wallet className="size-5" />}
          title="Pay full online"
          amount={money(total)}
          note="Nothing at the salon"
        />
        <QuickPlan
          on={d.payMode === 'salon'}
          onClick={() => choose('salon')}
          icon={<Store className="size-5" />}
          title="Pay at the salon"
          amount={money(total)}
          note="Nothing to pay now"
        />
      </div>

      <div className="mt-2.5 space-y-2.5">
        <ExpandPlan
          on={d.payMode === 'part'}
          onClick={() => choose('part')}
          icon={<SlidersHorizontal className="size-5" />}
          title="Pay part online"
          note="You choose the amount · rest at the salon"
        >
          <AmountField
            label="Amount to pay online"
            value={d.partOnline}
            total={total}
            presets={[25, 50, 75]}
            error={error}
            onChange={(v) => d.set({ partOnline: v })}
          />
          <Breakdown split={paymentSplit(total, d)} showDue={false} />
        </ExpandPlan>

        <ExpandPlan
          on={d.payMode === 'due'}
          onClick={() => choose('due')}
          icon={<Hourglass className="size-5" />}
          title="Pay some, rest as due"
          tag="Optional"
          note={`Pay at least ${SALON.minPaidPercent}% · the balance is added to your account`}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Where will you pay?</p>
          <Segmented
            value={d.duePaidOnline}
            onChange={(v) => d.set({ duePaidOnline: v })}
            options={[
              { value: true, label: 'Online now', icon: <CreditCard className="size-4" /> },
              { value: false, label: 'At the salon', icon: <Store className="size-4" /> },
            ]}
          />
          <div className="mt-4">
            <AmountField
              label={d.duePaidOnline ? 'Amount to pay online' : 'Amount to pay at the salon'}
              value={d.duePay}
              total={total}
              presets={[SALON.minPaidPercent, 80, 90]}
              roundUp
              error={error}
              hint={`Minimum ${money(minPaid)} (${SALON.minPaidPercent}%). Whatever you don't pay is kept as due automatically.`}
              onChange={(v) => d.set({ duePay: v })}
            />
          </div>
          <Breakdown split={paymentSplit(total, d)} />
        </ExpandPlan>
      </div>
    </Card>
  )
}

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sun-100 text-wine-700">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold leading-tight text-wine-950">{title}</h2>
        <p className="mt-0.5 text-sm text-stone-500">{sub}</p>
      </div>
    </div>
  )
}

function MethodLogo({ id }: { id: Exclude<PaymentMethod, 'none'> }) {
  if (id === 'apple_pay')
    return (
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-black text-white">
        <AppleLogo className="size-5" />
      </span>
    )
  if (id === 'google_pay')
    return (
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-stone-200">
        <GoogleG className="size-5" />
      </span>
    )
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-wine-700 text-white">
      <CreditCard className="size-5" />
    </span>
  )
}

const focusRing = 'outline-none focus-visible:ring-4 focus-visible:ring-wine-200'

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full border-2 transition',
        on ? 'border-wine-700 bg-wine-700' : 'border-wine-200 bg-white',
      )}
    >
      {on && <span className="size-2 rounded-full bg-white" />}
    </span>
  )
}

function QuickPlan({
  on,
  onClick,
  icon,
  title,
  amount,
  note,
}: {
  on: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  amount: string
  note: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'flex min-w-0 flex-col rounded-2xl border bg-white p-3.5 text-left transition sm:p-4',
        focusRing,
        on ? 'border-wine-600 bg-wine-50/40 ring-4 ring-wine-50' : 'border-wine-100 hover:border-wine-300',
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className={cn('grid size-10 place-items-center rounded-xl transition', on ? 'bg-wine-700 text-white' : 'bg-wine-50 text-wine-700')}>
          {icon}
        </span>
        <Radio on={on} />
      </span>
      <span className="mt-3 text-[15px] font-bold leading-tight text-wine-950">{title}</span>
      <span className="mt-1 text-lg font-extrabold text-wine-950">{amount}</span>
      <span className="text-xs text-stone-500">{note}</span>
    </button>
  )
}

function ExpandPlan({
  on,
  onClick,
  icon,
  title,
  note,
  tag,
  children,
}: {
  on: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  note: string
  tag?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-white transition',
        on ? 'border-wine-600 ring-4 ring-wine-50' : 'border-wine-100 hover:border-wine-300',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-expanded={on}
        className={cn('flex w-full items-center gap-3 rounded-2xl p-3.5 text-left sm:p-4', focusRing, on && 'bg-wine-50/40')}
      >
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl transition', on ? 'bg-wine-700 text-white' : 'bg-wine-50 text-wine-700')}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-bold leading-tight text-wine-950">{title}</span>
            {tag && <span className="rounded-full bg-sun-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-wine-800">{tag}</span>}
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-stone-500">{note}</span>
        </span>
        <Radio on={on} />
      </button>
      {on && <div className="animate-fade border-t border-wine-100 px-3.5 pb-4 pt-4 sm:px-4">{children}</div>}
    </div>
  )
}

function Segmented<T extends string | boolean>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon: React.ReactNode }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-wine-50 p-1 ring-1 ring-wine-100">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={cn(
              'flex h-10 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold transition',
              focusRing,
              on ? 'bg-white text-wine-950 shadow-soft ring-1 ring-wine-100' : 'text-stone-500 hover:text-wine-800',
            )}
          >
            <span className={on ? 'text-wine-700' : ''}>{o.icon}</span>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function AmountField({
  label,
  value,
  total,
  presets,
  roundUp,
  error,
  hint,
  onChange,
}: {
  label: string
  value: number
  total: number
  presets: number[]
  roundUp?: boolean
  error: string | null
  hint?: string
  onChange: (v: number) => void
}) {
  const fromPercent = (p: number) => (roundUp ? Math.ceil((total * p) / 100) : Math.round((total * p) / 100))
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor="pay-amount" className="text-sm font-semibold text-wine-950">
          {label}
        </label>
        <span className={cn('text-xs font-bold', error ? 'text-red-600' : 'text-wine-700')}>{percentOf(value, total)}% of {money(total)}</span>
      </div>
      <div
        className={cn(
          'mt-2 flex h-14 items-center gap-2 rounded-2xl border-2 bg-white px-4 transition focus-within:ring-4',
          error ? 'border-red-300 focus-within:ring-red-100' : 'border-wine-100 focus-within:border-wine-400 focus-within:ring-wine-100',
        )}
      >
        <span className="text-sm font-bold text-stone-400">{SALON.currency}</span>
        <input
          id="pay-amount"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={value > 0 ? String(value) : ''}
          onChange={(e) => onChange(Math.min(total, Number(e.target.value.replace(/\D/g, '') || 0)))}
          aria-invalid={!!error}
          className="min-w-0 flex-1 bg-transparent text-xl font-extrabold text-wine-950 outline-none placeholder:text-stone-300"
        />
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {presets.map((p) => {
          const amount = fromPercent(p)
          const on = value === amount
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(amount)}
              aria-pressed={on}
              className={cn(
                'flex flex-col items-center rounded-xl border py-1.5 transition',
                focusRing,
                on ? 'border-wine-700 bg-wine-700 text-white' : 'border-wine-100 bg-white text-wine-900 hover:border-wine-300',
              )}
            >
              <span className="text-sm font-extrabold">{p}%</span>
              <span className={cn('text-[11px] font-medium', on ? 'text-wine-100' : 'text-stone-500')}>{money(amount)}</span>
            </button>
          )
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-2.5 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-700 ring-1 ring-red-100">
          <CircleAlert className="mt-px size-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-2.5 text-xs leading-relaxed text-stone-500">{hint}</p>
      )}
    </div>
  )
}

function Breakdown({ split, showDue = true }: { split: { online: number; atSalon: number; due: number }; showDue?: boolean }) {
  return (
    <div
      className={cn(
        'mt-4 grid divide-x divide-cream-200 rounded-xl bg-cream-50 py-2.5 text-center ring-1 ring-cream-200',
        showDue ? 'grid-cols-3' : 'grid-cols-2',
      )}
    >
      <SplitAmount label="Online now" value={split.online} />
      <SplitAmount label="At salon" value={split.atSalon} />
      {showDue && <SplitAmount label="Kept as due" value={split.due} />}
    </div>
  )
}

function SplitAmount({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 px-1">
      <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className={cn('mt-0.5 whitespace-nowrap text-sm font-extrabold', value > 0 ? 'text-wine-950' : 'text-stone-300')}>{money(value)}</p>
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
