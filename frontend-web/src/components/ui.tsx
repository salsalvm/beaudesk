import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, X } from 'lucide-react'
import { cn } from '@/lib/format'

type Variant = 'sun' | 'wine' | 'outline' | 'ghost' | 'soft'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  sun: 'bg-sun-400 text-wine-950 shadow-[0_6px_16px_-8px_rgb(245_183_0/0.9)] hover:bg-sun-300 active:bg-sun-500',
  wine: 'bg-wine-700 text-white shadow-[0_6px_16px_-8px_rgb(116_32_58/0.9)] hover:bg-wine-800 active:bg-wine-900',
  outline: 'border border-wine-100 bg-white text-wine-950 hover:border-wine-200 hover:bg-wine-50',
  ghost: 'text-wine-800 hover:bg-wine-50',
  soft: 'bg-wine-50 text-wine-800 hover:bg-wine-100',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2',
}

export function Button({
  variant = 'sun',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-3xl border border-wine-100/80 bg-white shadow-soft', className)}>{children}</div>
}

export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl bg-sun-100 text-wine-700', className)}>
      {children}
    </span>
  )
}

export function Badge({ children, tone = 'wine', className }: { children: ReactNode; tone?: 'wine' | 'sun' | 'muted'; className?: string }) {
  const tones = {
    wine: 'bg-wine-50 text-wine-700 ring-wine-100',
    sun: 'bg-sun-100 text-wine-900 ring-sun-200',
    muted: 'bg-stone-100 text-stone-600 ring-stone-200',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', tones[tone], className)}>
      {children}
    </span>
  )
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-wine-50', className)}>
      <div className="h-full rounded-full bg-sun-400 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function Modal({
  open,
  onClose,
  children,
  className,
  width = 'sm:max-w-lg',
  label,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  width?: string
  label: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 animate-fade bg-wine-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative max-h-[94dvh] w-full animate-rise overflow-y-auto rounded-t-[28px] bg-white shadow-lift sm:animate-pop sm:rounded-[28px]',
          width,
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className={cn('grid size-10 place-items-center rounded-xl bg-white text-wine-950 shadow-soft transition hover:bg-wine-50', className)}
    >
      <X className="size-5" strokeWidth={2.5} />
    </button>
  )
}

export function Logo({ light }: { light?: boolean }) {
  return (
    <img
      src="/brand/beaudesk-logo.png"
      alt="BeauDesk"
      width={263}
      height={38}
      className={cn('h-6 w-auto sm:h-7', light && 'brightness-0 invert')}
    />
  )
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2zm5.8 14.09c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34h.52c.17 0 .4-.06.62.47.24.56.8 1.94.87 2.08.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.34z" />
    </svg>
  )
}

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  optional?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5 text-sm font-semibold text-wine-950">
        {label}
        {optional && <span className="text-xs font-medium text-stone-400">(optional)</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-stone-500">{hint}</span>
      ) : null}
    </label>
  )
}

export const inputClass =
  'h-12 w-full rounded-2xl border border-wine-100 bg-white px-4 text-[15px] text-wine-950 outline-none transition placeholder:text-stone-400 focus:border-wine-400 focus:ring-4 focus:ring-wine-100'
