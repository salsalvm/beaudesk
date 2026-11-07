import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Brush, Check, ChevronLeft, Flower2, Hand, Scissors } from 'lucide-react'
import { Button } from '@/components/ui'
import { ANY_STYLIST, branchById, stylistById, type CategoryId } from '@/data/catalog'
import { useDb } from '@/data/db'
import { appointmentLabel, cn, minutesLabel, money } from '@/lib/format'
import { STEPS, useDraft, type Step } from './draft'
import { paymentSplit, summarize } from './pricing'

export const CATEGORY_ICON: Record<CategoryId, typeof Scissors> = {
  hair: Scissors,
  nails: Hand,
  skin: Flower2,
  makeup: Brush,
}

export function useDraftCustomer() {
  const customerId = useDraft((s) => s.customerId)
  return useDb((s) => s.customers.find((c) => c.id === customerId) ?? null)
}

export function useSummary() {
  const draft = useDraft()
  const customer = useDraftCustomer()
  return summarize(draft, customer)
}

export function Stepper({ step }: { step: Step }) {
  const current = STEPS.findIndex((s) => s.id === step)
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((s, i) => (
        <li key={s.id} className="flex flex-1 items-center gap-1.5 sm:gap-2">
          <span
            className={cn(
              'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition',
              i < current && 'bg-wine-700 text-white',
              i === current && 'bg-sun-400 text-wine-950 ring-4 ring-sun-100',
              i > current && 'bg-white text-stone-400 ring-1 ring-wine-100',
            )}
          >
            {i < current ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cn('hidden text-sm font-semibold lg:inline', i === current ? 'text-wine-950' : 'text-stone-400')}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <span className={cn('h-0.5 flex-1 rounded-full', i < current ? 'bg-wine-300' : 'bg-wine-100')} />}
        </li>
      ))}
    </ol>
  )
}

export function StepHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-wine-600">{eyebrow}</p>
      <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-wine-950 sm:text-[30px]">{title}</h1>
      {children && <p className="mt-1.5 text-[15px] text-stone-500">{children}</p>}
    </div>
  )
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between gap-3">
      <h2 className="text-[17px] font-bold text-wine-950">{children}</h2>
      {aside}
    </div>
  )
}

/** Sticky on phones, inline on desktop. */
export function StepFooter({
  primary,
  onPrimary,
  disabled,
  loading,
  secondary,
  onSecondary,
  showTotal = true,
  total,
}: {
  primary: ReactNode
  onPrimary: () => void
  disabled?: boolean
  loading?: boolean
  secondary?: string
  onSecondary?: () => void
  showTotal?: boolean
  total?: { label: string; value: string }
}) {
  const summary = useSummary()
  // Portalled: the animated step wrapper has a transform, which would trap `position: fixed`.
  const mobileBar = (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-wine-100 bg-white/95 px-4 pt-3 shadow-[0_-10px_30px_-18px_rgb(43_10_22/0.35)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-2.5 pb-3">
        {secondary && (
          <Button variant="outline" size="lg" onClick={onSecondary} aria-label={secondary} className="w-14 shrink-0 px-0!">
            <ChevronLeft className="size-5" />
          </Button>
        )}
        {showTotal && (
          <div className="min-w-0 shrink-0 pr-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{total?.label ?? 'Total'}</div>
            <div className="whitespace-nowrap text-lg font-bold leading-tight text-wine-950">{total?.value ?? money(summary.total)}</div>
          </div>
        )}
        <Button size="lg" onClick={onPrimary} disabled={disabled} loading={loading} className="min-w-0 flex-1 whitespace-nowrap px-4!">
          {primary}
        </Button>
      </div>
    </div>
  )
  return (
    <>
      <div className="h-28 lg:hidden" />
      {typeof document !== 'undefined' && createPortal(mobileBar, document.body)}
      <div className="mt-8 hidden items-center justify-end gap-2.5 lg:flex">
        {secondary && (
          <Button variant="outline" size="lg" onClick={onSecondary} className="px-6">
            {secondary}
          </Button>
        )}
        <Button size="lg" onClick={onPrimary} disabled={disabled} loading={loading} className="min-w-56">
          {primary}
        </Button>
      </div>
    </>
  )
}

export function SummaryPanel() {
  const draft = useDraft()
  const customer = useDraftCustomer()
  const summary = summarize(draft, customer)
  const stylist = draft.stylistId === ANY_STYLIST ? 'First available' : stylistById(draft.stylistId)?.name
  const pendingDue = customer?.due && !draft.clearDue ? customer.due.amount : 0
  const split = paymentSplit(summary.total, draft)
  const showSplit = draft.step === 'payment' && split.online !== summary.total

  return (
    <aside className="sticky top-28 hidden self-start lg:block">
      <div className="overflow-hidden rounded-3xl border border-wine-100 bg-white shadow-soft">
        <div className="bg-wine-700 px-5 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-wine-200">Your booking</p>
          <p className="mt-1 text-lg font-bold">
            {draft.date && draft.time ? appointmentLabel(draft.date, draft.time) : 'Pick a date & time'}
          </p>
          <p className="text-sm text-wine-100">
            {branchById(draft.branchId)?.name} · {stylist}
          </p>
        </div>
        <div className="space-y-3 p-5 text-sm">
          {summary.services.length === 0 && <p className="text-stone-400">No services selected yet.</p>}
          {summary.services.map((l) => (
            <Row key={l.serviceId} label={l.name} value={l.coveredByPackageId ? 'Package' : money(l.price)} highlight={!!l.coveredByPackageId} />
          ))}
          {summary.products.map((l) => (
            <Row key={l.productId} label={`${l.name} × ${l.qty}`} value={money(l.price * l.qty)} />
          ))}
          {summary.due > 0 && <Row label="Previous due" value={money(summary.due)} />}
          {summary.durationMin > 0 && <p className="text-xs text-stone-400">About {minutesLabel(summary.durationMin)} in the chair</p>}
          <div className="border-t border-dashed border-wine-100 pt-3">
            {summary.offerSavings + summary.packageSavings > 0 && (
              <Row label="You save" value={money(summary.offerSavings + summary.packageSavings)} highlight />
            )}
            <div className="mt-1 flex items-center justify-between">
              <span className="font-semibold text-wine-950">Total to pay</span>
              <span className="text-xl font-bold text-wine-950">{money(summary.total)}</span>
            </div>
            {showSplit && (
              <div className="mt-3 space-y-1.5 rounded-2xl bg-wine-50/60 p-3 ring-1 ring-wine-100">
                <Row label="Online now" value={money(split.online)} />
                {split.atSalon > 0 && <Row label="At the salon" value={money(split.atSalon)} />}
                {split.due > 0 && <Row label="Kept as due" value={money(split.due)} highlight />}
              </div>
            )}
            {pendingDue > 0 && <p className="mt-2 text-xs text-stone-500">Due of {money(pendingDue)} left for later.</p>}
          </div>
        </div>
      </div>
    </aside>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-stone-600">{label}</span>
      <span className={cn('shrink-0 font-semibold', highlight ? 'text-wine-600' : 'text-wine-950')}>{value}</span>
    </div>
  )
}
