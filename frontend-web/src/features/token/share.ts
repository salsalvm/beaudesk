import { branchById, planById, serviceById } from '@/data/catalog'
import type { Booking, Customer, CustomerPackage, PaymentMethod } from '@/data/types'
import { SALON } from '@/lib/config'
import { hourLabel, money, shortDate } from '@/lib/format'
import { tokenFacts } from './TokenCard'

export function tokenFileName(b: Booking) {
  return `BeauDesk-token-${b.token}.png`
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  card: 'Card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  none: '',
}

export function paymentSummary(b: Booking) {
  if (b.total === 0) return 'Covered by your package'
  const parts = [
    b.paidOnline > 0 && `${money(b.paidOnline)} paid online${METHOD_LABEL[b.paymentMethod] ? ` (${METHOD_LABEL[b.paymentMethod]})` : ''}`,
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

export function receiptFileName(b: Booking) {
  return `BeauDesk-receipt-${b.token}.png`
}

export function paymentMethodLabel(b: Booking) {
  return METHOD_LABEL[b.paymentMethod]
}

export function pointsEarned(b: Booking) {
  const spend = b.services.reduce((a, s) => a + s.price, 0) + b.products.reduce((a, p) => a + p.price * p.qty, 0)
  return Math.floor(spend * SALON.pointsPerCurrencyUnit)
}

/**
 * Second WhatsApp message. With a receipt image it becomes the image caption, so the
 * itemised lines are left to the image and the text must fit WhatsApp's 1024-char caption cap.
 */
export function receiptMessage(b: Booking, { itemised = true } = {}) {
  const name = firstName(b)
  const items = [
    ...b.services.map((s) => `• ${s.name} — ${s.coveredByPackageId ? 'Package session' : money(s.price)}`),
    ...b.products.map((p) => `• ${p.name} × ${p.qty} — ${money(p.price * p.qty)}`),
    ...(b.dueCleared > 0 ? [`• Previous due cleared — ${money(b.dueCleared)}`] : []),
  ]
  const points = pointsEarned(b)
  const method = METHOD_LABEL[b.paymentMethod]

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
    ...(itemised ? ['*Order summary*', ...items, ''] : []),
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
    .slice(0, itemised ? 4096 : 1024)
}

export async function renderPng(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import('html-to-image')
  await Promise.all(
    Array.from(node.querySelectorAll('img')).map((img) =>
      img.complete ? Promise.resolve() : new Promise((r) => img.addEventListener('load', r, { once: true })),
    ),
  )
  await document.fonts.ready
  const blob = await toBlob(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!blob) throw new Error('Could not create the image')
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
export function shareTokenOnWhatsApp(b: Booking, png: Blob | null, receiptPng: Blob | null): Promise<'shared' | 'opened' | 'cancelled'> {
  const text = `${tokenMessage(b)}\n\n${receiptMessage(b, { itemised: !receiptPng })}`
  const files = [
    ...(png ? [new File([png], tokenFileName(b), { type: 'image/png' })] : []),
    ...(receiptPng ? [new File([receiptPng], receiptFileName(b), { type: 'image/png' })] : []),
  ]
  if (files.length && navigator.canShare?.({ files })) {
    return navigator
      .share({ files, text })
      .then(() => 'shared' as const)
      .catch(() => 'cancelled' as const)
  }
  window.open(`https://wa.me/${b.dial}${b.phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  if (png) download(png, tokenFileName(b))
  if (receiptPng) download(receiptPng, receiptFileName(b))
  return Promise.resolve('opened')
}

export function downloadToken(b: Booking, png: Blob) {
  download(png, tokenFileName(b))
}

export function packageReceiptFileName(pkg: CustomerPackage) {
  return `BeauDesk-receipt-${pkg.id}.png`
}

/** Caption for the package purchase receipt image (WhatsApp caps captions at 1024 chars). */
export function packageReceiptMessage(customer: Customer, pkg: CustomerPackage) {
  const plan = planById(pkg.planId)
  const service = plan && serviceById(plan.serviceId)
  const name = customer.name.trim().split(/\s+/)[0] || 'there'
  const method = pkg.purchase ? METHOD_LABEL[pkg.purchase.method] : ''
  return [
    '✅ *Payment successful*',
    '',
    `Thank you, ${name}! Your *${plan?.name ?? 'package'}* is now active.`,
    '',
    '*Package summary*',
    `• ${pkg.total} × ${service?.name ?? 'session'}`,
    `• Valid till ${shortDate(pkg.expiresOn)}`,
    '',
    `*Total paid: ${money(pkg.purchase?.price ?? plan?.price ?? 0)}*`,
    ...(method ? [`💳 Paid online (${method})`] : []),
    ...(pkg.purchase?.ref ? [`Ref: ${pkg.purchase.ref}`] : []),
    '',
    '*How to use it*',
    '• Book any time and tap "Use now" on your package in the Details step.',
    '• Each visit uses one session.',
    '',
    'Thank you for choosing BeauDesk 💐',
  ]
    .join('\n')
    .slice(0, 1024)
}

/** Manual fallback: share an image + text on WhatsApp (runs inside the tap, like shareTokenOnWhatsApp). */
export function shareReceiptOnWhatsApp(to: { dial: string; phone: string }, text: string, png: Blob | null, fileName: string) {
  const file = png ? new File([png], fileName, { type: 'image/png' }) : null
  if (file && navigator.canShare?.({ files: [file] })) {
    return navigator
      .share({ files: [file], text })
      .then(() => 'shared' as const)
      .catch(() => 'cancelled' as const)
  }
  window.open(`https://wa.me/${to.dial}${to.phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  if (png) download(png, fileName)
  return Promise.resolve('opened' as const)
}
