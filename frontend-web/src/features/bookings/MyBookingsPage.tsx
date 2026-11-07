import { useNavigate } from 'react-router'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { branchById } from '@/data/catalog'
import { useDb } from '@/data/db'
import type { Booking } from '@/data/types'
import { useTokenModal } from '@/features/token/TokenModal'
import { appointmentLabel, isoDate, money } from '@/lib/format'

export function MyBookingsPage() {
  const navigate = useNavigate()
  const bookings = useDb((s) => s.bookings)
  const today = isoDate(new Date())
  const sorted = [...bookings].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const upcoming = sorted.filter((b) => b.date >= today)
  const past = sorted.filter((b) => b.date < today).reverse()

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-wine-950">My bookings</h1>
          <p className="mt-1 text-stone-500">Tap a booking to show or share its token.</p>
        </div>
        <Button onClick={() => navigate('/book')}>
          <CalendarDays className="size-5" /> New booking
        </Button>
      </div>

      {bookings.length === 0 ? (
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
            <span className="grid w-20 shrink-0 place-items-center rounded-2xl bg-cream-100 py-3 ring-1 ring-cream-200">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-wine-900/60">Token</span>
              <span className="text-xl font-extrabold text-wine-950">{b.token}</span>
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
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
