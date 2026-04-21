import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { GuestFormValues } from '@/stores/bookingFlowStore'

interface Props {
  initial: GuestFormValues
  onBack: () => void
  onSubmit: (values: GuestFormValues) => void
}

export function GuestFormStep({ initial, onBack, onSubmit }: Props) {
  const [values, setValues] = useState<GuestFormValues>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof GuestFormValues, string>>>({})

  const update = <K extends keyof GuestFormValues>(key: K, v: GuestFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!values.guest_name.trim()) next.guest_name = 'お名前を入力してください'
    if (!values.guest_email.trim()) next.guest_email = 'メールアドレスを入力してください'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.guest_email))
      next.guest_email = 'メールアドレスの形式が正しくありません'
    if (!values.agreed) next.agreed = '利用規約への同意が必要です'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-white p-5">
      <div>
        <h2 className="mb-1 text-lg font-semibold">お客様情報</h2>
        <p className="text-sm text-slate-500">予約完了後、ご入力のメールアドレスに確認をお送りします。</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest_name">
          お名前 <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="guest_name"
          value={values.guest_name}
          onChange={(e) => update('guest_name', e.target.value)}
          placeholder="山田 太郎"
          autoComplete="name"
        />
        {errors.guest_name && <p className="text-sm text-rose-600">{errors.guest_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest_email">
          メールアドレス <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="guest_email"
          type="email"
          value={values.guest_email}
          onChange={(e) => update('guest_email', e.target.value)}
          placeholder="example@email.com"
          autoComplete="email"
        />
        {errors.guest_email && <p className="text-sm text-rose-600">{errors.guest_email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest_phone">電話番号（任意）</Label>
        <Input
          id="guest_phone"
          type="tel"
          value={values.guest_phone}
          onChange={(e) => update('guest_phone', e.target.value)}
          placeholder="090-1234-5678"
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">ご相談内容・ご質問（任意）</Label>
        <Textarea
          id="notes"
          value={values.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="事前に共有したい背景や聞きたいこと"
          rows={4}
        />
      </div>

      <div>
        <Checkbox
          checked={values.agreed}
          onChange={(e) => update('agreed', e.target.checked)}
          label={
            <>
              <a href="https://digicollabo.com/terms" target="_blank" className="text-primary underline" rel="noreferrer">利用規約</a>
              と
              <a href="https://digicollabo.com/privacy" target="_blank" className="text-primary underline" rel="noreferrer">プライバシーポリシー</a>
              に同意します
            </>
          }
        />
        {errors.agreed && <p className="mt-1 text-sm text-rose-600">{errors.agreed}</p>}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          ← 戻る
        </Button>
        <Button type="submit" size="lg">
          確認画面へ進む →
        </Button>
      </div>
    </form>
  )
}
