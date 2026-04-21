import { Outlet } from 'react-router-dom'

export function EmbedLayout() {
  return (
    <div className="min-h-screen bg-transparent">
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
