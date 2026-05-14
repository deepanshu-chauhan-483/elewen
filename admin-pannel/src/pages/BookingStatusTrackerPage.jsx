import { useMemo } from 'react'
import { EmptyState, ErrorState, LoadingState, PageIntro, Panel, StatusBadge } from '../components/ui/AdminUI'
import { useAdminBookings } from '../hooks/useAdminData'
import { formatDate } from '../lib/formatters'

const stages = [
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'info_collection', label: 'Info Collection' },
  { key: 'planning', label: 'Planning' },
  { key: 'pre_event', label: 'Pre Event' },
  { key: 'execution', label: 'Execution' },
  { key: 'post_event', label: 'Post Event' },
  { key: 'completed', label: 'Completed' },
]

export default function BookingStatusTrackerPage() {
  const bookingsQuery = useAdminBookings({ bucket: 'active', limit: 60 })

  const columns = useMemo(() => {
    const bookings = bookingsQuery.data?.bookings ?? []
    return stages.map(stage => ({
      ...stage,
      items: bookings.filter(booking => booking.status === stage.key),
    }))
  }, [bookingsQuery.data?.bookings])

  if (bookingsQuery.isLoading) {
    return <LoadingState label="Loading booking pipeline..." />
  }

  if (bookingsQuery.error) {
    return <ErrorState label="The booking tracker is unavailable right now." />
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Booking Status Tracker"
        subtitle="A stage-by-stage operational view of active bookings so the team can see where work is clustering."
      />

      <Panel title="Pipeline Board" subtitle="Grouped by booking stage to mirror your IA breakdown and operational handoffs.">
        {columns.some(column => column.items.length) ? (
          <div className="grid gap-4 xl:grid-cols-4 2xl:grid-cols-8">
            {columns.map(column => (
              <div key={column.key} className="rounded-[26px] bg-[#FBF7F4] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5D2E17]">{column.label}</h3>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-[#6F6257]">{column.items.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {column.items.length ? (
                    column.items.map(booking => (
                      <div key={booking.id} className="rounded-2xl bg-white px-3 py-3 shadow-[0_8px_20px_rgba(62,39,35,0.06)]">
                        <p className="text-sm font-medium text-[#2B211B]">{booking.package?.title || booking.event?.name || booking.id}</p>
                        <p className="mt-1 text-xs leading-5 text-[#6F6257]">{booking.customer?.name || 'Customer'}</p>
                        <p className="mt-1 text-xs leading-5 text-[#8C7D70]">{formatDate(booking.eventDate)}</p>
                        <div className="mt-3">
                          <StatusBadge status={booking.status} label={booking.statusLabel} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs leading-5 text-[#8C7D70]">No bookings in this stage.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No active bookings in the tracker" body="Once bookings move into the active pipeline they will populate this board." />
        )}
      </Panel>
    </div>
  )
}
