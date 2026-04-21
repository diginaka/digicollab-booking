import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AvailableSlot } from '@/types/appointment'

interface Props {
  availableSlots: AvailableSlot[]
  selectedDate: string | null
  onSelectDate: (isoDate: string) => void
  onMonthChange: (monthStart: Date) => void
  minLeadHours: number
  maxAdvanceDays: number
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export function DateGridPicker({
  availableSlots,
  selectedDate,
  onSelectDate,
  onMonthChange,
  minLeadHours,
  maxAdvanceDays,
}: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const availableDateSet = useMemo(() => {
    const set = new Set<string>()
    for (const slot of availableSlots) {
      set.add(slot.slot_start.slice(0, 10))
    }
    return set
  }, [availableSlots])

  const now = new Date()
  const earliestBooking = new Date(now.getTime() + minLeadHours * 3600_000)
  const latestBooking = new Date(now.getTime() + maxAdvanceDays * 86400_000)

  const days = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startOffset = firstDayOfMonth.getDay()
    const totalCells = Math.ceil((startOffset + lastDayOfMonth.getDate()) / 7) * 7
    const cells: { date: Date; inMonth: boolean }[] = []
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(year, month, i - startOffset + 1)
      cells.push({ date: d, inMonth: d.getMonth() === month })
    }
    return cells
  }, [cursor])

  const moveMonth = (delta: number) => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + delta)
    setCursor(d)
    onMonthChange(d)
  }

  const toIsoDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => moveMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
          前月
        </Button>
        <div className="text-base font-semibold">
          {cursor.getFullYear()}年 {cursor.getMonth() + 1}月
        </div>
        <Button variant="ghost" size="sm" onClick={() => moveMonth(1)}>
          次月
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs text-slate-500">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={cn('py-1 font-medium', i === 0 && 'text-rose-500', i === 6 && 'text-sky-500')}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, inMonth }, idx) => {
          const iso = toIsoDate(date)
          const hasSlots = availableDateSet.has(iso)
          const tooEarly = date < earliestBooking && !sameDate(date, earliestBooking)
          const tooLate = date > latestBooking
          const disabled = !inMonth || !hasSlots || tooEarly || tooLate
          const isSelected = selectedDate === iso
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelectDate(iso)}
              className={cn(
                'relative aspect-square rounded-md border text-sm transition-colors',
                'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-slate-50 disabled:text-slate-300',
                !disabled && 'border-slate-200 bg-white hover:border-primary hover:bg-primary/5',
                isSelected && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
                !inMonth && 'opacity-40',
              )}
            >
              <div>{date.getDate()}</div>
              {hasSlots && !disabled && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-500" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          空きあり
        </span>
        <span>最短予約: {minLeadHours}時間後から</span>
      </div>
    </div>
  )
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
