import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { CalendarDays, Clock, Crown, House, LogOut, MapPin, Scissors, Star, Ticket, UserRound } from 'lucide-react'
import { Logo } from '@/components/ui'
import { BRANCHES } from '@/data/catalog'
import { useCurrentCustomer } from '@/data/db'
import { SALON } from '@/lib/config'
import { formatPhone, hoursLabel, initials, cn } from '@/lib/format'
import { TokenModalHost } from '@/features/token/TokenModal'
import { LogoutConfirmHost, askLogout } from '@/components/LogoutConfirm'
import { useEffect, useRef, useState } from 'react'

const NAV = [
  { to: '/', label: 'Home', icon: House },
  { to: '/services', label: 'Services', icon: Scissors },
  { to: '/memberships', label: 'Memberships', icon: Crown },
  { to: '/bookings', label: 'My Bookings', icon: CalendarDays },
]

export function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const inBooking = pathname.startsWith('/book')

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 rounded-[22px] border border-white/60 bg-white/85 px-4 shadow-soft backdrop-blur-md sm:px-6">
          <NavLink to="/" aria-label="BeauDesk home" className="flex h-11 items-center">
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
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className={cn('mx-auto max-w-6xl px-3 pt-5 sm:px-6', inBooking ? 'pb-10' : 'pb-16')}>
        <Outlet />
      </main>

      {!inBooking && <Footer />}

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
      <LogoutConfirmHost />
    </div>
  )
}

function AccountMenu() {
  const customer = useCurrentCustomer()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const avatarClass = 'grid size-10 place-items-center rounded-full bg-wine-50 text-sm font-bold text-wine-700 ring-1 ring-wine-100 transition hover:ring-wine-300'

  if (!customer) {
    return (
      <Link to="/bookings" aria-label="Sign in to see your bookings" className={avatarClass}>
        <UserRound className="size-5" />
      </Link>
    )
  }

  const logout = () => {
    setOpen(false)
    askLogout()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(avatarClass, open && 'ring-2 ring-wine-300')}
      >
        {initials(customer.name)}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-64 animate-pop overflow-hidden rounded-2xl border border-wine-100 bg-white shadow-lift">
          <div className="flex items-center gap-3 bg-wine-50/70 px-4 py-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sun-400 text-sm font-extrabold text-wine-950">
              {initials(customer.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-wine-950">{customer.name}</p>
              <p className="text-xs text-stone-500">{formatPhone(customer.dial, customer.phone)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-wine-50 px-4 py-2.5 text-xs">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Star className="size-3.5 fill-sun-400 text-sun-400" /> Loyalty points
            </span>
            <span className="font-bold text-wine-950">{customer.points}</span>
          </div>
          <div className="p-1.5">
            <MenuLink to="/bookings" icon={<CalendarDays className="size-4" />} label="My account & history" />
            <MenuLink to="/memberships" icon={<Crown className="size-4" />} label="Memberships" />
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-wine-950 transition hover:bg-wine-50"
    >
      <span className="text-wine-700">{icon}</span>
      {label}
    </Link>
  )
}

function Footer() {
  const hours = hoursLabel()
  return (
    <footer className="bg-wine-950 pb-24 text-wine-100 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-10 md:py-12">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-wine-200">
            Book hair, nails, skin and makeup appointments in a minute and get your visit token on WhatsApp.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10">
            <Clock className="size-3.5 text-sun-400" /> {hours}
          </p>
          <p className="mt-2 text-xs text-wine-300">Closed on {SALON.closedDaysLabel}</p>
        </div>
        <nav aria-label="Footer">
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-sun-400">Explore</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 text-sm md:grid-cols-1">
            {[...NAV, { to: '/book', label: 'Book an appointment' }].map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="inline-block py-2 transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-sun-400">Branches</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {BRANCHES.map((b) => (
              <li key={b.id} className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-wine-300" />
                <span>
                  <span className="block font-semibold text-white">{b.name}</span>
                  <span className="text-wine-200">{b.area}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-wine-300 sm:px-6">
          © {new Date().getFullYear()} {SALON.name}. All rights reserved.
        </p>
      </div>
    </footer>
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
