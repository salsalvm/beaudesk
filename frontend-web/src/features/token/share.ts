import { branchById } from '@/data/catalog'
import type { Booking } from '@/data/types'
import { SALON } from '@/lib/config'
import { hourLabel, money } from '@/lib/format'
import { tokenFacts } from './TokenCard'

export function tokenFileName(b: Booking) {
  return `BeauDesk-token-${b.token}.png`
}

const METHOD: Record<Booking['paymentMethod'], string> = {
  card: 'Card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  none: '',
}

export function paymentSummary(b: Booking) {
  if (b.total === 0) return 'Covered by your package'
  const parts = [
    b.paidOnline > 0 && `${money(b.paidOnline)} paid online${METHOD[b.paymentMethod] ? ` (${METHOD[b.paymentMethod]})` : ''}`,
    b.payAtSalon > 0 && `${money(b.payAtSalon)} to pay at the salon`,
    b.dueKept > 0 && `${money(b.dueKept)} kept as due`,
  ].filter(Boolean)
  return parts.join(', ')
}

const firstName = (b: Booking) => b.customerName.trim().split(/\s+/)[0] || 'there'

/** First WhatsApp message: caption of the token image (WhatsApp caps captions at 1024 chars). */
export function tokenMessage(b: Booking) {
  const f = tokenFacts(b)
  const area = branchById(b.branchId)?.area
  return [
    '✨ *Your BeauDesk visit token*',
    '',
    `Hi ${firstName(b)}, you're all set! Here's your token for today's visit.`,
    '',
    `🎟️ Token: *${b.token}*`,
    `📅 Today · ${f.when}`,
    `📍 ${f.branch}${area ? ` — ${area}` : ''}`,
    `💇‍♀️ ${f.services.replace(/\s+·\s+/g, ', ')}`,
    `👤 Stylist: ${f.stylist}`,
    '',
    "Show this token at reception when you arrive — we'll call you as soon as your stylist is ready.",
  ]
    .join('\n')
    .slice(0, 1024)
}

/** Second WhatsApp message: itemised payment receipt (WhatsApp caps text at 4096 chars). */
export function receiptMessage(b: Booking) {
  const name = firstName(b)
  const items = [
    ...b.services.map((s) => `• ${s.name} — ${s.coveredByPackageId ? 'Package session' : money(s.price)}`),
    ...b.products.map((p) => `• ${p.name} × ${p.qty} — ${money(p.price * p.qty)}`),
    ...(b.dueCleared > 0 ? [`• Previous due cleared — ${money(b.dueCleared)}`] : []),
  ]
  const spend = b.services.reduce((a, s) => a + s.price, 0) + b.products.reduce((a, p) => a + p.price * p.qty, 0)
  const points = Math.floor(spend * SALON.pointsPerCurrencyUnit)
  const method = METHOD[b.paymentMethod]

  const intro =
    b.paidOnline > 0
      ? `Thank you, ${name}! We've received your payment of *${money(b.paidOnline)}* for token *${b.token}*.`
      : b.total === 0
        ? `Thank you, ${name}! Your visit (token *${b.token}*) is fully covered by your package.`
        : `Thank you, ${name}! Here's the receipt for token *${b.token}*.`

  return [
    b.paidOnline > 0 ? '✅ *Payment successful*' : '🧾 *Your BeauDesk receipt*',
    '',
    intro,
    '',
    '*Order summary*',
    ...items,
    '',
    `*Total: ${money(b.total)}*`,
    ...(b.paidOnline > 0 ? [`💳 Paid online: ${money(b.paidOnline)}${method ? ` (${method})` : ''}`] : []),
    ...(b.payAtSalon > 0 ? [`🏪 Pay at the salon: ${money(b.payAtSalon)}`] : []),
    ...(b.dueKept > 0 ? [`🕒 Kept as due: ${money(b.dueKept)}`] : []),
    ...(b.paymentRef ? [`Ref: ${b.paymentRef}`] : []),
    ...(points > 0 ? ['', `⭐ You've earned *${points} loyalty points* on this visit.`] : []),
    '',
    '*Good to know*',
    '• Please arrive 5–10 minutes before your time.',
    `• We're open ${SALON.openDaysLabel}, ${hourLabel(SALON.openHour)} – ${hourLabel(SALON.closeHour)} · closed on ${SALON.closedDaysLabel}.`,
    '• Need help? Just reply to this chat.',
    '',
    'Thank you for choosing BeauDesk 💐',
  ]
    .join('\n')
    .slice(0, 4096)
}

export async function renderTokenPng(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import('html-to-image')
  await Promise.all(
    Array.from(node.querySelectorAll('img')).map((img) =>
      img.complete ? Promise.resolve() : new Promise((r) => img.addEventListener('load', r, { once: true })),
    ),
  )
  await document.fonts.ready
  const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!blob) throw new Error('Could not create the token image')
  return blob
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/**
 * Must run synchronously inside the tap: browsers block `navigator.share` and
 * `window.open` after async work, which is why the PNG is rendered beforehand.
 */
export function shareTokenOnWhatsApp(b: Booking, png: Blob | null): Promise<'shared' | 'opened' | 'cancelled'> {
  const text = `${tokenMessage(b)}\n\n${receiptMessage(b)}`
  if (png) {
    const file = new File([png], tokenFileName(b), { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      return navigator
        .share({ files: [file], text })
        .then(() => 'shared' as const)
        .catch(() => 'cancelled' as const)
    }
  }
  window.open(`https://wa.me/${b.dial}${b.phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  if (png) download(png, tokenFileName(b))
  return Promise.resolve('opened')
}

export function downloadToken(b: Booking, png: Blob) {
  download(png, tokenFileName(b))
}
