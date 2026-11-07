import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  Crown,
  Gift,
  MapPin,
  Navigation,
  Percent,
  Scissors,
  Sparkles,
  Star,
  Store,
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
  PACKAGE_PLANS,
  SERVICES,
  categoryById,
  planById,
  serviceById,
  servicePrice,
  stylistById,
  type CategoryId,
} from '@/data/catalog'
import { useCurrentCustomer, useDb } from '@/data/db'
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

export function HomePage() {
  return (
    <div className="animate-fade">
      <Hero />
      <div id="book" className="relative z-10 -mt-20 scroll-mt-24 sm:mx-4 lg:mx-8 lg:-mt-24">
        <GenerateTokenCard />
      </div>
      <div className="mt-16 space-y-16">
        <HowItWorks />
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
  const days = useMemo(
    () =>
      Array.from({ length: SALON.bookingDays }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return isoDate(d)
      }),
    [],
  )
  const nowHour = new Date().getHours()
  const isPast = (day: string, t: string) => day === days[0] && Number(t.slice(0, 2)) <= nowHour
  const firstOpen = (day: string) => (isClosedDay(day) ? undefined : TIMES.find((t) => !isPast(day, t)))

  const [category, setCategory] = useState<CategoryId>('hair')
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [date, setDate] = useState(() => days.find((d) => firstOpen(d)) ?? days[0])
  const [time, setTime] = useState(() => firstOpen(date)!)

  const services = SERVICES.filter((s) => s.category === category)
  const selected = serviceIds.map((id) => serviceById(id)!)
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
    if (selected.length === 0) {
      setAttempts((n) => n + 1)
      servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    navigate(`/book?service=${serviceIds.join(',')}&date=${date}&time=${time}`)
  }
  const pickDate = (d: string) => {
    setDate(d)
    if (isPast(d, time)) setTime(firstOpen(d)!)
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
          <p className="text-sm text-stone-500">Choose your services and time — we'll send the token to your WhatsApp.</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 md:inline-flex">
          <WhatsAppIcon className="size-4" /> Token on WhatsApp
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:mt-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
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
                Services
              </StepLabel>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {services.map((s) => {
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
                  <CircleAlert className="size-4" /> Pick at least one service to generate your token.
                </p>
              )}
            </div>
          </div>

          <div>
            <StepLabel n={3}>Date & time</StepLabel>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
              {days.map((d, i) => {
                const [weekday, rest] = dayLabel(d).split(', ')
                const [dayNum, month] = rest.split(' ')
                const on = d === date
                const holiday = isClosedDay(d)
                const closed = !firstOpen(d)
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={closed}
                    onClick={() => pickDate(d)}
                    aria-pressed={on}
                    aria-label={holiday ? `${weekday} ${Number(dayNum)} ${month}, closed` : undefined}
                    className={cn(
                      'flex w-[58px] shrink-0 flex-col items-center rounded-xl border py-1.5 transition',
                      holiday
                        ? 'cursor-not-allowed border-dashed border-stone-200 bg-stone-50 text-stone-300'
                        : on
                          ? 'border-wine-700 bg-wine-700 text-white'
                          : 'border-wine-100 bg-white text-wine-950 hover:border-wine-300 disabled:opacity-35',
                    )}
                  >
                    <span className={cn('text-[11px] font-medium', holiday ? 'text-stone-400' : on ? 'text-wine-100' : 'text-stone-500')}>
                      {i === 0 ? 'Today' : weekday}
                    </span>
                    <span className="text-lg font-extrabold leading-tight">{Number(dayNum)}</span>
                    <span className={cn('text-[10px] font-semibold uppercase', holiday ? 'font-bold text-red-400' : on ? 'text-sun-300' : 'text-wine-600')}>
                      {holiday ? 'Closed' : month}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
              {TIMES.map((t) => {
                const on = t === time
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isPast(date, t)}
                    onClick={() => setTime(t)}
                    aria-pressed={on}
                    className={cn(
                      'h-9 shrink-0 rounded-xl border px-3 text-[13px] font-semibold transition disabled:opacity-35',
                      on ? 'border-sun-500 bg-sun-400 text-wine-950' : 'border-wine-100 bg-white text-wine-950 hover:border-wine-300',
                    )}
                  >
                    {timeLabel(t)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="relative lg:min-h-[400px]">
          <div className="flex flex-col rounded-3xl bg-cream-50 p-4 ring-1 ring-cream-200 sm:p-5 lg:absolute lg:inset-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-wine-600 lg:order-1">Your visit</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-wine-950 lg:order-1">
              <CalendarDays className="size-4 text-wine-700" /> {appointmentLabel(date, time)}
            </p>

            {selected.length > 0 && (
              <p className="mt-4 hidden items-center justify-between border-t border-dashed border-cream-200 pt-2.5 text-xs font-bold uppercase tracking-[0.08em] text-wine-600 lg:order-5 lg:flex">
                Selected services <span className="text-stone-400">{selected.length}</span>
              </p>
            )}
            <div
              ref={listRef}
              className="mt-4 max-h-72 min-h-28 flex-1 overflow-y-auto overscroll-contain rounded-2xl [scrollbar-color:var(--color-cream-200)_transparent] [scrollbar-width:thin] lg:order-6 lg:mt-2 lg:min-h-0 lg:max-h-none"
            >
              {selected.length === 0 ? (
                <div className="grid h-full min-h-28 place-items-center rounded-2xl border border-dashed border-cream-200 bg-white/60 p-4 text-center text-sm text-stone-500 lg:min-h-20">
                  <span>
                    No services yet — tap one or more <span className="lg:hidden">above</span>
                    <span className="hidden lg:inline">on the left</span>.
                  </span>
                </div>
              ) : (
                <ul className="space-y-2 pr-1 lg:space-y-1.5">
                  {selected.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-cream-200 animate-fade lg:gap-2.5 lg:rounded-xl lg:py-1.5 lg:pl-2.5 lg:pr-1.5">
                      <span className={cn('h-8 w-1 shrink-0 rounded-full lg:h-5', CATEGORY_THEME[s.category].dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-wine-950 lg:text-[13px]">{s.name}</p>
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
              <div className="mt-4 flex items-end justify-between border-t border-dashed border-cream-200 pt-3 lg:order-2 lg:mt-3">
                <span className="text-sm text-stone-600">
                  {selected.length} {selected.length === 1 ? 'service' : 'services'} · {minutesLabel(totalMin)}
                </span>
                <span className="text-xl font-extrabold text-wine-950">{money(total)}</span>
              </div>
            )}

            <Button
              size="lg"
              className={cn('mt-4 w-full text-[17px] lg:order-3 lg:mt-3', selected.length === 0 && 'opacity-60')}
              onClick={generate}
            >
              <Tag className="size-5" /> Generate Token
            </Button>
            <p className={cn('mt-2.5 text-center text-xs lg:order-4', selected.length === 0 ? 'font-semibold text-red-600' : 'text-stone-500 lg:hidden')}>
              {selected.length === 0 ? 'Select at least one service to generate a token' : 'Next: confirm your WhatsApp number · takes under a minute'}
            </p>
          </div>
        </div>
      </div>
    </section>
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
    { icon: CalendarClock, title: 'Choose branch & time', text: `Book today or up to ${SALON.bookingDays} days ahead at the branch that suits you.` },
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
          <span className={cn('rounded-xl px-3 py-2 text-center', CATEGORY_THEME[categoryOfBooking(next)].soft)}>
            <span className="block text-[11px] opacity-75">Token</span>
            <span className="block text-lg font-extrabold">{next.token}</span>
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
