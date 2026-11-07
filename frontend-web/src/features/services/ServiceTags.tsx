import { Clock, Flame } from 'lucide-react'
import { offerPercent, type Service } from '@/data/catalog'
import { CATEGORY_THEME } from '@/lib/categoryTheme'
import { cn, minutesLabel, money } from '@/lib/format'

export function ServiceTags({ service }: { service: Service }) {
  const off = offerPercent(service)
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
        <Clock className="size-3" /> {minutesLabel(service.durationMin)}
      </span>
      {service.popular && (
        <span className="inline-flex items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-bold text-wine-900">
          <Flame className="size-3 text-sun-600" /> Popular
        </span>
      )}
      {off > 0 && (
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', CATEGORY_THEME[service.category].soft)}>{off}% off</span>
      )}
    </span>
  )
}

export function ServicePrice({ service, className }: { service: Service; className?: string }) {
  return (
    <span className={cn('shrink-0 text-right', className)}>
      {service.offerPrice && <span className="block text-xs text-stone-400 line-through">{money(service.price)}</span>}
      <span className="block font-extrabold text-wine-950">{money(service.offerPrice ?? service.price)}</span>
    </span>
  )
}
