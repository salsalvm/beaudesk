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
import { sendBookingToWhatsApp } from './whatsapp'

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
    <Modal open={!!booking} onClose={hide} label="Your booking token" width="sm:max-w-[680px] lg:max-w-[1000px]" className="bg-[#fdfafa]">
      {booking && <TokenWindow booking={booking} justBooked={justBooked} onClose={hide} />}
    </Modal>
  )
}

function Amount({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cn('rounded-xl px-2 py-2.5', value > 0 ? tone : 'bg-stone-50 text-stone-400')}>
      <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide opacity-75 sm:text-[11px]">{label}</p>
      <p className="mt-0.5 whitespace-nowrap text-[14px] font-extrabold sm:text-[15px]">{money(value)}</p>
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
  const autoSent = useRef(false)

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

  useEffect(() => {
    if (!justBooked || booking.whatsapp || preparing || autoSent.current) return
    autoSent.current = true
    void sendBookingToWhatsApp(booking, png)
  }, [justBooked, booking, preparing, png])

  const shareManually = useCallback(() => {
    void shareTokenOnWhatsApp(booking, png)
  }, [booking, png])

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  const sending = justBooked && !booking.whatsapp
  const phone = formatPhone(booking.dial, booking.phone)

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-t-[28px] bg-wine-50">
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex items-start gap-3.5 pb-12 pl-5 pr-16 pt-6 sm:gap-5 sm:px-7 sm:pt-9 lg:items-center lg:gap-4 lg:pb-5 lg:pt-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun-400 text-xl font-extrabold text-wine-950 sm:size-[68px] sm:text-2xl lg:size-12 lg:text-lg">
              {initials(booking.customerName)}
            </span>
            <div className="min-w-0 pt-0.5 lg:pt-0">
              <h2 className="text-[22px] font-bold leading-tight tracking-tight text-wine-950 sm:text-[28px] lg:text-[22px]">Your booking token</h2>
              <p className="mt-1.5 text-[14px] text-stone-500 sm:text-[15px] lg:mt-0.5 lg:text-sm">
                Keep this ready when you arrive.
                <span className="ml-2 hidden rounded-full bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-wine-700 ring-1 ring-wine-100 lg:inline">
                  {justBooked ? 'Booking confirmed' : 'Booking active'}
                </span>
              </p>
              <p className="mt-2.5 text-[12px] font-bold uppercase tracking-[0.05em] text-wine-700 lg:hidden">
                {justBooked ? 'Booking confirmed' : 'Booking active'}
              </p>
            </div>
          </div>
          <div className="relative hidden w-[200px] sm:block lg:hidden">
            <span className="absolute -left-12 -top-16 size-40 rounded-full bg-sun-200" />
            <img src="/img/salon-relax.jpg" alt="" className="relative h-full w-full rounded-bl-[28px] object-cover object-[70%_center]" />
          </div>
        </div>
        <CloseButton onClick={onClose} className="absolute right-4 top-4 lg:top-1/2 lg:-translate-y-1/2" />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-6 lg:px-7 lg:pb-7 lg:pt-6">
        <div className="relative -mt-7 px-4 sm:px-7 lg:mt-0 lg:px-0">
          <TokenCard booking={booking} notchColor="#fdfafa" className="shadow-soft" />
        </div>

        <div className="space-y-4 px-4 pb-6 pt-5 sm:px-7 lg:flex lg:flex-col lg:space-y-3 lg:p-0">
          <WhatsAppStatus
            sending={sending}
            status={booking.whatsapp?.status}
            phone={phone}
            canAct={!preparing}
            onShare={shareManually}
            onDownload={png ? () => downloadToken(booking, png) : undefined}
          />

          <div className="flex items-center gap-3 rounded-2xl border border-wine-100 bg-wine-50/60 px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-wine-100 text-wine-700">
              <Check className="size-5" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-wine-950">Show token {booking.token} at the reception desk.</p>
              <p className="text-[13px] text-stone-500">We'll call you when your stylist is ready.</p>
            </div>
          </div>

          {booking.total > 0 && (
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-wine-100 bg-white p-2.5 text-center">
              <Amount label="Paid online" value={booking.paidOnline} tone="bg-wine-50 text-wine-800" />
              <Amount label="Pay at salon" value={booking.payAtSalon} tone="bg-sun-100 text-wine-950" />
              <Amount label="Kept as due" value={booking.dueKept} tone="bg-stone-100 text-stone-700" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:mt-auto">
            <Button variant="outline" size="lg" className="whitespace-nowrap px-3!" onClick={() => go('/')}>
              Keep browsing
            </Button>
            <Button size="lg" className="whitespace-nowrap px-3!" onClick={() => go('/bookings')}>
              My bookings <ArrowRight className="size-4" />
            </Button>
          </div>

          <p className="text-[12px] text-stone-400">
            {booking.total === 0
              ? 'Covered by your package · nothing to pay'
              : booking.paidOnline > 0
                ? `Paid ${money(booking.paidOnline)} · ${METHOD_LABEL[booking.paymentMethod]}${booking.paymentRef ? ` · Ref ${booking.paymentRef}` : ''}`
                : 'Nothing paid online'}
          </p>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none fixed left-[-10000px] top-0">
        <div ref={exportRef} className="w-[680px] bg-white p-5">
          <TokenCard booking={booking} />
        </div>
      </div>
    </div>
  )
}

function WhatsAppStatus({
  sending,
  status,
  phone,
  canAct,
  onShare,
  onDownload,
}: {
  sending: boolean
  status?: 'sent' | 'demo' | 'failed'
  phone: string
  canAct: boolean
  onShare: () => void
  onDownload?: () => void
}) {
  const delivered = status === 'sent' || status === 'demo'
  const failed = status === 'failed'
  const title = sending ? 'Sending to WhatsApp…' : delivered ? 'Sent to WhatsApp' : failed ? "Couldn't send automatically" : 'Send to WhatsApp'
  const sub = failed ? 'Tap Send to share it from your phone.' : `Token + receipt · ${phone}`

  return (
    <div
      className={cn(
        'rounded-2xl border p-3.5',
        failed ? 'border-amber-200 bg-amber-50/70' : 'border-emerald-100 bg-emerald-50/60',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'relative grid size-10 shrink-0 place-items-center rounded-full text-white',
            failed ? 'bg-amber-500' : 'bg-[#25d366]',
          )}
        >
          <WhatsAppIcon className="size-5" />
          {delivered && (
            <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-white text-emerald-600 ring-2 ring-emerald-50">
              <Check className="size-3" strokeWidth={3.5} />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-wine-950">
            {sending && <LoaderCircle className="size-3.5 animate-spin text-emerald-600" />}
            {title}
          </p>
          <p className="text-xs leading-snug text-stone-500">{sub}</p>
          {status === 'demo' && <p className="text-[11px] font-semibold text-amber-700">Demo mode — not actually delivered</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!sending && (
            <button
              type="button"
              onClick={onShare}
              disabled={!canAct}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition disabled:opacity-50',
                failed || !status ? 'bg-[#25d366] text-white hover:bg-[#1fb857]' : 'bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50',
              )}
            >
              {failed || !status ? 'Send' : 'Send again'}
            </button>
          )}
          <button
            type="button"
            onClick={onDownload}
            disabled={!onDownload}
            aria-label="Download token image"
            className="grid size-9 place-items-center rounded-xl bg-white text-wine-800 ring-1 ring-wine-100 transition hover:bg-wine-50 disabled:opacity-40"
          >
            <Download className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
