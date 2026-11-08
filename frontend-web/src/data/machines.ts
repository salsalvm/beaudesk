import { SALON } from '@/lib/config'
import { isoDate } from '@/lib/format'
import { CATEGORIES, MACHINES, serviceById } from './catalog'
import type { Booking } from './types'

/** Stable 0–1 value per key, so simulated occupancy is the same on every render and reload. */
function rand(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32
}

/**
 * Per category, the 1–2 machines with the fewest units, which demo data shows fully in use today,
 * mapped to how many hours from now they stay taken (2 or 3).
 */
function rushMachines(date: string) {
  const rush = new Map<string, number>()
  for (const c of CATEGORIES) {
    const count = rand(`${date}|${c.id}`) < 0.5 ? 1 : 2
    MACHINES.filter((m) => m.category === c.id)
      .sort((a, b) => a.machine!.units - b.machine!.units || rand(`${date}|${a.id}`) - rand(`${date}|${b.id}`))
      .slice(0, count)
      .forEach((m, i) => rush.set(m.id, 2 + i))
  }
  return rush
}

/** True while a rush machine is fully taken, from the current hour until it frees 2–3 hours later. */
function inRush(machineId: string, date: string, hour: number) {
  const now = new Date()
  const hours = rushMachines(date).get(machineId)
  return !!hours && date === isoDate(now) && hour >= now.getHours() && hour < now.getHours() + hours
}

/**
 * Demo stand-in for sessions already running on a machine (walk-ins, earlier tokens).
 * Each unit is held in 1–3 hour runs, so a busy machine frees up at a later slot.
 */
function unitsInUse(machineId: string, branchId: string, date: string, hour: number, units: number) {
  if (inRush(machineId, date, hour)) return units
  let busy = 0
  for (let u = 0; u < units; u++) {
    let h = SALON.openHour
    while (h <= hour) {
      const key = `${machineId}|${branchId}|${date}|${u}|${h}`
      if (rand(key) < 0.22) {
        const end = h + 1 + Math.floor(rand(`${key}|len`) * 3)
        if (hour < end) {
          busy++
          break
        }
        h = end
      } else h++
    }
  }
  return busy
}

/** Machine units still free at `branchId` for a session starting at `date` `time`. */
export function machineFree(bookings: Booking[], machineId: string, date: string, time: string, branchId: string) {
  const units = serviceById(machineId)?.machine?.units ?? 0
  const booked = bookings.filter(
    (b) =>
      b.status === 'confirmed' &&
      b.date === date &&
      b.time === time &&
      b.branchId === branchId &&
      b.services.some((s) => s.serviceId === machineId),
  ).length
  return Math.max(0, units - booked - unitsInUse(machineId, branchId, date, Number(time.slice(0, 2)), units))
}

/** First later hour today when a unit in use at `time` frees up, e.g. "17:00"; null if none does. */
export function machineFreesAt(bookings: Booking[], machineId: string, date: string, time: string, branchId: string) {
  const freeNow = machineFree(bookings, machineId, date, time, branchId)
  for (let h = Number(time.slice(0, 2)) + 1; h < SALON.closeHour; h++) {
    const slot = `${String(h).padStart(2, '0')}:00`
    if (machineFree(bookings, machineId, date, slot, branchId) > freeNow) return slot
  }
  return null
}
