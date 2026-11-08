import { Cog, Sparkles } from 'lucide-react'
import { planById, serviceById, type PackagePlan } from '@/data/catalog'
import { cn } from '@/lib/format'

export const isMachinePlan = (plan: PackagePlan) => !!serviceById(plan.serviceId)?.machine

/** Machine packages first, keeping the original order within each group. */
export function machinesFirst<T extends { planId: string }>(packages: T[]) {
  const machine = (p: T) => {
    const plan = planById(p.planId)
    return plan && isMachinePlan(plan) ? 0 : 1
  }
  return [...packages].sort((a, b) => machine(a) - machine(b))
}

export function PlanThumb({ plan, className }: { plan: PackagePlan; className?: string }) {
  const machine = isMachinePlan(plan)
  return (
    <span
      aria-hidden
      className={cn('relative shrink-0 overflow-hidden rounded-2xl bg-wine-50 bg-cover bg-center ring-1 ring-wine-100', className)}
      style={{ backgroundImage: `url(${plan.photo})` }}
    >
      <span className="absolute bottom-1 right-1 grid size-5 place-items-center rounded-md bg-white/90 text-wine-700 shadow-sm">
        {machine ? <Cog className="size-3" /> : <Sparkles className="size-3" />}
      </span>
    </span>
  )
}

export function PlanKind({ plan }: { plan: PackagePlan }) {
  const machine = isMachinePlan(plan)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
        machine ? 'bg-wine-50 text-wine-700 ring-wine-100' : 'bg-sun-50 text-wine-800 ring-sun-200',
      )}
    >
      {machine ? <Cog className="size-3" /> : <Sparkles className="size-3" />}
      {machine ? 'Machine' : 'Service'}
    </span>
  )
}
