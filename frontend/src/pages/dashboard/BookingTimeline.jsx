import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DashboardErrorState,
  DashboardEmptyState,
  DashboardLoadingState,
  DashboardPageIntro,
  DashboardSelectorList,
  SectionCard,
  StatusPill,
} from '../../components/dashboard/DashboardUI'
import {
  useDashboardBooking,
  useDashboardBookings,
  useDashboardBookingTimeline,
} from '../../hooks/useDashboardData'
import { formatDashboardDate } from '../../components/dashboard/dashboardUtils'
import EmptyBooking from '../../components/dashboard/EmptyBooking'

function titleizeStatus(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export default function BookingTimeline() {
  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useDashboardBookings('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedBookingId = searchParams.get('bookingId') || ''

  useEffect(() => {
    if (!bookings.length) return
    if (selectedBookingId && bookings.some(booking => booking.id === selectedBookingId)) return

    const next = new URLSearchParams(searchParams)
    next.set('bookingId', bookings[0].id)
    setSearchParams(next, { replace: true })
  }, [bookings, searchParams, selectedBookingId, setSearchParams])

  const {
    data: booking,
    isLoading: bookingLoading,
    error: bookingError,
  } = useDashboardBooking(selectedBookingId)
  const {
    data: timeline = [],
    isLoading: timelineLoading,
    error: timelineError,
  } = useDashboardBookingTimeline(selectedBookingId)

  const timelineItems = useMemo(() => {
    if (timeline.length > 0) return timeline

    return (booking?.statusLogs ?? []).map((entry, index) => ({
      id: `${entry.createdAt}-${index}`,
      title: titleizeStatus(entry.newStatus),
      description: entry.note || 'Status updated for this booking.',
      timelineDate: entry.createdAt,
      status: 'completed',
    }))
  }, [booking?.statusLogs, timeline])

  if (bookingsLoading) {
    return <DashboardLoadingState title="Loading booking timeline..." />
  }

  if (bookingsError || bookingError || timelineError) {
    return <DashboardErrorState title="We could not load this booking timeline." />
  }

  if (bookings.length === 0) {
    return (
      <EmptyBooking
        title="No booking timeline available yet"
        body="As soon as a booking is created, your milestone trail will appear here."
        actionLabel="Explore Packages"
        actionTo="/package-listing"
      />
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Booking Timeline"
        subtitle="Follow the milestones and key updates for each booking."
        meta={`${bookings.length} bookings`}
      />

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

        {bookingLoading || timelineLoading ? (
          <DashboardLoadingState title="Loading selected booking timeline..." />
        ) : booking ? (
          <SectionCard
            title={booking.package?.title || booking.event?.name || 'Booking Timeline'}
            subtitle={`${booking.statusLabel} · ${formatDashboardDate(booking.eventDate)}`}
            action={<StatusPill label={booking.statusLabel} status={booking.status} />}
          >
            {timelineItems.length === 0 ? (
              <DashboardEmptyState
                title="No timeline entries shared yet"
                body="Your planner will start posting milestone updates here once the next booking step begins."
              />
            ) : (
              <div className="space-y-4">
                {timelineItems.map(item => (
                  <div key={item.id} className="rounded-2xl border border-[#E5DED6] bg-white p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-[#2E2E2E]">
                          {item.title || 'Timeline update'}
                        </h3>
                        <p className="mt-2 text-sm text-[#6B7280]">
                          {item.description || 'Update shared by your team.'}
                        </p>
                      </div>
                      <div className="space-y-2 md:text-right">
                        <StatusPill
                          label={titleizeStatus(item.status || 'pending')}
                          status={item.status}
                        />
                        <p className="text-sm text-[#6B7280]">
                          {formatDashboardDate(item.timelineDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        ) : null}
      </>
    </div>
  )
}
