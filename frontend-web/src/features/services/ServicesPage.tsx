import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CalendarDays, Search, X } from 'lucide-react'
import { CATEGORIES, SERVICES, servicePrice } from '@/data/catalog'
import { CATEGORY_ICON } from '@/features/booking/parts'
import { CATEGORY_THEME } from '@/lib/categoryTheme'
import { SALON } from '@/lib/config'
import { cn, hourLabel, money } from '@/lib/format'
import { ServicePrice, ServiceTags } from './ServiceTags'

export function ServicesPage() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = SERVICES.filter((s) => !q || `${s.name} ${s.description}`.toLowerCase().includes(q))

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-wine-600">Menu</p>
          <h1 className="mt-1 text-[30px] font-extrabold tracking-tight text-wine-950 sm:text-[36px]">Services & prices</h1>
          <p className="mt-1 max-w-xl text-stone-500">
            {SERVICES.length} treatments across hair, nails, skin and makeup. Prices in {SALON.currency}, open daily{' '}
            {hourLabel(SALON.openHour)} – {hourLabel(SALON.closeHour)}.
          </p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services"
            aria-label="Search services"
            className="h-12 w-full rounded-2xl border border-wine-100 bg-white pl-11 pr-10 text-[15px] text-wine-950 outline-none transition placeholder:text-stone-400 focus:border-wine-400 focus:ring-4 focus:ring-wine-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-stone-400 hover:bg-wine-50 hover:text-wine-700"
            >
              <X className="size-4" />
            </button>
          )}
        </label>
      </div>

      <nav className="sticky top-[84px] z-20 -mx-3 mt-5 bg-canvas/90 px-3 py-2.5 backdrop-blur sm:top-[92px] sm:-mx-6 sm:px-6" aria-label="Service categories">
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.id]
            const count = matches.filter((s) => s.category === c.id).length
            return (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full border border-wine-100 bg-white py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-wine-950 shadow-soft transition hover:border-wine-200',
                  count === 0 && 'pointer-events-none opacity-40',
                )}
              >
                <span className={cn('grid size-7 place-items-center rounded-full', CATEGORY_THEME[c.id].solid)}>
                  <Icon className="size-3.5" />
                </span>
                {c.name}
                <span className="text-xs font-medium text-stone-400">{count}</span>
              </a>
            )
          })}
        </div>
      </nav>

      {matches.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-wine-200 bg-white px-6 py-14 text-center">
          <p className="text-lg font-bold text-wine-950">No services match “{query}”</p>
          <p className="mt-1 text-sm text-stone-500">Try another word, or browse all categories.</p>
          <button onClick={() => setQuery('')} className="mt-4 text-sm font-semibold text-wine-700 hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          {CATEGORIES.map((c) => {
            const list = matches.filter((s) => s.category === c.id)
            if (list.length === 0) return null
            const all = SERVICES.filter((s) => s.category === c.id)
            const Icon = CATEGORY_ICON[c.id]
            const theme = CATEGORY_THEME[c.id]
            return (
              <section
                key={c.id}
                id={`cat-${c.id}`}
                className="scroll-mt-44 overflow-hidden rounded-3xl border border-wine-100 bg-white shadow-soft"
              >
                <div className="relative h-36 overflow-hidden bg-wine-950 sm:h-40">
                  <img src={c.photo} alt="" className="absolute inset-0 size-full object-cover object-[center_30%]" />
                  <span className="absolute inset-0 bg-gradient-to-r from-wine-950/90 via-wine-950/60 to-wine-950/10" />
                  <div className="relative flex h-full items-end justify-between gap-4 p-5 sm:p-6">
                    <div className="flex items-center gap-3.5 text-white">
                      <span className={cn('grid size-12 place-items-center rounded-2xl ring-2 ring-white/25', theme.solid)}>
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <h2 className="text-2xl font-extrabold tracking-tight">{c.name}</h2>
                        <p className="text-sm text-white/80">{c.blurb}</p>
                      </div>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur sm:block">
                      {all.length} services · from {money(Math.min(...all.map(servicePrice)))}
                    </span>
                  </div>
                </div>

                <div className={cn('h-1', theme.dot)} aria-hidden />
                <ul className="grid sm:grid-cols-2">
                  {list.map((s, i) => (
                    <li key={s.id} className={cn('border-wine-100', i > 0 && 'border-t', i === 1 && 'sm:border-t-0', i % 2 === 1 && 'sm:border-l')}>
                      <Link to={`/book?service=${s.id}`} className={cn('group flex h-full gap-4 p-4 transition sm:p-5', theme.hover)}>
                        <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl', theme.soft)}>
                          <Icon className="size-5" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="flex items-start justify-between gap-4">
                            <span className="font-bold leading-snug text-wine-950">{s.name}</span>
                            <ServicePrice service={s} className="text-[17px]" />
                          </span>
                          <span className="mt-1 block text-[13px] leading-snug text-stone-500">{s.description}</span>
                          <span className="mt-auto flex items-center justify-between gap-3 pt-3.5">
                            <ServiceTags service={s} />
                            <span
                              className={cn(
                                'inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-xs font-bold transition-all group-hover:gap-2 group-hover:pr-3',
                                theme.solid,
                              )}
                            >
                              Book <ArrowRight className="size-3.5" />
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <div className="relative mt-12 overflow-hidden rounded-3xl bg-wine-950 px-6 py-8 text-white sm:px-10">
        <span className="absolute -right-10 -top-16 size-48 rounded-full bg-wine-700/60 blur-2xl" />
        <span className="absolute bottom-6 right-[30%] size-4 rounded-full bg-sun-400" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">Combine treatments in one visit</h2>
            <p className="mt-1 max-w-md text-sm text-wine-100">Pick several services, choose a time, and get a single token on WhatsApp.</p>
          </div>
          <Link
            to="/book"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-sun-400 px-5 font-semibold text-wine-950 shadow-[0_6px_16px_-8px_rgb(245_183_0/0.9)] transition hover:bg-sun-300"
          >
            <CalendarDays className="size-5" /> Book an appointment
          </Link>
        </div>
      </div>
    </div>
  )
}
