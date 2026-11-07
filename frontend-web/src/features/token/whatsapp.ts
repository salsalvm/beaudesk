import { useDb } from '@/data/db'
import type { Booking } from '@/data/types'
import { paymentSummary, receiptMessage, tokenFileName } from './share'
import { tokenFacts } from './TokenCard'

/** Sends the token image + receipt to the booking's WhatsApp number and records the result on the booking. */
export async function sendBookingToWhatsApp(b: Booking, png: Blob | null) {
  const f = tokenFacts(b)
  const form = new FormData()
  form.append(
    'payload',
    JSON.stringify({
      to: `${b.dial}${b.phone}`,
      token: b.token,
      name: b.customerName,
      services: f.services.replace(/\s+·\s+/g, ', '),
      when: `${f.when} · ${f.branch}`,
      payment: paymentSummary(b),
      caption: receiptMessage(b),
    }),
  )
  if (png) form.append('image', png, tokenFileName(b))

  let status: 'sent' | 'demo' | 'failed' = 'failed'
  try {
    const res = await fetch(`${import.meta.env.NEXT_PUBLIC_API_URL}/notify/booking`, { method: 'POST', body: form })
    const data = (await res.json()) as { status?: 'sent' | 'demo' }
    if (res.ok && (data.status === 'sent' || data.status === 'demo')) status = data.status
  } catch {
    status = 'failed'
  }
  useDb.getState().updateBooking(b.id, { whatsapp: { status, at: new Date().toISOString() } })
  return status
}
