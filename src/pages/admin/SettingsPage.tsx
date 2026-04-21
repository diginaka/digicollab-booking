import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export function SettingsPage() {
  const { session } = useAuth()
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">設定</h1>
        <p className="text-sm text-slate-500">アカウントと通知設定</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>アカウント</CardTitle>
          <CardDescription>デジコラボ統合アカウントでログイン中</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <div className="text-slate-500">Email</div>
            <div className="font-medium">{session?.user.email ?? '-'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ホストデフォルト</CardTitle>
          <CardDescription>各予約商品で個別上書き可能です</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">予約商品ごとにホスト名・ホストメールを設定してください。共通デフォルトの編集機能は今後追加予定です。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>外部連携（Coming Soon）</CardTitle>
          <CardDescription>Calendly / Cal.com / Google Calendar 同期は今後の更新で対応予定です</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Phase 4-D で検討中です。ご要望があれば運営までご連絡ください。</p>
        </CardContent>
      </Card>
    </div>
  )
}
