import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getBookingBySlug } from '@/lib/bookingRepository'
import { getAvailableSlots } from '@/lib/slotsApi'
import { createAppointment } from '@/lib/appointmentRepository'
import { buildCheckoutUrl, redirectToCheckout } from '@/lib/checkoutRedirect'
import { useBookingFlowStore } from '@/stores/bookingFlowStore'
import { DateGridPicker } from '@/components/guest/DateGridPicker'
import { TimeSlotPicker } from '@/components/guest/TimeSlotPicker'
import { GuestFormStep } from '@/components/guest/GuestFormStep'
import { ConfirmStep } from '@/components/guest/ConfirmStep'
import { BookingSummary } from '@/components/guest/BookingSummary'
import { SuccessStep } from '@/components/guest/SuccessStep'
import type { Appointment } from '@/types/appointment'
import type { Booking } from '@/types/booking'

export function BookingPage() {
  const { subdomain = '', booking_slug = '' } = useParams<{ subdomain: string; booking_slug: string }>()
  const flow = useBookingFlowStore()
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null)

  const bookingQ = useQuery({
    queryKey: ['booking', subdomain, booking_slug],
    queryFn: () => getBookingBySlug(subdomain, booking_slug),
    enabled: !!subdomain && !!booking_slug,
  })

  const booking = bookingQ.data

  const slotsQ = useQuery({
    queryKey: ['slots', booking?.id, monthCursor.toISOString()],
    queryFn: () => {
      if (!booking) return Promise.resolve([])
      const from = new Date(monthCursor)
      const to = new Date(monthCursor)
      to.setMonth(to.getMonth() + 1)
      to.setDate(0)
      return getAvailableSlots(booking.id, from, to)
    },
    enabled: !!booking,
  })

  useEffect(() => {
    flow.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id])

  if (bookingQ.isLoading) {
    return <CenteredSpinner label="予約情報を読み込み中..." />
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-white p-8 text-center">
        <h1 className="mb-2 text-lg font-semibold">予約ページが見つかりません</h1>
        <p className="text-sm text-slate-500">URL をご確認の上、再度アクセスしてください。</p>
      </div>
    )
  }

  const handleConfirm = async () => {
    if (!flow.selectedSlotStart) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const isPaid = booking.price > 0
      const holdExpiresAt = isPaid ? new Date(Date.now() + 15 * 60_000).toISOString() : null

      const appointment = await createAppointment({
        booking_id: booking.id,
        scheduled_at: flow.selectedSlotStart,
        duration_minutes: booking.duration_minutes,
        guest_name: flow.form.guest_name,
        guest_email: flow.form.guest_email,
        guest_phone: flow.form.guest_phone || null,
        notes: flow.form.notes || null,
        status: isPaid ? 'pending_payment' : 'confirmed',
        payment_status: isPaid ? 'pending' : 'free',
        hold_expires_at: holdExpiresAt,
      })

      if (isPaid) {
        const url = buildCheckoutUrl({ subdomain, booking, appointmentId: appointment.id })
        toast.success('決済画面に移動します…')
        redirectToCheckout(url)
        return
      }

      setCreatedAppointment(appointment)
      flow.setStep('done')
      toast.success('予約を受け付けました')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '予約の作成に失敗しました'
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <StepHeader booking={booking} step={flow.step} />
        {flow.step === 'date' && (
          <DateGridPicker
            availableSlots={slotsQ.data ?? []}
            selectedDate={flow.selectedDate}
            onSelectDate={(iso) => flow.setDate(iso)}
            onMonthChange={setMonthCursor}
            minLeadHours={booking.min_lead_hours}
            maxAdvanceDays={booking.max_advance_days}
          />
        )}
        {flow.step === 'time' && flow.selectedDate && (
          <TimeSlotPicker
            availableSlots={slotsQ.data ?? []}
            selectedDate={flow.selectedDate}
            selectedSlotStart={flow.selectedSlotStart}
            durationMinutes={booking.duration_minutes}
            onSelectSlot={(iso) => flow.setSlotStart(iso)}
            onBack={() => flow.setStep('date')}
          />
        )}
        {flow.step === 'form' && flow.selectedSlotStart && (
          <GuestFormStep
            initial={flow.form}
            onBack={() => flow.setStep('time')}
            onSubmit={(values) => {
              flow.setForm(values)
              flow.setStep('confirm')
            }}
          />
        )}
        {flow.step === 'confirm' && flow.selectedSlotStart && (
          <ConfirmStep
            booking={booking}
            slotStartIso={flow.selectedSlotStart}
            form={flow.form}
            submitting={submitting}
            error={submitError}
            onBack={() => flow.setStep('form')}
            onConfirm={handleConfirm}
          />
        )}
        {flow.step === 'done' && createdAppointment && (
          <SuccessStep booking={booking} appointment={createdAppointment} />
        )}
      </div>
      <div className="hidden md:block">
        <BookingSummary booking={booking} selectedSlotStart={flow.selectedSlotStart} />
      </div>
    </div>
  )
}

function CenteredSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">{label}</div>
  )
}

function StepHeader({
  booking,
  step,
}: {
  booking: Booking
  step: string
}) {
  const steps = [
    { key: 'date', label: '1. 日付' },
    { key: 'time', label: '2. 時間' },
    { key: 'form', label: '3. 情報入力' },
    { key: 'confirm', label: '4. 確認' },
  ]
  if (step === 'done') return null
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-1 text-xs text-slate-500">
        {booking.host_name ? `${booking.host_name}の予約ページ` : '予約'}
      </div>
      <h1 className="mb-3 text-xl font-semibold">{booking.title}</h1>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {steps.map((s, i) => (
          <span key={s.key} className="flex items-center gap-2">
            <span
              className={
                step === s.key
                  ? 'font-semibold text-primary'
                  : steps.findIndex((x) => x.key === step) > i
                    ? 'text-slate-700'
                    : 'text-slate-400'
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="text-slate-300">→</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
