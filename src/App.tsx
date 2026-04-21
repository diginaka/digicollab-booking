import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { GuestLayout } from '@/components/layout/GuestLayout'
import { EmbedLayout } from '@/components/layout/EmbedLayout'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { BookingListPage } from '@/pages/admin/BookingListPage'
import { BookingEditPage } from '@/pages/admin/BookingEditPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { BookingPage } from '@/pages/guest/BookingPage'
import { CancelPage } from '@/pages/guest/CancelPage'
import { EmbedPage } from '@/pages/guest/EmbedPage'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bookings" element={<BookingListPage />} />
        <Route path="bookings/new" element={<BookingEditPage />} />
        <Route path="bookings/:id" element={<BookingEditPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route element={<EmbedLayout />}>
        <Route path="/embed/:booking_slug" element={<EmbedPage />} />
      </Route>

      <Route element={<GuestLayout />}>
        <Route path="/cancel/:cancel_token" element={<CancelPage />} />
        <Route path="/:subdomain/:booking_slug" element={<BookingPage />} />
        <Route path="/" element={<RootRedirect />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function RootRedirect() {
  return (
    <div className="mx-auto max-w-md rounded-lg border bg-white p-8 text-center">
      <h1 className="mb-2 text-lg font-semibold">デジコラボ ブッキング</h1>
      <p className="text-sm text-slate-500">
        予約ページの URL は <code>/:subdomain/:booking_slug</code> 形式でアクセスしてください。
      </p>
      <p className="mt-3 text-xs text-slate-400">管理画面は <a className="text-primary underline" href="/admin/dashboard">/admin/dashboard</a></p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-2 text-4xl font-bold text-slate-400">404</div>
        <p className="text-sm text-slate-500">ページが見つかりません</p>
      </div>
    </div>
  )
}
