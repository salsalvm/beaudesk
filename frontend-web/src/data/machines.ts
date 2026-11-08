import { BRANCHES, serviceById } from './catalog'
import type { Booking } from './types'

/**
 * Machine units still free for a session starting at `date` `time`.
 * Without a branch it counts every branch, for screens where none is picked yet.
 */
export function machineFree(bookings: Booking[], machineId: string, date: string, time: string, branchId?: string) {
  const units = serviceById(machineId)?.machine?.units ?? 0
  const taken = bookings.filter(
    (b) =>
      b.status === 'confirmed' &&
      b.date === date &&
      b.time === time &&
      (!branchId || b.branchId === branchId) &&
      b.services.some((s) => s.serviceId === machineId),
  ).length
  return Math.max(0, (branchId ? units : units * BRANCHES.length) - taken)
}
