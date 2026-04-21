import { supabase } from './supabase'
import type {
  Appointment,
  AppointmentInput,
  AppointmentListFilters,
} from '@/types/appointment'

export class AppointmentRepositoryError extends Error {
  readonly cause?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'AppointmentRepositoryError'
    this.cause = cause
  }
}

const TABLE = 'fb_booking_appointments'

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const { data, error } = await supabase.from(TABLE).insert(input).select('*').single()
  if (error) {
    if (error.code === '23505') {
      throw new AppointmentRepositoryError(
        'この時間帯は直前に別の方が予約されました。別の時間を選択してください。',
        error,
      )
    }
    throw new AppointmentRepositoryError('予約の作成に失敗しました', error)
  }
  return data as Appointment
}

export async function getByCancelToken(token: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('cancel_token', token)
    .maybeSingle()
  if (error) throw new AppointmentRepositoryError('予約情報の取得に失敗しました', error)
  return (data as Appointment) ?? null
}

export async function cancelByGuest(token: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'guest',
      cancellation_reason: reason ?? null,
    })
    .eq('cancel_token', token)
  if (error) throw new AppointmentRepositoryError('キャンセルに失敗しました', error)
}

export async function listAppointments(
  filters: AppointmentListFilters = {},
): Promise<Appointment[]> {
  let q = supabase.from(TABLE).select('*').order('scheduled_at', { ascending: true })
  if (filters.bookingId) q = q.eq('booking_id', filters.bookingId)
  if (filters.from) q = q.gte('scheduled_at', filters.from)
  if (filters.to) q = q.lte('scheduled_at', filters.to)
  if (filters.statuses?.length) q = q.in('status', filters.statuses)
  const { data, error } = await q
  if (error) throw new AppointmentRepositoryError('予約一覧の取得に失敗しました', error)
  return (data ?? []) as Appointment[]
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
  if (error) throw new AppointmentRepositoryError('予約の取得に失敗しました', error)
  return (data as Appointment) ?? null
}

export async function cancelByHost(id: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'host',
      cancellation_reason: reason ?? null,
    })
    .eq('id', id)
  if (error) throw new AppointmentRepositoryError('キャンセルに失敗しました', error)
}
