export type MeetingType = 'online' | 'in_person' | 'phone'

export interface SchedulePattern {
  weekdays: number[]
  start_time: string
  end_time: string
  interval_minutes: number
}

export interface Booking {
  id: string
  user_id: string
  funnel_id: string | null
  booking_slug: string
  title: string
  description: string | null
  price: number
  duration_minutes: number
  is_active: boolean
  schedule_pattern: SchedulePattern
  buffer_minutes: number
  min_lead_hours: number
  max_advance_days: number
  meeting_type: MeetingType
  meeting_location_note: string | null
  host_name: string | null
  host_email: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface BookingInput {
  booking_slug: string
  title: string
  description?: string | null
  price: number
  duration_minutes: number
  is_active: boolean
  schedule_pattern: SchedulePattern
  buffer_minutes: number
  min_lead_hours: number
  max_advance_days: number
  meeting_type: MeetingType
  meeting_location_note?: string | null
  host_name?: string | null
  host_email?: string | null
  timezone: string
  funnel_id?: string | null
}

export const DEFAULT_SCHEDULE_PATTERN: SchedulePattern = {
  weekdays: [1, 2, 3, 4, 5],
  start_time: '10:00',
  end_time: '17:00',
  interval_minutes: 60,
}

export const DEFAULT_BOOKING_INPUT: BookingInput = {
  booking_slug: '',
  title: '',
  description: '',
  price: 0,
  duration_minutes: 30,
  is_active: true,
  schedule_pattern: DEFAULT_SCHEDULE_PATTERN,
  buffer_minutes: 15,
  min_lead_hours: 24,
  max_advance_days: 30,
  meeting_type: 'online',
  meeting_location_note: 'Zoom URL は予約確定後にメールでお送りします',
  host_name: '',
  host_email: '',
  timezone: 'Asia/Tokyo',
}
