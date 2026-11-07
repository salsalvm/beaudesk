import { DEMO_CUSTOMERS } from '@/data/db'
import { cn, formatPhone } from '@/lib/format'

export function DemoNumbers({
  selected,
  onPick,
  note,
}: {
  selected?: { dial: string; phone: string }
  onPick: (dial: string, phone: string) => void
  note: string
}) {
  return (
    <div className="mt-5 rounded-2xl bg-wine-50/70 p-3.5">
      <p className="text-xs font-bold uppercase tracking-wide text-wine-700">Demo numbers</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {DEMO_CUSTOMERS.map((c) => {
          const on = selected?.dial === c.dial && selected.phone === c.phone
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.dial, c.phone)}
              aria-pressed={on}
              className={cn(
                'rounded-xl bg-white px-3 py-1.5 text-left text-xs ring-1 transition hover:ring-wine-300',
                on ? 'ring-wine-400' : 'ring-wine-100',
              )}
            >
              <span className="block font-semibold text-wine-950">{formatPhone(c.dial, c.phone)}</span>
              <span className="text-stone-500">{c.name.split(' ')[0]} · existing</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-stone-500">{note}</p>
    </div>
  )
}
