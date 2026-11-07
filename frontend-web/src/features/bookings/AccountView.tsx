import { useNavigate, useSearchParams } from 'react-router'
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Crown,
  History,
  LogOut,
  Mail,
  MapPin,
  RotateCcw,
  Sparkles,
  Star,
  Ticket,
  Wallet,
} from 'lucide-react'
import { Badge, Button, Progress, WhatsAppIcon } from '@/components/ui'
import { SERVICES, branchById, planById, serviceById } from '@/data/catalog'
import { useDb } from '@/data/db'
import type { Booking, Customer } from '@/data/types'
import { CATEGORY_ICON } from '@/features/booking/parts'
import { remaining } from '@/features/booking/pricing'
import { useTokenModal } from '@/features/token/TokenModal'
import { CATEGORY_THEME, categoryOfToken } from '@/lib/categoryTheme'
import { appointmentLabel, cn, formatPhone, initials, isoDate, money, monthShort, shortDate, timeLabel } from '@/lib/format'

type Tab = 'upcoming' | 'history' | 'packages'

interface HistoryItem {
  key: string
  date: string
  services: string[]
  amount: number
  booking?: Booking
}

export function AccountView({ customer }: { customer: Customer }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const setCurrentCustomer = useDb((s) => s.setCurrentCustomer)
  const allBookings = useDb((s) => s.bookings)
  const today = isoDate(new Date())

  const mine = allBookings
    .filter((b) => b.customerId === customer.id && b.status === 'confirmed')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const upcoming = mine.filter((b) => b.date >= today)
  const history: HistoryItem[] = [
    ...mine
      .filter((b) => b.date < today)
      .map((b) => ({ key: b.id, date: b.date, services: b.services.map((s) => s.name), amount: b.total, booking: b })),
    ...customer.history.map((v, i) => ({ key: `visit-${i}`, date: v.date, services: v.services, amount: v.amount })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const tab = (['upcoming', 'history', 'packages'] as const).find((t) => t === params.get('tab')) ?? 'upcoming'
  const setTab = (t: Tab) => setParams(t === 'upcoming' ? {} : { tab: t }, { replace: true })

  const logout = () => {
    setCurrentCustomer(null)
    navigate('/')
  }

  const stats = [
    { icon: History, label: 'Visits', value: String(history.length) },
    { icon: Star, label: 'Points', value: String(customer.points) },
    { icon: Ticket, label: 'Upcoming', value: String(upcoming.length) },
    { icon: Wallet, label: 'Due', value: customer.due ? money(customer.due.amount) : 'None' },
  ]

  return (
    <div className="animate-fade">
      <section className="relative overflow-hidden rounded-[28px] bg-wine-950 p-5 text-white sm:p-7">
        <span className="absolute -right-16 -top-20 size-64 rounded-full bg-wine-700/50 blur-3xl" />
        <span className="absolute right-[22%] top-6 hidden size-4 rounded-full bg-sun-400 sm:block" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sun-400 text-xl font-extrabold text-wine-950 sm:size-[72px] sm:text-2xl">
              {initials(customer.name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-[28px]">{customer.name}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-wine-100">
                <span className="flex items-center gap-1.5">
                  <WhatsAppIcon className="size-4 text-emerald-300" /> {formatPhone(customer.dial, customer.phone)}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-4" /> {customer.email}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-wine-200">Member since {shortDate(customer.memberSince)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-10" onClick={() => navigate('/book')}>
              <CalendarDays className="size-4" /> New booking
            </Button>
            <button
              onClick={logout}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-white/10">
              <p className="flex items-center gap-1.5 text-xs font-medium text-wine-200">
                <Icon className="size-3.5 text-sun-400" /> {label}
              </p>
              <p className="mt-1 text-xl font-extrabold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {customer.due && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-3xl border border-sun-200 bg-sun-50 p-4 sm:p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sun-400 text-wine-950">
            <Wallet className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-wine-950">{money(customer.due.amount)} balance due</p>
            <p className="text-sm text-stone-600">
              {customer.due.note} · since {shortDate(customer.due.date)}
            </p>
          </div>
          <p className="text-xs text-stone-500 sm:max-w-[200px] sm:text-right">You can clear it with your next booking or at reception.</p>
        </div>
      )}

      <div role="tablist" className="mt-6 flex gap-1 rounded-2xl border border-wine-100 bg-white p-1 shadow-soft">
        {(
          [
            ['upcoming', 'Upcoming', upcoming.length],
            ['history', 'History', history.length],
            ['packages', 'Packages', customer.packages.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition',
              tab === id ? 'bg-wine-700 text-white shadow-soft' : 'text-stone-600 hover:bg-wine-50 hover:text-wine-800',
            )}
          >
            {label}
            <span className={cn('rounded-full px-1.5 text-[11px] font-bold', tab === id ? 'bg-white/20' : 'bg-wine-50 text-wine-700')}>{count}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'upcoming' && <UpcomingList items={upcoming} />}
        {tab === 'history' && <HistoryList items={history} />}
        {tab === 'packages' && <PackageList customer={customer} />}
      </div>
    </div>
  )
}

function Empty({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-wine-200 bg-white px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-sun-100 text-wine-700">{icon}</span>
      <p className="mt-4 text-lg font-bold text-wine-950">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function UpcomingList({ items }: { items: Booking[] }) {
  const navigate = useNavigate()
  const show = useTokenModal((s) => s.show)
  if (items.length === 0) {
    return (
      <Empty
        icon={<Ticket className="size-7" />}
        title="No upcoming visits"
        text="Book a service and your visit token will appear here, ready to show at reception."
        action={
          <Button onClick={() => navigate('/book')}>
            <CalendarDays className="size-5" /> Book now
          </Button>
        }
      />
    )
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((b) => {
        const theme = CATEGORY_THEME[categoryOfToken(b.token)]
        return (
          <button
            key={b.id}
            onClick={() => show(b.id)}
            className="flex items-center gap-4 rounded-3xl border border-wine-100 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-wine-200"
          >
            <span className={cn('grid w-20 shrink-0 place-items-center rounded-2xl py-3 ring-1', theme.soft, theme.ring)}>
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Token</span>
              <span className="text-xl font-extrabold">{b.token}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-wine-950">{b.services.map((s) => s.name).join(' · ')}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-500">
                <Clock className="size-3.5" /> {appointmentLabel(b.date, b.time)}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-stone-500">
                <MapPin className="size-3.5" /> {branchById(b.branchId)?.name}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1.5">
              <Badge tone="sun">Confirmed</Badge>
              <span className="text-sm font-semibold text-wine-950">{b.total ? money(b.total) : 'Package'}</span>
              {b.payAtSalon > 0 && <span className="text-xs font-semibold text-sun-600">{money(b.payAtSalon)} at salon</span>}
              {b.dueKept > 0 && <span className="text-xs font-semibold text-wine-600">{money(b.dueKept)} due</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function historyServices(item: HistoryItem) {
  return item.booking
    ? item.booking.services.map((l) => ({ name: l.name, service: serviceById(l.serviceId) }))
    : item.services.map((name) => ({ name, service: SERVICES.find((s) => s.name === name) }))
}

function HistoryList({ items }: { items: HistoryItem[] }) {
  const navigate = useNavigate()
  const show = useTokenModal((s) => s.show)
  if (items.length === 0) {
    return <Empty icon={<History className="size-7" />} title="No past visits yet" text="Your completed visits will show up here after your appointments." />
  }

  const bookAgain = (item: HistoryItem) => {
    const ids = historyServices(item).flatMap((x) => x.service?.id ?? [])
    navigate(ids.length ? `/book?service=${ids.join(',')}` : '/book')
  }

  const groups: { label: string; items: HistoryItem[] }[] = []
  for (const item of items) {
    const d = new Date(`${item.date}T00:00:00`)
    const label = `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
    const group = groups.find((g) => g.label === label)
    if (group) group.items.push(item)
    else groups.push({ label, items: [item] })
  }
  const spent = items.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div>
      <p className="mb-4 text-sm text-stone-500">
        <b className="font-semibold text-wine-950">{items.length}</b> {items.length === 1 ? 'visit' : 'visits'} ·{' '}
        <b className="font-semibold text-wine-950">{money(spent)}</b> spent
      </p>
      <div className="space-y-7">
        {groups.map((g) => (
          <section key={g.label}>
            <h3 className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.1em] text-wine-600">
              {g.label}
              <span className="h-px flex-1 bg-wine-100" />
            </h3>
            <ol
              className={cn(
                'relative space-y-3',
                g.items.length > 1 && 'before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-wine-100 sm:before:left-[31px]',
              )}
            >
              {g.items.map((item) => {
                const d = new Date(`${item.date}T00:00:00`)
                const lines = historyServices(item)
                const theme = CATEGORY_THEME[lines[0]?.service?.category ?? 'hair']
                return (
                  <li key={item.key} className="relative flex gap-3 sm:gap-4">
                    <span className="relative z-10 h-fit w-14 shrink-0 overflow-hidden rounded-2xl bg-white text-center shadow-soft ring-1 ring-wine-100 sm:w-16">
                      <span className={cn('block py-1 text-[10px] font-bold uppercase tracking-wide', theme.solid)}>{monthShort(item.date)}</span>
                      <span className="block pt-1.5 text-xl font-extrabold leading-none text-wine-950 sm:text-2xl">{d.getDate()}</span>
                      <span className="block pb-1.5 pt-0.5 text-[10px] font-medium text-stone-400">{WEEKDAYS[d.getDay()].slice(0, 3)}</span>
                    </span>

                    <div className="min-w-0 flex-1 rounded-2xl border border-wine-100 bg-white shadow-soft">
                      <div className="flex items-start gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-1.5">
                            {lines.map(({ name, service }) => {
                              const Icon = service ? CATEGORY_ICON[service.category] : Sparkles
                              return (
                                <span
                                  key={name}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold',
                                    service ? CATEGORY_THEME[service.category].soft : 'bg-stone-100 text-stone-700',
                                  )}
                                >
                                  <Icon className="size-3.5" /> {name}
                                </span>
                              )
                            })}
                          </div>
                          <p className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-stone-500">
                            <span className="flex items-center gap-1 font-bold text-emerald-700 sm:hidden">
                              <Check className="size-3.5" strokeWidth={3} /> Completed
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarDays className="size-3.5" /> {WEEKDAYS[d.getDay()]}, {shortDate(item.date)}
                              {item.booking && ` · ${timeLabel(item.booking.time)}`}
                            </span>
                            {item.booking && (
                              <>
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3.5" /> {branchById(item.booking.branchId)?.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Ticket className="size-3.5" /> {item.booking.token}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex">
                          <Check className="size-3" strokeWidth={3} /> Completed
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-wine-100 px-4 py-3">
                        {item.amount ? (
                          <span className="text-sm text-stone-500">
                            Paid <b className="text-base font-extrabold text-wine-950">{money(item.amount)}</b>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-wine-800">
                            <Crown className="size-4 text-sun-500" /> Covered by package
                          </span>
                        )}
                        <div className="flex w-full gap-2 sm:w-auto">
                          {item.booking && (
                            <button
                              onClick={() => show(item.booking!.id)}
                              className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl border border-wine-100 px-3.5 text-xs font-semibold text-wine-900 transition hover:bg-wine-50 sm:flex-none"
                            >
                              View token <ChevronRight className="size-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => bookAgain(item)}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-sun-400 px-3.5 text-xs font-bold text-wine-950 shadow-[0_6px_16px_-10px_rgb(245_183_0/0.9)] transition hover:bg-sun-300 sm:flex-none"
                          >
                            <RotateCcw className="size-3.5" /> Book again
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}

function PackageList({ customer }: { customer: Customer }) {
  const navigate = useNavigate()
  const today = isoDate(new Date())
  if (customer.packages.length === 0) {
    return (
      <Empty
        icon={<Crown className="size-7" />}
        title="No packages yet"
        text="Prepay for the services you love and save on every visit."
        action={
          <Button variant="outline" onClick={() => navigate('/memberships')}>
            Browse packages
          </Button>
        }
      />
    )
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {customer.packages.map((p) => {
        const plan = planById(p.planId)
        const service = plan && serviceById(plan.serviceId)
        const left = remaining(p)
        const status = p.expiresOn < today ? 'Expired' : left === 0 ? 'Used up' : 'Active'
        return (
          <div key={p.id} className="rounded-3xl border border-wine-100 bg-white p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-wine-700 text-sun-300">
                <Crown className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-wine-950">{plan?.name}</p>
                <p className="text-sm text-stone-500">{service?.name}</p>
              </div>
              <Badge tone={status === 'Active' ? 'sun' : 'muted'}>{status}</Badge>
            </div>
            <div className="mt-4 flex items-end justify-between text-sm">
              <span className="text-wine-950">
                <b className="text-lg font-extrabold">{left}</b> of {p.total} sessions left
              </span>
              <span className="text-xs text-stone-500">Valid till {shortDate(p.expiresOn)}</span>
            </div>
            <Progress value={(left / p.total) * 100} className="mt-2.5" />
            {status === 'Active' && plan && (
              <button
                onClick={() => navigate(`/book?service=${plan.serviceId}`)}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-wine-700 hover:gap-2"
              >
                Book a session <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
