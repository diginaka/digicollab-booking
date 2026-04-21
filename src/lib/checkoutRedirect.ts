import type { Booking } from '@/types/booking'

export function buildCheckoutUrl(params: {
  subdomain: string
  booking: Booking
  appointmentId: string
}): string {
  const base = import.meta.env.VITE_PAGE_RENDERER_URL || 'https://page.digicollabo.com'
  const funnelSlug = params.booking.funnel_id ? '' : params.booking.booking_slug
  const query = new URLSearchParams({ booking_appointment_id: params.appointmentId })
  return `${base}/${params.subdomain}/${funnelSlug}-checkout?${query.toString()}`
}

export function redirectToCheckout(url: string): void {
  window.location.href = url
}
