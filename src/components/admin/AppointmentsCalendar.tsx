import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types/appointment'
import type { Booking } from '@/types/booking'

interface Props {
  appointments: Appointment[]
  bookings: Booking[]
  onSelect: (a: Appointment) => void
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export function AppointmentsCalendar({ appointments, bookings, onSelect }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const bookingMap = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings])

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startOffset = firstDayOfMonth.getDay()
    const totalCells = Math.ceil((startOffset + lastDayOfMonth.getDate()) / 7) * 7
    const out: { date: Date; inMonth: boolean; appts: Appointment[] }[] = []
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(year, month, i - startOffset + 1)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const appts = appointments.filter((a) => a.scheduled_at.slice(0, 10) === iso)
      out.push({ date: d, inMonth: d.getMonth() === month, appts })
    }
    return out
  }, [cursor, appointments])

  const moveMonth = (delta: number) => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + delta)
    setCursor(d)
  }

  return (
    <div className="overflow-hidden rounded-md border bg-white">
      <div className="flex items-center justify-between border-b p-3">
        <Button variant="ghost" size="sm" onClick={() => moveMonth(-1)}>
          <ChevronLeft className="h-4 w-4" /> 前月
        </Button>
        <div className="font-semibold">
          {cursor.getFullYear()}年 {cursor.getMonth() + 1}月
        </div>
        <Button variant="ghost" size="sm" onClick={() => moveMonth(1)}>
          次月 <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs text-slate-500">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={cn('py-2 font-medium', i === 0 && 'text-rose-500', i === 6 && 'text-sky-500')}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((c, idx) => (
          <div
            key={idx}
            className={cn(
              'min-h-[110px] border-b border-r p-2 text-xs',
              !c.inMonth && 'bg-slate-50 text-slate-300',
              (idx + 1) % 7 === 0 && 'border-r-0',
            )}
          >
            <div className={cn('mb-1 font-medium', !c.inMonth && 'opacity-50')}>{c.date.getDate()}</div>
            <div className="space-y-1">
              {c.appts.slice(0, 3).map((a) => {
                const bk = bookingMap.get(a.booking_id)
                const time = new Date(a.scheduled_at)
                const hh = String(time.getHours()).padStart(2, '0')
                const mm = String(time.getMinutes()).padStart(2, '0')
                const color =
                  a.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : a.status === 'pending_payment'
                      ? 'bg-amber-100 text-amber-800'
                      : a.status === 'cancelled'
                        ? 'bg-slate-100 text-slate-500 line-through'
                        : 'bg-slate-100 text-slate-700'
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className={cn('w-full truncate rounded px-1 py-0.5 text-left', color)}
                  >
                    <span className="font-semibold">{hh}:{mm}</span> {bk?.title ?? a.guest_name}
                  </button>
                )
              })}
              {c.appts.length > 3 && (
                <div className="pl-1 text-[10px] text-slate-500">+ {c.appts.length - 3} 件</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
