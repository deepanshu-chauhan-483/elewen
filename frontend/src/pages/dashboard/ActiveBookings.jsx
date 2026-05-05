import { Link } from 'react-router-dom'
import { DashboardErrorState, DashboardEmptyState, DashboardLoadingState, DashboardPageIntro, BookingSummaryCard } from '../../components/dashboard/DashboardUI'
import { useDashboardBookings } from '../../hooks/useDashboardData'
import { formatDashboardCurrency } from '../../components/dashboard/dashboardUtils'

function PaymentSnapshot({ booking }) {
  return (
    <div className="text-sm text-[#111827]">
      <p>AMOUNT PAID</p>
      <p className="font-medium">{formatDashboardCurrency(booking?.paymentSummary?.amountPaid)}</p>
      <p className="mt-3">REMAINING</p>
      <p className="font-medium">{formatDashboardCurrency(booking?.paymentSummary?.amountDue)}</p>
    </div>
  )
}

function ActionButton({ bookingId }) {
  return (
    <Link
      to={`/user-dashboard/details?bookingId=${bookingId}`}
      className="inline-flex rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90"
    >
      View Details →
    </Link>
  )
}

export default function ActiveBookings() {
  const { data: bookings = [], isLoading, error } = useDashboardBookings('active')

  if (isLoading) {
    return <DashboardLoadingState title="Loading active bookings..." />
  }

  if (error) {
    return <DashboardErrorState title="We could not load your active bookings." />
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Active Bookings"
        subtitle="Track and manage your ongoing events."
        meta={`${bookings.length} live`}
      />

      {bookings.length === 0 ? (
        <DashboardEmptyState
          title="No active bookings yet"
          body="As soon as a booking is placed or confirmed, it will show up here with its payment status and quick dashboard links."
          actionLabel="Explore Packages"
          actionTo="/package-listing"
        />
      ) : null}

      {bookings.map(booking => (
        <BookingSummaryCard
          key={booking.id}
          booking={booking}
          rightContent={
            booking.status === 'confirmed' ? (
              <ActionButton bookingId={booking.id} />
            ) : (
              <PaymentSnapshot booking={booking} />
            )
          }
          footerContent={
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                to={`/user-dashboard/timeline?bookingId=${booking.id}`}
                className="rounded-full border border-[#D2C9BF] px-4 py-2 text-[#591902] transition hover:border-[#591902]"
              >
                View Timeline
              </Link>
              <Link
                to={`/user-dashboard/messages?bookingId=${booking.id}`}
                className="rounded-full border border-[#D2C9BF] px-4 py-2 text-[#591902] transition hover:border-[#591902]"
              >
                Messages & Updates
              </Link>
              <Link
                to={`/user-dashboard/details?bookingId=${booking.id}`}
                className="rounded-full border border-[#D2C9BF] px-4 py-2 text-[#591902] transition hover:border-[#591902]"
              >
                Booking Details
              </Link>
            </div>
          }
        />
      ))}
    </div>
  )
}
