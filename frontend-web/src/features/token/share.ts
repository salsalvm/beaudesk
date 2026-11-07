import type { Booking } from '@/data/types'
import { tokenFacts } from './TokenCard'

export function tokenFileName(b: Booking) {
  return `BeauDesk-token-${b.token}.png`
}

export function tokenMessage(b: Booking) {
  const f = tokenFacts(b)
  return [
    `BeauDesk visit token: *${b.token}*`,
    `${f.services.replace(/\s+·\s+/g, ' · ')}`,
    `${f.when} · ${f.branch}`,
    'Show this token at the reception desk.',
  ].join('\n')
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
  const text = tokenMessage(b)
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
