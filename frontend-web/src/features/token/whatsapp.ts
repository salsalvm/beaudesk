import { useDb } from '@/data/db'
import type { Booking } from '@/data/types'
import { money } from '@/lib/format'
import { paymentSummary, receiptFileName, receiptMessage, tokenFileName, tokenMessage } from './share'
import { tokenFacts } from './TokenCard'

/** Sends two WhatsApp messages (token image, then receipt image) and records the result on the booking. */
export async function sendBookingToWhatsApp(b: Booking, png: Blob | null, receiptPng: Blob | null) {
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
      total: money(b.total),
      caption: tokenMessage(b),
      receipt: receiptMessage(b, { itemised: !receiptPng }),
    }),
  )
  if (png) form.append('image', png, tokenFileName(b))
  if (receiptPng) form.append('receiptImage', receiptPng, receiptFileName(b))

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

/** Sends one receipt image + caption (e.g. a package purchase) to a WhatsApp number. */
export async function sendReceiptToWhatsApp(input: { to: string; name: string; reference: string; total: string; caption: string }, png: Blob | null, fileName: string) {
  const form = new FormData()
  form.append('payload', JSON.stringify(input))
  if (png) form.append('image', png, fileName)
  try {
    const res = await fetch(`${import.meta.env.NEXT_PUBLIC_API_URL}/notify/receipt`, { method: 'POST', body: form })
    const data = (await res.json()) as { status?: 'sent' | 'demo' }
    return res.ok && (data.status === 'sent' || data.status === 'demo') ? data.status : 'failed'
  } catch {
    return 'failed'
  }
}
