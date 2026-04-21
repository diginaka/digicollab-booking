import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Appointment } from '@/types/appointment'
import type { Booking } from '@/types/booking'

interface Props {
  appointments: Appointment[]
  bookings: Booking[]
}

export function CsvExportButton({ appointments, bookings }: Props) {
  const handleExport = () => {
    if (appointments.length === 0) return
    const bookingMap = new Map(bookings.map((b) => [b.id, b]))
    const header = [
      '日時(JST)',
      '予約商品',
      '所要時間(分)',
      'ゲスト名',
      'Email',
      '電話',
      '状態',
      '決済',
      '相談内容',
      '作成日時',
    ]
    const rows = appointments.map((a) => {
      const b = bookingMap.get(a.booking_id)
      const jst = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo',
      }).format(new Date(a.scheduled_at))
      return [
        jst,
        b?.title ?? '',
        String(a.duration_minutes),
        a.guest_name,
        a.guest_email,
        a.guest_phone ?? '',
        a.status,
        a.payment_status,
        (a.notes ?? '').replace(/\n/g, ' '),
        a.created_at,
      ]
    })
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const filename = `bookings_${new Date().toISOString().slice(0, 10)}.csv`
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={appointments.length === 0}>
      <Download className="mr-1 h-4 w-4" /> CSVエクスポート
    </Button>
  )
}
