import { Link } from 'react-router-dom'
import {
  BookingSummaryCard,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
} from '../../components/dashboard/DashboardUI'
import { useDashboardBookings } from '../../hooks/useDashboardData'
import { formatDashboardCurrency } from '../../components/dashboard/dashboardUtils'

function getBookAgainHref(booking) {
  const serviceSlug = String(booking?.package?.serviceCategories?.[0]?.slug ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')
  const packageId = booking?.package?.documentId || booking?.package?.id || booking?.packageId

  if (!packageId) return '/package-listing'
  if (serviceSlug === 'decor') return `/packages/decor-single/${packageId}`
  if (serviceSlug === 'sheesha') return `/packages/sheesha-single/${packageId}`
  if (serviceSlug) return `/packages/${serviceSlug}/${packageId}`
  return '/package-listing'
}

export default function PreviousBookings() {
  const { data: bookings = [], isLoading, error } = useDashboardBookings('previous')

  if (isLoading) {
    return <DashboardLoadingState title="Loading previous bookings..." />
  }

  if (error) {
    return <DashboardErrorState title="We could not load previous bookings." />
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Previous Bookings"
        subtitle="Look back at completed or past events with their final payment snapshot."
        meta={`${bookings.length} past`}
      />

      {bookings.length === 0 ? (
        <DashboardEmptyState
          title="No previous bookings yet"
          body="Past events will be listed here once their date passes or they are marked complete."
        />
      ) : null}

      {bookings.map(booking => (
        <BookingSummaryCard
          key={booking.id}
          booking={booking}
          rightContent={
            <div className="space-y-3 text-sm text-[#111827] lg:text-right">
              <div>
                <p>FINAL PAID</p>
                <p className="font-medium">
                  {formatDashboardCurrency(booking?.paymentSummary?.amountPaid)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  to={`/user-dashboard/details?bookingId=${booking.id}`}
                  className="inline-flex rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90"
                >
                  Open Details →
                </Link>
                <Link
                  to={getBookAgainHref(booking)}
                  className="inline-flex rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902]"
                >
                  Book Again
                </Link>
                <Link
                  to={`/user-dashboard/support?bookingId=${booking.id}`}
                  className="inline-flex rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902]"
                >
                  Refer a Friend
                </Link>
              </div>
            </div>
          }
        />
      ))}
    </div>
  )
}
