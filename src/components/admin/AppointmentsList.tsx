import { useMemo } from 'react'
import { Eye, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { Appointment, AppointmentStatus } from '@/types/appointment'
import type { Booking } from '@/types/booking'
import { formatYen } from '@/lib/utils'

interface Props {
  appointments: Appointment[]
  bookings: Booking[]
  onSelect: (a: Appointment) => void
  onCancel: (a: Appointment) => void
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending_payment: '決済待ち',
  confirmed: '確定',
  cancelled: 'キャンセル',
  no_show: '無断欠席',
  completed: '完了',
}

const STATUS_VARIANT: Record<AppointmentStatus, BadgeProps['variant']> = {
  pending_payment: 'warning',
  confirmed: 'success',
  cancelled: 'muted',
  no_show: 'destructive',
  completed: 'secondary',
}

export function AppointmentsList({ appointments, bookings, onSelect, onCancel }: Props) {
  const bookingMap = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings])
  if (appointments.length === 0) {
    return <div className="rounded-md border bg-white p-8 text-center text-sm text-slate-500">該当する予約がありません</div>
  }
  return (
    <div className="overflow-x-auto rounded-md border bg-white">
      <table className="min-w-full divide-y">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <Th>日時</Th>
            <Th>ゲスト</Th>
            <Th>予約商品</Th>
            <Th>状態</Th>
            <Th>決済</Th>
            <Th align="right">アクション</Th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {appointments.map((a) => {
            const b = bookingMap.get(a.booking_id)
            const dateStr = new Intl.DateTimeFormat('ja-JP', {
              month: 'short',
              day: 'numeric',
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Tokyo',
            }).format(new Date(a.scheduled_at))
            return (
              <tr key={a.id} className="text-sm">
                <Td>{dateStr}</Td>
                <Td>
                  <div className="font-medium text-slate-900">{a.guest_name}</div>
                  <div className="text-xs text-slate-500">{a.guest_email}</div>
                </Td>
                <Td>
                  <div className="text-slate-900">{b?.title ?? '-'}</div>
                  <div className="text-xs text-slate-500">{a.duration_minutes}分</div>
                </Td>
                <Td>
                  <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </Td>
                <Td>
                  <div className="text-xs text-slate-600">
                    {a.payment_status === 'free' ? '無料' : a.payment_status === 'paid' ? '決済済' : a.payment_status === 'pending' ? '未決済' : a.payment_status}
                  </div>
                  <div className="text-xs text-slate-500">{b ? formatYen(b.price) : ''}</div>
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onSelect(a)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {a.status !== 'cancelled' && (
                      <Button variant="ghost" size="sm" onClick={() => onCancel(a)}>
                        <XCircle className="h-4 w-4 text-rose-500" />
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={`px-4 py-3 text-${align ?? 'left'} font-medium`}>{children}</th>
}
function Td({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <td className={`px-4 py-3 text-${align ?? 'left'}`}>{children}</td>
}
