import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, LayoutDashboard, LogOut, Package, Settings2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { consumeSsoTokensFromUrl, redirectToHub, signOut } from '@/lib/ssoClient'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/admin/bookings', label: '予約商品', icon: Package },
  { to: '/admin/settings', label: '設定', icon: Settings2 },
]

export function AdminLayout() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [ssoChecking, setSsoChecking] = useState(true)

  useEffect(() => {
    consumeSsoTokensFromUrl()
      .then((consumed) => {
        if (consumed) navigate(location.pathname, { replace: true })
      })
      .finally(() => setSsoChecking(false))
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!ssoChecking && !loading && !session) {
      redirectToHub('login')
    }
  }, [ssoChecking, loading, session])

  const handleSignOut = async () => {
    await signOut()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  if (loading || ssoChecking) {
    return <FullPageSpinner label="認証確認中..." />
  }
  if (!session) {
    return <FullPageSpinner label="ログインページへ移動しています..." />
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-white md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Calendar className="mr-2 h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">ブッキング管理</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 truncate text-xs text-slate-500">{session.user.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> ログアウト
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function FullPageSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </div>
  )
}
