import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatYen } from '@/lib/utils'
import type { Appointment } from '@/types/appointment'
import type { Booking } from '@/types/booking'

interface Props {
  appointment: Appointment | null
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: (a: Appointment) => void
}

export function AppointmentDetailModal({ appointment, booking, open, onOpenChange, onCancel }: Props) {
  if (!appointment) return null
  const dateStr = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(appointment.scheduled_at))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>予約詳細</DialogTitle>
          <DialogDescription>{booking?.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <Row k="日時" v={dateStr} />
          <Row k="所要時間" v={`${appointment.duration_minutes}分`} />
          <Row k="状態" v={<Badge>{appointment.status}</Badge>} />
          <Row k="決済" v={appointment.payment_status} />
          {booking && <Row k="価格" v={formatYen(booking.price)} />}

          <div className="border-t pt-3">
            <Row k="お名前" v={appointment.guest_name} />
            <Row k="Email" v={<a className="text-primary underline" href={`mailto:${appointment.guest_email}`}>{appointment.guest_email}</a>} />
            {appointment.guest_phone && <Row k="電話" v={appointment.guest_phone} />}
          </div>

          {appointment.notes && (
            <div>
              <div className="mb-1 text-slate-500">ご相談内容</div>
              <div className="whitespace-pre-wrap rounded-md bg-slate-50 p-3">{appointment.notes}</div>
            </div>
          )}

          {appointment.cancellation_reason && (
            <div>
              <div className="mb-1 text-slate-500">キャンセル理由</div>
              <div className="whitespace-pre-wrap rounded-md bg-rose-50 p-3 text-rose-800">{appointment.cancellation_reason}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>閉じる</Button>
          {appointment.status !== 'cancelled' && (
            <Button variant="destructive" onClick={() => onCancel(appointment)}>キャンセルする</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-slate-500">{k}</div>
      <div className="text-right font-medium text-slate-900">{v}</div>
    </div>
  )
}
