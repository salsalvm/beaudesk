import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  Cog,
  Crown,
  Gift,
  MapPin,
  Moon,
  Navigation,
  Percent,
  Scissors,
  Sparkles,
  Star,
  Store,
  Sun,
  Sunrise,
  Tag,
  Ticket,
  UserRound,
  X,
} from 'lucide-react'
import { Badge, Button, IconTile, Progress, WhatsAppIcon } from '@/components/ui'
import {
  ANY_STYLIST,
  BRANCHES,
  CATEGORIES,
  MACHINES,
  PACKAGE_PLANS,
  SERVICES,
  categoryById,
  planById,
  serviceById,
  servicePrice,
  stylistById,
  type CategoryId,
  type Service,
} from '@/data/catalog'
import { useCurrentCustomer, useDb } from '@/data/db'
import { machineFree, machineFreesAt } from '@/data/machines'
import { CATEGORY_ICON } from '@/features/booking/parts'
import { activePackages, remaining } from '@/features/booking/pricing'
import { useTokenModal } from '@/features/token/TokenModal'
import { CATEGORY_THEME, categoryOfBooking } from '@/lib/categoryTheme'
import { SALON } from '@/lib/config'
import { appointmentLabel, cn, dayLabel, hourLabel, hoursLabel, isClosedDay, isoDate, minutesLabel, money, timeLabel } from '@/lib/format'

const HOURS = `${hourLabel(SALON.openHour)} – ${hourLabel(SALON.closeHour)}`

const TIMES = Array.from(
  { length: SALON.closeHour - SALON.openHour },
  (_, i) => `${String(SALON.openHour + i).padStart(2, '0')}:00`,
)

const DAY_PARTS = [
  { label: 'Morning', icon: Sunrise, from: 0, to: 12 },
  { label: 'Afternoon', icon: Sun, from: 12, to: 17 },
  { label: 'Evening', icon: Moon, from: 17, to: 24 },
]

export function HomePage() {
  return (
    <div className="animate-fade">
      <Hero />
      <div id="book" className="relative z-10 -mt-20 scroll-mt-24 sm:mx-4 lg:mx-8 lg:-mt-24">
        <GenerateTokenCard />
      </div>
      <div className="mt-16 space-y-16">
        <HowItWorks />
        <OurMachines />
        <Categories />
        <PopularServices />
        <YourBeauDesk />
        <Branches />
      </div>
    </div>
  )
}

function nextOpening(now: Date) {
  if (!isClosedDay(isoDate(now)) && now.getHours() < SALON.openHour) return hourLabel(SALON.openHour)
  const d = new Date(now)
  for (let i = 1; i <= 7; i++) {
    d.setDate(d.getDate() + 1)
    if (isClosedDay(isoDate(d))) continue
    const when = i === 1 ? 'tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' })
    return `${when} ${hourLabel(SALON.openHour)}`
  }
  return hourLabel(SALON.openHour)
}

function OpenStatus() {
  const now = new Date()
  const hour = now.getHours()
  const closedToday = isClosedDay(isoDate(now))
  const open = !closedToday && hour >= SALON.openHour && hour < SALON.closeHour
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur">
      <span className={cn('relative flex size-2', open ? 'text-emerald-400' : 'text-sun-400')}>
        {open && <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative size-2 rounded-full bg-current" />
      </span>
      {open
        ? `Open now · until ${hourLabel(SALON.closeHour)}`
        : `${closedToday ? 'Closed today' : 'Closed now'} · opens ${nextOpening(now)}`}
    </span>
  )
}

function Hero() {
  const facts = [
    { icon: Store, label: `${BRANCHES.length} branches`, sub: 'Doha & Lusail' },
    { icon: Sparkles, label: `${SERVICES.length} services`, sub: `${CATEGORIES.length} categories` },
    { icon: Clock, label: SALON.openDaysLabel, sub: HOURS },
  ]
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-wine-950 text-white">
      <img
        src="/img/hero-woman.jpg"
        alt=""
        className="absolute inset-y-0 right-0 h-full w-full object-cover object-[70%_15%] opacity-35 md:w-[60%] md:opacity-100 md:[mask-image:linear-gradient(to_right,transparent,black_45%)]"
      />
      <span className="absolute inset-0 bg-gradient-to-r from-wine-950 via-wine-950/85 to-wine-950/30 md:hidden" />
      <span className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-wine-950/80 to-transparent" />
      <span className="absolute -left-24 -top-28 size-80 rounded-full bg-wine-600/40 blur-3xl" />
      <div className="relative max-w-2xl px-5 pb-24 pt-7 sm:px-10 sm:pb-32 sm:pt-12 lg:max-w-3xl lg:pb-[124px] lg:pt-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <OpenStatus />
          <ul className="hidden items-center gap-4 text-[13px] lg:flex">
            {facts.map(({ icon: Icon, label, sub }) => (
              <li key={label} className="flex items-center gap-1.5 whitespace-nowrap">
                <Icon className="size-4 text-sun-400" />
                <span className="font-bold">{label}</span>
                <span className="text-wine-200">· {sub}</span>
              </li>
            ))}
          </ul>
        </div>
        <h1 className="mt-4 text-[31px] font-extrabold leading-[1.06] tracking-tight min-[400px]:text-[34px] sm:mt-5 sm:text-[54px] lg:mt-4 lg:text-[44px]">
          Your salon visit,
          <br />
          <span className="text-sun-400">booked in a minute.</span>
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-wine-100 sm:mt-4 sm:text-[17px] lg:mt-3 lg:max-w-xl lg:text-[16px] lg:[@media(max-height:820px)]:hidden">
          Pick your treatments, choose a time and get your visit token on WhatsApp. Walk in, show it at reception and relax.
        </p>
        <ul className="mt-5 grid max-w-xl grid-cols-3 gap-2 sm:mt-7 sm:gap-4 lg:hidden">
          {facts.map(({ icon: Icon, label, sub }) => (
            <li
              key={label}
              className="flex min-w-0 flex-col gap-2 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-white/10 sm:flex-row sm:items-start sm:gap-3 sm:bg-transparent sm:p-0 sm:ring-0"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/10 text-sun-400 ring-1 ring-white/15 sm:size-9">
                <Icon className="size-4 sm:size-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold sm:text-sm">{label}</span>
                <span className="block truncate text-[11px] text-wine-200 sm:text-xs">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function StepLabel({ n, children, aside }: { n: number; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm font-bold text-wine-950">
        <span className="grid size-5 place-items-center rounded-full bg-wine-700 text-[11px] text-white">{n}</span>
        {children}
      </span>
      {aside && <span className="text-xs text-stone-500">{aside}</span>}
    </div>
  )
}

function GenerateTokenCard() {
  const navigate = useNavigate()
  const now = new Date()
  const date = isoDate(now)
  const closedToday = isClosedDay(date)
  const openTimes = closedToday ? [] : TIMES.filter((t) => Number(t.slice(0, 2)) > now.getHours())
  const opensLater = now.getHours() < SALON.openHour
  const reopens = nextOpening(now)
  const [weekday, rest] = dayLabel(date).split(', ')
  const [dayNum, month] = rest.split(' ')

  const [category, setCategory] = useState<CategoryId>('hair')
  const [kind, setKind] = useState<'services' | 'machines'>('machines')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [time, setTime] = useState<string | undefined>(() => openTimes[0])
  const bookings = useDb((s) => s.bookings)

  const services = (kind === 'services' ? SERVICES : MACHINES).filter((s) => s.category === category)
  const selected = serviceIds.map((id) => serviceById(id)!)
  const branch = BRANCHES[0]
  const freeAt = (id: string) => (time ? machineFree(bookings, id, date, time, branch.id) : 0)
  const freesAt = (id: string) => {
    const slot = time ? machineFreesAt(bookings, id, date, time, branch.id) : null
    return slot ? hourLabel(Number(slot.slice(0, 2))) : undefined
  }
  const fullMachines = selected.filter((s) => s.machine && freeAt(s.id) === 0)
  const totalMin = selected.reduce((m, s) => m + s.durationMin, 0)
  const total = selected.reduce((sum, s) => sum + servicePrice(s), 0)

  const servicesRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(0)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const list = listRef.current
    if (list && selected.length > prevCount.current) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
    prevCount.current = selected.length
  }, [selected.length])
  const missingService = attempts > 0 && selected.length === 0

  const toggle = (id: string) => setServiceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  const generate = () => {
    if (!time || fullMachines.length > 0) return
    if (selected.length === 0) {
      setAttempts((n) => n + 1)
      servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    navigate(`/book?service=${serviceIds.join(',')}&date=${date}&time=${time}`)
  }

  return (
    <section
      aria-labelledby="token-title"
      className="relative rounded-[28px] bg-white p-4 shadow-lift ring-1 ring-wine-100 sm:p-6 lg:px-7 lg:pb-6 lg:pt-6"
    >
      <span className="absolute -top-3.5 left-5 inline-flex items-center gap-1.5 rounded-full bg-sun-400 px-3 py-1 text-xs font-bold text-wine-950 shadow-[0_6px_16px_-8px_rgb(245_183_0/0.9)] sm:left-7">
        <Sparkles className="size-3.5" /> Fastest way to book
      </span>

      <div className="flex flex-wrap items-center gap-3 pt-2 sm:gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-wine-700 text-sun-400">
          <Ticket className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="token-title" className="text-xl font-extrabold tracking-tight text-wine-950 sm:text-2xl">
            Generate your visit token
          </h2>
          <p className="text-sm text-stone-500">Choose services or a machine and your time — we'll send the token to your WhatsApp.</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 md:inline-flex">
          <WhatsAppIcon className="size-4" /> Token on WhatsApp
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:mt-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
        <div className="min-w-0 space-y-6 lg:space-y-5">
          <div>
            <StepLabel n={1}>Category</StepLabel>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICON[c.id]
                const count = selected.filter((s) => s.category === c.id).length
                const on = c.id === category
                const theme = CATEGORY_THEME[c.id]
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={on}
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-semibold transition sm:text-sm lg:h-12 lg:flex-row lg:justify-center lg:gap-2 lg:py-0',
                      on
                        ? cn(theme.solid, theme.border, 'shadow-[0_8px_20px_-12px_rgb(43_10_22/0.7)]')
                        : 'border-wine-100 bg-white text-wine-900 hover:border-wine-300',
                    )}
                  >
                    <Icon className={cn('size-5 lg:size-[18px]', on ? 'text-white' : theme.text)} />
                    {c.name}
                    {count > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-sun-400 text-[11px] font-bold text-wine-950 ring-2 ring-white">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div ref={servicesRef} className="scroll-mt-28">
            <div
              key={attempts}
              className={cn('-m-2.5 rounded-2xl p-2.5 transition-colors', missingService && 'animate-shake bg-red-50/60 ring-2 ring-red-200')}
            >
              <StepLabel
                n={2}
                aside={
                  selected.length > 0 ? (
                    <span className="font-semibold text-emerald-700">{selected.length} selected ✓</span>
                  ) : (
                    <span>
                      <span className="font-semibold text-red-600">Required</span> · pick 1 or more
                    </span>
                  )
                }
              >
                Machines & services
              </StepLabel>
              <div role="tablist" aria-label="Book a service or a machine" className="mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-wine-50/70 p-1 ring-1 ring-wine-100 sm:inline-grid">
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
                        'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-bold transition',
                        on ? 'bg-white text-wine-950 shadow-soft ring-1 ring-wine-100' : 'text-wine-800/70 hover:text-wine-950',
                      )}
                    >
                      <tab.icon className={cn('size-4', on ? 'text-wine-700' : 'text-wine-400')} />
                      {tab.label}
                      {picked > 0 && (
                        <span className="grid size-5 place-items-center rounded-full bg-sun-400 text-[11px] font-bold text-wine-950">{picked}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {kind === 'machines' && (
                <p className="mb-2.5 text-xs text-stone-500">
                  Reserve a salon machine for your session{time ? ` at ${hourLabel(Number(time.slice(0, 2)))}` : ''} — it's held just for you.
                  Showing {branch.name}; you can switch branch next.
                </p>
              )}
              <div className={cn('grid gap-2', kind === 'machines' ? 'grid-cols-2 gap-2.5 sm:gap-3' : 'grid-cols-2 sm:flex sm:flex-wrap')}>
                {kind === 'machines' &&
                  services.map((s) => (
                    <MachineTile
                      key={s.id}
                      machine={s}
                      on={serviceIds.includes(s.id)}
                      free={freeAt(s.id)}
                      total={s.machine!.units}
                      at={time ? hourLabel(Number(time.slice(0, 2))) : undefined}
                      freesAt={freesAt(s.id)}
                      onToggle={() => toggle(s.id)}
                    />
                  ))}
                {kind === 'services' && services.map((s) => {
                  const on = serviceIds.includes(s.id)
                  const theme = CATEGORY_THEME[s.category]
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      aria-pressed={on}
                      className={cn(
                        'flex min-h-[54px] min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition sm:min-h-0 sm:h-10 sm:gap-2 sm:py-0',
                        on ? cn(theme.soft, theme.border, theme.ring, 'ring-2') : 'border-wine-100 bg-white text-wine-950 hover:border-wine-300',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-4 shrink-0 place-items-center rounded-[5px] border transition',
                          on ? cn(theme.solid, theme.border) : 'border-wine-200 text-transparent',
                        )}
                      >
                        <Check className="size-3" strokeWidth={3.5} />
                      </span>
                      <span className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="leading-tight sm:whitespace-nowrap">{s.name}</span>
                        <span className={cn('mt-0.5 text-[12px] font-medium sm:mt-0 sm:text-[13px]', on ? theme.text : 'text-stone-400')}>
                          {money(servicePrice(s))}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {missingService && (
                <p role="alert" className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                  <CircleAlert className="size-4" /> Pick at least one service or machine to generate your token.
                </p>
              )}
              {fullMachines.length > 0 && time && (
                <p role="alert" className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                  <CircleAlert className="size-4 shrink-0" />
                  {fullMachines.map((s) => s.name).join(', ')} {fullMachines.length === 1 ? 'is' : 'are'} in use at{' '}
                  {hourLabel(Number(time.slice(0, 2)))}
                  {fullMachines.length === 1 && freesAt(fullMachines[0].id) ? ` — free at ${freesAt(fullMachines[0].id)}` : ''}. Pick another time or
                  remove it.
                </p>
              )}
            </div>
          </div>

          <div>
            <StepLabel
              n={3}
              aside={
                time && (
                  <span className="font-semibold text-emerald-700">
                    {openTimes.length} {openTimes.length === 1 ? 'slot' : 'slots'} left today
                  </span>
                )
              }
            >
              Date & time
            </StepLabel>
            <div className={cn('overflow-hidden rounded-2xl ring-1', time ? 'bg-cream-50 ring-cream-200' : 'bg-red-50/60 ring-red-100')}>
              <div className="flex items-center gap-3 p-3">
                <span
                  aria-label={`Today, ${weekday} ${Number(dayNum)} ${month}${closedToday ? ', closed' : ''}`}
                  className="flex w-14 shrink-0 flex-col overflow-hidden rounded-xl bg-white text-center shadow-soft ring-1 ring-wine-100"
                >
                  <span className={cn('py-0.5 text-[10px] font-bold uppercase tracking-wider text-white', closedToday ? 'bg-red-500' : 'bg-wine-700')}>
                    {closedToday ? 'Closed' : month}
                  </span>
                  <span className={cn('pt-1 text-xl font-extrabold leading-none', time ? 'text-wine-950' : 'text-stone-400')}>{Number(dayNum)}</span>
                  <span className="pb-1.5 pt-0.5 text-[10px] font-semibold text-stone-500">{weekday}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-wine-950">
                    Today · {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 flex items-center gap-1.5 text-xs font-semibold',
                      closedToday ? 'text-red-600' : !time ? 'text-amber-700' : opensLater ? 'text-amber-700' : 'text-emerald-700',
                    )}
                  >
                    <span className="relative flex size-2">
                      {time && !opensLater && <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60" />}
                      <span className="relative size-2 rounded-full bg-current" />
                    </span>
                    {closedToday
                      ? `Closed today · we're closed on ${SALON.closedDaysLabel}`
                      : !time
                        ? `No slots left today · closes ${hourLabel(SALON.closeHour)}`
                        : opensLater
                          ? `Opens ${hourLabel(SALON.openHour)} today`
                          : `Open now · until ${hourLabel(SALON.closeHour)}`}
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-wine-700 ring-1 ring-wine-100 sm:inline-flex">
                  <Ticket className="size-3.5" /> Same-day token
                </span>
              </div>

              {time ? (
                <div className="space-y-2.5 border-t border-dashed border-cream-200 bg-white/70 p-3">
                  {DAY_PARTS.map(({ label, icon: Icon, from, to }) => {
                    const part = TIMES.filter((t) => Number(t.slice(0, 2)) >= from && Number(t.slice(0, 2)) < to)
                    if (part.length === 0) return null
                    const partOver = part.every((t) => !openTimes.includes(t))
                    return (
                      <div key={label} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                        <span
                          className={cn(
                            'flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]',
                            partOver ? 'text-stone-300' : 'text-stone-400',
                          )}
                        >
                          <Icon className="size-3.5" /> {label}
                        </span>
                        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">
                          {part.map((t) => {
                            const on = t === time
                            const past = !openTimes.includes(t)
                            return (
                              <button
                                key={t}
                                type="button"
                                disabled={past}
                                onClick={() => setTime(t)}
                                aria-pressed={on}
                                aria-label={past ? `${timeLabel(t)}, time passed` : timeLabel(t)}
                                title={past ? 'This time has passed' : undefined}
                                className={cn(
                                  'inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-xl border px-2 text-[13px] font-semibold transition sm:min-w-[68px] sm:px-3',
                                  past
                                    ? 'cursor-not-allowed border-dashed border-stone-200 bg-stone-50 text-stone-300 line-through decoration-stone-300'
                                    : on
                                      ? 'border-sun-500 bg-sun-400 text-wine-950 shadow-[0_6px_16px_-8px_rgb(245_183_0/0.9)]'
                                      : 'border-wine-100 bg-white text-wine-950 hover:border-wine-300 hover:bg-wine-50/40',
                                )}
                              >
                                {on && <Check className="size-3.5" strokeWidth={3} />}
                                {hourLabel(Number(t.slice(0, 2)))}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="flex items-center gap-2 border-t border-dashed border-red-100 px-3 py-2.5 text-[13px] text-red-700">
                  <CalendarClock className="size-4 shrink-0" />
                  Tokens are for same-day visits — come back {reopens} to get yours.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="relative lg:min-h-[400px]">
          <div className="flex flex-col rounded-3xl bg-cream-50 p-4 ring-1 ring-cream-200 sm:p-5 lg:absolute lg:inset-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-wine-600">Your visit</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-wine-950">
              <CalendarDays className="size-4 text-wine-700" />{' '}
              {time ? appointmentLabel(date, time) : `${dayLabel(date)} · ${closedToday ? 'Closed today' : 'No slots left'}`}
            </p>

            <TokenPreview />

            {selected.length > 0 && (
              <p className="mt-4 hidden items-center justify-between border-t border-dashed border-cream-200 pt-2.5 text-xs font-bold uppercase tracking-[0.08em] text-wine-600 lg:flex">
                Selected <span className="text-stone-400">{selected.length}</span>
              </p>
            )}
            <div
              ref={listRef}
              className="mt-4 max-h-72 min-h-28 flex-1 overflow-y-auto overscroll-contain rounded-2xl [scrollbar-color:var(--color-cream-200)_transparent] [scrollbar-width:thin] lg:mt-2 lg:min-h-0 lg:max-h-none"
            >
              {selected.length === 0 ? (
                <div className="relative flex h-full min-h-40 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-cream-200 bg-white/70 px-5 py-6 text-center lg:min-h-20">
                  <span className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-sun-100/70" />
                  <span className="pointer-events-none absolute -bottom-12 -left-8 size-28 rounded-full bg-wine-50" />
                  <span className="relative grid size-14 place-items-center rounded-2xl bg-white text-wine-700 shadow-soft ring-1 ring-wine-100">
                    <Ticket className="size-6" />
                    <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-sun-400 text-wine-950 ring-2 ring-white">
                      <Sparkles className="size-3.5" />
                    </span>
                  </span>
                  <p className="relative mt-3.5 text-[15px] font-bold text-wine-950">Your visit is empty</p>
                  <p className="relative mt-1 max-w-[260px] text-[13px] leading-relaxed text-stone-500">
                    Pick a machine or a service <span className="lg:hidden">above</span>
                    <span className="hidden lg:inline">on the left</span> — it'll show up here with the price.
                  </p>
                  <span className="relative mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-wine-700 ring-1 ring-wine-100">
                      <Cog className="size-3.5" /> Machines
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-wine-700 ring-1 ring-wine-100">
                      <Scissors className="size-3.5" /> Services
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100">
                      <WhatsAppIcon className="size-3.5" /> Token on WhatsApp
                    </span>
                  </span>
                </div>
              ) : (
                <ul className="space-y-2 pr-1 lg:space-y-1.5">
                  {selected.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-cream-200 animate-fade lg:gap-2.5 lg:rounded-xl lg:py-1.5 lg:pl-2.5 lg:pr-1.5">
                      <span className={cn('h-8 w-1 shrink-0 rounded-full lg:h-5', CATEGORY_THEME[s.category].dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-wine-950 lg:text-[13px]">
                          <span className="min-w-0 truncate">{s.name}</span>
                          {s.machine && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-wine-50 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-wine-700 ring-1 ring-wine-100">
                              <Cog className="size-3" /> Machine
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-stone-500 lg:hidden">
                          {categoryById(s.category).name} · {minutesLabel(s.durationMin)}
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-sm font-bold text-wine-950 lg:text-[13px]">{money(servicePrice(s))}</span>
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        aria-label={`Remove ${s.name}`}
                        className="grid size-7 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-wine-50 hover:text-wine-700"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selected.length > 0 && (
              <div className="mt-4 flex items-end justify-between border-t border-dashed border-cream-200 pt-3 lg:mt-3">
                <span className="text-sm text-stone-600">
                  {selected.length} {selected.length === 1 ? 'service' : 'services'} · {minutesLabel(totalMin)}
                </span>
                <span className="text-xl font-extrabold text-wine-950">{money(total)}</span>
              </div>
            )}

            <Button
              size="lg"
              className={cn('mt-4 w-full text-[17px] lg:mt-3', selected.length === 0 && 'opacity-60')}
              disabled={!time || fullMachines.length > 0}
              onClick={generate}
            >
              <Tag className="size-5" /> {time ? 'Generate Token' : closedToday ? 'Closed today' : 'No slots left today'}
            </Button>
            <p
              className={cn(
                'mt-2.5 text-center text-xs',
                !time || selected.length === 0 ? 'font-semibold text-red-600' : 'text-stone-500 lg:hidden',
              )}
            >
              {!time
                ? `Tokens are for same-day visits — come back ${reopens}`
                : selected.length === 0
                  ? 'Select at least one service or machine to generate a token'
                  : 'Next: confirm your WhatsApp number · takes under a minute'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function TokenPreview() {
  const steps = [
    { icon: Sparkles, label: 'Choose' },
    { icon: WhatsAppIcon, label: 'Confirm' },
    { icon: Ticket, label: 'Show token' },
  ]
  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-wine-700 text-white shadow-[0_12px_28px_-18px_rgb(43_10_22/0.9)]">
      <div className="relative flex items-center gap-3 p-3">
        <span className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-white/10" />
        <span className="relative flex h-14 w-[78px] shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-white/30 bg-white/10">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-wine-100">Token</span>
          <span className="text-[17px] font-extrabold leading-tight tracking-tight text-sun-300">{SALON.tokenPrefix}-•••</span>
        </span>
        <div className="relative min-w-0">
          <p className="text-[14px] font-bold leading-tight">Your visit token</p>
          <p className="mt-0.5 text-[12px] leading-snug text-wine-100">Generated instantly and sent to your WhatsApp — show it at reception, no queue.</p>
        </div>
      </div>
      <ol className="grid grid-cols-3 border-t border-white/10 bg-wine-800/60 text-[11px] font-semibold text-wine-100">
        {steps.map(({ icon: Icon, label }, i) => (
          <li key={label} className={cn('flex items-center justify-center gap-1.5 px-1 py-2', i > 0 && 'border-l border-white/10')}>
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-sun-400 text-[10px] font-extrabold text-wine-950">{i + 1}</span>
            <Icon className="hidden size-3.5 shrink-0 text-sun-300 sm:block" />
            <span className="truncate">{label}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function MachineTile({
  machine: m,
  on,
  free,
  total,
  at,
  freesAt,
  onToggle,
}: {
  machine: Service
  on: boolean
  free: number
  total: number
  at?: string
  /** When a unit in use at `at` frees up today. */
  freesAt?: string
  onToggle: () => void
}) {
  const theme = CATEGORY_THEME[m.category]
  const full = !!at && free === 0
  const low = !full && free <= Math.max(1, Math.round(total / 4))
  const inUse = total - free
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={full && !on}
      aria-pressed={on}
      aria-label={`${m.name}, ${money(servicePrice(m))}, ${full ? `in use at ${at}${freesAt ? `, free at ${freesAt}` : ''}` : `${free} of ${total} open`}`}
      className={cn(
        'group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white text-left transition disabled:cursor-not-allowed',
        on
          ? full
            ? 'border-red-300 ring-2 ring-red-100'
            : cn(theme.border, theme.ring, 'ring-2 shadow-[0_10px_24px_-16px_rgb(43_10_22/0.6)]')
          : 'border-wine-100 hover:-translate-y-0.5 hover:border-wine-200 hover:shadow-soft',
      )}
    >
      <span className="relative block aspect-[2/1] overflow-hidden bg-wine-50 sm:aspect-[5/2]">
        <img
          src={m.machine!.photo}
          alt=""
          loading="lazy"
          className={cn('size-full object-cover transition duration-500 group-hover:scale-105', full && !on && 'grayscale')}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-wine-950/55 via-transparent to-transparent" />
        <span
          className={cn(
            'absolute left-2 top-2 grid size-6 place-items-center rounded-full ring-2 transition',
            on ? cn(theme.solid, 'ring-white') : 'bg-wine-950/25 text-transparent ring-white backdrop-blur',
          )}
        >
          <Check className="size-3.5" strokeWidth={3.5} />
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[12px] font-extrabold text-wine-950 shadow-sm">
          {money(servicePrice(m))}
        </span>
        {!full && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-wine-950/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            <Clock className="size-3" /> {minutesLabel(m.durationMin)}
          </span>
        )}
        {full && (
          <span className="absolute inset-x-2 bottom-2 rounded-lg bg-wine-950/85 px-2 py-1 text-center text-[11px] font-bold text-white ring-1 ring-white/15 backdrop-blur">
            {total === 1 ? 'In use' : `All ${total} in use`} at {at}
            {freesAt && <span className="text-sun-300"> · free at {freesAt}</span>}
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <span className="line-clamp-2 text-[13px] font-bold leading-tight text-wine-950 sm:line-clamp-1">{m.name}</span>
        <span className="mt-auto pt-1.5">
          <span className="flex items-center justify-between gap-2 text-[11px] font-semibold">
            <span className={cn(full ? 'text-red-600' : low ? 'text-amber-700' : 'text-emerald-700')}>
              {!at
                ? 'Pick a time'
                : full
                  ? freesAt
                    ? `${total === 1 ? 'In use' : `All ${total} in use`} · free at ${freesAt}`
                    : 'Booked today'
                  : inUse > 0
                    ? `${low ? `Only ${free} left` : `${inUse} in use`}${freesAt ? ` · more at ${freesAt}` : ''}`
                    : `Available · ${at}`}
            </span>
            <span className="text-stone-400">
              {free}/{total}
            </span>
          </span>
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-stone-100">
            <span
              className={cn('block h-full rounded-full transition-all', full ? 'bg-red-400' : low ? 'bg-amber-400' : 'bg-emerald-500')}
              style={{ width: `${total ? (free / total) * 100 : 0}%` }}
            />
          </span>
        </span>
      </span>
    </button>
  )
}

function SectionHead({ eyebrow, title, text, link }: { eyebrow: string; title: string; text?: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-wine-600">{eyebrow}</p>
        <h2 className="mt-1 text-[24px] font-extrabold tracking-tight text-wine-950 sm:text-[28px]">{title}</h2>
        {text && <p className="mt-1 max-w-xl text-sm text-stone-500 sm:text-[15px]">{text}</p>}
      </div>
      {link && (
        <Link to={link.to} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-wine-800 hover:text-wine-600 sm:flex">
          {link.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  )
}

function HowItWorks() {
  const steps = [
    { icon: Sparkles, title: 'Pick your services', text: 'Combine hair, nails, skin and makeup treatments in a single visit.' },
    { icon: CalendarClock, title: 'Choose branch & time', text: 'Tokens are for same-day visits — pick a time today at the branch that suits you.' },
    { icon: Ticket, title: 'Show your token', text: 'Your token arrives on WhatsApp. Show it at reception and you’re in.' },
  ]
  return (
    <section>
      <SectionHead eyebrow="How it works" title="Three steps to your appointment" />
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li
            key={title}
            className="relative flex items-start gap-4 overflow-hidden rounded-3xl border border-wine-100 bg-white p-4 shadow-soft md:block md:p-5"
          >
            <span className="absolute -right-1 -top-3 text-[64px] font-extrabold leading-none text-wine-50 md:-right-2 md:-top-5 md:text-[88px]">{i + 1}</span>
            <IconTile className="relative shrink-0">
              <Icon className="size-5" />
            </IconTile>
            <div className="relative min-w-0 pr-6 md:pr-0">
              <h3 className="font-bold text-wine-950 md:mt-4">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function OurMachines() {
  const [cat, setCat] = useState<CategoryId | 'all'>('all')
  const [showAll, setShowAll] = useState(false)
  const list =
    cat !== 'all'
      ? MACHINES.filter((m) => m.category === cat)
      : showAll
        ? MACHINES
        : CATEGORIES.flatMap((c) => MACHINES.filter((m) => m.category === c.id).slice(0, 2))
  const chips = [{ id: 'all' as const, name: 'All', count: MACHINES.length }, ...CATEGORIES.map((c) => ({ id: c.id, name: c.name, count: MACHINES.filter((m) => m.category === c.id).length }))]

  return (
    <section>
      <SectionHead
        eyebrow="Our machines"
        title="Professional salon machines"
        text="Reserve a machine for your own session — pick a time today and it's held just for you."
        link={{ to: '/book?service=mc-nails-pedi-spa', label: 'Reserve a machine' }}
      />
      <div role="tablist" aria-label="Machine category" className="-mx-3 mb-4 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        {chips.map((c) => {
          const on = cat === c.id
          const Icon = c.id === 'all' ? Cog : CATEGORY_ICON[c.id]
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setCat(c.id)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition',
                on
                  ? c.id === 'all'
                    ? 'border-wine-700 bg-wine-700 text-white'
                    : cn(CATEGORY_THEME[c.id].solid, CATEGORY_THEME[c.id].border)
                  : 'border-wine-100 bg-white text-wine-950 hover:border-wine-300',
              )}
            >
              <Icon className={cn('size-4', !on && (c.id === 'all' ? 'text-wine-700' : CATEGORY_THEME[c.id].text))} />
              {c.name}
              <span className={cn('rounded-full px-1.5 text-[11px] font-bold', on ? 'bg-white/20' : 'bg-wine-50 text-wine-700')}>{c.count}</span>
            </button>
          )
        })}
      </div>
      <div className="-mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-2 scrollbar-none sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {list.map((m) => {
          const Icon = CATEGORY_ICON[m.category]
          return (
            <Link
              key={m.id}
              to={`/book?service=${m.id}`}
              className="group flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-wine-100 bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-wine-200 lg:w-auto"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-wine-50">
                <img
                  src={m.machine!.photo}
                  alt={m.name}
                  loading="lazy"
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span
                  className={cn(
                    'absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm',
                    CATEGORY_THEME[m.category].solid,
                  )}
                >
                  <Icon className="size-3.5" /> {categoryById(m.category).name}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold text-wine-950 shadow-sm">
                  {money(servicePrice(m))}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="font-bold leading-snug text-wine-950">{m.name}</p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-stone-500">{m.description}</p>
                <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-semibold text-stone-500">
                  <Clock className="size-3.5 shrink-0" /> {minutesLabel(m.durationMin)} session · {m.machine!.units} per branch
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-wine-700 transition-all group-hover:gap-2">
                  Reserve <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
      {cat === 'all' && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer machines' : `Show all ${MACHINES.length} machines`}
          </Button>
        </div>
      )}
    </section>
  )
}

function Categories() {
  return (
    <section>
      <SectionHead
        eyebrow="Our services"
        title="Care for every part of you"
        text="Professional hair, nail, skin and makeup services by experienced stylists."
        link={{ to: '/services', label: 'All services & prices' }}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c.id]
          const list = SERVICES.filter((s) => s.category === c.id)
          const from = Math.min(...list.map(servicePrice))
          return (
            <Link
              key={c.id}
              to={`/book?category=${c.id}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-wine-900 shadow-soft"
            >
              <img src={c.photo} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-wine-950/95 via-wine-950/35 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                <span className={cn('grid size-9 place-items-center rounded-xl ring-2 ring-white/25', CATEGORY_THEME[c.id].solid)}>
                  <Icon className="size-[18px]" />
                </span>
                <span className="mt-3 block text-lg font-bold sm:text-xl">{c.name}</span>
                <span className="block text-xs text-wine-100 sm:text-sm">
                  <span className="block sm:inline">{list.length} services</span>
                  <span className="hidden sm:inline"> · </span>
                  <span className="block font-semibold text-sun-300 sm:inline sm:font-normal sm:text-wine-100">from {money(from)}</span>
                </span>
                <span className="mt-2 hidden items-center gap-1 text-sm font-semibold text-sun-300 transition group-hover:gap-2 sm:inline-flex">
                  Book {c.name.toLowerCase()} <ArrowRight className="size-4" />
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function PopularServices() {
  const popular = SERVICES.filter((s) => s.popular)
  return (
    <section>
      <SectionHead eyebrow="Most booked" title="Popular right now" link={{ to: '/services', label: 'See full menu' }} />
      <div className="-mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-2 scrollbar-none sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {popular.map((s) => {
          const Icon = CATEGORY_ICON[s.category]
          const off = s.offerPrice ? Math.round((1 - s.offerPrice / s.price) * 100) : 0
          return (
            <Link
              key={s.id}
              to={`/book?service=${s.id}`}
              className="group flex w-[220px] shrink-0 snap-start flex-col rounded-3xl border border-wine-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-wine-200 lg:w-auto"
            >
              <div className="flex items-start justify-between">
                <span className={cn('grid size-10 place-items-center rounded-2xl', CATEGORY_THEME[s.category].soft)}>
                  <Icon className="size-5" />
                </span>
                {off > 0 && <Badge tone="sun">{off}% off</Badge>}
              </div>
              <p className="mt-4 font-bold text-wine-950">{s.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                <Clock className="size-3.5" /> {minutesLabel(s.durationMin)} · {categoryById(s.category).name}
              </p>
              <div className="mt-auto flex items-end justify-between pt-5">
                <span>
                  {s.offerPrice && <span className="block text-xs text-stone-400 line-through">{money(s.price)}</span>}
                  <span className="text-lg font-extrabold text-wine-950">{money(servicePrice(s))}</span>
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-sun-400 text-wine-950 transition group-hover:bg-sun-300">
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function YourBeauDesk() {
  return (
    <section>
      <SectionHead eyebrow="Your BeauDesk" title="Visits, memberships & rewards" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          <UpcomingCard />
          <MembershipCard />
        </div>
        <LoyaltyCard />
      </div>
    </section>
  )
}

function Branches() {
  return (
    <section>
      <SectionHead eyebrow="Visit us" title="Our branches" text={`Open ${SALON.openDaysLabel}, ${HOURS} · closed on ${SALON.closedDaysLabel}. Book at any branch and show your token at reception.`} />
      <div className="grid gap-3 md:grid-cols-3">
        {BRANCHES.map((b) => (
          <div key={b.id} className="flex flex-col rounded-3xl border border-wine-100 bg-white p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <IconTile>
                <MapPin className="size-5" />
              </IconTile>
              <div className="min-w-0">
                <h3 className="font-bold text-wine-950">BeauDesk {b.name}</h3>
                <p className="text-sm text-stone-500">{b.area}</p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-wine-950">
              <Clock className="size-4 text-wine-700" /> {hoursLabel()}
            </p>
            <p className="mt-1 pl-6 text-xs font-semibold text-red-500">Closed on {SALON.closedDaysLabel}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name}, ${b.area}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-wine-100 text-sm font-semibold text-wine-900 transition hover:border-wine-200 hover:bg-wine-50"
            >
              <Navigation className="size-4" /> Get directions
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

function Panel({ icon, title, subtitle, aside, children, className }: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-3xl border border-wine-100 bg-white p-4 shadow-soft sm:p-5', className)}>
      <div className="mb-4 flex items-center gap-3">
        <IconTile>{icon}</IconTile>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-wine-950">{title}</h3>
          {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </div>
  )
}

function MembershipCard() {
  const customer = useCurrentCustomer()
  const pkg = activePackages(customer)[0]
  const plan = pkg ? planById(pkg.planId) : PACKAGE_PLANS[0]
  if (!plan) return null

  return (
    <Link to="/memberships" className="block">
      <Panel
        icon={<Crown className="size-5" />}
        title={pkg ? 'Active membership' : 'Memberships'}
        subtitle={plan.name}
        aside={pkg ? <Badge tone="sun">Active</Badge> : <Badge>Save more</Badge>}
      >
        <div className="rounded-2xl bg-wine-50/60 p-4 ring-1 ring-wine-100">
          {pkg ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-wine-950">
                  <b>{remaining(pkg)} of {pkg.total}</b> sessions remaining
                </span>
                <ChevronRight className="size-4 text-stone-400" />
              </div>
              <Progress value={(remaining(pkg) / pkg.total) * 100} className="mt-3 bg-white" />
            </>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-wine-950">{plan.perks}</span>
              <ChevronRight className="size-4 text-stone-400" />
            </div>
          )}
        </div>
      </Panel>
    </Link>
  )
}

function UpcomingCard() {
  const customerId = useDb((s) => s.currentCustomerId)
  const bookings = useDb((s) => s.bookings)
  const show = useTokenModal((s) => s.show)
  const today = isoDate(new Date())
  const next = bookings
    .filter((b) => b.customerId === customerId && b.status === 'confirmed' && b.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]

  return (
    <Panel
      icon={<CalendarDays className="size-5" />}
      title="Upcoming booking"
      aside={next && <ChevronRight className="size-5 text-wine-950" />}
    >
      {next ? (
        <button onClick={() => show(next.id)} className="flex w-full items-center gap-4 rounded-2xl bg-wine-50/60 p-3 text-left ring-1 ring-wine-100">
          <span className={cn('shrink-0 rounded-xl px-3 py-2 text-center', CATEGORY_THEME[categoryOfBooking(next)].soft)}>
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">Token</span>
            <span className="block whitespace-nowrap text-lg font-extrabold leading-tight">{next.token}</span>
          </span>
          <span className="min-w-0 space-y-1 border-l border-wine-100 pl-4 text-xs text-wine-950">
            <span className="flex items-center gap-2 truncate">
              <Scissors className="size-3.5 shrink-0 text-wine-700" /> {next.services.map((s) => s.name).join(', ')}
            </span>
            <span className="flex items-center gap-2">
              <UserRound className="size-3.5 shrink-0 text-wine-700" /> Stylist: {next.stylistId === ANY_STYLIST ? 'First available' : stylistById(next.stylistId)?.name}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0 text-wine-700" /> {appointmentLabel(next.date, next.time)}
            </span>
          </span>
        </button>
      ) : (
        <a href="#book" className="flex items-center justify-between rounded-2xl bg-wine-50/60 p-4 text-sm ring-1 ring-wine-100">
          <span className="text-stone-600">No upcoming visits yet. Generate a token in a minute.</span>
          <Ticket className="size-5 text-wine-700" />
        </a>
      )}
    </Panel>
  )
}

function LoyaltyCard() {
  const customer = useCurrentCustomer()
  const facial = serviceById('skin-hydrafacial')!
  const off = Math.round((1 - (facial.offerPrice ?? facial.price) / facial.price) * 100)

  return (
    <Panel
      icon={<Gift className="size-5" />}
      title="Loyalty & rewards"
      subtitle="Book, enjoy, and get rewarded."
      className="relative overflow-hidden"
    >
      <span className="absolute -right-6 top-6 size-14 rounded-full bg-sun-400" />
      <div className="relative rounded-2xl bg-cream-100 p-4 ring-1 ring-cream-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-stone-600">{customer ? 'You have' : 'Earn as you visit'}</p>
            <p className="text-2xl font-extrabold text-wine-950">{customer ? `${customer.points} Points` : '1 pt / QAR 10'}</p>
          </div>
          <span className="grid size-12 place-items-center rounded-full bg-sun-400 text-white shadow-[0_0_0_6px_rgb(255_203_43/0.25)]">
            <Star className="size-6 fill-white" />
          </span>
        </div>
        <p className="mt-2 text-xs text-stone-600">Redeem points at reception for discounts and exclusive perks.</p>
      </div>
      <div className="relative mt-4 border-t border-wine-100 pt-4">
        <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-wine-950">
          <Tag className="size-4 text-sun-500" /> Current offer
        </p>
        <Link to="/book?category=skin" className="flex items-center gap-3 rounded-2xl bg-sun-50 p-3 ring-1 ring-sun-200">
          <span className="grid size-10 place-items-center rounded-full bg-sun-400 text-wine-950">
            <Percent className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-wine-950">{off}% off on facials</span>
            <span className="block text-xs text-stone-500">Limited-time offer · Book now!</span>
          </span>
          <ChevronRight className="size-4 text-stone-400" />
        </Link>
      </div>
    </Panel>
  )
}
