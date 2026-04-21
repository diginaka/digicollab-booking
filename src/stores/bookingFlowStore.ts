import { create } from 'zustand'

export type FlowStep = 'date' | 'time' | 'form' | 'confirm' | 'done'

export interface GuestFormValues {
  guest_name: string
  guest_email: string
  guest_phone: string
  notes: string
  agreed: boolean
}

interface BookingFlowState {
  step: FlowStep
  selectedDate: string | null
  selectedSlotStart: string | null
  form: GuestFormValues
  setStep: (step: FlowStep) => void
  setDate: (iso: string) => void
  setSlotStart: (iso: string | null) => void
  setForm: (patch: Partial<GuestFormValues>) => void
  reset: () => void
}

const INITIAL_FORM: GuestFormValues = {
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  notes: '',
  agreed: false,
}

export const useBookingFlowStore = create<BookingFlowState>((set) => ({
  step: 'date',
  selectedDate: null,
  selectedSlotStart: null,
  form: INITIAL_FORM,
  setStep: (step) => set({ step }),
  setDate: (iso) => set({ selectedDate: iso, selectedSlotStart: null, step: 'time' }),
  setSlotStart: (iso) => set({ selectedSlotStart: iso, step: iso ? 'form' : 'time' }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  reset: () => set({ step: 'date', selectedDate: null, selectedSlotStart: null, form: INITIAL_FORM }),
}))
