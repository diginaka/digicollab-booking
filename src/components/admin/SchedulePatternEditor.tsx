import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SchedulePattern } from '@/types/booking'

interface Props {
  value: SchedulePattern
  onChange: (next: SchedulePattern) => void
}

const WEEKDAYS: { idx: number; label: string }[] = [
  { idx: 0, label: '日' },
  { idx: 1, label: '月' },
  { idx: 2, label: '火' },
  { idx: 3, label: '水' },
  { idx: 4, label: '木' },
  { idx: 5, label: '金' },
  { idx: 6, label: '土' },
]

const TIME_OPTIONS = (() => {
  const out: string[] = []
  for (let h = 7; h <= 22; h++) {
    for (const m of [0, 15, 30, 45]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
})()

const INTERVAL_OPTIONS = [30, 45, 60, 90, 120]

const PRESETS: { label: string; pattern: Partial<SchedulePattern> }[] = [
  { label: '平日10-17時 (毎時)', pattern: { weekdays: [1, 2, 3, 4, 5], start_time: '10:00', end_time: '17:00', interval_minutes: 60 } },
  { label: '平日午後のみ', pattern: { weekdays: [1, 2, 3, 4, 5], start_time: '13:00', end_time: '18:00', interval_minutes: 60 } },
  { label: '週末も受付', pattern: { weekdays: [0, 1, 2, 3, 4, 5, 6], start_time: '10:00', end_time: '19:00', interval_minutes: 60 } },
]

export function SchedulePatternEditor({ value, onChange }: Props) {
  const toggleWeekday = (w: number) => {
    const next = value.weekdays.includes(w)
      ? value.weekdays.filter((x) => x !== w)
      : [...value.weekdays, w].sort()
    onChange({ ...value, weekdays: next })
  }

  return (
    <div className="space-y-4 rounded-md border bg-slate-50 p-4">
      <div>
        <div className="mb-2 text-sm font-medium">曜日</div>
        <div className="flex gap-1">
          {WEEKDAYS.map((w) => {
            const active = value.weekdays.includes(w.idx)
            return (
              <button
                key={w.idx}
                type="button"
                onClick={() => toggleWeekday(w.idx)}
                className={cn(
                  'h-10 w-10 rounded-md border text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary',
                )}
              >
                {w.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">開始時刻</div>
          <Select value={value.start_time} onValueChange={(v) => onChange({ ...value, start_time: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-slate-500">終了時刻</div>
          <Select value={value.end_time} onValueChange={(v) => onChange({ ...value, end_time: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-slate-500">枠間隔</div>
          <Select
            value={String(value.interval_minutes)}
            onValueChange={(v) => onChange({ ...value, interval_minutes: Number(v) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INTERVAL_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}分</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">プリセット</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...value, ...p.pattern } as SchedulePattern)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
