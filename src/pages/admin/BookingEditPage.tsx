import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingForm } from '@/components/admin/BookingForm'
import {
  createBooking,
  getBooking,
  updateBooking,
} from '@/lib/bookingRepository'
import { DEFAULT_BOOKING_INPUT, type BookingInput } from '@/types/booking'

export function BookingEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initial, setInitial] = useState<BookingInput>(DEFAULT_BOOKING_INPUT)

  const bookingQ = useQuery({
    queryKey: ['booking-edit', id],
    queryFn: () => (isNew ? Promise.resolve(null) : getBooking(id!)),
    enabled: !isNew,
  })

  useEffect(() => {
    if (bookingQ.data) {
      const b = bookingQ.data
      setInitial({
        booking_slug: b.booking_slug,
        title: b.title,
        description: b.description,
        price: b.price,
        duration_minutes: b.duration_minutes,
        is_active: b.is_active,
        schedule_pattern: b.schedule_pattern,
        buffer_minutes: b.buffer_minutes,
        min_lead_hours: b.min_lead_hours,
        max_advance_days: b.max_advance_days,
        meeting_type: b.meeting_type,
        meeting_location_note: b.meeting_location_note,
        host_name: b.host_name,
        host_email: b.host_email,
        timezone: b.timezone,
        funnel_id: b.funnel_id,
      })
    }
  }, [bookingQ.data])

  const handleSubmit = async (values: BookingInput) => {
    setSubmitting(true)
    setError(null)
    try {
      if (isNew) {
        const created = await createBooking(values)
        toast.success('予約商品を作成しました')
        navigate(`/admin/bookings/${created.id}`, { replace: true })
      } else {
        await updateBooking(id!, values)
        toast.success('変更を保存しました')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存に失敗しました'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/bookings')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> 一覧へ戻る
        </Button>
      </div>
      <h1 className="text-2xl font-semibold">{isNew ? '新しい予約商品' : initial.title || '予約商品の編集'}</h1>
      {bookingQ.isLoading ? (
        <div className="text-sm text-slate-500">読み込み中…</div>
      ) : (
        <BookingForm
          initial={initial}
          existingId={isNew ? undefined : id}
          submitting={submitting}
          error={error}
          onCancel={() => navigate('/admin/bookings')}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
