import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CalendarDays, Smartphone, UserRound } from 'lucide-react'
import { DemoNumbers } from '@/components/DemoNumbers'
import { Button, Card, Field, inputClass } from '@/components/ui'
import { lookupCustomer } from '@/data/api'
import { useCurrentCustomer, useDb } from '@/data/db'
import { COUNTRIES, DEFAULT_COUNTRY } from '@/lib/config'
import { cn } from '@/lib/format'
import { AccountView } from './AccountView'

export function MyBookingsPage() {
  const navigate = useNavigate()
  const customer = useCurrentCustomer()

  if (customer) return <AccountView customer={customer} />

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-wine-950">My bookings</h1>
          <p className="mt-1 text-stone-500">Find your bookings with the WhatsApp number you booked with.</p>
        </div>
        <Button onClick={() => navigate('/book')}>
          <CalendarDays className="size-5" /> New booking
        </Button>
      </div>
      <SignInCard />
    </div>
  )
}

function SignInCard() {
  const setCurrentCustomer = useDb((s) => s.setCurrentCustomer)
  const [dial, setDial] = useState(DEFAULT_COUNTRY.dial)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const country = COUNTRIES.find((c) => c.dial === dial) ?? DEFAULT_COUNTRY
  const valid = country.pattern.test(phone)

  const submit = async () => {
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const found = await lookupCustomer(dial, phone)
      if (found) setCurrentCustomer(found.id)
      else setError('No bookings found for this number. Book your first visit to get started.')
    } catch {
      setError('We could not check this number. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-6 max-w-xl p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-sun-100 text-wine-700">
          <UserRound className="size-5" />
        </span>
        <div>
          <h2 className="font-bold text-wine-950">See your bookings</h2>
          <p className="text-sm text-stone-500">Enter your WhatsApp number to view tokens, dues and visits.</p>
        </div>
      </div>
      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="Mobile number" error={error}>
          <div className="flex gap-2">
            <div className="w-[132px] shrink-0">
              <select
                value={dial}
                onChange={(e) => {
                  setDial(e.target.value)
                  setPhone('')
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
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, country.digits))}
                placeholder={'•'.repeat(country.digits)}
                className={cn(inputClass, 'pl-11 text-lg font-semibold tracking-[0.12em]')}
              />
            </div>
          </div>
        </Field>
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={!valid} loading={loading}>
          Show my bookings
        </Button>
      </form>
      <DemoNumbers
        selected={{ dial, phone }}
        onPick={(pickedDial, pickedPhone) => {
          setDial(pickedDial)
          setPhone(pickedPhone)
          setError(null)
        }}
        note="Tap a number to fill it in, then press Show my bookings."
      />
    </Card>
  )
}
