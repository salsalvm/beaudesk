import { forwardRef } from 'react'
import { Clock, Sparkles } from 'lucide-react'
import { ANY_STYLIST, branchById, categoryById, serviceById, stylistById } from '@/data/catalog'
import type { Booking } from '@/data/types'
import { CATEGORY_THEME, categoryOfToken } from '@/lib/categoryTheme'
import { appointmentLabel, cn } from '@/lib/format'

export function tokenFacts(b: Booking) {
  const branch = branchById(b.branchId)?.name ?? 'BeauDesk'
  const stylist = b.stylistId === ANY_STYLIST ? 'First available' : (stylistById(b.stylistId)?.name ?? 'First available')
  const first = serviceById(b.services[0]?.serviceId ?? '')
  const photo = first ? categoryById(first.category).photo : '/img/stylist-blowdry.jpg'
  return {
    branch,
    stylist,
    photo,
    services: b.services.map((s) => s.name).join('  ·  '),
    when: appointmentLabel(b.date, b.time),
  }
}

/** The ticket itself. Also rendered off-screen and exported as the WhatsApp image. */
export const TokenCard = forwardRef<HTMLDivElement, { booking: Booking; className?: string; notchColor?: string }>(
  function TokenCard({ booking, className, notchColor = '#ffffff' }, ref) {
    const f = tokenFacts(booking)
    const category = categoryById(categoryOfToken(booking.token))
    const theme = CATEGORY_THEME[category.id]
    return (
      <div
        ref={ref}
        className={cn('@container relative overflow-hidden rounded-[24px] border border-cream-200 bg-cream-100 text-wine-950', className)}
      >
        <span className="pointer-events-none absolute -right-24 -top-28 size-[340px] rounded-full bg-sun-100/80" />
        <span className="pointer-events-none absolute -bottom-12 -right-10 size-32 rounded-full bg-sun-200/70" />

        <div className="relative px-5 pb-6 pt-5 @sm:px-6 @sm:pt-6 @lg:px-8 @lg:pt-7">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.06em] text-wine-900/60 @sm:text-[13px]">
                Your visit token
              </span>
              <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold', theme.solid)}>{category.name}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-wine-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-wine-700 ring-1 ring-wine-100 @sm:gap-2 @sm:px-3.5 @sm:py-1.5 @sm:text-[12px]">
              <span className="size-2 rounded-full bg-wine-600" />
              <span className="@md:hidden">Ready</span>
              <span className="hidden @md:inline">Ready to show</span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-5">
            <div className="min-w-0 flex-1">
              <div className="whitespace-nowrap text-[60px] font-extrabold leading-[0.95] tracking-tight text-wine-950 @md:text-[68px] @xl:text-[84px]">{booking.token}</div>
              <span className={cn('mt-3 block h-[6px] w-[85%] max-w-[260px] rounded-full', theme.dot)} />
              <p className="mt-4 text-[17px] font-semibold leading-snug text-wine-950 @lg:text-[19px]">{f.services}</p>
            </div>
            <div className="relative hidden w-[40%] shrink-0 @md:block @xl:w-[44%]">
              <span className="absolute -top-8 left-0 size-4 rounded-full bg-sun-400" />
              <span className="absolute -top-11 left-7 size-2.5 rounded-full bg-sun-400" />
              <img
                src={f.photo}
                alt=""
                className="aspect-[1.85] w-full rounded-2xl object-cover shadow-[0_10px_24px_-14px_rgb(43_10_22/0.6)]"
              />
            </div>
          </div>
        </div>

        <div className="relative h-6">
          <span className="absolute -left-3 top-0 size-6 rounded-full border border-cream-200" style={{ background: notchColor }} />
          <span className="absolute -right-3 top-0 size-6 rounded-full border border-cream-200" style={{ background: notchColor }} />
          <span className="absolute inset-x-5 top-1/2 border-t-[3px] border-dashed border-wine-900/15" />
        </div>

        <div className="relative grid grid-cols-1 gap-4 px-5 pb-6 pt-4 @sm:px-6 @sm:pb-7 @xl:grid-cols-[1fr_auto_1fr] @xl:gap-6 @lg:px-8">
          <Fact icon={<Clock className="size-[18px]" />} label="Appointment" value={f.when} />
          <span className="hidden w-px self-stretch bg-wine-900/12 @xl:block" />
          <Fact icon={<Sparkles className="size-[18px]" />} label="Salon & stylist" value={`${f.branch} · ${f.stylist}`} />
        </div>
      </div>
    )
  },
)

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-wine-50 text-wine-700">{icon}</span>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-wine-900/55">{label}</div>
        <div className="mt-1 text-[16px] font-semibold text-wine-950">{value}</div>
      </div>
    </div>
  )
}
