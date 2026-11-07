import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CalendarDays, MapPin, Smartphone, Ticket, UserRound } from 'lucide-react'
import { Badge, Button, Card, Field, inputClass } from '@/components/ui'
import { lookupCustomer } from '@/data/api'
import { branchById } from '@/data/catalog'
import { useCurrentCustomer, useDb } from '@/data/db'
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/config'
import type { Booking } from '@/data/types'
import { useTokenModal } from '@/features/token/TokenModal'
import { CATEGORY_THEME, categoryOfToken } from '@/lib/categoryTheme'
import { appointmentLabel, cn, isoDate, money } from '@/lib/format'

export function MyBookingsPage() {
  const navigate = useNavigate()
  const customer = useCurrentCustomer()
  const setCurrentCustomer = useDb((s) => s.setCurrentCustomer)
  const allBookings = useDb((s) => s.bookings)
  const bookings = allBookings.filter((b) => b.customerId === customer?.id)
  const today = isoDate(new Date())
  const sorted = [...bookings].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const upcoming = sorted.filter((b) => b.date >= today)
  const past = sorted.filter((b) => b.date < today).reverse()

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-wine-950">My bookings</h1>
          {customer ? (
            <p className="mt-1 text-stone-500">
              Signed in as <b className="font-semibold text-wine-950">{customer.name}</b> ·{' '}
              <button onClick={() => setCurrentCustomer(null)} className="font-semibold text-wine-700 underline-offset-2 hover:underline">
                Not you? Log out
              </button>
            </p>
          ) : (
            <p className="mt-1 text-stone-500">Find your bookings with the WhatsApp number you booked with.</p>
          )}
        </div>
        <Button onClick={() => navigate('/book')}>
          <CalendarDays className="size-5" /> New booking
        </Button>
      </div>

      {!customer ? (
        <SignInCard />
      ) : bookings.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center px-6 py-14 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-sun-100 text-wine-700">
            <Ticket className="size-8" />
          </span>
          <p className="mt-4 text-lg font-bold text-wine-950">No bookings yet</p>
          <p className="mt-1 max-w-sm text-sm text-stone-500">Book a service and your visit token will appear here, ready to show at reception.</p>
        </Card>
      ) : (
        <>
          <List title="Upcoming" items={upcoming} />
          <List title="Past" items={past} />
        </>
      )}
    </div>
  )
}

function SignInCard() {
  const setCurrentCustomer = useDb((s) => s.setCurrentCustomer)
  const [dial, setDial] = useState(DEFAULT_COUNTRY.dial)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const country = COUNTRIES.find((c) => c.dial === dial) ?? DEFAULT_COUNTRY
  const valid = country.pattern.test(phone)

  const submit = async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const found = await lookupCustomer(dial, phone)
      if (found) setCurrentCustomer(found.id)
      else setError('No bookings found for this number. Book your first visit to get started.')
    } catch {
      setError('We could not check this number. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6 max-w-xl p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-sun-100 text-wine-700">
          <UserRound className="size-5" />
        </span>
        <div>
          <h2 className="font-bold text-wine-950">See your bookings</h2>
          <p className="text-sm text-stone-500">Enter your WhatsApp number to view tokens, dues and visits.</p>
        </div>
      </div>
      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="Mobile number" error={error}>
          <div className="flex gap-2">
            <div className="w-[132px] shrink-0">
              <select
                value={dial}
                onChange={(e) => {
                  setDial(e.target.value)
                  setPhone('')
                }}
                className={cn(inputClass, 'font-semibold')}
                aria-label="Country code"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>
                    {c.flag} +{c.dial}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative min-w-0 flex-1">
              <Smartphone className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" />
              <input
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                maxLength={country.digits}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, country.digits))}
                placeholder={'•'.repeat(country.digits)}
                className={cn(inputClass, 'pl-11 text-lg font-semibold tracking-[0.12em]')}
              />
            </div>
          </div>
        </Field>
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={!valid} loading={loading}>
          Show my bookings
        </Button>
      </form>
    </Card>
  )
}

const tokenTheme = (b: Booking) => CATEGORY_THEME[categoryOfToken(b.token)]

function List({ title, items }: { title: string; items: Booking[] }) {
  const show = useTokenModal((s) => s.show)
  if (items.length === 0) return null
  return (
    <>
      <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((b) => (
          <button
            key={b.id}
            onClick={() => show(b.id)}
            className="flex items-center gap-4 rounded-3xl border border-wine-100 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-wine-200"
          >
            <span className={cn('grid w-20 shrink-0 place-items-center rounded-2xl py-3 ring-1', tokenTheme(b).soft, tokenTheme(b).ring)}>
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Token</span>
              <span className="text-xl font-extrabold">{b.token}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-wine-950">{b.services.map((s) => s.name).join(' · ')}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-500">
                <CalendarDays className="size-3.5" /> {appointmentLabel(b.date, b.time)}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-stone-500">
                <MapPin className="size-3.5" /> {branchById(b.branchId)?.name} · {b.customerName}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1.5">
              <Badge tone={title === 'Upcoming' ? 'sun' : 'muted'}>{title === 'Upcoming' ? 'Confirmed' : 'Past'}</Badge>
              <span className="text-sm font-semibold text-wine-950">{b.total ? money(b.total) : 'Package'}</span>
              {b.payAtSalon > 0 && <span className="text-xs font-semibold text-sun-600">{money(b.payAtSalon)} at salon</span>}
              {b.dueKept > 0 && <span className="text-xs font-semibold text-wine-600">{money(b.dueKept)} due</span>}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
