import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AvailableSlot } from '@/types/appointment'

interface Props {
  availableSlots: AvailableSlot[]
  selectedDate: string
  selectedSlotStart: string | null
  durationMinutes: number
  onSelectSlot: (slotStartIso: string) => void
  onBack: () => void
}

export function TimeSlotPicker({
  availableSlots,
  selectedDate,
  selectedSlotStart,
  durationMinutes,
  onSelectSlot,
  onBack,
}: Props) {
  const slotsOfDay = useMemo(
    () => availableSlots.filter((s) => s.slot_start.slice(0, 10) === selectedDate),
    [availableSlots, selectedDate],
  )

  const readableDate = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00')
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(d)
  }, [selectedDate])

  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← 日付を変更
        </Button>
        <div className="text-sm font-medium text-slate-700">{readableDate}</div>
      </div>

      {slotsOfDay.length === 0 ? (
        <div className="rounded-md bg-slate-50 p-6 text-center text-sm text-slate-500">
          この日は空き枠がありません。別の日を選択してください。
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slotsOfDay.map((slot) => {
            const isSelected = slot.slot_start === selectedSlotStart
            const startLabel = formatTime(slot.slot_start)
            const endLabel = formatTimeEnd(slot.slot_start, durationMinutes)
            return (
              <button
                key={slot.slot_start}
                type="button"
                onClick={() => onSelectSlot(slot.slot_start)}
                className={cn(
                  'flex h-12 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:bg-primary/5',
                )}
              >
                <Clock className="h-3.5 w-3.5 opacity-70" />
                {startLabel} - {endLabel}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatTimeEnd(startIso: string, durationMinutes: number): string {
  const d = new Date(new Date(startIso).getTime() + durationMinutes * 60_000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
