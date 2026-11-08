import { useState } from 'react'
import { Link } from 'react-router'
import { Crown } from 'lucide-react'
import { Badge, Button, Card, Progress } from '@/components/ui'
import { PACKAGE_PLANS, planById, serviceById } from '@/data/catalog'
import { useCurrentCustomer } from '@/data/db'
import { activePackages, remaining } from '@/features/booking/pricing'
import { money, shortDate } from '@/lib/format'
import { PlanKind, PlanThumb, isMachinePlan, machinesFirst } from './PlanPhoto'
import { SubscribeModal } from './SubscribeModal'

const SECTIONS = [
  { title: 'Machine packages', text: 'Prepaid sessions on our salon machines — reserve the machine for your time.', machine: true },
  { title: 'Service packages', text: 'Prepay for the treatments you love and save on every visit.', machine: false },
]

export function MembershipsPage() {
  const customer = useCurrentCustomer()
  const mine = machinesFirst(activePackages(customer))
  const [subscribing, setSubscribing] = useState<string | null>(null)

  return (
    <div className="animate-fade">
      <h1 className="text-[28px] font-bold tracking-tight text-wine-950">Memberships & packages</h1>
      <p className="mt-1 text-stone-500">Prepay for the services and salon machines you love and save on every visit.</p>

      {mine.length > 0 && (
        <>
          <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">Your running packages</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {mine.map((p) => {
              const plan = planById(p.planId)
              if (!plan) return null
              return (
                <Card key={p.id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3.5">
                    <PlanThumb plan={plan} className="size-16" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-wine-950">{plan.name}</p>
                        <Badge tone="sun">Active</Badge>
                      </div>
                      <p className="text-sm text-stone-500">
                        {remaining(p)} of {p.total} sessions left · valid till {shortDate(p.expiresOn)}
                      </p>
                      <span className="mt-1.5 inline-block">
                        <PlanKind plan={plan} />
                      </span>
                    </div>
                  </div>
                  <Progress value={(remaining(p) / p.total) * 100} className="mt-3" />
                  <Link to={`/book?service=${plan.serviceId}`} className="mt-3 inline-block text-sm font-semibold text-wine-700">
                    Book a session →
                  </Link>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="mt-8 text-[17px] font-bold text-wine-950">{section.title}</h2>
          <p className="mb-3 text-sm text-stone-500">{section.text}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PACKAGE_PLANS.filter((p) => isMachinePlan(p) === section.machine).map((p) => {
              const s = serviceById(p.serviceId)
              return (
                <Card key={p.id} className="flex flex-col overflow-hidden">
                  <div className="relative h-36 bg-wine-100 bg-cover bg-center" style={{ backgroundImage: `url(${p.photo})` }}>
                    <span className="absolute inset-0 bg-gradient-to-t from-wine-950/85 via-wine-950/25 to-transparent" />
                    <span className="absolute left-3 top-3">
                      <PlanKind plan={p} />
                    </span>
                    <div className="absolute inset-x-4 bottom-3 text-white">
                      <p className="text-lg font-bold leading-tight">{p.name}</p>
                      <p className="text-[13px] text-wine-100">{p.perks}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-2xl font-extrabold text-wine-950">{money(p.price)}</p>
                    <p className="text-sm text-stone-500">
                      {p.sessions} × {s?.name} · valid {p.validityDays} days
                    </p>
                    <div className="mt-auto pt-4">
                      <Button className="w-full" onClick={() => setSubscribing(p.id)}>
                        <Crown className="size-4" /> Subscribe
                      </Button>
                      <p className="mt-2 text-center text-xs text-stone-400">Pay online now or at reception.</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      ))}

      <SubscribeModal planId={subscribing} onClose={() => setSubscribing(null)} />
    </div>
  )
}
