import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookingSummaryCard, DashboardEmptyState, DashboardErrorState, DashboardLoadingState, DashboardPageIntro, DashboardSelectorList, DetailGrid, SectionCard, StatusPill } from '../../components/dashboard/DashboardUI'
import { useDashboardBooking, useDashboardBookings } from '../../hooks/useDashboardData'
import { formatDashboardCurrency, formatDashboardDate } from '../../components/dashboard/dashboardUtils'

function PaymentSummary({ booking }) {
  return (
    <div className="space-y-2 text-sm text-[#111827]">
      <div className="flex items-center justify-between gap-6">
        <span>Total</span>
        <span>{formatDashboardCurrency(booking?.paymentSummary?.totalPrice)}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span>Advance</span>
        <span>{formatDashboardCurrency(booking?.paymentSummary?.advanceAmount)}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span>Paid</span>
        <span>{formatDashboardCurrency(booking?.paymentSummary?.amountPaid)}</span>
      </div>
      <div className="flex items-center justify-between gap-6 font-medium">
        <span>Balance</span>
        <span>{formatDashboardCurrency(booking?.paymentSummary?.amountDue)}</span>
      </div>
    </div>
  )
}

export default function BookingDetails() {
  const { data: bookings = [], isLoading: bookingsLoading, error: bookingsError } = useDashboardBookings('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedBookingId = searchParams.get('bookingId') || ''

  useEffect(() => {
    if (!bookings.length) return
    if (selectedBookingId && bookings.some(booking => booking.id === selectedBookingId)) return

    const next = new URLSearchParams(searchParams)
    next.set('bookingId', bookings[0].id)
    setSearchParams(next, { replace: true })
  }, [bookings, searchParams, selectedBookingId, setSearchParams])

  const { data: booking, isLoading: bookingLoading, error: bookingError } = useDashboardBooking(selectedBookingId)

  if (bookingsLoading) {
    return <DashboardLoadingState title="Loading booking details..." />
  }

  if (bookingsError || bookingError) {
    return <DashboardErrorState title="We could not load this booking detail view." />
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Booking Details"
        subtitle="Review package selections, event information, and payment history."
        meta={`${bookings.length} bookings`}
      />

      {bookings.length === 0 ? (
        <DashboardEmptyState
          title="No booking details yet"
          body="Once you place a booking, the full package and payment breakdown will be available here."
          actionLabel="Explore Packages"
          actionTo="/package-listing"
        />
      ) : (
        <>
          <DashboardSelectorList
            items={bookings}
            selectedId={selectedBookingId}
            onSelect={bookingId => {
              const next = new URLSearchParams(searchParams)
              next.set('bookingId', bookingId)
              setSearchParams(next, { replace: true })
            }}
            getLabel={item => item.package?.title || item.event?.name || 'Booking'}
            getSubLabel={item => `${item.statusLabel} · ${formatDashboardDate(item.eventDate)}`}
          />

          {bookingLoading ? (
            <DashboardLoadingState title="Loading selected booking..." />
          ) : booking ? (
            <>
              <BookingSummaryCard
                booking={booking}
                rightContent={<PaymentSummary booking={booking} />}
                footerContent={
                  <div className="text-sm text-[#6B7280]">
                    Booking ID: <span className="font-medium text-[#2E2E2E]">{booking.id}</span>
                  </div>
                }
              />

              <SectionCard title="Event Snapshot" subtitle="Core details shared for this booking.">
                <DetailGrid
                  items={[
                    { label: 'Event', value: booking.event?.name || 'Not assigned yet' },
                    { label: 'Date', value: formatDashboardDate(booking.eventDate) },
                    { label: 'Guests', value: booking.guestCount ? `${booking.guestCount} guests` : 'Pending' },
                    { label: 'Location', value: booking.locationSummary || 'Venue not shared yet' },
                    { label: 'Status', value: booking.statusLabel },
                    { label: 'Booking ID', value: booking.id },
                  ]}
                />
              </SectionCard>

              <SectionCard title="Selected Items" subtitle="Package elements snapped into this booking.">
                {booking.items?.length ? (
                  <div className="space-y-3">
                    {booking.items.map(item => (
                      <div key={item.id} className="flex flex-col gap-2 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#2E2E2E]">{item.title}</p>
                          <p className="mt-1 text-xs text-[#6B7280]">Qty {item.quantity}</p>
                        </div>
                        <div className="text-sm text-[#2E2E2E]">{formatDashboardCurrency(item.totalPrice)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">No line items were stored for this booking yet.</p>
                )}
              </SectionCard>

              <SectionCard title="Vendor Coordination" subtitle="Assigned partners for this booking.">
                {booking.vendorAssignments?.length ? (
                  <div className="space-y-3">
                    {booking.vendorAssignments.map(assignment => (
                      <div key={assignment.id} className="rounded-2xl bg-white p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#2E2E2E]">
                              {assignment.vendor?.companyName || `Vendor #${assignment.vendorId}`}
                            </p>
                            <p className="mt-1 text-xs text-[#6B7280]">
                              {assignment.vendor?.locationCity || 'City pending'} · {assignment.vendor?.serviceArea || 'Service area pending'}
                            </p>
                          </div>
                          <StatusPill
                            label={String(assignment.status || 'assigned').replace(/_/g, ' ')}
                            status={assignment.status}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">Vendor assignments have not been added yet.</p>
                )}
              </SectionCard>

              <SectionCard title="Payments" subtitle="Recorded payments linked to this booking.">
                {booking.payments?.length ? (
                  <div className="space-y-3">
                    {booking.payments.map(payment => (
                      <div key={payment.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#2E2E2E]">
                            {String(payment.paymentType || 'payment').replace(/\b\w/g, char => char.toUpperCase())}
                          </p>
                          <p className="mt-1 text-xs text-[#6B7280]">{formatDashboardDate(payment.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <StatusPill label={payment.status} status={payment.status} />
                          <span className="text-sm text-[#2E2E2E]">{formatDashboardCurrency(payment.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">No payment records are attached to this booking yet.</p>
                )}
              </SectionCard>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
