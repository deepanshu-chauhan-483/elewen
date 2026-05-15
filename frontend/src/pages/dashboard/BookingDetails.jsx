import { useMemo, useState } from 'react'
import {
  useDashboardBookings,
  useDashboardBookingTimeline,
  useDashboardCancelBooking,
  useDashboardSession,
} from '../../hooks/useDashboardData'
import {
  formatDashboardCurrency,
  formatDashboardDate,
} from '../../components/dashboard/dashboardUtils'
import {
  getBookingPackageNamesText,
  getPackageLineLabel,
  getPackageLineSubtitle,
  parseBookingItemTitle,
} from '../../lib/bookingDisplay'
import { buildReceiptData, downloadReceipt } from '../../lib/receipt'

function getCartItemMeta(title = '') {
  return parseBookingItemTitle(title)
}

function buildSelectedItemRows(booking) {
  const items = Array.isArray(booking?.items) ? booking.items : []
  const rows = []

  for (const item of items) {
    const meta = getCartItemMeta(item?.title)
    if (meta?.itemType === 'addon') {
      continue
    }

    rows.push({
      id: item?.id ?? `${booking?.id ?? 'row'}-${rows.length}`,
      title: getPackageLineLabel(item?.title, booking?.package?.title),
      includes: getPackageLineSubtitle(item?.title),
      amount: item?.totalPrice ?? 0,
    })
  }

  if (!rows.length && booking?.package?.title) {
    rows.unshift({
      id: `package-${booking?.id ?? 'row'}`,
      title: booking.package.title,
      includes: '',
      amount: booking?.totalPrice ?? booking?.package?.basePrice ?? 0,
    })
  }

  return rows
}

function buildPackageIncludesRows(booking) {
  return Array.isArray(booking?.package?.detail_inclusions)
    ? booking.package.detail_inclusions.filter(Boolean).slice(0, 12)
    : []
}

function buildAddonDetailRows(booking) {
  const items = Array.isArray(booking?.items) ? booking.items : []
  const packageAddons = Array.isArray(booking?.package?.detail_addons)
    ? booking.package.detail_addons
    : []

  return items
    .map(item => {
      const meta = getCartItemMeta(item?.title)
      if (meta?.itemType !== 'addon') return null

      const addonName = getPackageLineLabel(item?.title, 'Add-on')
      const matchedAddon =
        packageAddons.find(addon => String(addon?.id ?? '') === String(item?.addonId ?? '')) ??
        packageAddons.find(
          addon =>
            String(addon?.name ?? '')
              .trim()
              .toLowerCase() === addonName.toLowerCase()
        ) ??
        null

      const details = [
        matchedAddon?.description,
        getPackageLineSubtitle(item?.title),
        matchedAddon?.unit ? `Unit: ${matchedAddon.unit}` : '',
        item?.quantity > 1 ? `Qty ${item.quantity}` : '',
      ]
        .filter(Boolean)
        .join(' | ')

      return {
        id: item?.id ?? `${booking?.id ?? 'addon'}-${addonName}`,
        title: matchedAddon?.name || addonName,
        details,
        amount: item?.totalPrice ?? 0,
      }
    })
    .filter(Boolean)
}

const TIMELINE_DISPLAY_ORDER = [
  'Inquiry / Booking Placed',
  'Internal Review & Confirmation',
  'Information Collection',
  'Planning & Preparation',
  'Pre-event Final Checks',
  'Event Day / Execution',
  'Event Complete',
  'Post Event Follow Up',
]

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
    timelineDate: item?.timelineDate ?? '',
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

function getCurrentTimelineStage(timeline = []) {
  const inProgressStage = timeline.find(item => item.status === 'in_progress')
  if (inProgressStage) return inProgressStage

  const blockedStage = timeline.find(item => item.status === 'blocked')
  if (blockedStage) return blockedStage

  return null
}

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M6.6 1.6V5M13.3 1.6V5M2.5 8.3H17.5M4.1 3.3H15.8C16.7 3.3 17.5 4 17.5 5V16.6C17.5 17.5 16.7 18.3 15.8 18.3H4.1C3.2 18.3 2.5 17.5 2.5 16.6V5C2.5 4 3.2 3.3 4.1 3.3Z"
      stroke="#1C1C1C"
      strokeWidth="1.5"
    />
  </svg>
)

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="#fff" strokeWidth="1.5" />
  </svg>
)

const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-[#E0F6ED] text-[#238E64]',
  }

  const label = String(status ?? 'In Progress')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        styles[status] || 'bg-[#FEF1DE] text-[#C07318]'
      }`}
    >
      {label}
    </span>
  )
}

function BookingAccordionCard({ booking, session }) {
  const [open, setOpen] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')
  const selectedItemRows = buildSelectedItemRows(booking)
  const packageIncludesRows = buildPackageIncludesRows(booking)
  const addonDetailRows = buildAddonDetailRows(booking)
  const cancelMutation = useDashboardCancelBooking()
  const { data: timelineData = [] } = useDashboardBookingTimeline(open ? booking?.id : null)
  const receiptData = buildReceiptData({
    booking,
    customer: {
      fullName:
        [session?.profile?.first_name, session?.profile?.last_name].filter(Boolean).join(' ') ||
        [session?.user?.first_name, session?.user?.last_name].filter(Boolean).join(' ') ||
        '',
      email: session?.user?.email || '',
      phone: session?.user?.phone || '',
    },
  })
  const currentTimelineStage = useMemo(() => {
    const timeline = Array.isArray(timelineData)
      ? sortTimelineItems(timelineData.map(normalizeTimelineItem))
      : []

    return getCurrentTimelineStage(timeline)
  }, [timelineData])

  const borderColor = booking.status === 'completed' ? 'border-[#238E64]' : 'border-[#C07318]'

  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md ${
        open ? 'border-t-4' : 'border-l-4'
      } ${borderColor}`}
      onClick={() => setOpen(prev => !prev)}
    >
      <div className="cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 md:justify-start">
              <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E] md:text-lg">
                {getBookingPackageNamesText(booking, 'Booking')}
              </h3>

              <div className="shrink-0 md:pt-0.5">
                <StatusBadge status={booking.status} />
              </div>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {booking.detailSubtitle || booking.event?.name || 'Booking details pending'}
            </p>
          </div>

          {!open ? (
            <div className="mt-2 hidden shrink-0 gap-[24px] text-sm md:flex md:gap-[32px]">
              <div className="flex flex-col">
                <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
                <p className="font-medium">
                  {formatDashboardCurrency(booking.paymentSummary?.amountPaid)}
                </p>
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
                <p className="font-medium">
                  {formatDashboardCurrency(booking.paymentSummary?.amountDue)}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-[#1C1C1C]">
          <CalendarIcon />
          {formatDashboardDate(booking.eventDate)}
        </div>

        {!open ? (
          <div className="mt-4 flex gap-10 text-sm md:hidden">
            <div className="flex flex-col">
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p className="font-medium">
                {formatDashboardCurrency(booking.paymentSummary?.amountPaid)}
              </p>
            </div>

            <div className="flex flex-col">
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p className="font-medium">
                {formatDashboardCurrency(booking.paymentSummary?.amountDue)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {open ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[#00000033] pt-6 text-sm md:grid-cols-3">
            <div>
              <p className="text-[11px] text-[#767676]">PACKAGE</p>
              <p>{getBookingPackageNamesText(booking, booking.event?.name || 'Not shared yet')}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">GUESTS</p>
              <p>{booking.guestCount || 'Pending'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">LOCATION</p>
              <p>{booking.locationSummary}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p>{formatDashboardCurrency(booking.paymentSummary?.amountPaid)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p>{formatDashboardCurrency(booking.paymentSummary?.amountDue)}</p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-[11px] text-[#767676]">SELECTED ITEMS</h4>
            <div className="space-y-2">
              {selectedItemRows.map(item => (
                <div key={item.id} className="flex justify-between rounded-xl bg-[#F3F3F3] p-3">
                  <div className="min-w-0 pr-4">
                    <span className="block text-sm">{item.title}</span>
                    {item.includes ? (
                      <span className="mt-1 block text-xs text-[#767676]">{item.includes}</span>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium">
                    {formatDashboardCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {packageIncludesRows.length ? (
            <div className="mt-6">
              <h4 className="mb-3 text-[11px] text-[#767676]">INCLUDES</h4>
              <div className="space-y-2">
                {packageIncludesRows.map((item, index) => (
                  <div
                    key={`${booking.id}-include-${index}`}
                    className="flex justify-between rounded-xl bg-[#F3F3F3] p-3"
                  >
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {addonDetailRows.length ? (
            <div className="mt-6">
              <h4 className="mb-3 text-[11px] text-[#767676]">ADDON DETAILS</h4>
              <div className="space-y-2">
                {addonDetailRows.map(item => (
                  <div key={item.id} className="flex justify-between rounded-xl bg-[#F3F3F3] p-3">
                    <div className="min-w-0 pr-4">
                      <span className="block text-sm">{item.title}</span>
                      {item.details ? (
                        <span className="mt-1 block text-xs text-[#767676]">{item.details}</span>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium">
                      {formatDashboardCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {currentTimelineStage ? (
            <div className="mt-6">
              <h4 className="mb-3 text-[11px] text-[#767676]">CURRENT STAGE</h4>
              <div className="rounded-xl bg-[#F3F3F3] p-3">
                <span className="block text-sm">{currentTimelineStage.title}</span>
                {currentTimelineStage.description ? (
                  <span className="mt-1 block text-xs text-[#767676]">
                    {currentTimelineStage.description}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <h4 className="mb-3 text-[11px] text-[#767676]">PAYMENTS</h4>
            {booking.payments?.map(payment => (
              <div
                key={payment.id}
                className="mb-2 flex justify-between rounded-xl  bg-[#F3F3F3] p-3"
              >
                <span className="text-sm text-[#2E2E2E]">{payment.paymentType}</span>
                <span className="text-sm font-medium">
                  {formatDashboardCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => downloadReceipt(receiptData)}
              className="rounded-full border border-[#C6A15B] bg-[#FFFFFF] px-5 py-2 text-[#C6A15B]"
            >
              Download Receipt
            </button>

            <button className="flex items-center gap-2 rounded-full bg-[#C6A15B] px-5 py-2 text-white">
              Message Admin <ArrowIcon />
            </button>

            <button
              type="button"
              onClick={event => {
                event.stopPropagation()
                setShowCancel(prev => !prev)
              }}
              className="rounded-full px-5 py-2 border border-[#EDE5DA] bg-[#FFFFFF] text-[#9C8878] hover:bg-[#FAF6F1] hover:border-[#E7D3BC] text-[#C6A15B]"
            >
              Cancel Booking
            </button>
          </div>

          {showCancel ? (
            <div
              className="mt-4 rounded-xl border border-red-200 bg-[#FFF5F5] p-4"
              onClick={event => event.stopPropagation()}
            >
              <textarea
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="Reason..."
                className="w-full rounded-lg p-3 bg-[#FFFFFF]"
              />

              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    cancelMutation.mutate({
                      bookingId: booking.id,
                      body: { reason },
                    })
                  }}
                  className="rounded-full bg-[#CDB17E] hover:bg-[#C6AB7F] px-4 py-2 text-white"
                >
                  Confirm
                </button>

                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    setShowCancel(false)
                  }}
                  className="rounded-full px-4 py-2 border border-[#EDE5DA] bg-[#FFFFFF] text-[#9C8878] hover:bg-[#FAF6F1] hover:border-[#E7D3BC] text-[#C6A15B]"
                >
                  Abort
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export default function BookingDetailsAccordion() {
  const { data: bookings = [] } = useDashboardBookings('all')
  const { data: session } = useDashboardSession()

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-2xl text-[#2E2E2E]">Booking Details</h1>
        <p className="text-sm text-gray-500">Click on a booking to view full details</p>
      </div>

      {bookings.map(booking => (
        <BookingAccordionCard key={booking.id} booking={booking} session={session} />
      ))}
    </div>
  )
}
