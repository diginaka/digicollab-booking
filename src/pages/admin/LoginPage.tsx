import { useEffect } from 'react'
import { redirectToHub } from '@/lib/ssoClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  useEffect(() => {
    const t = setTimeout(() => redirectToHub('login'), 600)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログインページに移動します</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          自動でデジコラボのログインページにリダイレクトします。移動しない場合は
          <button className="ml-1 text-primary underline" onClick={() => redirectToHub('login')}>こちらをクリック</button>
          してください。
        </CardContent>
      </Card>
    </div>
  )
}
