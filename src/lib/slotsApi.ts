import { supabase } from './supabase'
import type { AvailableSlot } from '@/types/appointment'

export async function getAvailableSlots(
  bookingId: string,
  fromDate: Date,
  toDate: Date,
): Promise<AvailableSlot[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_booking_id: bookingId,
    p_from_date: formatIsoDate(fromDate),
    p_to_date: formatIsoDate(toDate),
  })
  if (error) throw new Error(`空き枠の取得に失敗しました: ${error.message}`)
  return (data ?? []) as AvailableSlot[]
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
