import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SchedulePatternEditor } from './SchedulePatternEditor'
import { checkSlugAvailable } from '@/lib/bookingRepository'
import { randomSlug, slugify } from '@/lib/slugUtils'
import type { Booking, BookingInput, MeetingType } from '@/types/booking'

interface Props {
  initial: BookingInput
  existingId?: string
  submitting: boolean
  error: string | null
  onCancel: () => void
  onSubmit: (values: BookingInput) => void
  saved?: Booking | null
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

export function BookingForm({ initial, existingId, submitting, error, onCancel, onSubmit }: Props) {
  const [values, setValues] = useState<BookingInput>(initial)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const update = <K extends keyof BookingInput>(k: K, v: BookingInput[K]) => setValues((p) => ({ ...p, [k]: v }))

  const autofillSlug = () => {
    const base = values.title.trim() ? slugify(values.title) : randomSlug()
    update('booking_slug', base || randomSlug())
  }

  const verifySlug = async () => {
    if (!values.booking_slug) return
    setCheckingSlug(true)
    try {
      const ok = await checkSlugAvailable(values.booking_slug, existingId)
      setSlugError(ok ? null : 'このスラッグは既に使用されています')
    } catch (e) {
      setSlugError(e instanceof Error ? e.message : 'スラッグ確認に失敗しました')
    } finally {
      setCheckingSlug(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-lg border bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">予約タイトル *</Label>
            <Input
              id="title"
              value={values.title}
              maxLength={50}
              onChange={(e) => update('title', e.target.value)}
              placeholder="60分個別戦略コンサル"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL スラッグ *</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={values.booking_slug}
                onChange={(e) => update('booking_slug', e.target.value.toLowerCase())}
                onBlur={verifySlug}
                placeholder="consult-60min"
                required
              />
              <Button type="button" variant="outline" onClick={autofillSlug}>自動</Button>
            </div>
            {checkingSlug && <p className="text-xs text-slate-500">確認中…</p>}
            {slugError && <p className="text-sm text-rose-600">{slugError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">所要時間 *</Label>
            <Select
              value={String(values.duration_minutes)}
              onValueChange={(v) => update('duration_minutes', Number(v))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}分</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>開催形態</Label>
          <RadioGroup
            value={values.meeting_type}
            onValueChange={(v) => update('meeting_type', v as MeetingType)}
            className="flex gap-6"
          >
            {[
              { v: 'online', label: 'オンライン' },
              { v: 'in_person', label: '対面' },
              { v: 'phone', label: 'お電話' },
            ].map((o) => (
              <label key={o.v} className="flex cursor-pointer items-center gap-2">
                <RadioGroupItem value={o.v} id={`mt-${o.v}`} />
                <span>{o.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loc">開催場所の案内</Label>
          <Textarea
            id="loc"
            value={values.meeting_location_note ?? ''}
            onChange={(e) => update('meeting_location_note', e.target.value)}
            placeholder="Zoom URL は予約確定後にメールでお送りします"
            rows={2}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">価格（円, 0=無料）</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={values.price}
              onChange={(e) => update('price', Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-end gap-3 pb-2">
            <Switch
              checked={values.is_active}
              onCheckedChange={(v) => update('is_active', Boolean(v))}
            />
            <span className="text-sm text-slate-700">公開中（予約受付ON）</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">説明</Label>
          <Textarea
            id="desc"
            value={values.description ?? ''}
            maxLength={500}
            onChange={(e) => update('description', e.target.value)}
            placeholder="予約内容の説明（500文字まで）"
            rows={4}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border bg-white p-5">
        <h3 className="text-base font-semibold">受付パターン</h3>
        <SchedulePatternEditor
          value={values.schedule_pattern}
          onChange={(p) => update('schedule_pattern', p)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="バッファ（分）" value={values.buffer_minutes} onChange={(n) => update('buffer_minutes', n)} min={0} />
          <NumberField label="最小リード（時間）" value={values.min_lead_hours} onChange={(n) => update('min_lead_hours', n)} min={0} />
          <NumberField label="最大先行（日）" value={values.max_advance_days} onChange={(n) => update('max_advance_days', n)} min={1} />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border bg-white p-5">
        <h3 className="text-base font-semibold">ホスト情報</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hn">ホスト名</Label>
            <Input id="hn" value={values.host_name ?? ''} onChange={(e) => update('host_name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="he">ホストメール</Label>
            <Input id="he" type="email" value={values.host_email ?? ''} onChange={(e) => update('host_email', e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tz">タイムゾーン</Label>
          <Select value={values.timezone} onValueChange={(v) => update('timezone', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>キャンセル</Button>
        <Button type="submit" size="lg" disabled={submitting || !!slugError}>
          {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          保存
        </Button>
      </div>
    </form>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  )
}
