import { useMemo } from 'react'
import { Check, Clock, MapPin } from 'lucide-react'
import { ANY_STYLIST, BRANCHES, CATEGORIES, SERVICES, STYLISTS, serviceById } from '@/data/catalog'
import { SALON } from '@/lib/config'
import { cn, isoDate, minutesLabel, money, timeLabel } from '@/lib/format'
import { useDraft } from '../draft'
import { CATEGORY_ICON, SectionTitle, StepFooter, StepHeading } from '../parts'

function upcomingDays() {
  const out: { iso: string; top: string; day: string }[] = []
  const today = new Date()
  for (let i = 0; i < SALON.bookingDays; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    out.push({
      iso: isoDate(d),
      top: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    })
  }
  return out
}

function slotsFor(date: string | null) {
  const slots: { time: string; past: boolean }[] = []
  const now = new Date()
  const isToday = date === isoDate(now)
  for (let m = SALON.openHour * 60; m < SALON.closeHour * 60; m += SALON.slotMinutes) {
    const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    slots.push({ time, past: isToday && m <= now.getHours() * 60 + now.getMinutes() + 30 })
  }
  return slots
}

export function ServicesStep() {
  const d = useDraft()
  const days = useMemo(upcomingDays, [])
  const slots = slotsFor(d.date)
  const services = SERVICES.filter((s) => s.category === d.category)
  const chosenCats = new Set(d.serviceIds.map((id) => serviceById(id)?.category))
  const stylists = STYLISTS.filter((s) => s.categories.some((c) => chosenCats.has(c) || (chosenCats.size === 0 && c === d.category)))
  const timeOk = d.time && slots.some((s) => s.time === d.time && !s.past)

  return (
    <div>
      <StepHeading eyebrow="Step 1 of 5" title="What would you like today?">
        Pick one or more services, then choose when you'd like to come in.
      </StepHeading>

      <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c.id]
          const count = d.serviceIds.filter((id) => serviceById(id)?.category === c.id).length
          const active = d.category === c.id
          return (
            <button
              key={c.id}
              onClick={() => d.set({ category: c.id })}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
                active ? 'border-wine-700 bg-wine-700 text-white shadow-soft' : 'border-wine-100 bg-white text-wine-950 hover:border-wine-200',
              )}
            >
              <Icon className="size-[18px]" />
              {c.name}
              {count > 0 && (
                <span className={cn('grid size-5 place-items-center rounded-full text-[11px]', active ? 'bg-sun-400 text-wine-950' : 'bg-wine-100 text-wine-800')}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const on = d.serviceIds.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => d.toggleService(s.id)}
              aria-pressed={on}
              className={cn(
                'group flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition',
                on ? 'border-wine-600 ring-4 ring-wine-50' : 'border-wine-100 hover:border-wine-200',
              )}
            >
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-lg border-2 transition',
                  on ? 'border-wine-700 bg-wine-700 text-white' : 'border-wine-200 bg-white text-transparent',
                )}
              >
                <Check className="size-3.5" strokeWidth={3.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-wine-950">
                  {s.name}
                  {s.popular && <span className="rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-bold text-wine-900">Popular</span>}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[13px] text-stone-500">
                  <Clock className="size-3.5" /> {minutesLabel(s.durationMin)}
                </span>
              </span>
              <span className="text-right">
                {s.offerPrice && <span className="block text-xs text-stone-400 line-through">{money(s.price)}</span>}
                <span className="block font-bold text-wine-950">{money(s.offerPrice ?? s.price)}</span>
                {s.offerPrice && (
                  <span className="block text-[11px] font-bold text-wine-600">{Math.round((1 - s.offerPrice / s.price) * 100)}% off</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <SectionTitle>Salon</SectionTitle>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {BRANCHES.map((b) => (
          <button
            key={b.id}
            onClick={() => d.set({ branchId: b.id })}
            className={cn(
              'flex items-start gap-3 rounded-2xl border bg-white p-3.5 text-left transition',
              d.branchId === b.id ? 'border-wine-600 ring-4 ring-wine-50' : 'border-wine-100 hover:border-wine-200',
            )}
          >
            <MapPin className={cn('mt-0.5 size-[18px] shrink-0', d.branchId === b.id ? 'text-wine-700' : 'text-stone-400')} />
            <span>
              <span className="block font-semibold text-wine-950">{b.name}</span>
              <span className="block text-[13px] text-stone-500">{b.area}</span>
            </span>
          </button>
        ))}
      </div>

      <SectionTitle>Stylist</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {[{ id: ANY_STYLIST, name: 'First available', role: 'Shortest wait' }, ...stylists].map((s) => (
          <button
            key={s.id}
            onClick={() => d.set({ stylistId: s.id })}
            className={cn(
              'rounded-2xl border px-4 py-2 text-left transition',
              d.stylistId === s.id ? 'border-wine-700 bg-wine-700 text-white' : 'border-wine-100 bg-white hover:border-wine-200',
            )}
          >
            <span className="block text-sm font-semibold">{s.name}</span>
            <span className={cn('block text-xs', d.stylistId === s.id ? 'text-wine-100' : 'text-stone-500')}>{s.role}</span>
          </button>
        ))}
      </div>

      <SectionTitle>Date</SectionTitle>
      <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {days.map((day) => (
          <button
            key={day.iso}
            onClick={() => d.set({ date: day.iso })}
            className={cn(
              'w-[78px] shrink-0 rounded-2xl border px-2 py-2.5 text-center transition',
              d.date === day.iso ? 'border-wine-700 bg-wine-700 text-white shadow-soft' : 'border-wine-100 bg-white hover:border-wine-200',
            )}
          >
            <span className={cn('block text-xs font-semibold', d.date === day.iso ? 'text-sun-300' : 'text-stone-500')}>{day.top}</span>
            <span className="mt-0.5 block text-[15px] font-bold">{day.day}</span>
          </button>
        ))}
      </div>

      <SectionTitle aside={!d.date && <span className="text-xs text-stone-400">Choose a date first</span>}>Time</SectionTitle>
      <div className={cn('grid grid-cols-3 gap-2 sm:grid-cols-6', !d.date && 'pointer-events-none opacity-40')}>
        {slots.map((s) => (
          <button
            key={s.time}
            disabled={s.past}
            onClick={() => d.set({ time: s.time })}
            className={cn(
              'h-11 rounded-xl border text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-transparent disabled:bg-stone-100 disabled:text-stone-300 disabled:line-through',
              d.time === s.time && !s.past ? 'border-sun-400 bg-sun-400 text-wine-950' : 'border-wine-100 bg-white text-wine-950 hover:border-wine-200',
            )}
          >
            {timeLabel(s.time)}
          </button>
        ))}
      </div>

      <StepFooter
        primary={d.serviceIds.length === 0 ? 'Select a service' : !d.date || !timeOk ? 'Pick date & time' : 'Continue'}
        disabled={d.serviceIds.length === 0 || !d.date || !timeOk}
        onPrimary={() => d.set({ step: 'mobile' })}
      />
    </div>
  )
}
