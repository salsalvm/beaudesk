import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { BadgeCheck, CalendarDays, Check, CreditCard, LoaderCircle, Smartphone, Sparkles } from 'lucide-react'
import { DemoNumbers } from '@/components/DemoNumbers'
import { Button, CloseButton, Field, inputClass, Modal, WhatsAppIcon } from '@/components/ui'
import { lookupCustomer, registerCustomer, subscribePackage } from '@/data/api'
import { planById, serviceById, servicePrice } from '@/data/catalog'
import { useCurrentCustomer, useDb } from '@/data/db'
import type { Customer, CustomerPackage, PaymentMethod } from '@/data/types'
import { AppleLogo, GoogleG, PaymentGateway } from '@/features/booking/steps/PaymentGateway'
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/config'
import { renderPng, packageReceiptFileName, packageReceiptMessage, shareReceiptOnWhatsApp } from '@/features/token/share'
import { sendReceiptToWhatsApp } from '@/features/token/whatsapp'
import { cn, formatPhone, initials, money, shortDate } from '@/lib/format'
import { PackageReceiptCard } from './PackageReceiptCard'
import { PlanKind } from './PlanPhoto'

type Step = 'number' | 'details' | 'review' | 'done'
type Method = Exclude<PaymentMethod, 'none'>

const METHODS: { id: Method; label: string }[] = [
  { id: 'apple_pay', label: 'Apple Pay' },
  { id: 'google_pay', label: 'Google Pay' },
  { id: 'card', label: 'Card' },
]

export function SubscribeModal({ planId, onClose }: { planId: string | null; onClose: () => void }) {
  const plan = planId ? planById(planId) : undefined
  const signedIn = useCurrentCustomer()
  const [step, setStep] = useState<Step>('number')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const customer = useDb((s) => s.customers.find((c) => c.id === customerId) ?? null)
  const [method, setMethod] = useState<Method>('apple_pay')
  const [gatewayOpen, setGatewayOpen] = useState(false)
  const [bought, setBought] = useState<CustomerPackage | null>(null)

  useEffect(() => {
    if (!planId) return
    setCustomerId(signedIn?.id ?? null)
    setStep(signedIn ? 'review' : 'number')
    setGatewayOpen(false)
    setBought(null)
    // Only when a new plan is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId])

  if (!plan) return null
  const service = serviceById(plan.serviceId)
  const worth = service ? servicePrice(service) * plan.sessions : 0

  const paid = async (ref: string) => {
    if (!customer) return
    setBought(await subscribePackage(customer.id, plan.id, { method, ref }))
    setGatewayOpen(false)
    setStep('done')
  }

  return (
    <>
      <Modal open={!gatewayOpen} onClose={onClose} label={`Subscribe to ${plan.name}`} width="sm:max-w-[480px]">
        <div className="relative h-36 bg-wine-100 bg-cover bg-center sm:h-40" style={{ backgroundImage: `url(${plan.photo})` }}>
          <span className="absolute inset-0 bg-gradient-to-t from-wine-950/85 via-wine-950/20 to-transparent" />
          <CloseButton onClick={onClose} className="absolute right-4 top-4" />
          <span className="absolute left-5 top-4">
            <PlanKind plan={plan} />
          </span>
          <div className="absolute inset-x-5 bottom-4 text-white">
            <p className="text-xl font-extrabold leading-tight">{plan.name}</p>
            <p className="text-sm text-wine-100">{plan.perks}</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {step === 'number' && (
            <NumberStep
              onDone={(id) => {
                setCustomerId(id)
                setStep('review')
              }}
            />
          )}

          {step === 'review' && customer && (
            <div>
              <div className="flex items-center gap-3 rounded-2xl bg-wine-50/60 p-3 ring-1 ring-wine-100">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sun-400 text-sm font-extrabold text-wine-950">
                  {initials(customer.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-wine-950">{customer.name}</p>
                  <p className="flex items-center gap-1 text-xs text-stone-500">
                    <WhatsAppIcon className="size-3.5 text-emerald-600" /> {formatPhone(customer.dial, customer.phone)}
                  </p>
                </div>
                {!signedIn && (
                  <button type="button" onClick={() => setStep('number')} className="text-xs font-semibold text-wine-700 hover:underline">
                    Change
                  </button>
                )}
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Sessions" value={`${plan.sessions} × ${service?.name ?? ''}`} />
                <Row label="Valid for" value={`${plan.validityDays} days from today`} />
                {worth > plan.price && <Row label="Worth" value={<s className="text-stone-400">{money(worth)}</s>} />}
                <div className="flex items-center justify-between border-t border-dashed border-wine-100 pt-3">
                  <dt className="text-base font-bold text-wine-950">Pay today</dt>
                  <dd className="text-2xl font-extrabold text-wine-950">{money(plan.price)}</dd>
                </div>
                {worth > plan.price && <p className="text-right text-xs font-semibold text-emerald-700">You save {money(worth - plan.price)}</p>}
              </dl>

              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.08em] text-stone-400">Pay with</p>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    aria-pressed={method === m.id}
                    className={cn(
                      'flex h-12 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-bold transition',
                      method === m.id ? 'border-wine-600 bg-wine-50/50 ring-4 ring-wine-50' : 'border-wine-100 bg-white hover:border-wine-300',
                    )}
                  >
                    {m.id === 'apple_pay' ? <AppleLogo className="size-4" /> : m.id === 'google_pay' ? <GoogleG className="size-4" /> : <CreditCard className="size-4" />}
                    {m.label}
                  </button>
                ))}
              </div>

              <Button size="lg" className="mt-5 w-full" onClick={() => setGatewayOpen(true)}>
                Subscribe · pay {money(plan.price)}
              </Button>
              <p className="mt-2 text-center text-xs text-stone-500">Sessions are added to your profile right after payment.</p>
            </div>
          )}

          {step === 'done' && bought && customer && (
            <div className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <BadgeCheck className="size-7" />
              </span>
              <h2 className="mt-3 text-xl font-extrabold tracking-tight text-wine-950">You're subscribed!</h2>
              <p className="mt-1 text-sm text-stone-500">
                {plan.name} is now active for {customer.name.split(' ')[0]}.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                <Fact icon={<Sparkles className="size-4" />} label="Sessions" value={`${bought.total} ready to use`} />
                <Fact icon={<CalendarDays className="size-4" />} label="Valid till" value={shortDate(bought.expiresOn)} />
              </div>
              <ReceiptStatus customer={customer} pkg={bought} />
              <p className="mt-3 text-xs text-stone-500">Use a session at your next booking — it's applied in the Details step.</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <Button variant="outline" size="lg" className="px-3!" onClick={onClose}>
                  Done
                </Button>
                <BookNow serviceId={plan.serviceId} onGo={onClose} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <PaymentGateway
        open={gatewayOpen}
        method={method}
        amount={plan.price}
        lines={[
          { label: 'Package', value: plan.name },
          { label: 'Sessions', value: `${plan.sessions} × ${service?.name ?? ''}` },
          ...(customer ? [{ label: 'For', value: `${customer.name} · ${formatPhone(customer.dial, customer.phone)}` }] : []),
        ]}
        confirmStep="Activating your package"
        successNote="activating your package…"
        onClose={() => setGatewayOpen(false)}
        onPaid={paid}
      />
    </>
  )
}

function BookNow({ serviceId, onGo }: { serviceId: string; onGo: () => void }) {
  const navigate = useNavigate()
  return (
    <Button
      size="lg"
      className="px-3!"
      onClick={() => {
        onGo()
        navigate(`/book?service=${serviceId}`)
      }}
    >
      Book a session
    </Button>
  )
}

function NumberStep({ onDone }: { onDone: (customerId: string) => void }) {
  const [dial, setDial] = useState(DEFAULT_COUNTRY.dial)
  const [phone, setPhone] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [name, setName] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const country = COUNTRIES.find((c) => c.dial === dial) ?? DEFAULT_COUNTRY
  const valid = country.pattern.test(phone)

  const submit = async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      if (isNew) {
        if (name.trim().length < 2) throw new Error('Enter your name.')
        const c = await registerCustomer({ name, email: '', dial, phone, whatsappConfirmed: confirmed })
        onDone(c.id)
        return
      }
      const found = await lookupCustomer(dial, phone)
      if (found) onDone(found.id)
      else setIsNew(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <p className="text-[15px] font-bold text-wine-950">Who is this package for?</p>
      <p className="mb-4 text-sm text-stone-500">Enter the WhatsApp number the sessions should be added to.</p>
      <Field label="WhatsApp number" error={!isNew ? error : null}>
        <div className="flex gap-2">
          <div className="w-[120px] shrink-0">
            <select
              value={dial}
              onChange={(e) => {
                setDial(e.target.value)
                setPhone('')
                setIsNew(false)
              }}
              className={cn(inputClass, 'font-semibold')}
              aria-label="Country code"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.dial}>
                  {c.flag} +{c.dial}
                </option>
              ))}
            </select>
          </div>
          <div className="relative min-w-0 flex-1">
            <Smartphone className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" />
            <input
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              maxLength={country.digits}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, country.digits))
                setIsNew(false)
              }}
              placeholder={'•'.repeat(country.digits)}
              className={cn(inputClass, 'pl-11 text-lg font-semibold tracking-[0.12em]')}
            />
          </div>
        </div>
      </Field>

      {isNew && (
        <div className="mt-4 space-y-3 rounded-2xl bg-sun-50 p-3.5 ring-1 ring-sun-200">
          <p className="text-sm font-semibold text-wine-950">New here? Add your name to create your profile.</p>
          <Field label="Your name" error={error}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClass} autoFocus />
          </Field>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-wine-950">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="size-5 accent-[#74203a]" />
            This number is on WhatsApp
          </label>
        </div>
      )}

      <Button type="submit" size="lg" className="mt-4 w-full" disabled={!valid || (isNew && (!confirmed || name.trim().length < 2))} loading={loading}>
        {isNew ? 'Create profile & continue' : 'Continue'} <Check className="size-4" />
      </Button>
      {!isNew && (
        <DemoNumbers
          selected={{ dial, phone }}
          onPick={(d, p) => {
            setDial(d)
            setPhone(p)
            setError(null)
            setIsNew(false)
          }}
          note="Tap a number to fill it in, then press Continue."
        />
      )}
    </form>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-semibold text-wine-950">{value}</dd>
    </div>
  )
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-wine-50/60 p-3 ring-1 ring-wine-100">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-wine-700">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-bold text-wine-950">{value}</p>
    </div>
  )
}

type SendStatus = 'sending' | 'sent' | 'demo' | 'failed'

/** Renders the package receipt and sends it to the customer's WhatsApp once, with a manual fallback. */
function ReceiptStatus({ customer, pkg }: { customer: Customer; pkg: CustomerPackage }) {
  const ref = useRef<HTMLDivElement>(null)
  const [png, setPng] = useState<Blob | null>(null)
  const [status, setStatus] = useState<SendStatus>('sending')
  const plan = planById(pkg.planId)
  const caption = packageReceiptMessage(customer, pkg)

  useEffect(() => {
    let alive = true
    const id = window.setTimeout(async () => {
      const image = ref.current ? await renderPng(ref.current).catch(() => null) : null
      if (!alive) return
      setPng(image)
      const result = await sendReceiptToWhatsApp(
        { to: `${customer.dial}${customer.phone}`, name: customer.name, reference: plan?.name ?? 'Package', total: money(pkg.purchase?.price ?? 0), caption },
        image,
        packageReceiptFileName(pkg),
      )
      if (alive) setStatus(result)
    }, 350)
    return () => {
      alive = false
      window.clearTimeout(id)
    }
    // Send once per purchase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg.id])

  const failed = status === 'failed'
  return (
    <>
      <div className={cn('mt-4 flex items-center gap-3 rounded-2xl border p-3 text-left', failed ? 'border-amber-200 bg-amber-50/70' : 'border-emerald-100 bg-emerald-50/60')}>
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full text-white', failed ? 'bg-amber-500' : 'bg-[#25d366]')}>
          <WhatsAppIcon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-wine-950">
            {status === 'sending' && <LoaderCircle className="size-3.5 animate-spin text-emerald-600" />}
            {status === 'sending' ? 'Sending receipt to WhatsApp…' : failed ? "Couldn't send the receipt" : 'Receipt sent to WhatsApp'}
          </p>
          <p className="truncate text-xs text-stone-500">{failed ? 'Tap Send to share it from your phone.' : formatPhone(customer.dial, customer.phone)}</p>
          {status === 'demo' && <p className="text-[11px] font-semibold text-amber-700">Demo mode — not actually delivered</p>}
        </div>
        {status !== 'sending' && (
          <button
            type="button"
            onClick={() => void shareReceiptOnWhatsApp(customer, caption, png, packageReceiptFileName(pkg))}
            className={cn(
              'h-9 shrink-0 rounded-xl px-3 text-xs font-bold transition',
              failed ? 'bg-[#25d366] text-white hover:bg-[#1fb857]' : 'bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50',
            )}
          >
            {failed ? 'Send' : 'Send again'}
          </button>
        )}
      </div>
      <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0">
        <div ref={ref} className="w-[520px] bg-white p-5">
          <PackageReceiptCard customer={customer} pkg={pkg} />
        </div>
      </div>
    </>
  )
}
