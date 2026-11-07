import { useState } from 'react'
import { BadgeCheck, CalendarCheck, CircleAlert, Crown, History, Pencil, Star, Wallet } from 'lucide-react'
import { Badge, Button, Card, Field, inputClass, Progress, WhatsAppIcon } from '@/components/ui'
import { registerCustomer } from '@/data/api'
import { planById, serviceById, servicePrice } from '@/data/catalog'
import type { Customer, CustomerPackage } from '@/data/types'
import { cn, formatPhone, initials, money, shortDate } from '@/lib/format'
import { useDraft } from '../draft'
import { activePackages, remaining } from '../pricing'
import { StepFooter, StepHeading, useDraftCustomer } from '../parts'

export function CustomerStep() {
  const isNew = useDraft((s) => s.isNew)
  const customer = useDraftCustomer()
  if (isNew || !customer) return <NewCustomer />
  return <ExistingCustomer customer={customer} />
}

function ExistingCustomer({ customer }: { customer: Customer }) {
  const d = useDraft()
  const packages = activePackages(customer)
  const visits = customer.history.length

  return (
    <div>
      <StepHeading eyebrow="Step 3 of 5" title={`Welcome back, ${customer.name.split(' ')[0]}!`}>
        Here's everything on your profile. Check your balance and packages before you continue.
      </StepHeading>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 bg-wine-700 p-5 text-white">
          <span className="grid size-14 place-items-center rounded-2xl bg-sun-400 text-xl font-extrabold text-wine-950">{initials(customer.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{customer.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-wine-100">
              <WhatsAppIcon className="size-4" /> {formatPhone(customer.dial, customer.phone)}
            </p>
          </div>
          <button onClick={() => d.set({ step: 'mobile' })} className="text-sm font-semibold text-sun-300 underline-offset-4 hover:underline">
            Not you?
          </button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-wine-100">
          <Stat icon={<CalendarCheck className="size-4" />} label="Member since" value={shortDate(customer.memberSince)} />
          <Stat icon={<History className="size-4" />} label="Visits" value={String(visits)} />
          <Stat icon={<Star className="size-4" />} label="Points" value={String(customer.points)} />
        </div>
      </Card>

      {customer.due ? (
        <Card className="mt-4 border-sun-200 bg-sun-50 p-5">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sun-400 text-wine-950">
              <Wallet className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-wine-700">Due amount</p>
              <p className="text-2xl font-bold text-wine-950">{money(customer.due.amount)}</p>
              <p className="text-sm text-stone-600">
                {customer.due.note} · {shortDate(customer.due.date)}
              </p>
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-sun-200">
            <input
              type="checkbox"
              checked={d.clearDue}
              onChange={(e) => d.set({ clearDue: e.target.checked })}
              className="size-5 accent-[#74203a]"
            />
            <span className="text-sm">
              <span className="font-semibold text-wine-950">Clear this due with today's payment</span>
              <span className="block text-stone-500">Untick to settle it later at the salon.</span>
            </span>
          </label>
        </Card>
      ) : (
        <Card className="mt-4 flex items-center gap-3 p-4">
          <BadgeCheck className="size-5 text-wine-600" />
          <p className="text-sm font-medium text-wine-950">No due amount — you're all settled.</p>
        </Card>
      )}

      <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">Running packages & subscriptions</h2>
      {packages.length === 0 ? (
        <Card className="p-4 text-sm text-stone-500">No active package right now. Ask at reception about our memberships.</Card>
      ) : (
        <div className="space-y-3">
          {packages.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>
      )}

      {customer.history.length > 0 && (
        <>
          <h2 className="mb-3 mt-7 text-[17px] font-bold text-wine-950">Recent visits</h2>
          <Card className="divide-y divide-wine-50">
            {customer.history.slice(0, 3).map((v, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <div>
                  <p className="font-semibold text-wine-950">{v.services.join(', ')}</p>
                  <p className="text-stone-500">{shortDate(v.date)}</p>
                </div>
                <span className="font-semibold text-wine-950">{v.amount ? money(v.amount) : 'Package'}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      <StepFooter primary="Continue" onPrimary={() => d.set({ step: 'products' })} secondary="Back" onSecondary={() => d.set({ step: 'mobile' })} />
    </div>
  )
}

function PackageCard({ pkg }: { pkg: CustomerPackage }) {
  const d = useDraft()
  const plan = planById(pkg.planId)
  const service = plan ? serviceById(plan.serviceId) : undefined
  if (!plan || !service) return null
  const left = remaining(pkg)
  const choice = d.packageChoice[pkg.id]

  const choose = (c: 'use' | 'leave') => {
    const addedByPackage = { ...d.addedByPackage }
    let serviceIds = d.serviceIds
    if (c === 'use' && !serviceIds.includes(service.id)) {
      serviceIds = [...serviceIds, service.id]
      addedByPackage[pkg.id] = service.id
    }
    if (c === 'leave' && addedByPackage[pkg.id]) {
      serviceIds = serviceIds.filter((id) => id !== addedByPackage[pkg.id])
      delete addedByPackage[pkg.id]
    }
    d.set({ packageChoice: { ...d.packageChoice, [pkg.id]: c }, serviceIds, addedByPackage })
  }

  return (
    <Card className={cn('p-5 transition', choice === 'use' && 'border-wine-600 ring-4 ring-wine-50')}>
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sun-100 text-wine-700">
          <Crown className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-wine-950">{plan.name}</p>
            <Badge tone="sun">Active</Badge>
          </div>
          <p className="text-sm text-stone-500">
            {service.name} · valid till {shortDate(pkg.expiresOn)}
          </p>
        </div>
        <span className="text-right">
          <span className="block text-2xl font-extrabold leading-none text-wine-950">
            {pkg.used}/{pkg.total}
          </span>
          <span className="text-[11px] font-semibold uppercase text-stone-400">used</span>
        </span>
      </div>
      <Progress value={(pkg.used / pkg.total) * 100} className="mt-4" />

      <div className="mt-4 rounded-2xl bg-wine-50/70 p-3.5">
        <p className="text-sm font-semibold text-wine-950">
          {left} {left === 1 ? 'session' : 'sessions'} left — use {left === 1 ? 'it' : 'one'} now?
        </p>
        <p className="text-[13px] text-stone-500">
          {d.serviceIds.includes(service.id) || choice === 'use'
            ? `Covers your ${service.name} today (saves ${money(servicePrice(service))}).`
            : `Adds a ${service.name} to this booking at no charge.`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant={choice === 'use' ? 'wine' : 'outline'} onClick={() => choose('use')}>
            Use now
          </Button>
          <Button variant={choice === 'leave' ? 'soft' : 'outline'} onClick={() => choose('leave')}>
            Leave it
          </Button>
        </div>
      </div>
    </Card>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-3 py-3.5 text-center sm:px-5">
      <span className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </span>
      <span className="mt-1 block text-[15px] font-bold text-wine-950">{value}</span>
      <span className="text-[11px] text-stone-400 sm:hidden">{label}</span>
    </div>
  )
}

function NewCustomer() {
  const d = useDraft()
  const form = d.newCustomer
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameError = form.name.trim().length < 2 ? 'Please enter your name.' : null
  const emailError = form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? 'Enter a valid email or leave it empty.' : null
  const patch = (p: Partial<typeof form>) => d.set({ newCustomer: { ...form, ...p } })

  const submit = async () => {
    setTouched(true)
    if (!form.whatsappConfirmed || nameError || emailError) return
    setLoading(true)
    setError(null)
    try {
      const c = await registerCustomer({ ...form, dial: d.dial, phone: d.phone })
      d.set({ customerId: c.id, isNew: false, step: 'products' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <StepHeading eyebrow="Step 3 of 5 · New customer" title="Welcome to BeauDesk">
        First, confirm your WhatsApp number — that's where we share your booking token.
      </StepHeading>

      <Card className={cn('p-5 sm:p-6', form.whatsappConfirmed && 'border-wine-600 ring-4 ring-wine-50')}>
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-wine-700 text-white">
            <WhatsAppIcon className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-500">Is this number on WhatsApp?</p>
            <p className="mt-0.5 text-2xl font-bold tracking-wide text-wine-950">{formatPhone(d.dial, d.phone)}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant={form.whatsappConfirmed ? 'wine' : 'sun'} onClick={() => patch({ whatsappConfirmed: true })}>
            <BadgeCheck className="size-5" /> {form.whatsappConfirmed ? 'Confirmed WhatsApp number' : 'Yes, it is on WhatsApp'}
          </Button>
          <Button variant="outline" onClick={() => d.set({ step: 'mobile' })}>
            <Pencil className="size-4" /> No, change number
          </Button>
        </div>
        {touched && !form.whatsappConfirmed && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
            <CircleAlert className="size-4" /> Please confirm your WhatsApp number to continue.
          </p>
        )}
      </Card>

      <Card className={cn('mt-4 space-y-4 p-5 transition sm:p-6', !form.whatsappConfirmed && 'pointer-events-none opacity-45')}>
        <Field label="Your name" error={touched ? nameError : null}>
          <input
            className={inputClass}
            value={form.name}
            autoComplete="name"
            placeholder="e.g. Aisha Rahman"
            onChange={(e) => patch({ name: e.target.value })}
            onBlur={() => setTouched(true)}
          />
        </Field>
        <Field label="Email" optional error={emailError} hint="For e-receipts only.">
          <input
            className={inputClass}
            type="email"
            value={form.email}
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(e) => patch({ email: e.target.value })}
          />
        </Field>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </Card>

      <StepFooter
        primary="Save & continue"
        loading={loading}
        disabled={!form.whatsappConfirmed}
        onPrimary={submit}
        secondary="Back"
        onSecondary={() => d.set({ step: 'mobile' })}
      />
    </div>
  )
}
