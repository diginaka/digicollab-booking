import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration, formatYen } from '@/lib/utils'
import type { Booking } from '@/types/booking'
import type { GuestFormValues } from '@/stores/bookingFlowStore'

interface Props {
  booking: Booking
  slotStartIso: string
  form: GuestFormValues
  submitting: boolean
  error: string | null
  onBack: () => void
  onConfirm: () => void
}

export function ConfirmStep({
  booking,
  slotStartIso,
  form,
  submitting,
  error,
  onBack,
  onConfirm,
}: Props) {
  const formattedDate = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(slotStartIso))

  const isPaid = booking.price > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>予約内容の確認</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <SummaryRow label="予約内容" value={booking.title} />
        <SummaryRow label="日時" value={formattedDate} />
        <SummaryRow label="所要時間" value={formatDuration(booking.duration_minutes)} />
        <SummaryRow label="価格" value={formatYen(booking.price)} />
        <SummaryRow label="開催形態" value={meetingTypeLabel(booking.meeting_type)} />
        {booking.meeting_location_note && (
          <SummaryRow label="開催場所" value={booking.meeting_location_note} />
        )}
        <div className="my-2 border-t" />
        <SummaryRow label="お名前" value={form.guest_name} />
        <SummaryRow label="Email" value={form.guest_email} />
        {form.guest_phone && <SummaryRow label="電話" value={form.guest_phone} />}
        {form.notes && (
          <div>
            <div className="mb-1 text-slate-500">ご相談内容</div>
            <div className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-slate-800">{form.notes}</div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
            ← 内容を変更
          </Button>
          <Button type="button" size="lg" onClick={onConfirm} disabled={submitting}>
            {submitting ? '処理中…' : isPaid ? '決済画面へ進む' : '予約を確定する'}
          </Button>
        </div>

        {isPaid && (
          <p className="text-xs text-slate-500">
            ※ 次のページで決済を完了してください。決済が完了するまで仮押さえ状態で最大15分間保持されます。
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-slate-500">{label}</div>
      <div className="text-right font-medium text-slate-900">{value}</div>
    </div>
  )
}

function meetingTypeLabel(t: string): string {
  if (t === 'online') return 'オンライン'
  if (t === 'in_person') return '対面'
  if (t === 'phone') return 'お電話'
  return t
}
