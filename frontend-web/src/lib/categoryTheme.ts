import { serviceById, type CategoryId } from '@/data/catalog'
import type { Booking } from '@/data/types'

export interface CategoryTheme {
  /** Filled surface for selected states. */
  solid: string
  /** Pale tint with accent text, for chips, icon tiles and badges. */
  soft: string
  text: string
  border: string
  ring: string
  /** Header band gradient stops. */
  gradient: string
  dot: string
  /** Hover tint for rows and cards. */
  hover: string
}

export const CATEGORY_THEME: Record<CategoryId, CategoryTheme> = {
  hair: {
    solid: 'bg-wine-700 text-white',
    soft: 'bg-wine-50 text-wine-700',
    text: 'text-wine-700',
    border: 'border-wine-700',
    ring: 'ring-wine-100',
    gradient: 'from-wine-800 to-wine-600',
    dot: 'bg-wine-600',
    hover: 'hover:bg-wine-50/50',
  },
  nails: {
    solid: 'bg-coral-500 text-white',
    soft: 'bg-coral-50 text-coral-600',
    text: 'text-coral-600',
    border: 'border-coral-500',
    ring: 'ring-coral-100',
    gradient: 'from-coral-600 to-coral-400',
    dot: 'bg-coral-500',
    hover: 'hover:bg-coral-50/60',
  },
  skin: {
    solid: 'bg-teal-600 text-white',
    soft: 'bg-teal-50 text-teal-700',
    text: 'text-teal-700',
    border: 'border-teal-600',
    ring: 'ring-teal-100',
    gradient: 'from-teal-700 to-teal-500',
    dot: 'bg-teal-500',
    hover: 'hover:bg-teal-50/60',
  },
  makeup: {
    solid: 'bg-violet-600 text-white',
    soft: 'bg-violet-50 text-violet-700',
    text: 'text-violet-700',
    border: 'border-violet-600',
    ring: 'ring-violet-100',
    gradient: 'from-violet-700 to-violet-500',
    dot: 'bg-violet-500',
    hover: 'hover:bg-violet-50/60',
  },
}

/** A booking takes the colour of its first service's category. */
export const categoryOfBooking = (b: Pick<Booking, 'services'>): CategoryId =>
  serviceById(b.services[0]?.serviceId ?? '')?.category ?? 'hair'
