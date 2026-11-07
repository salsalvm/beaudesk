import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { serviceById, type CategoryId } from '@/data/catalog'
import { useDraft } from './draft'
import { Stepper, SummaryPanel, useDraftCustomer } from './parts'
import { ServicesStep } from './steps/ServicesStep'
import { MobileStep } from './steps/MobileStep'
import { CustomerStep } from './steps/CustomerStep'
import { ProductsStep } from './steps/ProductsStep'
import { PaymentStep } from './steps/PaymentStep'

const CATEGORY_IDS: CategoryId[] = ['hair', 'nails', 'skin', 'makeup']

export function BookingFlow() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const d = useDraft()
  const customer = useDraftCustomer()

  useEffect(() => {
    const service = params.get('service')
    const category = params.get('category') as CategoryId | null
    if (!service && !category) return
    const s = service ? serviceById(service) : undefined
    const date = params.get('date')
    const time = params.get('time')
    d.reset({
      category: s?.category ?? (category && CATEGORY_IDS.includes(category) ? category : 'hair'),
      serviceIds: s ? [s.id] : [],
      date,
      time,
      step: s && date && time ? 'mobile' : 'services',
    })
    setParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Never show a step whose earlier answers are missing (e.g. after a reload).
  useEffect(() => {
    const needsServices = d.step !== 'services' && (d.serviceIds.length === 0 || !d.date || !d.time)
    const needsCustomer = (d.step === 'products' || d.step === 'payment') && !customer
    const needsPhone = d.step === 'customer' && !d.phone
    if (needsServices) d.set({ step: 'services' })
    else if (needsPhone) d.set({ step: 'mobile' })
    else if (needsCustomer) d.set({ step: 'customer' })
  }, [d, customer])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [d.step])

  return (
    <div className="animate-fade">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          aria-label="Leave booking"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-wine-950 shadow-soft ring-1 ring-wine-100"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <Stepper step={d.step} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div key={d.step} className="min-w-0 animate-rise">
          {d.step === 'services' && <ServicesStep />}
          {d.step === 'mobile' && <MobileStep />}
          {d.step === 'customer' && <CustomerStep />}
          {d.step === 'products' && <ProductsStep />}
          {d.step === 'payment' && <PaymentStep />}
        </div>
        <SummaryPanel />
      </div>
    </div>
  )
}
