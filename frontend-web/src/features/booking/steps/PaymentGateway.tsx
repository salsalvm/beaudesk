import { useEffect, useState } from 'react'
import { Check, CreditCard, Fingerprint, Lock, ShieldCheck, Smartphone } from 'lucide-react'
import { CloseButton, Modal } from '@/components/ui'
import { chargePayment } from '@/data/api'
import type { PaymentMethod } from '@/data/types'
import { cn, money } from '@/lib/format'

type Phase = 'form' | 'processing' | 'success'
type Brand = 'visa' | 'mastercard' | 'amex' | null

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

function brandOf(digits: string): Brand {
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  return null
}

const PROCESSING_STEPS = ['Contacting your bank', 'Authorising payment', 'Confirming booking']

export interface CheckoutLine {
  label: string
  value: string
}

export function PaymentGateway({
  open,
  method,
  amount,
  lines = [],
  onClose,
  onPaid,
}: {
  open: boolean
  method: Exclude<PaymentMethod, 'none'>
  amount: number
  /** Order details shown above the amount (services, appointment, what's left to pay). */
  lines?: CheckoutLine[]
  onClose: () => void
  onPaid: (ref: string) => Promise<void>
}) {
  const [phase, setPhase] = useState<Phase>('form')
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvc: '' })
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [ref, setRef] = useState('')

  useEffect(() => {
    if (open) {
      setPhase('form')
      setError(null)
      setTouched(false)
      setStepIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (phase !== 'processing') return
    const id = window.setInterval(() => setStepIndex((i) => Math.min(i + 1, PROCESSING_STEPS.length - 1)), 450)
    return () => window.clearInterval(id)
  }, [phase])

  const digits = card.number.replace(/\s/g, '')
  const brand = brandOf(digits)
  const errors = {
    number: digits.length < 15 || !luhn(digits) ? 'Enter a valid card number.' : null,
    name: card.name.trim().length < 2 ? 'Enter the name on the card.' : null,
    exp: !expiryOk(card.exp) ? 'Use MM/YY, not expired.' : null,
    cvc: !/^\d{3,4}$/.test(card.cvc) ? '3 or 4 digits.' : null,
  }
  const cardValid = !Object.values(errors).some(Boolean)
  const show = (k: keyof typeof errors) => (touched ? errors[k] : null)

  const pay = async () => {
    setTouched(true)
    if (method === 'card' && !cardValid) return
    setPhase('processing')
    setStepIndex(0)
    setError(null)
    try {
      const res = await chargePayment({ method, amount })
      setRef(res.ref)
      setPhase('success')
      await new Promise((r) => setTimeout(r, 1100))
      await onPaid(res.ref)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed. Please try again.')
      setPhase('form')
    }
  }

  const busy = phase !== 'form'
  const walletName = method === 'apple_pay' ? 'Apple Pay' : 'Google Pay'

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} label="Secure checkout" width="sm:max-w-[440px]" className="bg-[#fbf8f8]">
      <div className="flex items-center gap-3 border-b border-wine-100/70 bg-white px-5 py-4">
        <img src="/favicon.svg" alt="" className="size-10 rounded-xl ring-1 ring-wine-100" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-wine-950">BeauDesk Salon</p>
          <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
            <Lock className="size-3" strokeWidth={2.5} /> Secure checkout
          </p>
        </div>
        <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">
          Test mode
        </span>
        {!busy && <CloseButton onClick={onClose} className="size-9 shadow-none ring-1 ring-wine-100" />}
      </div>

      <div className="px-5 pb-5 pt-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-wine-700 via-wine-800 to-wine-950 p-5 text-white shadow-[0_18px_40px_-22px_rgb(43_10_22/0.9)]">
          <span className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-white/[0.06]" />
          <span className="pointer-events-none absolute -bottom-16 right-10 size-32 rounded-full bg-sun-400/15" />
          <p className="relative text-[11px] font-semibold uppercase tracking-[0.12em] text-wine-200">Pay now</p>
          <p className="relative mt-1 text-[34px] font-extrabold leading-none tracking-tight">{money(amount)}</p>
          {lines.length > 0 && (
            <dl className="relative mt-4 space-y-1.5 border-t border-white/15 pt-3.5 text-[13px]">
              {lines.map((l) => (
                <div key={l.label} className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-wine-200">{l.label}</dt>
                  <dd className="min-w-0 text-right font-semibold text-white">{l.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {phase === 'processing' && (
          <div className="animate-fade py-9">
            <span className="mx-auto block size-14 animate-spin rounded-full border-4 border-wine-100 border-t-wine-700" />
            <p className="mt-5 text-center font-bold text-wine-950">Processing {money(amount)}</p>
            <p className="text-center text-sm text-stone-500">Please keep this window open.</p>
            <ol className="mx-auto mt-6 max-w-[260px] space-y-2.5">
              {PROCESSING_STEPS.map((s, i) => (
                <li key={s} className={cn('flex items-center gap-2.5 text-sm transition', i <= stepIndex ? 'text-wine-950' : 'text-stone-300')}>
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full transition',
                      i < stepIndex ? 'bg-emerald-500 text-white' : i === stepIndex ? 'bg-wine-100 text-wine-700' : 'bg-stone-100',
                    )}
                  >
                    {i < stepIndex ? <Check className="size-3" strokeWidth={3.5} /> : <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}

        {phase === 'success' && (
          <div className="animate-pop py-9 text-center">
            <span className="relative mx-auto grid size-[72px] place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_10px_rgb(16_185_129/0.12)]">
              <Check className="size-9" strokeWidth={3} />
            </span>
            <p className="mt-6 text-lg font-extrabold text-wine-950">Payment successful</p>
            <p className="mt-0.5 text-sm text-stone-500">{money(amount)} paid · generating your token…</p>
            {ref && <p className="mx-auto mt-4 w-fit rounded-lg bg-white px-3 py-1.5 font-mono text-xs text-stone-500 ring-1 ring-wine-100">Ref {ref}</p>}
          </div>
        )}

        {phase === 'form' && (
          <div className="mt-5 animate-fade">
            {method === 'card' ? (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-wine-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-wine-950">Card details</p>
                  <div className="flex items-center gap-1">
                    <BrandMark brand="visa" dim={!!brand && brand !== 'visa'} />
                    <BrandMark brand="mastercard" dim={!!brand && brand !== 'mastercard'} />
                    <BrandMark brand="amex" dim={!!brand && brand !== 'amex'} />
                  </div>
                </div>

                <div
                  className={cn(
                    'mt-3 overflow-hidden rounded-xl border bg-white transition focus-within:ring-4',
                    show('number') || show('exp') || show('cvc')
                      ? 'border-red-300 focus-within:ring-red-100'
                      : 'border-wine-200 focus-within:border-wine-400 focus-within:ring-wine-100',
                  )}
                >
                  <label className="flex h-12 items-center gap-3 border-b border-wine-100 px-3.5">
                    <CreditCard className="size-[18px] shrink-0 text-stone-400" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-[15px] tracking-wider text-wine-950 outline-none placeholder:tracking-normal placeholder:text-stone-300"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      aria-label="Card number"
                      placeholder="Card number"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })}
                    />
                    {brand && <BrandMark brand={brand} />}
                  </label>
                  <div className="grid grid-cols-2 divide-x divide-wine-100">
                    <input
                      className="h-12 min-w-0 bg-transparent px-3.5 text-[15px] text-wine-950 outline-none placeholder:text-stone-300"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      aria-label="Expiry date"
                      placeholder="MM / YY"
                      value={card.exp}
                      onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })}
                    />
                    <input
                      className="h-12 min-w-0 bg-transparent px-3.5 text-[15px] text-wine-950 outline-none placeholder:text-stone-300"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      aria-label="Security code"
                      placeholder="CVC"
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    />
                  </div>
                </div>
                {(show('number') || show('exp') || show('cvc')) && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{show('number') ?? show('exp') ?? show('cvc')}</p>
                )}

                <input
                  className={cn(
                    'mt-3 h-12 w-full rounded-xl border bg-white px-3.5 text-[15px] text-wine-950 outline-none transition placeholder:text-stone-300 focus:ring-4',
                    show('name') ? 'border-red-300 focus:ring-red-100' : 'border-wine-200 focus:border-wine-400 focus:ring-wine-100',
                  )}
                  autoComplete="cc-name"
                  aria-label="Name on card"
                  placeholder="Name on card"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                />
                {show('name') && <p className="mt-1.5 text-xs font-medium text-red-600">{show('name')}</p>}

                <button
                  type="button"
                  onClick={() => setCard({ number: '4242 4242 4242 4242', name: 'Test Customer', exp: '12/30', cvc: '123' })}
                  className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-amber-50 px-3 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
                >
                  <CreditCard className="size-3.5" /> Fill test card
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-wine-100">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-black text-white">
                    {method === 'apple_pay' ? <AppleLogo className="size-5" /> : <GoogleG className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-wine-950">{walletName}</p>
                    <p className="text-xs text-stone-500">Card saved in your {method === 'apple_pay' ? 'Apple Wallet' : 'Google Wallet'}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 px-3.5 py-3 text-[13px] text-stone-600">
                  {method === 'apple_pay' ? <Fingerprint className="size-5 shrink-0 text-wine-700" /> : <Smartphone className="size-5 shrink-0 text-wine-700" />}
                  {method === 'apple_pay' ? 'Confirm with Face ID or Touch ID on your device.' : 'Confirm with your screen lock on your phone.'}
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}

            {method === 'card' ? (
              <button
                type="button"
                onClick={pay}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-wine-700 text-base font-bold text-white shadow-[0_14px_30px_-16px_rgb(116_32_58/0.9)] transition hover:bg-wine-800 active:scale-[0.98]"
              >
                <Lock className="size-4" /> Pay {money(amount)}
              </button>
            ) : (
              <button
                type="button"
                onClick={pay}
                aria-label={`Pay with ${walletName}`}
                className="mt-4 flex h-14 w-full items-center justify-center gap-1.5 rounded-2xl bg-black text-[17px] font-semibold text-white transition hover:bg-stone-900 active:scale-[0.98]"
              >
                {method === 'apple_pay' ? (
                  <>
                    Pay with <AppleLogo className="ml-1 size-[18px]" /> Pay
                  </>
                ) : (
                  <>
                    Buy with <GoogleG className="ml-1 size-[18px]" /> Pay
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-center gap-4 text-[11px] font-medium text-stone-400">
          <span className="flex items-center gap-1">
            <Lock className="size-3" /> 256-bit SSL
          </span>
          <span className="size-1 rounded-full bg-stone-300" />
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> PCI DSS compliant
          </span>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-stone-400">Test mode — no real money is charged.</p>
      </div>
    </Modal>
  )
}

export function BrandMark({ brand, dim }: { brand: Exclude<Brand, null>; dim?: boolean }) {
  return (
    <span
      className={cn(
        'grid h-6 w-9 place-items-center rounded-md bg-white ring-1 ring-stone-200 transition',
        dim && 'opacity-30 grayscale',
      )}
      aria-label={brand}
    >
      {brand === 'visa' && <span className="text-[10px] font-black italic tracking-tight text-[#1a1f71]">VISA</span>}
      {brand === 'mastercard' && (
        <span className="flex">
          <span className="size-3 rounded-full bg-[#eb001b]" />
          <span className="-ml-1.5 size-3 rounded-full bg-[#f79e1b] mix-blend-multiply" />
        </span>
      )}
      {brand === 'amex' && <span className="rounded-[3px] bg-[#2e77bc] px-0.5 text-[7px] font-black text-white">AMEX</span>}
    </span>
  )
}

export function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.67-2.14.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.33-3.54zM14.18 6.13c.61-.74 1.02-1.76.91-2.78-.88.04-1.94.59-2.57 1.32-.56.65-1.06 1.69-.93 2.69.98.08 1.98-.5 2.59-1.23z" />
    </svg>
  )
}

export function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.2 3.31v2.75h3.56c2.08-1.92 3.24-4.74 3.24-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.75c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.17v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.85 14.12a6.6 6.6 0 0 1 0-4.24V7.04H2.17a11 11 0 0 0 0 9.92l3.68-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.17 7.04l3.68 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}
