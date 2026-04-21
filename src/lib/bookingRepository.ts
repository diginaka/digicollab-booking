import { supabase } from './supabase'
import type { Booking, BookingInput } from '@/types/booking'

export class BookingRepositoryError extends Error {
  readonly cause?: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'BookingRepositoryError'
    this.cause = cause
  }
}

const TABLE = 'fb_bookings'

export async function listMyBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new BookingRepositoryError('予約商品の取得に失敗しました', error)
  return (data ?? []) as Booking[]
}

export async function getBooking(id: string): Promise<Booking | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
  if (error) throw new BookingRepositoryError('予約商品の取得に失敗しました', error)
  return (data as Booking) ?? null
}

export async function getBookingBySlug(
  subdomain: string,
  bookingSlug: string,
): Promise<Booking | null> {
  const { data, error } = await supabase.rpc('get_booking_public_by_slug', {
    p_subdomain: subdomain,
    p_booking_slug: bookingSlug,
  })
  if (error) {
    const fallback = await supabase
      .from(TABLE)
      .select('*')
      .eq('booking_slug', bookingSlug)
      .eq('is_active', true)
      .maybeSingle()
    if (fallback.error) throw new BookingRepositoryError('予約商品の取得に失敗しました', fallback.error)
    return (fallback.data as Booking) ?? null
  }
  return (data as Booking) ?? null
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new BookingRepositoryError('認証が必要です')
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, user_id: userData.user.id })
    .select('*')
    .single()
  if (error) throw new BookingRepositoryError('予約商品の作成に失敗しました', error)
  return data as Booking
}

export async function updateBooking(
  id: string,
  input: Partial<BookingInput>,
): Promise<Booking> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new BookingRepositoryError('予約商品の更新に失敗しました', error)
  return data as Booking
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw new BookingRepositoryError('予約商品の削除に失敗しました', error)
}

export async function checkSlugAvailable(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let q = supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('booking_slug', slug)
  if (excludeId) q = q.neq('id', excludeId)
  const { count, error } = await q
  if (error) throw new BookingRepositoryError('スラッグの確認に失敗しました', error)
  return (count ?? 0) === 0
}

export async function toggleActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ is_active: isActive }).eq('id', id)
  if (error) throw new BookingRepositoryError('公開状態の更新に失敗しました', error)
}
