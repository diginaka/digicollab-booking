import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cancelByGuest, getByCancelToken } from '@/lib/appointmentRepository'
import { getBooking } from '@/lib/bookingRepository'

export function CancelPage() {
  const { cancel_token = '' } = useParams<{ cancel_token: string }>()
  const qc = useQueryClient()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  const apptQ = useQuery({
    queryKey: ['cancel-appt', cancel_token],
    queryFn: () => getByCancelToken(cancel_token),
    enabled: !!cancel_token,
  })

  const bookingQ = useQuery({
    queryKey: ['cancel-booking', apptQ.data?.booking_id],
    queryFn: () => (apptQ.data ? getBooking(apptQ.data.booking_id) : Promise.resolve(null)),
    enabled: !!apptQ.data?.booking_id,
  })

  if (apptQ.isLoading) return <Info label="読み込み中…" />
  if (!apptQ.data) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <XCircle className="h-7 w-7 text-rose-600" />
          </div>
          <CardTitle>予約が見つかりません</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          URL が正しくないか、既に削除された可能性があります。メール内のリンクを再度ご確認ください。
        </CardContent>
      </Card>
    )
  }

  const appt = apptQ.data
  const booking = bookingQ.data

  if (appt.status === 'cancelled' || cancelled) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <CardTitle>キャンセル済みです</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>このご予約はキャンセルされています。</p>
          {booking && <p>予約内容: {booking.title}</p>}
        </CardContent>
      </Card>
    )
  }

  const handleCancel = async () => {
    if (!window.confirm('本当にキャンセルしますか?')) return
    setSubmitting(true)
    try {
      await cancelByGuest(cancel_token, reason || undefined)
      await qc.invalidateQueries({ queryKey: ['cancel-appt'] })
      setCancelled(true)
      toast.success('キャンセルが完了しました')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'キャンセルに失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const dateStr = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(appt.scheduled_at))

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>ご予約のキャンセル</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="rounded-md bg-slate-50 p-4">
          {booking && <div className="mb-1 font-semibold">{booking.title}</div>}
          <div className="text-slate-700">{dateStr}</div>
          <div className="mt-2 text-xs text-slate-500">
            お名前: {appt.guest_name} / Email: {appt.guest_email}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">キャンセル理由（任意）</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ご都合が悪くなった、日程を変更したい等"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end">
          <Button variant="destructive" size="lg" onClick={handleCancel} disabled={submitting}>
            {submitting ? '処理中…' : 'キャンセルを確定する'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Info({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">{label}</div>
  )
}
