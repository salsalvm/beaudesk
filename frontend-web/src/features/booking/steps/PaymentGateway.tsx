import { useEffect, useState } from 'react'
import { Check, CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { Button, CloseButton, Field, inputClass, Modal } from '@/components/ui'
import { chargePayment } from '@/data/api'
import type { PaymentMethod } from '@/data/types'
import { cn, money } from '@/lib/format'

type Phase = 'form' | 'processing' | 'success'

const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
const fmtExp = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

function luhn(num: string) {
  let sum = 0
  let dbl = false
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i])
    if (dbl) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    dbl = !dbl
  }
  return sum % 10 === 0
}

function expiryOk(exp: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

export function PaymentGateway({
  open,
  method,
  amount,
  onClose,
  onPaid,
}: {
  open: boolean
  method: Exclude<PaymentMethod, 'none'>
  amount: number
  onClose: () => void
  onPaid: (ref: string) => Promise<void>
}) {
  const [phase, setPhase] = useState<Phase>('form')
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvc: '' })
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPhase('form')
      setError(null)
      setTouched(false)
    }
  }, [open])

  const digits = card.number.replace(/\s/g, '')
  const errors = {
    number: digits.length < 15 || !luhn(digits) ? 'Enter a valid card number.' : null,
    name: card.name.trim().length < 2 ? 'Enter the name on the card.' : null,
    exp: !expiryOk(card.exp) ? 'Use MM/YY, not expired.' : null,
    cvc: !/^\d{3,4}$/.test(card.cvc) ? '3 or 4 digits.' : null,
  }
  const cardValid = !Object.values(errors).some(Boolean)

  const pay = async () => {
    setTouched(true)
    if (method === 'card' && !cardValid) return
    setPhase('processing')
    setError(null)
    try {
      const { ref } = await chargePayment({ method, amount })
      setPhase('success')
      await new Promise((r) => setTimeout(r, 900))
      await onPaid(ref)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed. Please try again.')
      setPhase('form')
    }
  }

  const busy = phase !== 'form'

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} label="Secure checkout" width="sm:max-w-md">
      <div className="flex items-center justify-between gap-3 border-b border-wine-50 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-wine-700 text-white">
            <Lock className="size-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-wine-950">Secure checkout</p>
            <p className="text-xs text-stone-500">BeauDesk Salon · Doha</p>
          </div>
        </div>
        {!busy && <CloseButton onClick={onClose} className="size-9 shadow-none ring-1 ring-wine-100" />}
      </div>

      <div className="px-5 pb-6 pt-5">
        <div className="rounded-2xl bg-wine-700 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-wine-200">Amount</p>
          <p className="text-3xl font-extrabold">{money(amount)}</p>
        </div>

        {phase === 'processing' && (
          <div className="py-12 text-center">
            <span className="mx-auto block size-14 animate-spin rounded-full border-4 border-wine-100 border-t-wine-700" />
            <p className="mt-5 font-semibold text-wine-950">Processing your payment…</p>
            <p className="text-sm text-stone-500">Please don't close this window.</p>
          </div>
        )}

        {phase === 'success' && (
          <div className="animate-pop py-10 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-sun-400 text-wine-950">
              <Check className="size-8" strokeWidth={3} />
            </span>
            <p className="mt-5 text-lg font-bold text-wine-950">Payment successful</p>
            <p className="text-sm text-stone-500">Generating your token…</p>
          </div>
        )}

        {phase === 'form' && (
          <div className="mt-5">
            {method === 'card' ? (
              <div className="space-y-3.5">
                <Field label="Card number" error={touched ? errors.number : null}>
                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" />
                    <input
                      className={cn(inputClass, 'pl-11 tracking-wider')}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                    />
                  </div>
                </Field>
                <Field label="Name on card" error={touched ? errors.name : null}>
                  <input
                    className={inputClass}
                    autoComplete="cc-name"
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry" error={touched ? errors.exp : null}>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      value={card.exp}
                      onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })}
                    />
                  </Field>
                  <Field label="CVC" error={touched ? errors.cvc : null}>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => setCard({ number: '4242 4242 4242 4242', name: 'Test Customer', exp: '12/30', cvc: '123' })}
                  className="text-xs font-semibold text-wine-700 underline-offset-4 hover:underline"
                >
                  Fill test card
                </button>
              </div>
            ) : (
              <p className="rounded-2xl bg-wine-50/70 p-4 text-sm text-stone-600">
                You'll confirm {money(amount)} with {method === 'apple_pay' ? 'Apple Pay' : 'Google Pay'} on your device.
              </p>
            )}

            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

            {method === 'card' ? (
              <Button size="lg" className="mt-5 w-full" onClick={pay}>
                <Lock className="size-4" /> Pay {money(amount)}
              </Button>
            ) : (
              <button
                onClick={pay}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black text-base font-semibold text-white transition active:scale-[0.98]"
              >
                Pay with {method === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
              </button>
            )}
          </div>
        )}

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-stone-400">
          <ShieldCheck className="size-3.5" /> Test mode — no real money is charged.
        </p>
      </div>
    </Modal>
  )
}
