import { useNavigate } from 'react-router'
import { create } from 'zustand'
import { CalendarCheck, LogOut } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { useCurrentCustomer, useDb } from '@/data/db'
import { useDraft } from '@/features/booking/draft'
import { formatPhone, initials } from '@/lib/format'

const useLogoutPrompt = create<{ open: boolean; set: (open: boolean) => void }>((set) => ({
  open: false,
  set: (open) => set({ open }),
}))

/** Opens the "Log out?" confirmation instead of logging out straight away. */
export const askLogout = () => useLogoutPrompt.getState().set(true)

export function LogoutConfirmHost() {
  const { open, set } = useLogoutPrompt()
  const customer = useCurrentCustomer()
  const setCurrentCustomer = useDb((s) => s.setCurrentCustomer)
  const resetDraft = useDraft((s) => s.reset)
  const navigate = useNavigate()
  const close = () => set(false)

  const confirm = () => {
    set(false)
    setCurrentCustomer(null)
    resetDraft()
    navigate('/')
  }

  return (
    <Modal open={open && !!customer} onClose={close} label="Log out" width="sm:max-w-[400px]">
      {customer && (
        <div className="px-6 pb-6 pt-7 text-center sm:px-7">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <LogOut className="size-6" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-wine-950">Log out of BeauDesk?</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-500">You'll need your WhatsApp number to sign in again.</p>

          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-wine-50/60 p-3 text-left ring-1 ring-wine-100">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sun-400 text-sm font-extrabold text-wine-950">
              {initials(customer.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-wine-950">{customer.name}</p>
              <p className="text-xs text-stone-500">{formatPhone(customer.dial, customer.phone)}</p>
            </div>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-500">
            <CalendarCheck className="size-3.5 text-emerald-600" /> Your bookings and tokens stay saved.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <Button variant="outline" size="lg" className="px-3!" onClick={close} autoFocus>
              Stay signed in
            </Button>
            <Button variant="danger" size="lg" className="px-3!" onClick={confirm}>
              <LogOut className="size-4" /> Log out
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
