import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import { Card, Field, inputClass } from '@/components/ui'
import { lookupCustomer } from '@/data/api'
import { DEMO_CUSTOMERS } from '@/data/db'
import { COUNTRIES } from '@/lib/config'
import { cn, formatPhone } from '@/lib/format'
import { useDraft } from '../draft'
import { StepFooter, StepHeading } from '../parts'

export function MobileStep() {
  const d = useDraft()
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const country = COUNTRIES.find((c) => c.dial === d.dial) ?? COUNTRIES[0]
  const valid = country.pattern.test(d.phone)
  const showError = touched && d.phone.length > 0 && !valid

  const submit = async () => {
    setTouched(true)
    if (!valid) return
    setLoading(true)
    setError(null)
    try {
      const found = await lookupCustomer(d.dial, d.phone)
      d.set({
        customerId: found?.id ?? null,
        isNew: !found,
        packageChoice: {},
        addedByPackage: {},
        clearDue: true,
        newCustomer: { name: '', email: '', whatsappConfirmed: false },
        step: 'customer',
      })
    } catch {
      setError('We could not check this number. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <StepHeading eyebrow="Step 2 of 5" title="Your mobile number">
        We'll find your profile, packages and any balance. New here? We'll set you up in a moment.
      </StepHeading>

      <Card className="p-5 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Field
            label="Mobile number"
            error={showError ? `Enter a valid ${country.digits}-digit ${country.name} mobile number.` : error}
            hint="Use the number you have on WhatsApp — your token is shared there."
          >
            <div className="flex gap-2">
              <select
                value={d.dial}
                onChange={(e) => d.set({ dial: e.target.value, phone: '' })}
                className={cn(inputClass, 'w-[118px] shrink-0 px-3')}
                aria-label="Country code"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>
                    {c.flag} +{c.dial}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <Smartphone className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" />
                <input
                  autoFocus
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={d.phone}
                  maxLength={country.digits}
                  onBlur={() => setTouched(true)}
                  onChange={(e) => d.set({ phone: e.target.value.replace(/\D/g, '').slice(0, country.digits) })}
                  placeholder={'0'.repeat(country.digits).replace(/0/g, '•')}
                  className={cn(inputClass, 'pl-11 text-lg font-semibold tracking-[0.12em]', showError && 'border-red-300 focus:ring-red-100')}
                />
              </div>
            </div>
          </Field>
          <button type="submit" className="hidden" />
        </form>

        <div className="mt-5 rounded-2xl bg-wine-50/70 p-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-wine-700">Demo numbers</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_CUSTOMERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => d.set({ dial: c.dial, phone: c.phone })}
                className="rounded-xl bg-white px-3 py-1.5 text-left text-xs ring-1 ring-wine-100 hover:ring-wine-300"
              >
                <span className="block font-semibold text-wine-950">{formatPhone(c.dial, c.phone)}</span>
                <span className="text-stone-500">{c.name.split(' ')[0]} · existing</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">Any other number goes through the new-customer path.</p>
        </div>
      </Card>

      <StepFooter
        primary="Continue"
        loading={loading}
        disabled={!valid}
        onPrimary={submit}
        secondary="Back"
        onSecondary={() => d.set({ step: 'services' })}
      />
    </div>
  )
}
