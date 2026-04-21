import { Outlet } from 'react-router-dom'
import { Calendar } from 'lucide-react'

export function GuestLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="h-5 w-5" />
            <span className="text-sm font-medium">予約フォーム</span>
          </div>
          <span className="text-xs text-slate-500">タイムゾーン: Asia/Tokyo (JST)</span>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
      <footer className="border-t bg-white py-4">
        <div className="container text-center text-xs text-slate-500">
          Powered by デジコラボ
        </div>
      </footer>
    </div>
  )
}
