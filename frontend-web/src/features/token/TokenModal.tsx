import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { create } from 'zustand'
import { ArrowRight, Check, Download, LoaderCircle } from 'lucide-react'
import { Button, CloseButton, Modal, WhatsAppIcon } from '@/components/ui'
import { useDb } from '@/data/db'
import type { Booking } from '@/data/types'
import { cn, formatPhone, initials, money } from '@/lib/format'
import { TokenCard } from './TokenCard'
import { downloadToken, renderTokenPng, shareTokenOnWhatsApp } from './share'

interface TokenModalState {
  bookingId: string | null
  justBooked: boolean
  show: (bookingId: string, justBooked?: boolean) => void
  hide: () => void
}

export const useTokenModal = create<TokenModalState>((set) => ({
  bookingId: null,
  justBooked: false,
  show: (bookingId, justBooked = false) => set({ bookingId, justBooked }),
  hide: () => set({ bookingId: null, justBooked: false }),
}))

export function TokenModalHost() {
  const { bookingId, justBooked, hide } = useTokenModal()
  const booking = useDb((s) => s.bookings.find((b) => b.id === bookingId) ?? null)
  return (
    <Modal open={!!booking} onClose={hide} label="Your booking token" width="sm:max-w-[680px]" className="bg-[#fdfafa]">
      {booking && <TokenWindow booking={booking} justBooked={justBooked} onClose={hide} />}
    </Modal>
  )
}

function Amount({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cn('rounded-xl px-2 py-2.5', value > 0 ? tone : 'bg-stone-50 text-stone-400')}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-0.5 text-[15px] font-extrabold">{money(value)}</p>
    </div>
  )
}

const METHOD_LABEL: Record<Booking['paymentMethod'], string> = {
  card: 'Card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  none: 'No payment needed',
}

function TokenWindow({ booking, justBooked, onClose }: { booking: Booking; justBooked: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const exportRef = useRef<HTMLDivElement>(null)
  const [png, setPng] = useState<Blob | null>(null)
  const [preparing, setPreparing] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    let alive = true
    setPreparing(true)
    const id = window.setTimeout(() => {
      if (!exportRef.current) return
      renderTokenPng(exportRef.current)
        .then((b) => alive && setPng(b))
        .catch(() => alive && setPng(null))
        .finally(() => alive && setPreparing(false))
    }, 350)
    return () => {
      alive = false
      window.clearTimeout(id)
    }
  }, [booking.id])

  const share = useCallback(() => {
    shareTokenOnWhatsApp(booking, png).then((r) => r !== 'cancelled' && setShared(true))
  }, [booking, png])

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-t-[28px] bg-wine-50">
        <div className="relative grid grid-cols-[1fr_auto]">
          <div className="flex items-start gap-4 px-5 pb-12 pt-6 sm:gap-5 sm:px-7 sm:pt-9">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun-400 text-xl font-extrabold text-wine-950 sm:size-[68px] sm:text-2xl">
              {initials(booking.customerName)}
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-[22px] font-bold leading-tight tracking-tight text-wine-950 sm:text-[28px]">Your booking token</h2>
              <p className="mt-1.5 text-[14px] text-stone-500 sm:text-[15px]">Keep this ready when you arrive.</p>
              <p className="mt-2.5 text-[12px] font-bold uppercase tracking-[0.05em] text-wine-700">
                {justBooked ? 'Booking confirmed' : 'Booking active'}
              </p>
            </div>
          </div>
          <div className="relative hidden w-[200px] sm:block">
            <span className="absolute -left-12 -top-16 size-40 rounded-full bg-sun-200" />
            <img src="/img/salon-relax.jpg" alt="" className="relative h-full w-full rounded-bl-[28px] object-cover object-[70%_center]" />
          </div>
        </div>
        <CloseButton onClick={onClose} className="absolute right-4 top-4" />
      </div>

      <div className="relative -mt-7 px-4 sm:px-7">
        <TokenCard booking={booking} notchColor="#fdfafa" className="shadow-soft" />
      </div>

      <div className="space-y-4 px-4 pb-6 pt-5 sm:px-7">
        <div className="flex items-center gap-4 rounded-2xl border border-wine-100 bg-wine-50/60 px-4 py-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-wine-100 text-wine-700">
            <Check className="size-6" strokeWidth={3} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-wine-950 sm:text-[16px]">Show token {booking.token} at the reception desk.</p>
            <p className="mt-0.5 text-[13px] text-stone-500">We'll call you when your stylist is ready.</p>
          </div>
        </div>

        {booking.total > 0 && (
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-wine-100 bg-white p-2.5 text-center">
            <Amount label="Paid online" value={booking.paidOnline} tone="bg-wine-50 text-wine-800" />
            <Amount label="Pay at salon" value={booking.payAtSalon} tone="bg-sun-100 text-wine-950" />
            <Amount label="Kept as due" value={booking.dueKept} tone="bg-stone-100 text-stone-700" />
          </div>
        )}

        <div className="rounded-2xl border border-wine-100 bg-white p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="wine" size="lg" className="w-full sm:w-auto sm:flex-1" onClick={share} disabled={preparing}>
              {preparing ? <LoaderCircle className="size-5 animate-spin" /> : <WhatsAppIcon className="size-5" />}
              {shared ? 'Share token again' : 'Share token on WhatsApp'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="sm:w-14 sm:px-0"
              aria-label="Download token image"
              disabled={!png}
              onClick={() => png && downloadToken(booking, png)}
            >
              <Download className="size-5" />
              <span className="sm:hidden">Download token image</span>
            </Button>
          </div>
          <p className="mt-2.5 text-center text-[12px] text-stone-500">
            Only the token card is shared, to WhatsApp {formatPhone(booking.dial, booking.phone)}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={() => go('/')}>
            Keep browsing
          </Button>
          <Button size="lg" onClick={() => go('/bookings')}>
            Manage my booking <ArrowRight className="size-4" />
          </Button>
        </div>

        <p className="text-[12px] text-stone-400">
          {booking.total === 0
            ? 'Covered by your package · nothing to pay'
            : booking.paidOnline > 0
              ? `Paid ${money(booking.paidOnline)} · ${METHOD_LABEL[booking.paymentMethod]}${booking.paymentRef ? ` · Ref ${booking.paymentRef}` : ''}`
              : 'Nothing paid online'}
          {' · '}Each booking gets its own unique token.
        </p>
      </div>

      <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0">
        <div ref={exportRef} className="w-[680px] bg-white p-5">
          <TokenCard booking={booking} />
        </div>
      </div>
    </div>
  )
}
