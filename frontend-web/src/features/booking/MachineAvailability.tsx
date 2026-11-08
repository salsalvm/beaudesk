import { cn } from '@/lib/format'

/** "Available at 3 PM · 2 of 3 open" pill for a machine at the chosen time. */
export function MachineAvailability({ free, total, at, place }: { free: number; total: number; at?: string; place?: string }) {
  const where = place ? ` in ${place}` : ''
  const tone = !at ? 'bg-stone-50 text-stone-600 ring-stone-200' : free === 0 ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', tone)}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {!at
        ? `${total} machine${total === 1 ? '' : 's'}${where}`
        : free === 0
          ? `Fully booked at ${at}${where}`
          : `Available at ${at}${where} · ${free} of ${total} open`}
    </span>
  )
}
