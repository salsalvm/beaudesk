import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { CalendarDays, Crown, House, Scissors, Ticket, UserRound } from 'lucide-react'
import { Button, Logo } from '@/components/ui'
import { useCurrentCustomer } from '@/data/db'
import { initials, cn } from '@/lib/format'
import { TokenModalHost } from '@/features/token/TokenModal'
import { useEffect } from 'react'

const NAV = [
  { to: '/', label: 'Home', icon: House },
  { to: '/services', label: 'Services', icon: Scissors },
  { to: '/memberships', label: 'Memberships', icon: Crown },
  { to: '/bookings', label: 'My Bookings', icon: CalendarDays },
]

export function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const customer = useCurrentCustomer()
  const inBooking = pathname.startsWith('/book')

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 rounded-[22px] border border-white/60 bg-white/85 px-4 shadow-soft backdrop-blur-md sm:px-6">
          <NavLink to="/" aria-label="BeauDesk home">
            <Logo />
          </NavLink>
          <span className="hidden h-7 w-px bg-wine-100 md:block" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'inline-flex h-10 items-center gap-2 rounded-2xl px-3.5 text-sm font-medium transition',
                    isActive ? 'bg-wine-50 text-wine-800 ring-1 ring-wine-100' : 'text-stone-600 hover:text-wine-800',
                  )
                }
              >
                <Icon className="size-[18px]" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            {!inBooking && (
              <Button size="sm" className="hidden h-10 px-4 sm:inline-flex" onClick={() => navigate('/book')}>
                <CalendarDays className="size-[18px]" />
                Book Now
              </Button>
            )}
            <NavLink
              to="/bookings"
              aria-label="My account"
              className="grid size-10 place-items-center rounded-full bg-wine-50 text-sm font-bold text-wine-700 ring-1 ring-wine-100"
            >
              {customer ? initials(customer.name) : <UserRound className="size-5" />}
            </NavLink>
          </div>
        </div>
      </header>

      <main className={cn('mx-auto max-w-6xl px-3 pt-5 sm:px-6', inBooking ? 'pb-10' : 'pb-28 md:pb-12')}>
        <Outlet />
      </main>

      {!inBooking && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-wine-100 bg-white/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-5">
            {NAV.slice(0, 2).map((item) => (
              <TabLink key={item.to} {...item} />
            ))}
            <button onClick={() => navigate('/book')} className="flex flex-col items-center justify-center gap-0.5 py-2">
              <span className="-mt-6 grid size-12 place-items-center rounded-2xl bg-sun-400 text-wine-950 shadow-lift ring-4 ring-white">
                <Ticket className="size-5" />
              </span>
              <span className="text-[11px] font-semibold text-wine-950">Book</span>
            </button>
            {NAV.slice(2).map((item) => (
              <TabLink key={item.to} {...item} label={item.label.replace('My ', '')} />
            ))}
          </div>
        </nav>
      )}

      <TokenModalHost />
    </div>
  )
}

function TabLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof House }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn('flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium', isActive ? 'text-wine-700' : 'text-stone-500')
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  )
}
