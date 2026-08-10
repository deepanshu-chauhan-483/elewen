import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  SectionLoadingState,
  CustomSelect,
} from '../components/ui/AdminUI'
import { useAdminBookings, useAdminUpdateBookingStatus } from '../hooks/useAdminData'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { getAdminBadgeClass } from '../lib/adminBadges'
import {
  BOOKING_STAGE_GUIDANCE,
  BOOKING_STATUS_LABELS,
  NEXT_STAGE_MAP,
  TRACKER_STAGES,
  canProgressToStage,
  resolveTrackerBucket,
} from '../lib/bookingStages'
import { getBookingDisplayTitle } from '../lib/bookingDisplay'
import { formatCurrency, formatDate } from '../lib/formatters'

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

function buildBookingWorkspaceHref(bookingId = '') {
  const id = String(bookingId ?? '').trim()
  return id ? `/bookings?open=${encodeURIComponent(id)}` : '/bookings'
}

function stageGuidance(status = '') {
  return (
    BOOKING_STAGE_GUIDANCE[String(status).toLowerCase()] ??
    'Open the booking workspace to continue the operational flow.'
  )
}

function StatusBadge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = getAdminBadgeClass(status, { preset: 'vivid' })
  const text = label ?? BOOKING_STATUS_LABELS[key] ?? key

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

function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? '' : 'rotate-180'

  return (
    <svg className={`h-6 w-6 ${rotationClass}`} viewBox="0 0 36 36" fill="none">
      <path
        d="M28.5 18H7.5M7.5 18L18 28.5M7.5 18L18 7.5"
        stroke="#1C1C1C"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getSubtitle(booking) {
  return [booking?.event?.name, booking?.package?.serviceCategories?.[0]?.name].filter(Boolean).join(' · ')
}

function getStageEmptyStateBody(stageKey = '') {
  if (stageKey === 'new') {
    return 'Bookings move past this stage automatically after full payment or admin confirmation. Advance-only bookings stay here until you confirm them.'
  }

  return 'Select a different stage or check back when bookings move into this step.'
}

function BookingCard({ booking }) {
  const borderColor = borderColorMap[booking.status?.toLowerCase()] ?? 'border-[#CDB17E]'
  const subtitle = getSubtitle(booking)
  const updateStatusMutation = useAdminUpdateBookingStatus()
  const nextStage = NEXT_STAGE_MAP[String(booking.status ?? '').toLowerCase()]
  const remainingAmount = Number(booking?.remainingAmount ?? 0)
  const advanceValidation =
    nextStage &&
    canProgressToStage(
      booking.status,
      nextStage,
      remainingAmount
    )

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
              {getBookingDisplayTitle(booking)}
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
          <div className="flex flex-col items-start">
            <p className="text-[11px] text-[#767676]">ADVANCE PAID</p>
            <p className="font-medium text-[#2D2D2D]">{formatCurrency(booking.advanceAmount)}</p>
          </div>
          <div className="flex flex-col items-start">
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

      <div className="mt-4 rounded-xl border border-[#E4DED8] bg-[#FBF7F3] px-4 py-4">
        <p className="text-[11px] tracking-[0.16em] text-[#767676]">STAGE ACTION</p>
        <p className="mt-2 text-sm leading-6 text-[#2D2D2D]">{stageGuidance(booking.status)}</p>
        {advanceValidation && !advanceValidation.allowed ? (
          <p className="mt-2 text-sm text-[#8A1C1C]">{advanceValidation.message}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={buildBookingWorkspaceHref(booking.id)}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#CDB17E] bg-white px-5 text-sm text-[#CDB17E] hover:bg-[#FAF6F1]"
          >
            Open Booking Details
          </Link>
          {nextStage && advanceValidation?.allowed ? (
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() =>
                updateStatusMutation.mutate({
                  bookingId: booking.id,
                  body: {
                    status: nextStage,
                    note: `Advanced from tracker to ${BOOKING_STATUS_LABELS[nextStage] ?? nextStage}`,
                  },
                })
              }
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] hover:bg-[#C6AB7F] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateStatusMutation.isPending
                ? 'Updating...'
                : `Move to ${BOOKING_STATUS_LABELS[nextStage] ?? nextStage}`}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function BookingStatusTrackerPage() {
  const [activeStage, setActiveStage] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const trackerBucket = resolveTrackerBucket(activeStage)
  const bookingsQuery = useAdminBookings({
    bucket: trackerBucket,
    status: activeStage === 'all' ? '' : activeStage,
    page: currentPage,
    limit: PAGE_SIZE,
  })

  const bookings = useMemo(() => bookingsQuery.data?.bookings ?? [], [bookingsQuery.data?.bookings])
  const statusCounts = bookingsQuery.data?.statusCounts ?? {}
  const totalBookings = Number(bookingsQuery.data?.total ?? 0)
  const totalPages = Math.max(1, Number(bookingsQuery.data?.pages ?? 1))
  const visiblePage = Math.min(currentPage, totalPages)

  useScrollToTop(currentPage)
  const isResultsLoading = bookingsQuery.isFetching && !bookingsQuery.isLoading

  const counts = useMemo(() => {
    const map = { all: 0 }
    TRACKER_STAGES.forEach(stage => {
      if (stage.key === 'all') {
        map.all = Object.values(statusCounts).reduce(
          (sum, count) => sum + Number(count ?? 0),
          0
        )
        return
      }
      map[stage.key] = Number(statusCounts[stage.key] ?? 0)
    })
    return map
  }, [statusCounts])

  const activeLabel = TRACKER_STAGES.find(stage => stage.key === activeStage)?.label ?? 'All Bookings'

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
        <CustomSelect
          value={activeStage}
          onChange={value => {
            setActiveStage(value)
            setCurrentPage(1)
          }}
          className="min-h-10 rounded-full bg-[#F3F3F3]"
        >
          {TRACKER_STAGES.map(stage => (
            <option key={stage.key} value={stage.key}>
              {stage.label}
              {stage.key === 'all'
                ? ` (${counts.all})`
                : ` (${counts[stage.key] ?? 0})`}
            </option>
          ))}
        </CustomSelect>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">
          {totalBookings} booking{totalBookings !== 1 ? 's' : ''}
        </span>
        {activeStage !== 'all' && (
          <span className="text-sm text-[#8F8F8F]">in &quot;{activeLabel}&quot; stage</span>
        )}
      </div>

      {isResultsLoading ? (
        <SectionLoadingState label="Loading booking pipeline..." />
      ) : bookings.length ? (
        <div className="space-y-3">
          {bookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={visiblePage === 1}
              className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowIcon direction="left" />
            </button>
            <div className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1C]">
              {visiblePage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={visiblePage === totalPages}
              className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </div>
      ) : (
        <ResultsEmptyState
          title={`No bookings in "${activeLabel}"`}
          body={getStageEmptyStateBody(activeStage)}
        />
      )}
    </div>
  )
}
