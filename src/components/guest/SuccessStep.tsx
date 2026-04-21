import { CheckCircle2, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Booking } from '@/types/booking'
import type { Appointment } from '@/types/appointment'

interface Props {
  booking: Booking
  appointment: Appointment
}

export function SuccessStep({ booking, appointment }: Props) {
  const dateStr = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(appointment.scheduled_at))

  const bookUrl = import.meta.env.VITE_BOOK_URL || window.location.origin
  const cancelUrl = `${bookUrl}/cancel/${appointment.cancel_token}`

  const copyCancelUrl = async () => {
    await navigator.clipboard.writeText(cancelUrl)
    toast.success('キャンセル用URLをコピーしました')
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <CardTitle>予約を受け付けました</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              確認メールを <strong>{appointment.guest_email}</strong> にお送りしました
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="rounded-md bg-slate-50 p-4">
          <div className="mb-2 text-xs text-slate-500">予約内容</div>
          <div className="mb-1 font-semibold">{booking.title}</div>
          <div className="text-slate-700">{dateStr}</div>
        </div>

        {booking.meeting_type === 'online' && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <div className="mb-1 font-semibold">オンライン開催について</div>
            <p>{booking.meeting_location_note ?? 'Zoom URL は予約当日までにメールでお送りします。'}</p>
          </div>
        )}

        <div className="rounded-md border p-4">
          <div className="mb-2 text-sm font-semibold">ご予約のキャンセルについて</div>
          <p className="mb-3 text-slate-600">
            下記URLからいつでもキャンセルできます。確認メールにも同じリンクが記載されています。
          </p>
          <div className="flex items-center gap-2 rounded-md bg-slate-50 p-2 text-xs">
            <code className="flex-1 truncate text-slate-700">{cancelUrl}</code>
            <Button type="button" variant="ghost" size="sm" onClick={copyCancelUrl}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <a href={cancelUrl} target="_blank" rel="noreferrer" className="inline-flex">
              <Button type="button" variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500">当日お会いできることを楽しみにしております。</p>
      </CardContent>
    </Card>
  )
}
