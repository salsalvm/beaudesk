import { Link } from 'react-router'
import { Crown } from 'lucide-react'
import { Badge, Card, Progress } from '@/components/ui'
import { PACKAGE_PLANS, planById, serviceById } from '@/data/catalog'
import { useCurrentCustomer } from '@/data/db'
import { activePackages, remaining } from '@/features/booking/pricing'
import { money, shortDate } from '@/lib/format'

export function MembershipsPage() {
  const customer = useCurrentCustomer()
  const mine = activePackages(customer)

  return (
    <div className="animate-fade">
      <h1 className="text-[28px] font-bold tracking-tight text-wine-950">Memberships & packages</h1>
      <p className="mt-1 text-stone-500">Prepay for the services you love and save on every visit.</p>

      {mine.length > 0 && (
        <>
          <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">Your running packages</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {mine.map((p) => {
              const plan = planById(p.planId)
              return (
                <Card key={p.id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-wine-950">{plan?.name}</p>
                    <Badge tone="sun">Active</Badge>
                  </div>
                  <p className="text-sm text-stone-500">
                    {remaining(p)} of {p.total} sessions left · valid till {shortDate(p.expiresOn)}
                  </p>
                  <Progress value={(remaining(p) / p.total) * 100} className="mt-3" />
                  {plan && (
                    <Link to={`/book?service=${plan.serviceId}`} className="mt-3 inline-block text-sm font-semibold text-wine-700">
                      Book a session →
                    </Link>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}

      <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">Available packages</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PACKAGE_PLANS.map((p) => {
          const s = serviceById(p.serviceId)
          return (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              <div className="bg-wine-700 p-5 text-white">
                <Crown className="size-6 text-sun-300" />
                <p className="mt-3 text-lg font-bold">{p.name}</p>
                <p className="text-sm text-wine-100">{p.perks}</p>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-2xl font-extrabold text-wine-950">{money(p.price)}</p>
                <p className="text-sm text-stone-500">
                  {p.sessions} × {s?.name} · valid {p.validityDays} days
                </p>
                <p className="mt-auto pt-4 text-xs text-stone-400">Buy at reception on your next visit.</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
