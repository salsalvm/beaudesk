import { useEffect, useState, type ReactNode } from 'react'
import { CalendarDays, Check, Cog, MapPin, Moon, Sparkles, Sun, Sunrise } from 'lucide-react'
import { ANY_STYLIST, BRANCHES, CATEGORIES, MACHINES, SERVICES, STYLISTS, serviceById } from '@/data/catalog'
import { useDb } from '@/data/db'
import { machineFree, machineFreesAt } from '@/data/machines'
import { MachineAvailability } from '../MachineAvailability'
import { ServicePrice, ServiceTags } from '@/features/services/ServiceTags'
import { CATEGORY_THEME } from '@/lib/categoryTheme'
import { SALON } from '@/lib/config'
import { cn, initials, isClosedDay, isoDate, longDate, minutesLabel, monthShort, timeLabel } from '@/lib/format'
import { useDraft } from '../draft'
import { CATEGORY_ICON, StepFooter, StepHeading } from '../parts'

function slotsFor(date: string | null) {
  const slots: { time: string; hour: number; past: boolean }[] = []
  const now = new Date()
  const isToday = date === isoDate(now)
  for (let m = SALON.openHour * 60; m < SALON.closeHour * 60; m += SALON.slotMinutes) {
    const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    slots.push({ time, hour: Math.floor(m / 60), past: isToday && m <= now.getHours() * 60 + now.getMinutes() + 30 })
  }
  return slots
}

const DAY_PARTS = [
  { label: 'Morning', icon: Sunrise, from: 0, to: 12 },
  { label: 'Afternoon', icon: Sun, from: 12, to: 17 },
  { label: 'Evening', icon: Moon, from: 17, to: 24 },
]

function Panel({ n, title, aside, children }: { n: number; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-wine-100 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-wine-950">
          <span className="grid size-7 place-items-center rounded-full bg-wine-700 text-xs font-bold text-white">{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function SubLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.08em] text-stone-400">{children}</p>
}

export function ServicesStep() {
  const d = useDraft()
  const today = isoDate(new Date())
  useEffect(() => {
    if (d.date !== today) d.set({ date: today, time: null })
  }, [d, today])
  const slots = slotsFor(d.date)
  const selected = d.serviceIds.flatMap((id) => serviceById(id) ?? [])
  const [kind, setKind] = useState<'services' | 'machines'>(() =>
    selected.length > 0 && selected.every((s) => !s.machine) ? 'services' : 'machines',
  )
  const bookings = useDb((s) => s.bookings)
  const services = (kind === 'services' ? SERVICES : MACHINES).filter((s) => s.category === d.category)
  const freeAt = (id: string) => (d.time ? machineFree(bookings, id, today, d.time, d.branchId) : 0)
  const freesAt = (id: string) => {
    const slot = d.time ? machineFreesAt(bookings, id, today, d.time, d.branchId) : null
    return slot ? timeLabel(slot) : undefined
  }
  const fullMachines = selected.filter((s) => s.machine && d.time && freeAt(s.id) === 0)
  const branchName = BRANCHES.find((b) => b.id === d.branchId)?.name
  const chosenCats = new Set(selected.map((s) => s.category))
  const stylists = STYLISTS.filter((s) => s.categories.some((c) => chosenCats.has(c) || (chosenCats.size === 0 && c === d.category)))
  const dateClosed = isClosedDay(today)
  const noSlotsLeft = !dateClosed && slots.every((s) => s.past)
  const timeOk = d.date === today && d.time && !dateClosed && slots.some((s) => s.time === d.time && !s.past)

  return (
    <div>
      <StepHeading eyebrow="Step 1 of 5" title="What would you like today?">
        Pick services or reserve a machine, then choose your salon and a time that suits you.
      </StepHeading>

      <div className="space-y-4">
        <Panel
          n={1}
          title="Machines & services"
          aside={
            selected.length > 0 && (
              <span className="rounded-full bg-wine-50 px-3 py-1 text-xs font-semibold text-wine-800 ring-1 ring-wine-100">
                {selected.length} selected · {minutesLabel(selected.reduce((m, s) => m + s.durationMin, 0))}
              </span>
            )
          }
        >
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICON[c.id]
              const count = selected.filter((s) => s.category === c.id).length
              const active = d.category === c.id
              const theme = CATEGORY_THEME[c.id]
              return (
                <button
                  key={c.id}
                  onClick={() => d.set({ category: c.id })}
                  aria-pressed={active}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
                    active ? cn(theme.solid, theme.border, 'shadow-soft') : 'border-wine-100 bg-white text-wine-950 hover:border-wine-200',
                  )}
                >
                  <Icon className={cn('size-[18px]', !active && theme.text)} />
                  {c.name}
                  {count > 0 && (
                    <span className={cn('grid size-5 place-items-center rounded-full text-[11px] font-bold', active ? 'bg-white/25 text-white' : theme.soft)}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div role="tablist" aria-label="Book a service or a machine" className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-wine-50/70 p-1 ring-1 ring-wine-100 sm:inline-grid">
            {(
              [
                { id: 'machines', label: 'Machines', icon: Cog, list: MACHINES },
                { id: 'services', label: 'Services', icon: Sparkles, list: SERVICES },
              ] as const
            ).map((tab) => {
              const on = kind === tab.id
              const picked = selected.filter((s) => tab.list.includes(s)).length
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setKind(tab.id)}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-bold transition',
                    on ? 'bg-white text-wine-950 shadow-soft ring-1 ring-wine-100' : 'text-wine-800/70 hover:text-wine-950',
                  )}
                >
                  <tab.icon className={cn('size-4', on ? 'text-wine-700' : 'text-wine-400')} />
                  {tab.label}
                  {picked > 0 && <span className="grid size-5 place-items-center rounded-full bg-sun-400 text-[11px] font-bold text-wine-950">{picked}</span>}
                </button>
              )
            })}
          </div>
          {kind === 'machines' && (
            <p className="mt-3 text-[13px] text-stone-500">
              Reserve a salon machine for your session — it's held just for you at the time you pick below.
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const on = d.serviceIds.includes(s.id)
              const theme = CATEGORY_THEME[s.category]
              const free = s.machine ? freeAt(s.id) : 0
              const full = !!s.machine && !!d.time && free === 0
              return (
                <button
                  key={s.id}
                  onClick={() => d.toggleService(s.id)}
                  disabled={full && !on}
                  aria-pressed={on}
                  className={cn(
                    'flex gap-3.5 rounded-2xl border bg-white p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50',
                    on
                      ? full
                        ? 'border-red-300 ring-4 ring-red-50'
                        : cn(theme.border, theme.ring, 'ring-4')
                      : 'border-wine-100 hover:border-wine-200 hover:shadow-soft',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition',
                      on ? cn(theme.solid, theme.border) : 'border-wine-200 bg-white text-transparent',
                    )}
                  >
                    <Check className="size-3.5" strokeWidth={3.5} />
                  </span>
                  {s.machine && (
                    <img src={s.machine.photo} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-wine-100" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-semibold leading-snug text-wine-950">{s.name}</span>
                      <ServicePrice service={s} />
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-stone-500">{s.description}</span>
                    <span className="mt-2.5 block">
                      {s.machine ? (
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold">
                          <span className="inline-flex items-center gap-1 rounded-md bg-wine-50 px-1.5 py-0.5 uppercase tracking-wide text-wine-700 ring-1 ring-wine-100">
                            <Cog className="size-3" /> Machine
                          </span>
                          <span className="text-stone-500">{minutesLabel(s.durationMin)} session</span>
                          <MachineAvailability
                            free={free}
                            total={s.machine.units}
                            at={d.time ? timeLabel(d.time) : undefined}
                            place={branchName}
                            freesAt={freesAt(s.id)}
                          />
                        </span>
                      ) : (
                        <ServiceTags service={s} />
                      )}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel n={2} title="Salon & stylist">
          <SubLabel>Branch</SubLabel>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {BRANCHES.map((b) => {
              const on = d.branchId === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => d.set({ branchId: b.id })}
                  aria-pressed={on}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border bg-white p-3.5 text-left transition',
                    on ? 'border-wine-600 ring-4 ring-wine-50' : 'border-wine-100 hover:border-wine-200',
                  )}
                >
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', on ? 'bg-wine-700 text-white' : 'bg-wine-50 text-wine-700')}>
                    <MapPin className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-wine-950">{b.name}</span>
                    <span className="block truncate text-[13px] text-stone-500">{b.area}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5">
            <SubLabel>Stylist</SubLabel>
            <div className="flex flex-wrap gap-2">
              {[{ id: ANY_STYLIST, name: 'First available', role: 'Shortest wait' }, ...stylists].map((s) => {
                const on = d.stylistId === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => d.set({ stylistId: s.id })}
                    aria-pressed={on}
                    className={cn(
                      'flex items-center gap-2.5 rounded-2xl border bg-white py-2 pl-2 pr-4 text-left transition',
                      on ? 'border-wine-600 ring-4 ring-wine-50' : 'border-wine-100 hover:border-wine-200',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold',
                        on ? 'bg-wine-700 text-white' : 'bg-wine-50 text-wine-700',
                      )}
                    >
                      {s.id === ANY_STYLIST ? <Sparkles className="size-4" /> : initials(s.name)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-wine-950">{s.name}</span>
                      <span className="block text-xs text-stone-500">{s.role}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </Panel>

        <Panel n={3} title="Date & time">
          <div className="flex items-center gap-3">
            <span
              aria-label={`Today, ${longDate(today)}${dateClosed ? ', closed' : ''}`}
              className={cn(
                'flex w-[62px] shrink-0 flex-col items-center rounded-2xl border py-2',
                dateClosed || noSlotsLeft
                  ? 'border-dashed border-stone-200 bg-stone-50 text-stone-300'
                  : 'border-wine-700 bg-wine-700 text-white shadow-soft',
              )}
            >
              <span className={cn('text-[11px] font-semibold', dateClosed || noSlotsLeft ? 'text-stone-400' : 'text-wine-100')}>Today</span>
              <span className="text-lg font-extrabold leading-tight">{new Date(`${today}T00:00:00`).getDate()}</span>
              <span className={cn('text-[10px] font-bold uppercase', dateClosed ? 'text-red-400' : noSlotsLeft ? 'text-stone-400' : 'text-sun-300')}>
                {dateClosed ? 'Closed' : monthShort(today)}
              </span>
            </span>
            <p className="text-xs text-stone-500">
              <span className="block text-sm font-semibold text-wine-950">{longDate(today)}</span>
              Tokens are for today's visits only · open {SALON.openDaysLabel}, closed on {SALON.closedDaysLabel}
            </p>
          </div>
          {dateClosed || noSlotsLeft ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-wine-200 bg-wine-50/40 px-4 py-5 text-sm text-stone-500">
              <CalendarDays className="size-5 shrink-0 text-wine-600" />
              {dateClosed
                ? `We're closed today (closed on ${SALON.closedDaysLabel}). Come back tomorrow to generate your token.`
                : 'No slots left today. Come back tomorrow to generate your token.'}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {DAY_PARTS.map(({ label, icon: Icon, from, to }) => {
                const part = slots.filter((s) => s.hour >= from && s.hour < to)
                if (part.length === 0) return null
                const allPast = part.every((s) => s.past)
                return (
                  <div key={label}>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-stone-400">
                      <Icon className="size-3.5" /> {label}
                    </p>
                    {allPast ? (
                      <p className="text-sm text-stone-400">No {label.toLowerCase()} slots left today.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {part.map((s) => (
                          <button
                            key={s.time}
                            disabled={s.past}
                            onClick={() => d.set({ time: s.time })}
                            aria-pressed={d.time === s.time}
                            className={cn(
                              'h-10 rounded-xl border text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:border-transparent disabled:bg-stone-50 disabled:text-stone-300',
                              d.time === s.time && !s.past
                                ? 'border-sun-500 bg-sun-400 text-wine-950 shadow-[0_6px_16px_-8px_rgb(245_183_0/0.9)]'
                                : 'border-wine-100 bg-white text-wine-950 hover:border-wine-300',
                            )}
                          >
                            {timeLabel(s.time)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>

      {fullMachines.length > 0 && d.time && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-600">
          {fullMachines.map((s) => s.name).join(', ')} {fullMachines.length === 1 ? 'is' : 'are'} in use at {timeLabel(d.time)} in {branchName}
          {fullMachines.length === 1 && freesAt(fullMachines[0].id) ? ` — free at ${freesAt(fullMachines[0].id)}` : ''}. Pick another time or branch,
          or remove it.
        </p>
      )}

      <StepFooter
        primary={
          dateClosed
            ? 'Closed today'
            : noSlotsLeft
              ? 'No slots left today'
              : d.serviceIds.length === 0
                ? 'Select a service or machine'
                : !timeOk
                  ? 'Pick a time'
                  : fullMachines.length > 0
                    ? 'Machine fully booked'
                    : 'Continue'
        }
        disabled={d.serviceIds.length === 0 || !timeOk || fullMachines.length > 0}
        onPrimary={() => d.set({ step: 'mobile' })}
      />
    </div>
  )
}
