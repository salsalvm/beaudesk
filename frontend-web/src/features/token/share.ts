import type { Booking } from '@/data/types'
import { money } from '@/lib/format'
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

export function receiptMessage(b: Booking) {
  const f = tokenFacts(b)
  const lines = [
    `Hi ${b.customerName.split(' ')[0]}, your BeauDesk booking is confirmed.`,
    '',
    `Token: *${b.token}*`,
    `Services: ${f.services.replace(/\s+·\s+/g, ', ')}`,
    `When: ${f.when}`,
    `Salon: ${f.branch} · ${f.stylist}`,
    '',
    '*Receipt*',
    `Total: ${money(b.total)}`,
    ...(b.paidOnline > 0 ? [`Paid online: ${money(b.paidOnline)}${b.paymentRef ? ` (Ref ${b.paymentRef})` : ''}`] : []),
    ...(b.payAtSalon > 0 ? [`Pay at salon: ${money(b.payAtSalon)}`] : []),
    ...(b.dueKept > 0 ? [`Kept as due: ${money(b.dueKept)}`] : []),
    '',
    'Show this token at the reception desk.',
  ]
  return lines.join('\n').slice(0, 1024)
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
  const text = receiptMessage(b)
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
