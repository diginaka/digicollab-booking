import { Calendar, Clock, User, Video } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDuration, formatYen } from '@/lib/utils'
import type { Booking } from '@/types/booking'

interface Props {
  booking: Booking
  selectedSlotStart: string | null
}

export function BookingSummary({ booking, selectedSlotStart }: Props) {
  const dateStr = selectedSlotStart
    ? new Intl.DateTimeFormat('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo',
      }).format(new Date(selectedSlotStart))
    : null

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant={booking.price > 0 ? 'default' : 'success'}>
            {booking.price > 0 ? formatYen(booking.price) : '無料'}
          </Badge>
          <Badge variant="muted">{formatDuration(booking.duration_minutes)}</Badge>
        </div>
        <CardTitle className="text-base leading-snug">{booking.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {booking.description && (
          <p className="whitespace-pre-wrap text-slate-600">{booking.description}</p>
        )}

        <div className="space-y-2 rounded-md bg-slate-50 p-3">
          {booking.host_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-slate-700">{booking.host_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-slate-700">{formatDuration(booking.duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-slate-500" />
            <span className="text-slate-700">
              {booking.meeting_type === 'online' ? 'オンライン (Zoom 等)' : booking.meeting_type === 'in_person' ? '対面' : 'お電話'}
            </span>
          </div>
          {dateStr && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">{dateStr}</span>
            </div>
          )}
        </div>

        {booking.meeting_location_note && (
          <p className="text-xs text-slate-500">{booking.meeting_location_note}</p>
        )}
      </CardContent>
    </Card>
  )
}
