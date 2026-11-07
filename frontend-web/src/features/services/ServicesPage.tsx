import { Link } from 'react-router'
import { ChevronRight, Clock } from 'lucide-react'
import { CATEGORIES, SERVICES } from '@/data/catalog'
import { CATEGORY_ICON } from '@/features/booking/parts'
import { minutesLabel, money } from '@/lib/format'

export function ServicesPage() {
  return (
    <div className="animate-fade">
      <h1 className="text-[28px] font-bold tracking-tight text-wine-950">Services & prices</h1>
      <p className="mt-1 text-stone-500">Tap any service to book it.</p>

      <div className="mt-6 space-y-8">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c.id]
          return (
            <section key={c.id} className="overflow-hidden rounded-3xl border border-wine-100 bg-white shadow-soft">
              <div className="flex items-center gap-4 bg-gradient-to-r from-wine-700 to-wine-600 p-4 text-white sm:p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-sun-400 text-wine-950">
                  <Icon className="size-5" />
                </span>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{c.name}</h2>
                  <p className="text-sm text-wine-100">{c.blurb}</p>
                </div>
                <img src={c.photo} alt="" className="hidden h-14 w-24 rounded-xl object-cover sm:block" />
              </div>
              <ul className="divide-y divide-wine-50">
                {SERVICES.filter((s) => s.category === c.id).map((s) => (
                  <li key={s.id}>
                    <Link to={`/book?service=${s.id}`} className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-wine-50/60 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-wine-950">{s.name}</p>
                        <p className="flex items-center gap-1 text-xs text-stone-500">
                          <Clock className="size-3.5" /> {minutesLabel(s.durationMin)}
                        </p>
                      </div>
                      <div className="text-right">
                        {s.offerPrice && <p className="text-xs text-stone-400 line-through">{money(s.price)}</p>}
                        <p className="font-bold text-wine-950">{money(s.offerPrice ?? s.price)}</p>
                      </div>
                      <ChevronRight className="size-4 text-stone-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
