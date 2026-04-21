import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppointmentsList } from '@/components/admin/AppointmentsList'
import { AppointmentsCalendar } from '@/components/admin/AppointmentsCalendar'
import { AppointmentDetailModal } from '@/components/admin/AppointmentDetailModal'
import { CsvExportButton } from '@/components/admin/CsvExportButton'
import { cancelByHost, listAppointments } from '@/lib/appointmentRepository'
import { listMyBookings } from '@/lib/bookingRepository'
import type { Appointment, AppointmentStatus } from '@/types/appointment'

const STATUS_OPTIONS: { v: AppointmentStatus | 'all'; label: string }[] = [
  { v: 'all', label: 'すべて' },
  { v: 'confirmed', label: '確定' },
  { v: 'pending_payment', label: '決済待ち' },
  { v: 'cancelled', label: 'キャンセル' },
  { v: 'completed', label: '完了' },
]

export function DashboardPage() {
  const qc = useQueryClient()
  const [bookingFilter, setBookingFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [selected, setSelected] = useState<Appointment | null>(null)

  const bookingsQ = useQuery({ queryKey: ['my-bookings'], queryFn: listMyBookings })

  const apptQ = useQuery({
    queryKey: ['appointments', bookingFilter, statusFilter],
    queryFn: () =>
      listAppointments({
        bookingId: bookingFilter === 'all' ? undefined : bookingFilter,
        statuses: statusFilter === 'all' ? undefined : [statusFilter],
      }),
  })

  const selectedBooking = useMemo(() => {
    if (!selected) return null
    return bookingsQ.data?.find((b) => b.id === selected.booking_id) ?? null
  }, [bookingsQ.data, selected])

  const handleCancel = async (a: Appointment) => {
    const reason = window.prompt('キャンセル理由を入力してください（任意）') ?? undefined
    if (reason === null) return
    try {
      await cancelByHost(a.id, reason)
      toast.success('キャンセルしました')
      setSelected(null)
      await qc.invalidateQueries({ queryKey: ['appointments'] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'キャンセルに失敗しました')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">予約一覧</h1>
          <p className="text-sm text-slate-500">入ってきた予約をリストとカレンダーで確認できます</p>
        </div>
        <Button asChild>
          <Link to="/admin/bookings/new">
            <Plus className="mr-1 h-4 w-4" /> 予約商品を作成
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-md border bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[200px]">
            <div className="mb-1 text-xs text-slate-500">予約商品</div>
            <Select value={bookingFilter} onValueChange={setBookingFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {bookingsQ.data?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <div className="mb-1 text-xs text-slate-500">状態</div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AppointmentStatus | 'all')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CsvExportButton appointments={apptQ.data ?? []} bookings={bookingsQ.data ?? []} />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">リスト表示</TabsTrigger>
          <TabsTrigger value="calendar">カレンダー表示</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          {apptQ.isLoading ? (
            <div className="text-sm text-slate-500">読み込み中…</div>
          ) : (
            <AppointmentsList
              appointments={apptQ.data ?? []}
              bookings={bookingsQ.data ?? []}
              onSelect={setSelected}
              onCancel={handleCancel}
            />
          )}
        </TabsContent>
        <TabsContent value="calendar">
          {apptQ.isLoading ? (
            <div className="text-sm text-slate-500">読み込み中…</div>
          ) : (
            <AppointmentsCalendar
              appointments={apptQ.data ?? []}
              bookings={bookingsQ.data ?? []}
              onSelect={setSelected}
            />
          )}
        </TabsContent>
      </Tabs>

      <AppointmentDetailModal
        appointment={selected}
        booking={selectedBooking}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onCancel={handleCancel}
      />
    </div>
  )
}
