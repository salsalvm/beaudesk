import type { ReactNode } from 'react'
import { BadgeCheck } from 'lucide-react'
import { SALON } from '@/lib/config'
import { cn, formatPhone, money } from '@/lib/format'
import { LOGO_SRC } from './TokenCard'

export interface ReceiptLine {
  key: string
  label: string
  sub?: string
  value: string
}

export interface ReceiptRow {
  label: string
  value: string
  tone?: 'paid' | 'muted'
}

/** Branded receipt layout shared by every receipt image sent to WhatsApp. */
export function ReceiptSheet({
  badge,
  kicker,
  title,
  meta,
  customer,
  lines,
  total,
  rows,
  note,
}: {
  badge: { label: string; paid: boolean }
  kicker: string
  title: string
  meta: [string, string]
  customer: { name: string; dial: string; phone: string }
  lines: ReceiptLine[]
  total: number
  rows: ReceiptRow[]
  note?: ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-cream-200 bg-white text-left text-wine-950">
      <span className="block h-2 bg-gradient-to-r from-wine-800 via-wine-600 to-sun-400" />
      <div className="relative overflow-hidden bg-cream-100 px-6 pb-5 pt-5">
        <span className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-sun-100/80" />
        <div className="relative flex items-center justify-between gap-3">
          <img src={LOGO_SRC} alt="BeauDesk" width={263} height={38} className="h-7 w-auto" />
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wide ring-1',
              badge.paid ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-wine-50 text-wine-700 ring-wine-100',
            )}
          >
            <BadgeCheck className="size-4" />
            {badge.label}
          </span>
        </div>
        <p className="relative mt-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-wine-700">{kicker}</p>
        <div className="relative mt-1 flex items-end justify-between gap-4">
          <p className="text-[28px] font-extrabold leading-[1.05] tracking-tight">{title}</p>
          <p className="shrink-0 text-right text-[13px] font-semibold text-stone-500">
            {meta[0]}
            <br />
            {meta[1]}
          </p>
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="flex justify-between text-[13px] text-stone-500">
          <span>{customer.name}</span>
          <span>{formatPhone(customer.dial, customer.phone)}</span>
        </div>
        <ul className="mt-3 divide-y divide-wine-50 border-y border-wine-50">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center justify-between gap-4 py-2.5">
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold">{l.label}</span>
                {l.sub && <span className="block text-[12px] text-stone-500">{l.sub}</span>}
              </span>
              <span className="whitespace-nowrap text-[15px] font-semibold">{l.value}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-1.5 py-4 text-[14px]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[16px] font-bold">Total</span>
            <span className="text-[24px] font-extrabold text-wine-800">{money(total)}</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.label}
              className={cn(
                'flex items-center justify-between gap-4 font-semibold',
                r.tone === 'paid' && 'text-emerald-700',
                r.tone === 'muted' && 'text-stone-500',
              )}
            >
              <span>{r.label}</span>
              <span className="whitespace-nowrap">{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-dashed border-wine-100 bg-wine-50/60 px-6 py-4">
        {note}
        <p className={cn('text-[13px] text-stone-500', !!note && 'mt-1')}>
          Thank you for choosing BeauDesk · Open {SALON.openDaysLabel} · closed on {SALON.closedDaysLabel}
        </p>
      </div>
    </div>
  )
}
