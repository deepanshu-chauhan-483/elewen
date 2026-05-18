import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState, SelectField } from '../components/ui/AdminUI'
import { useAdminBookings } from '../hooks/useAdminData'
import { formatCurrency, formatDate } from '../lib/formatters'

// ---------------------------------------------------------------------------
// Stage config
// ---------------------------------------------------------------------------
const stages = [
  { key: 'all', label: 'All Bookings' },
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'info_collection', label: 'Info Collection' },
  { key: 'planning', label: 'Planning' },
  { key: 'pre_event', label: 'Pre Event' },
  { key: 'execution', label: 'Execution' },
  { key: 'post_event', label: 'Post Event' },
  { key: 'completed', label: 'Completed' },
]

const badgeMap = {
  new: 'bg-[#FCE7CF] text-[#C57A1E]',
  confirmed: 'bg-[#DDF7E5] text-[#16A34A]',
  info_collection: 'bg-[#DBEAFE] text-[#0383E4]',
  planning: 'bg-[#EDE9FE] text-[#6D28D9]',
  pre_event: 'bg-[#FCE7CF] text-[#C57A1E]',
  execution: 'bg-[#DDF7E5] text-[#16A34A]',
  post_event: 'bg-[#DBEAFE] text-[#0383E4]',
  completed: 'bg-[#E5E7EB] text-[#4B5563]',
  cancelled: 'bg-[#FFF3F3] text-[#8A1C1C]',
}

const borderColorMap = {
  new: 'border-[#C57A1E]',
  confirmed: 'border-[#16A34A]',
  info_collection: 'border-[#0383E4]',
  planning: 'border-[#6D28D9]',
  pre_event: 'border-[#C57A1E]',
  execution: 'border-[#16A34A]',
  post_event: 'border-[#0383E4]',
  completed: 'border-[#9CA3AF]',
  cancelled: 'border-[#8A1C1C]',
}

function StatusBadge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = badgeMap[key] ?? 'bg-[#E5E7EB] text-[#4B5563]'
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '-'

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

function CalIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#8F8F8F]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function getSubtitle(booking) {
  return [
    // booking?.detailSubtitle,
    booking?.event?.name,
    booking?.package?.serviceCategories?.[0]?.name,
  ]
    .filter(Boolean)
    .join(' · ')
}

function BookingCard({ booking }) {
  const borderColor = borderColorMap[booking.status?.toLowerCase()] ?? 'border-[#CDB17E]'
  const subtitle = getSubtitle(booking)

  return (
    <div
      className={[
        'rounded-2xl border-l-4 bg-white p-5 shadow-sm transition-all hover:shadow-md',
        borderColor,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-3">
            <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E]">
              {booking.package?.title || booking.event?.name || booking.id}
            </h3>
            <div className="shrink-0">
              <StatusBadge status={booking.status} label={booking.statusLabel} />
            </div>
          </div>

          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-[#1C1C1C]">
            <CalIcon />
            {formatDate(booking.eventDate)}
          </div>
        </div>

        <div className="hidden shrink-0 gap-6 text-sm md:flex">
          <div className="flex flex-col items-end">
            <p className="text-[11px] text-[#767676]">ADVANCE PAID</p>
            <p className="font-medium text-[#2D2D2D]">{formatCurrency(booking.advanceAmount)}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[11px] text-[#767676]">REMAINING</p>
            <p className="font-medium text-[#2D2D2D]">{formatCurrency(booking.remainingAmount)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 md:hidden">
        <div>
          <p className="text-[11px] text-[#767676]">ADVANCE PAID</p>
          <p className="font-medium text-[#2D2D2D]">{formatCurrency(booking.advanceAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#767676]">REMAINING</p>
          <p className="font-medium text-[#2D2D2D]">{formatCurrency(booking.remainingAmount)}</p>
        </div>
      </div>
    </div>
  )
}

export default function BookingStatusTrackerPage() {
  const [activeStage, setActiveStage] = useState('all')
  const bookingsQuery = useAdminBookings({ bucket: 'active', limit: 60 })

  const bookings = bookingsQuery.data?.bookings ?? []

  const counts = useMemo(() => {
    const map = { all: bookings.length }
    stages.forEach(stage => {
      if (stage.key !== 'all') {
        map[stage.key] = bookings.filter(booking => booking.status === stage.key).length
      }
    })
    return map
  }, [bookings])

  const filtered = useMemo(() => {
    if (activeStage === 'all') return bookings
    return bookings.filter(booking => booking.status === activeStage)
  }, [bookings, activeStage])

  const activeLabel = stages.find(stage => stage.key === activeStage)?.label ?? 'All Bookings'

  if (bookingsQuery.isLoading) return <LoadingState label="Loading booking pipeline..." />
  if (bookingsQuery.error)
    return <ErrorState label="The booking tracker is unavailable right now." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Booking Pipeline</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Track bookings by stage using the same compact card view as booking management.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#767676]">
          Filter by Stage
        </p>
        <SelectField
          value={activeStage}
          onChange={setActiveStage}
          className="min-h-10 rounded-full bg-[#F3F3F3]"
        >
          {stages.map(stage => (
            <option key={stage.key} value={stage.key}>
              {stage.label} ({counts[stage.key] ?? 0})
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
        </span>
        {activeStage !== 'all' && (
          <span className="text-sm text-[#8F8F8F]">in "{activeLabel}" stage</span>
        )}
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E4DED8] bg-white p-8">
          <EmptyState
            title={`No bookings in "${activeLabel}"`}
            body="Select a different stage or check back when bookings move into this step."
          />
        </div>
      )}
    </div>
  )
}
