import { SALON } from './config'

export function money(amount: number) {
  const value = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2)
  return `${SALON.currency} ${value}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function dayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`
}

export function monthShort(iso: string) {
  return MONTHS[new Date(`${iso.slice(0, 10)}T00:00:00`).getMonth()]
}

export function shortDate(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function longDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
}

export function hourLabel(h: number) {
  return `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}`
}

export function appointmentLabel(date: string, time: string) {
  return `${dayLabel(date)} · ${timeLabel(time)}`
}

export function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'BD'
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? ''))).toUpperCase()
}

export function formatPhone(dial: string, number: string) {
  const grouped = number.length === 10 ? `${number.slice(0, 5)} ${number.slice(5)}` : number.replace(/(\d{4})(?=\d)/g, '$1 ')
  return `+${dial} ${grouped}`
}

export function minutesLabel(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
