// Phase B: Lindo iframe embed. MVP placeholder renders the same BookingPage via an outer subdomain param.
// Actual CSP / X-Frame-Options / postMessage height sync will be wired in a follow-up phase.
import { BookingPage } from './BookingPage'

export function EmbedPage() {
  return (
    <div className="min-h-full">
      <BookingPage />
    </div>
  )
}
