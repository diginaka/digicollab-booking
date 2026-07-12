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

// SEC-5b: 公開ゲスト導線は SECURITY DEFINER RPC 経由（anon 直テーブルアクセスは撤去済み）。
// RPC は cancel_token 完全一致のみ作用し、旧 USING=true の列挙・任意キャンセルの穴を封殺する。
export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc('create_appointment', {
      p_booking_id: input.booking_id,
      p_scheduled_at: input.scheduled_at,
      p_duration_minutes: input.duration_minutes,
      p_guest_name: input.guest_name,
      p_guest_email: input.guest_email,
      p_guest_phone: input.guest_phone ?? null,
      p_notes: input.notes ?? null,
      p_status: input.status,
      p_payment_status: input.payment_status,
      p_hold_expires_at: input.hold_expires_at ?? null,
      p_custom_fields: input.custom_fields ?? {},
    })
    .single()
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
    .rpc('get_appointment_by_cancel_token', { p_cancel_token: token })
    .maybeSingle()
  if (error) throw new AppointmentRepositoryError('予約情報の取得に失敗しました', error)
  return (data as Appointment) ?? null
}

export async function cancelByGuest(token: string, reason?: string): Promise<void> {
  // RPC は更新した予約行を返す。トークン不一致 or 既にキャンセル済みなら NULL。
  const { data, error } = await supabase.rpc('cancel_appointment_by_cancel_token', {
    p_cancel_token: token,
    p_reason: reason ?? null,
  })
  if (error) throw new AppointmentRepositoryError('キャンセルに失敗しました', error)
  if (!data) {
    throw new AppointmentRepositoryError(
      'この予約はキャンセルできませんでした（既にキャンセル済み、または URL が無効です）。',
    )
  }
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
