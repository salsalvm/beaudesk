import { Minus, Plus, ShoppingBag, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { PRODUCTS, serviceById, type CategoryId, type Product } from '@/data/catalog'
import { cn, money } from '@/lib/format'
import { useDraft } from '../draft'
import { SectionTitle, StepFooter, StepHeading } from '../parts'

export function ProductsStep() {
  const d = useDraft()
  const chosen = d.serviceIds.map(serviceById).filter((s) => !!s)
  const cats = new Set<CategoryId>(chosen.map((s) => s.category))
  const recommended = PRODUCTS.filter((p) => p.categories.some((c) => cats.has(c)))
  const others = PRODUCTS.filter((p) => !recommended.includes(p))
  const count = Object.values(d.products).reduce((a, n) => a + n, 0)

  const reasonFor = (p: Product) =>
    chosen
      .filter((s) => p.categories.includes(s.category))
      .map((s) => s.name)
      .slice(0, 2)
      .join(' & ')

  return (
    <div>
      <StepHeading eyebrow="Step 4 of 5" title="Would you like to add any products?">
        Hand-picked by our stylists for the services you chose. Collect them at reception with your token.
      </StepHeading>

      <div className="grid gap-4 sm:grid-cols-2">
        {recommended.map((p) => (
          <ProductCard key={p.id} product={p} reason={reasonFor(p)} big />
        ))}
      </div>

      {others.length > 0 && (
        <>
          <SectionTitle>More from our shelf</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}

      <StepFooter
        primary={
          count > 0 ? (
            <>
              <ShoppingBag className="size-5" /> Continue with {count} {count === 1 ? 'item' : 'items'}
            </>
          ) : (
            'Continue to payment'
          )
        }
        onPrimary={() => d.set({ step: 'payment' })}
        secondary={count > 0 ? 'Back' : 'No, thanks'}
        onSecondary={() => (count > 0 ? d.set({ step: 'customer' }) : d.set({ step: 'payment' }))}
      />
    </div>
  )
}

function ProductCard({ product: p, reason, big }: { product: Product; reason?: string; big?: boolean }) {
  const qty = useDraft((s) => s.products[p.id] ?? 0)
  const setQty = useDraft((s) => s.setProductQty)

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-3xl border bg-white shadow-soft transition',
        qty > 0 ? 'border-wine-600 ring-4 ring-wine-50' : 'border-wine-100',
        big ? 'flex flex-col' : 'flex items-center gap-4 p-3',
      )}
    >
      <div className={cn('relative overflow-hidden bg-wine-50', big ? 'aspect-[4/3]' : 'size-20 shrink-0 rounded-2xl')}>
        <img src={p.image} alt={p.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
        {big && reason && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-wine-800 backdrop-blur">
            <Sparkles className="size-3.5 text-sun-500" /> Recommended for {reason}
          </span>
        )}
      </div>
      <div className={cn('flex flex-1 flex-col', big ? 'p-4' : 'min-w-0')}>
        <p className="font-bold text-wine-950">{p.name}</p>
        <p className="text-xs text-stone-400">{p.size}</p>
        {big && <p className="mt-2 text-sm text-stone-600">{p.why}</p>}
        <div className={cn('flex items-center justify-between gap-3', big ? 'mt-4' : 'mt-2')}>
          <span className="text-lg font-bold text-wine-950">{money(p.price)}</span>
          {qty === 0 ? (
            <Button size="sm" variant={big ? 'sun' : 'soft'} onClick={() => setQty(p.id, 1)}>
              <Plus className="size-4" /> Add
            </Button>
          ) : (
            <div className="flex items-center gap-1 rounded-xl bg-wine-50 p-1">
              <button aria-label="Remove one" onClick={() => setQty(p.id, qty - 1)} className="grid size-8 place-items-center rounded-lg bg-white text-wine-800 shadow-sm">
                <Minus className="size-4" />
              </button>
              <span className="w-7 text-center font-bold text-wine-950">{qty}</span>
              <button aria-label="Add one" onClick={() => setQty(p.id, qty + 1)} className="grid size-8 place-items-center rounded-lg bg-wine-700 text-white shadow-sm">
                <Plus className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
