import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  Gift,
  Percent,
  Play,
  Scissors,
  Star,
  Tag,
  Ticket,
  UserRound,
} from 'lucide-react'
import { Badge, Button, IconTile, Progress } from '@/components/ui'
import { ANY_STYLIST, CATEGORIES, PACKAGE_PLANS, SERVICES, planById, serviceById, stylistById, type CategoryId } from '@/data/catalog'
import { useCurrentCustomer, useDb } from '@/data/db'
import { CATEGORY_ICON } from '@/features/booking/parts'
import { activePackages, remaining } from '@/features/booking/pricing'
import { useTokenModal } from '@/features/token/TokenModal'
import { SALON } from '@/lib/config'
import { appointmentLabel, cn, dayLabel, isoDate, timeLabel } from '@/lib/format'

export function HomePage() {
  const navigate = useNavigate()
  return (
    <div className="space-y-8 animate-fade">
      <section className="relative overflow-hidden rounded-[28px] border border-wine-100 bg-gradient-to-br from-wine-50 via-[#fdf4f1] to-white">
        <span className="absolute -top-16 left-[54%] hidden size-44 rounded-full bg-sun-400 md:block" />
        <span className="absolute left-[50%] top-36 hidden size-7 rounded-full bg-sun-400 md:block" />
        <span className="absolute -bottom-40 right-24 hidden size-[420px] rounded-full bg-wine-100/60 md:block" />
        <div className="relative grid items-center md:grid-cols-[1.1fr_0.9fr]">
          <div className="px-6 py-9 sm:px-10 sm:py-12">
            <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-tight text-wine-950 sm:text-[46px]">
              Book your next
              <br />
              <span className="text-wine-700">beauty appointment</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-stone-600 sm:text-base">
              Your favourite salon, now at your fingertips — browse services, book instantly, and manage your beauty journey with BeauDesk.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/book')}>
                <CalendarDays className="size-5" /> Book Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/services')}>
                <Play className="size-4" /> Explore Services
              </Button>
            </div>
          </div>
          <div className="relative hidden h-full min-h-[300px] md:block">
            <img src="/img/hero-woman.jpg" alt="Relaxed salon guest" className="absolute inset-0 size-full object-cover object-top [mask-image:linear-gradient(to_right,transparent,black_22%)]" />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-wine-950">Explore our services</h2>
            <p className="text-sm text-stone-500">Professional care for hair, nails, skin and makeup — all in one place.</p>
          </div>
          <Link to="/services" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-wine-800 sm:flex">
            View all services <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.id]
            return (
              <Link
                key={c.id}
                to={`/book?category=${c.id}`}
                className="group flex items-center gap-3 rounded-3xl border border-wine-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-wine-200"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-wine-50 text-wine-700 ring-1 ring-wine-100 transition group-hover:bg-wine-700 group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-wine-950">{c.name}</span>
                  <span className="block truncate text-xs text-stone-500">{c.blurb}</span>
                </span>
                <ChevronRight className="hidden size-4 text-stone-400 sm:block" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <GenerateTokenCard />
        <div className="grid gap-4">
          <MembershipCard />
          <UpcomingCard />
        </div>
        <LoyaltyCard />
      </section>
    </div>
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
    <div className={cn('rounded-3xl border border-wine-100 bg-wine-50/60 p-4 shadow-soft sm:p-5', className)}>
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

const selectClass =
  'h-11 w-full appearance-none rounded-xl border border-wine-100 bg-white pl-9 pr-7 text-[13px] font-medium text-wine-950 outline-none focus:border-wine-400 focus:ring-4 focus:ring-wine-100'

function SelectBox({ icon, value, onChange, children, label }: {
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  label: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-wine-950">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-wine-700">{icon}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
      </span>
    </label>
  )
}

function GenerateTokenCard() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<CategoryId>('hair')
  const services = SERVICES.filter((s) => s.category === category)
  const [serviceId, setServiceId] = useState(services[0].id)
  const days = useMemo(() => {
    return Array.from({ length: SALON.bookingDays }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + i)
      return isoDate(d)
    })
  }, [])
  const [date, setDate] = useState(days[1])
  const times = useMemo(() => {
    const out: string[] = []
    for (let m = SALON.openHour * 60; m < SALON.closeHour * 60; m += 60) out.push(`${String(m / 60).padStart(2, '0')}:00`)
    return out
  }, [])
  const [time, setTime] = useState('11:00')
  const CatIcon = CATEGORY_ICON[category]

  return (
    <Panel icon={<CalendarDays className="size-5" />} title="Generate Token" subtitle="Quickly book a service and get your token.">
      <div className="space-y-3">
        <SelectBox
          label="Category"
          icon={<CatIcon className="size-4" />}
          value={category}
          onChange={(v) => {
            setCategory(v as CategoryId)
            setServiceId(SERVICES.find((s) => s.category === v)!.id)
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectBox>
        <SelectBox label="Service" icon={<Scissors className="size-4" />} value={serviceId} onChange={setServiceId}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectBox>
        <div className="grid grid-cols-2 gap-3">
          <SelectBox label="Date" icon={<CalendarDays className="size-4" />} value={date} onChange={setDate}>
            {days.map((d, i) => (
              <option key={d} value={d}>
                {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayLabel(d).replace(',', '')}
              </option>
            ))}
          </SelectBox>
          <SelectBox label="Time" icon={<Clock className="size-4" />} value={time} onChange={setTime}>
            {times.map((t) => (
              <option key={t} value={t}>
                {timeLabel(t)}
              </option>
            ))}
          </SelectBox>
        </div>
        <Button
          size="lg"
          className="mt-1 w-full"
          onClick={() => {
            const past = date === days[0] && Number(time.slice(0, 2)) <= new Date().getHours()
            navigate(past ? `/book?service=${serviceId}` : `/book?service=${serviceId}&date=${date}&time=${time}`)
          }}
        >
          <Tag className="size-5" /> Generate Token
        </Button>
      </div>
    </Panel>
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
        <div className="rounded-2xl bg-white p-4 ring-1 ring-wine-100">
          {pkg ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-wine-950">
                  <b>{remaining(pkg)} of {pkg.total}</b> sessions remaining
                </span>
                <ChevronRight className="size-4 text-stone-400" />
              </div>
              <Progress value={(remaining(pkg) / pkg.total) * 100} className="mt-3" />
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
        <button onClick={() => show(next.id)} className="flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left ring-1 ring-wine-100">
          <span className="rounded-xl bg-sun-100 px-3 py-2 text-center">
            <span className="block text-[11px] text-wine-900/70">Token</span>
            <span className="block text-lg font-extrabold text-wine-950">#{next.token.replace('-', '')}</span>
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
        <Link to="/book" className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm ring-1 ring-wine-100">
          <span className="text-stone-600">No upcoming visits yet. Book one in a minute.</span>
          <Ticket className="size-5 text-wine-700" />
        </Link>
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
