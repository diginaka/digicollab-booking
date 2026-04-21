export type AppointmentStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'no_show'
  | 'completed'

export type PaymentStatus = 'free' | 'pending' | 'paid' | 'refunded'

export type CancelledBy = 'guest' | 'host' | 'system'

export interface Appointment {
  id: string
  booking_id: string
  scheduled_at: string
  duration_minutes: number
  guest_name: string
  guest_email: string
  guest_phone: string | null
  notes: string | null
  custom_fields: Record<string, unknown>
  status: AppointmentStatus
  payment_status: PaymentStatus
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  hold_expires_at: string | null
  cancel_token: string
  cancelled_at: string | null
  cancelled_by: CancelledBy | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentInput {
  booking_id: string
  scheduled_at: string
  duration_minutes: number
  guest_name: string
  guest_email: string
  guest_phone?: string | null
  notes?: string | null
  status: AppointmentStatus
  payment_status: PaymentStatus
  hold_expires_at?: string | null
  custom_fields?: Record<string, unknown>
}

export interface AvailableSlot {
  slot_start: string
  slot_end: string
}

export interface AppointmentListFilters {
  bookingId?: string
  from?: string
  to?: string
  statuses?: AppointmentStatus[]
}
