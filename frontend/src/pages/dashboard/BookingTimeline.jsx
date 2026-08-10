import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardSearch } from '../../components/dashboard/useDashboardSearch'
import { DashboardErrorState, DashboardLoadingState } from '../../components/dashboard/DashboardUI'
import { getStoredJwt, paymentCreateOrder, paymentVerify } from '../../lib/api'
import { openCashfreeCheckout } from '../../lib/cashfreeCheckout'
import {
  formatDashboardDate,
  matchesDashboardSearch,
} from '../../components/dashboard/dashboardUtils'
import { getBookingDisplayTitle } from '../../lib/bookingDisplay'
import {
  useDashboardBooking,
  useDashboardBookingTimeline,
  useDashboardBookings,
} from '../../hooks/useDashboardData'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import EmptyBooking from '../../components/dashboard/EmptyBooking'

const TIMELINE_DISPLAY_ORDER = [
  'Booking request received',
  'Booking Confirmed',
  'Information Collection',
  'Pre-Event Planning',
  'Final payment',
  'Setup completed and styled',
  'Dismantling after the celebration',
  "Review us and join the Fam! (we'd love to hear from you 🤍)",
]

const STATUS_PILL = {
  completed: 'bg-[#E1F5EE] text-[#0F6E56]',
  in_progress: 'bg-[#FEF1DE] text-[#C07318]',
  blocked: 'bg-[#FFF0F0] text-[#B42318]',
  pending: 'bg-[#F1EFE8] text-[#5F5E5A]',
  confirmed: 'bg-[#E1F5EE] text-[#0F6E56]',
  upcoming: 'bg-[#E6F1FB] text-[#185FA5]',
  active: 'bg-[#FEF1DE] text-[#C07318]',
  new: 'bg-[#FEF1DE] text-[#C07318]',
  info_collection: 'bg-[#E6F1FB] text-[#185FA5]',
  planning: 'bg-[#FEF1DE] text-[#C07318]',
  pre_event: 'bg-[#FFF0F0] text-[#B42318]',
  execution: 'bg-[#E6F1FB] text-[#185FA5]',
  post_event: 'bg-[#E6F1FB] text-[#185FA5]',
  cancelled: 'bg-[#F1EFE8] text-[#5F5E5A]',
}

const STATUS_PILL_LABEL = {
  completed: 'Completed',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  pending: 'Pending',
  confirmed: 'Confirmed',
  upcoming: 'Upcoming',
  active: 'Active',
  new: 'New',
  info_collection: 'Info Collection',
  planning: 'Planning',
  pre_event: 'Pre Event',
  execution: 'Execution',
  post_event: 'Post Event',
  cancelled: 'Cancelled',
}

const CARD_BG = {
  completed: 'bg-[#FDFAF7] border-[#EDE5DA]',
  in_progress: 'bg-[#FEF9F3] border-[#F0D5A0]',
  blocked: 'bg-[#FFF8F8] border-[#F5B0AA]',
  pending: 'bg-[#FAFAFA] border-[#EFEFEF]',
}

function formatPaymentAmount(value) {
  const amount = Number(value ?? 0)
  return `Rs${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function getPaymentErrorMessage(error) {
  const gatewayError = error?.error ?? error?.response?.error ?? null

  const message =
    gatewayError?.description ||
    error?.description ||
    gatewayError?.message ||
    error?.message ||
    null

  if (message) {
    return message
  }

  if (
    gatewayError?.reason === 'international_transaction_not_allowed' ||
    error?.reason === 'international_transaction_not_allowed'
  ) {
    return 'International cards are not supported. Please contact our support team for help.'
  }

  return 'Payment failed. Please try again.'
}

function normalizeTimelineItem(item) {
  const rawStatus = String(item?.status ?? '')
    .trim()
    .toLowerCase()
  const status =
    rawStatus === 'active'
      ? 'in_progress'
      : rawStatus === 'in_progress'
        ? 'in_progress'
        : rawStatus === 'completed'
          ? 'completed'
          : rawStatus === 'blocked'
            ? 'blocked'
            : 'pending'

  return {
    id: item?.id ?? `${item?.title}-${item?.timelineDate ?? ''}`,
    title: item?.title ?? 'Timeline Step',
    description: item?.description ?? '',
    stageNote: String(item?.stageNote ?? '').trim(),
    stageNoteDate: item?.stageNoteCreatedAt ? formatDashboardDate(item.stageNoteCreatedAt) : '',
    status,
  }
}

function sortTimelineItems(items = []) {
  const orderMap = new Map(TIMELINE_DISPLAY_ORDER.map((title, index) => [title, index]))

  return [...items].sort((left, right) => {
    const leftIndex = orderMap.get(left?.title) ?? Number.MAX_SAFE_INTEGER
    const rightIndex = orderMap.get(right?.title) ?? Number.MAX_SAFE_INTEGER

    if (leftIndex !== rightIndex) return leftIndex - rightIndex
    return String(left?.title ?? '').localeCompare(String(right?.title ?? ''))
  })
}

function StatusPill({ status, label }) {
  const cls = STATUS_PILL[status] || STATUS_PILL.pending
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 whitespace-nowrap text-xs font-normal tracking-wide ${cls}`}
    >
      {label || STATUS_PILL_LABEL[status] || 'Pending'}
    </span>
  )
}

function TimelineDot({ status, isLast }) {
  return (
    <div className="flex flex-shrink-0 flex-col items-center">
      <div
        className={`
          z-10 flex h-9 w-9 items-center justify-center rounded-full border-2
          ${
            status === 'completed'
              ? 'border-[#C6A15B] bg-[#C6A15B]'
              : status === 'in_progress'
                ? 'border-[#C07318] bg-[#FEF1DE]'
                : status === 'blocked'
                  ? 'border-[#B42318] bg-[#FFF0F0]'
                  : 'border-[#D3D1C7] bg-[#F1EFE8]'
          }
        `}
      >
        {status === 'completed' ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8L6.5 11.5L13 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : status === 'in_progress' ? (
          <span className="h-2 w-2 rounded-full bg-[#C07318]" />
        ) : status === 'blocked' ? (
          <span className="h-2 w-2 rounded-full bg-[#B42318]" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-[#D3D1C7]" />
        )}
      </div>

      {!isLast ? (
        <div
          className={`mt-0.5 min-h-[32px] w-0.5 flex-1 ${
            status === 'completed' ? 'bg-[#C6A15B]/20' : 'bg-[#E5DED6]'
          }`}
        />
      ) : null}
    </div>
  )
}

export default function BookingTimeline() {
  const queryClient = useQueryClient()
  const { searchTerm } = useDashboardSearch()
  const debouncedSearchTerm = useDebouncedValue(searchTerm)
  const {
    data: bookings = [],
    error,
    isLoading,
  } = useDashboardBookings('all', {
    search: debouncedSearchTerm,
  })
  const [selectedId, setSelectedId] = useState('')
  const [payingBookingId, setPayingBookingId] = useState('')

  const orderBookings = useMemo(
    () =>
      bookings.filter(booking => {
        const checkoutMode = String(
          booking?.checkoutMode ?? booking?.latestStatusLog?.checkoutMode ?? ''
        )
          .trim()
          .toLowerCase()
        return (
          booking?.isSampleTasteBooking !== true &&
          booking?.isSampleTastingBooking !== true &&
          checkoutMode !== 'sample-tasting'
        )
      }),
    [bookings]
  )
  const filteredOrderBookings = useMemo(
    () =>
      orderBookings.filter(booking =>
        matchesDashboardSearch(debouncedSearchTerm, [
          booking?.package?.title,
          booking?.event?.name,
          booking?.statusLabel,
          booking?.locationSummary,
          booking?.detailSubtitle,
        ])
      ),
    [debouncedSearchTerm, orderBookings]
  )

  useEffect(() => {
    if (!filteredOrderBookings.length) return
    if (selectedId && filteredOrderBookings.some(booking => booking.id === selectedId)) return
    setSelectedId(filteredOrderBookings[0].id)
  }, [filteredOrderBookings, selectedId])

  const selectedBooking = useMemo(
    () =>
      filteredOrderBookings.find(booking => booking.id === selectedId) ??
      filteredOrderBookings[0] ??
      null,
    [filteredOrderBookings, selectedId]
  )
  const { data: selectedBookingDetails } = useDashboardBooking(selectedBooking?.id)
  const activeBooking = selectedBookingDetails ?? selectedBooking

  const {
    data: timelineData = [],
    error: timelineError,
    isLoading: timelineLoading,
  } = useDashboardBookingTimeline(selectedBooking?.id)

  const timeline = useMemo(
    () =>
      Array.isArray(timelineData) ? sortTimelineItems(timelineData.map(normalizeTimelineItem)) : [],
    [timelineData]
  )
  const done = timeline.filter(item => item.status === 'completed').length
  const pct = timeline.length > 0 ? Math.round((done / timeline.length) * 100) : 0

  const handlePayRemaining = async booking => {
    if (!booking?.id || payingBookingId) return

    const token = getStoredJwt()
    if (!token) return

    setPayingBookingId(booking.id)

    try {
      const orderResponse = await paymentCreateOrder(token, {
        bookingId: booking.id,
        paymentType: 'remaining',
      })

      if (orderResponse?.testMode) {
        await paymentVerify(token, {
          paymentId: orderResponse.paymentId,
          gatewayOrderId: orderResponse.gatewayOrderId,
          gatewayPaymentId: `test_payment_${orderResponse.paymentId}`,
          paymentMethod: 'offline',
          testBypass: true,
        })

        await queryClient.invalidateQueries({ queryKey: ['dashboard', 'bookings'] })
        await queryClient.invalidateQueries({
          queryKey: ['dashboard', 'booking', booking.id],
        })
        await queryClient.invalidateQueries({
          queryKey: ['dashboard', 'booking-timeline', booking.id],
        })
        return
      }

      if (!orderResponse?.paymentSessionId) {
        throw new Error('Cashfree payment session could not be created.')
      }

      const checkoutResult = await openCashfreeCheckout({
        paymentSessionId: orderResponse.paymentSessionId,
        environment: orderResponse.environment,
      })

      if (checkoutResult?.error) {
        throw new Error(getPaymentErrorMessage(checkoutResult.error))
      }

      await paymentVerify(token, {
        paymentId: orderResponse.paymentId,
        gatewayOrderId: orderResponse.gatewayOrderId,
        gatewayPaymentId:
          checkoutResult?.paymentDetails?.paymentId ||
          checkoutResult?.paymentDetails?.cf_payment_id ||
          null,
        paymentMethod: 'upi',
      })

      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'bookings'] })
      await queryClient.invalidateQueries({
        queryKey: ['dashboard', 'booking', booking.id],
      })
      await queryClient.invalidateQueries({
        queryKey: ['dashboard', 'booking-timeline', booking.id],
      })
    } catch (err) {
      window.alert(getPaymentErrorMessage(err))
    } finally {
      setPayingBookingId('')
    }
  }

  if (isLoading || timelineLoading) {
    return <DashboardLoadingState title="Loading booking timeline..." />
  }

  if (error || timelineError) {
    return <DashboardErrorState title="We could not load your booking timeline." />
  }

  if (!orderBookings.length) {
    return (
      <EmptyBooking
        title="No booking timeline available yet"
        body="Your booking milestones and progress updates will appear here once a booking is created."
        actionLabel="Explore Packages"
        actionTo="/package-listing"
      />
    )
  }

  if (!filteredOrderBookings.length) {
    return (
      <DashboardErrorState
        title="No booking timelines match your search."
        body="Try searching by package, event, status, or location."
      />
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-1.5 flex items-center gap-2.5">
          <h1 className="text-2xl text-[#2E2E2E]">Booking Timeline</h1>
        </div>
        <p className="text-sm text-[#8C7B6B]">
          Follow the milestones and key updates for each booking - {filteredOrderBookings.length}{' '}
          bookings
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {filteredOrderBookings.map(booking => (
          <button
            key={booking.id}
            type="button"
            onClick={() => setSelectedId(booking.id)}
            className={`
              min-w-[180px] cursor-pointer rounded-xl border-[1.5px] px-4 py-2.5 text-left transition-all duration-150
              ${
                selectedBooking?.id === booking.id
                  ? 'border-[#591902] bg-[#591902] text-[#F5E6CC]'
                  : 'border-[#E5DED6] bg-white text-[#3D2B1A] hover:border-[#C6A15B] hover:shadow-sm'
              }
            `}
          >
            <p className="mb-0.5 text-sm font-semibold">{getBookingDisplayTitle(booking)}</p>
            <p
              className={`text-xs ${
                selectedBooking?.id === booking.id ? 'text-[#F5E6CC]/75' : 'text-[#8C7B6B]'
              }`}
            >
              {booking.event?.name} - {formatDashboardDate(booking.eventDate)}
            </p>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white shadow-[0_2px_16px_rgba(89,25,2,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-[#591902] to-[#7A2408] px-7 py-6">
          <div>
            <h2
              className="mb-1 text-lg font-semibold tracking-tight text-[#F5E6CC]"
              style={{ fontFamily: 'poppins' }}
            >
              {getBookingDisplayTitle(activeBooking)}
            </h2>
            <p className="text-sm text-[#D4A96A]">
              {activeBooking?.displaySubtitle || activeBooking?.event?.name || 'Event'} -{' '}
              {formatDashboardDate(activeBooking?.eventDate)}
            </p>
          </div>
          <StatusPill status={activeBooking?.status} label={activeBooking?.statusLabel} />
        </div>

        <div className="border-b border-[#F0EBE4] bg-[#FDFAF7] px-7 py-4">
          <div className="mb-2 flex items-center justify-between font-sans">
            <span className="text-xs text-[#8C7B6B]">Overall progress</span>
            <span className="text-xs font-semibold text-[#591902]">
              {done}/{timeline.length} milestones
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#F0EBE4]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C6A15B] to-[#E8C47A] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="px-7 py-7">
          {timeline.map((item, idx) => (
            <div key={item.id} className="flex gap-4">
              <TimelineDot status={item.status} isLast={idx === timeline.length - 1} />

              <div className={`flex-1 pt-1 ${idx < timeline.length - 1 ? 'pb-6' : 'pb-0'}`}>
                <div
                  className={`
                      flex flex-wrap items-start justify-between gap-2.5 rounded-2xl border px-4 py-3.5
                      ${CARD_BG[item.status] || CARD_BG.pending}
                    `}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[#C6A15B]">
                        Step {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3
                        className="text-sm font-semibold text-[#2E2E2E]"
                        style={{ fontFamily: 'poppins' }}
                      >
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed text-[#8C7B6B]">{item.description}</p>
                    {item.stageNote ? (
                      <div className="mt-3 rounded-xl border border-[#EDE5DA] bg-white/80 px-3 py-2.5">
                        <p className="text-[11px] font-medium tracking-[0.14em] text-[#A89080] uppercase">
                          Stage note
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#3D2B1A]">
                          {item.stageNote}
                        </p>
                        {item.stageNoteDate ? (
                          <p className="mt-1 text-[11px] text-[#A89080]">{item.stageNoteDate}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {activeBooking?.status === 'pre_event' &&
                    item.title === 'Final payment' &&
                    item.status === 'blocked' ? (
                      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 rounded-[18px] border border-[#F2D4CF] bg-white/80 px-4 py-3">
                        <div className="flex flex-wrap gap-6">
                          <div>
                            <p className="text-[11px] text-[#A16255]">AMOUNT PAID</p>
                            <p className="mt-1 text-sm font-medium text-[#2E2E2E]">
                              {formatPaymentAmount(activeBooking?.paymentSummary?.amountPaid)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-[#A16255]">REMAINING PAYMENT</p>
                            <p className="mt-1 text-sm font-medium text-[#B42318]">
                              {formatPaymentAmount(activeBooking?.paymentSummary?.amountDue)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePayRemaining(activeBooking)}
                          disabled={
                            payingBookingId === activeBooking?.id ||
                            Number(activeBooking?.paymentSummary?.amountDue ?? 0) <= 0
                          }
                          className="rounded-full bg-[#CDB17E] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#c3a66f] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {payingBookingId === activeBooking?.id
                            ? 'Opening payment...'
                            : 'Pay Remaining Payment'}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <StatusPill status={item.status} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
