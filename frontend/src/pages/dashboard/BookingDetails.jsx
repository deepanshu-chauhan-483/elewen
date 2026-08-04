import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../../components/common/useToast'
import { useDashboardSearch } from '../../components/dashboard/useDashboardSearch'
import { DashboardEmptyState } from '../../components/dashboard/DashboardUI'
import {
  useDashboardBookings,
  useDashboardBookingTimeline,
  useDashboardCancelBooking,
  useDashboardSession,
} from '../../hooks/useDashboardData'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCancellationPolicy } from '../../hooks/useCancellationPolicy'
import { useBookingCancellationToastMessage } from '../../hooks/useMessagingContent'
import { usePackages } from '../../hooks/usePackages'
import {
  formatDashboardCurrency,
  formatDashboardDate,
  formatDashboardDateTime,
  matchesDashboardSearch,
} from '../../components/dashboard/dashboardUtils'
import {
  getBookingPackageNames,
  getBookingPackageNamesText,
  getPackageLineLabel,
  getPackageLineSubtitle,
  parseBookingItemTitle,
} from '../../lib/bookingDisplay'
import { buildReceiptData, downloadReceipt } from '../../lib/receipt'
import EmptyBooking from '../../components/dashboard/EmptyBooking'

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
      additionalInfo: meta?.additionalInfo ?? '',
      amount: item?.totalPrice ?? 0,
    })
  }

  if (!rows.length && booking?.package?.title) {
    rows.unshift({
      id: `package-${booking?.id ?? 'row'}`,
      title: booking.package.title,
      includes: '',
      additionalInfo: '',
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

function normalizePackageTitle(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function buildPackageIncludesSections(booking, packages = []) {
  const packageNames = getBookingPackageNames(booking)
  const packageCatalog = Array.isArray(packages) ? packages : []
  const fallbackIncludes = buildPackageIncludesRows(booking)

  const sections = packageNames
    .map((packageName, index) => {
      const normalizedPackageName = normalizePackageTitle(packageName)
      const matchedPackage =
        packageCatalog.find(pkg => normalizePackageTitle(pkg?.title) === normalizedPackageName) ??
        (normalizePackageTitle(booking?.package?.title) === normalizedPackageName
          ? booking.package
          : null)

      const includes = Array.isArray(matchedPackage?.detail_inclusions)
        ? matchedPackage.detail_inclusions.filter(Boolean).slice(0, 12)
        : []

      if (!includes.length) return null

      return {
        id: `${booking?.id ?? 'booking'}-include-section-${index}`,
        title: matchedPackage?.title || packageName || booking?.package?.title || 'Package',
        includes,
      }
    })
    .filter(Boolean)

  if (sections.length) return sections

  return fallbackIncludes.length
    ? [
        {
          id: `${booking?.id ?? 'booking'}-include-section-fallback`,
          title: booking?.package?.title || packageNames[0] || 'Package',
          includes: fallbackIncludes,
        },
      ]
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

function buildPaymentDetailRows(booking) {
  const paymentSummary = booking?.paymentSummary ?? {}

  const advanceAmount = paymentSummary?.advanceAmount ?? booking?.advanceAmount ?? 0

  const remainingAmount = paymentSummary?.scheduledRemainingAmount ?? booking?.remainingAmount ?? 0

  const totalAmount = paymentSummary?.totalPrice ?? booking?.totalPrice ?? 0

  const advancePaidAt = paymentSummary?.advancePaidAt || booking?.bookedAt || null

  const remainingPaidAt = paymentSummary?.remainingPaidAt || booking?.remainingPaidAt || null

  return [
    {
      id: `${booking?.id ?? 'booking'}-payment-advance`,
      label: 'Advance',
      amount: advanceAmount,
      bookedAt: advancePaidAt,
    },
    {
      id: `${booking?.id ?? 'booking'}-payment-remaining`,
      label: 'Remaining',
      amount: remainingAmount,
      bookedAt: remainingPaidAt,
    },
    {
      id: `${booking?.id ?? 'booking'}-payment-total`,
      label: 'Total',
      amount: totalAmount,
      bookedAt: remainingPaidAt,
      isTotal: true,
    },
  ]
}

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

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-5 w-5 text-[#8F8F8F] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function CancellationPolicyModal({
  open,
  policyBody,
  refundPreview,
  booking,
  reason,
  hasAcceptedPolicy,
  isSubmitting,
  onReasonChange,
  onAcceptanceChange,
  onClose,
  onConfirm,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 px-4 py-6 md:px-6 hide-scrollbar"
      data-denis-prevent
      style={{
        left: typeof window !== 'undefined' && window.innerWidth >= 768 ? '260px' : '0px',
      }}
      onClick={onClose}
    >
      <div
        className="max-h-[84vh] w-full max-w-[460px] overflow-y-auto rounded-[22px] bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:p-5 hide-scrollbar"
        onClick={event => event.stopPropagation()}
        data-lenis-prevent
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[20px] text-[#1C1C1C]">Cancel Booking</h3>
            <p className="mt-1 text-sm leading-5 text-[#6B7280]">
              Refund is calculated from your booking timestamp, not the event date.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#957960] transition hover:bg-[#F3EEE8] p-2"
            aria-label="Close cancellation popup"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="#1C1C1C"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-3 rounded-2xl border border-[#E7D9C7] bg-[#FBF7F3] p-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#957960]">
            Cancellation Policy
          </p>
          <p className="mt-2 whitespace-pre-line text-[13px] leading-5 text-[#364022]">
            {policyBody || 'Cancellation policy is currently unavailable.'}
          </p>
        </div>

        <div className="mt-3 rounded-2xl border border-[#E4DED8] bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#957960]">
            Refund Summary
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8F8F8F]">Booked On</p>
              <p className="mt-1 text-sm text-[#2E2E2E]">
                {formatDashboardDateTime(refundPreview?.bookedAt || booking?.bookedAt)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8F8F8F]">Event</p>
              <p className="mt-1 text-sm text-[#2E2E2E]">
                {formatDashboardDate(booking?.eventDate)}
                {booking?.eventTime ? ` · ${booking.eventTime}` : ''}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8F8F8F]">Window</p>
              <p className="mt-1 text-sm text-[#2E2E2E]">
                {refundPreview?.windowLabel || 'Policy unavailable'}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8F8F8F]">
                Refundable Amount
              </p>
              <p className="mt-1 text-sm font-medium text-[#2E2E2E]">
                {formatDashboardCurrency(refundPreview?.refundableAmount ?? 0)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm leading-5 text-[#6B7280]">
            {refundPreview?.ruleText || 'No refund rule is available for this cancellation.'}
          </p>
          {refundPreview?.refundNote ? (
            <p className="mt-1.5 text-xs leading-5 text-[#8F8F8F]">{refundPreview.refundNote}</p>
          ) : null}
        </div>

        <div className="mt-3">
          <label
            htmlFor="dashboard-cancel-reason"
            className="mb-2 block text-sm font-medium text-[#2E2E2E]"
          >
            Reason for cancellation
          </label>
          <textarea
            id="dashboard-cancel-reason"
            value={reason}
            onChange={event => onReasonChange(event.target.value)}
            placeholder="Please share your reason..."
            rows={3}
            className="w-full rounded-2xl border border-[#E4DED8] bg-white px-4 py-3 text-sm text-[#2E2E2E] outline-none transition focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E]"
          />
        </div>

        <label className="mt-3 flex items-start gap-3 rounded-2xl border border-[#E4DED8] bg-[#FFFFFF] px-4 py-3">
          <input
            type="checkbox"
            checked={hasAcceptedPolicy}
            onChange={event => onAcceptanceChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#C6A15B]"
          />
          <span className="text-sm leading-6 text-[#2E2E2E]">
            I have read and accept the cancellation policy and want to continue with this
            cancellation.
          </span>
        </label>

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#EDE5DA] bg-white px-5 py-2.5 text-[#9C8878] transition hover:border-[#E7D3BC] hover:bg-[#FAF6F1]"
          >
            Back
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !reason.trim() || !hasAcceptedPolicy}
            className="rounded-full bg-[#CDB17E] px-5 py-2.5 text-white transition hover:bg-[#C6AB7F] disabled:cursor-not-allowed disabled:bg-[#D7D0C6]"
          >
            {isSubmitting ? 'Cancelling...' : 'Accept & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

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

function BookingAccordionCard({ booking, session, packages, defaultOpen = false }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [open, setOpen] = useState(defaultOpen)
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [hasAcceptedPolicy, setHasAcceptedPolicy] = useState(false)
  const selectedItemRows = buildSelectedItemRows(booking)
  const packageNames = getBookingPackageNames(booking)
  const packageIncludesSections = useMemo(
    () => buildPackageIncludesSections(booking, packages),
    [booking, packages]
  )
  const hasMultiplePackages = packageNames.length > 1
  const addonDetailRows = buildAddonDetailRows(booking)
  const paymentDetailRows = useMemo(() => buildPaymentDetailRows(booking), [booking])
  const amountPaidDisplay = paymentDetailRows[0]?.amount ?? 0
  const remainingBalanceDisplay = paymentDetailRows[1]?.amount ?? 0
  const cancelMutation = useDashboardCancelBooking()
  const { data: cancellationPolicy } = useCancellationPolicy()
  const {
    data: bookingCancellationToastMessage = 'Your booking has been cancelled successfully.',
  } = useBookingCancellationToastMessage()
  const { data: timelineData = [] } = useDashboardBookingTimeline(open ? booking?.id : null)
  // const { showToast } = useToast()
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

  useEffect(() => {
    if (!cancelMutation.isSuccess) return

    showToast({ message: bookingCancellationToastMessage })

    queueMicrotask(() => {
      setShowCancel(false)
      setReason('')
      setHasAcceptedPolicy(false)
      setOpen(false)
    })
  }, [bookingCancellationToastMessage, cancelMutation.isSuccess, showToast])

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

          {/* Right — amounts + chevron (hidden when open) */}
          <div className="flex shrink-0 items-start gap-6">
            {!open && (
              <div className="hidden gap-[24px] text-sm md:flex md:gap-[32px]">
                <div className="flex flex-col">
                  <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {formatDashboardCurrency(amountPaidDisplay)}
                  </p>
                </div>

                <div className="flex flex-col">
                  <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {formatDashboardCurrency(remainingBalanceDisplay)}
                  </p>
                </div>
              </div>
            )}

            <ChevronIcon open={open} />
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 text-sm text-[#1C1C1C]">
          <CalendarIcon />
          <div className="space-y-1">
            <p>{formatDashboardDate(booking.eventDate)}</p>
          </div>
        </div>

        {!open ? (
          <div className="mt-4 flex gap-10 text-sm md:hidden">
            <div className="flex flex-col">
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p className="font-medium">{formatDashboardCurrency(amountPaidDisplay)}</p>
            </div>

            <div className="flex flex-col">
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p className="font-medium">{formatDashboardCurrency(remainingBalanceDisplay)}</p>
            </div>
          </div>
        ) : null}
      </div>

      {open ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[#00000033] py-6 text-sm md:grid-cols-3">
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
              <p className="text-[11px] text-[#767676]">EVENT DATE</p>
              <p>{formatDashboardDate(booking.eventDate)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">EVENT TIME</p>
              <p>{booking.eventTime || 'Pending'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">BOOKED ON</p>
              <p>{formatDashboardDateTime(booking.bookedAt)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p>{formatDashboardCurrency(amountPaidDisplay)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p>{formatDashboardCurrency(remainingBalanceDisplay)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">SPECIAL REQUEST</p>
              <p>{booking.specialRequest || 'Not provided'}</p>
            </div>
          </div>

          <div className="py-6 border-t border-[#00000033]">
            <h4 className="mb-3 text-[11px] text-[#767676]">SELECTED ITEMS</h4>
            <div className="space-y-2">
              {selectedItemRows.map(item => (
                <div key={item.id} className="flex justify-between rounded-xl bg-[#F3F3F3] p-3">
                  <div className="min-w-0 pr-4">
                    <span className="block text-sm">{item.title}</span>
                    {item.additionalInfo ? (
                      <span className="mt-1 block text-xs text-[#767676]">
                        Additional Info: {item.additionalInfo}
                      </span>
                    ) : null}
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

          {packageIncludesSections.length ? (
            <div className="py-6 border-t border-[#00000033]">
              <h4 className="mb-3 text-[11px] text-[#767676]">INCLUDES</h4>
              <div className="space-y-4">
                {packageIncludesSections.map(section => (
                  <div key={section.id}>
                    {hasMultiplePackages ? (
                      <p className="mb-2 text-sm font-medium text-[#2E2E2E]">{section.title}</p>
                    ) : null}
                    <div className="space-y-2">
                      <ul className="space-y-2 list-disc pl-5 text-[#767676]">
                        {section.includes.map((item, index) => (
                          <li
                            key={`${section.id}-item-${index}`}
                            className="rounded-xl text-sm text-[#767676]"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {addonDetailRows.length ? (
            <div className="py-6 border-t border-[#00000033]">
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
            <div className="py-6 border-t border-[#00000033]">
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

          <div className="border-t border-[#00000033] py-6">
            <h4 className="mb-3 text-[11px] text-[#767676]">PAYMENTS</h4>

            {/* Single background wrapper */}
            <div className="rounded-xl bg-[#F3F3F3] p-3">
              {paymentDetailRows.map((payment, index) => (
                <div
                  key={payment.id}
                  className={index !== paymentDetailRows.length - 1 ? 'mb-3' : ''}
                >
                  <div
                    className={`flex justify-between ${
                      payment.isTotal ? 'border-t border-[#00000033] pt-3' : ''
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm ${payment.isTotal ? 'font-medium text-[#1C1C1C]' : 'text-[#2E2E2E]'}`}
                      >
                        {payment.label}
                      </p>
                      <p className="mt-0.5 text-xs text-[#767676]">
                        {payment.bookedAt ? formatDashboardDateTime(payment.bookedAt) : 'Pending'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-medium ${payment.isTotal ? 'text-[#1C1C1C]' : 'text-[#2D2D2D]'}`}
                      >
                        {formatDashboardCurrency(payment.amount)}
                      </span>
                      {/* <StatusBadge status={p.status} /> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={() => downloadReceipt(receiptData)}
              className="rounded-full px-4 py-2 border border-[#CDB17E] bg-[#FFFFFF] hover:bg-[#FAF6F1] text-[#CDB17E]"
            >
              Download Receipt
            </button>

            <button
              type="button"
              onClick={event => {
                event.stopPropagation()
                navigate(`/user-dashboard/messages`)
              }}
              className="flex items-center gap-2 rounded-full bg-[#CDB17E] hover:bg-[#C6AB7F] px-4 py-2 text-white transition"
            >
              Message Admin <ArrowIcon />
            </button>

            <button
              type="button"
              onClick={event => {
                event.stopPropagation()
                setShowCancel(true)
                setReason('')
                setHasAcceptedPolicy(false)
              }}
              className="rounded-full px-4 py-2 border border-[#CDB17E] bg-[#FFFFFF] hover:bg-[#FAF6F1] text-[#CDB17E]"
            >
              Cancel Booking
            </button>
          </div>
        </>
      ) : null}

      <CancellationPolicyModal
        open={showCancel}
        policyBody={cancellationPolicy?.body ?? ''}
        refundPreview={booking?.refundPreview}
        booking={booking}
        reason={reason}
        hasAcceptedPolicy={hasAcceptedPolicy}
        isSubmitting={cancelMutation.isPending}
        onReasonChange={setReason}
        onAcceptanceChange={setHasAcceptedPolicy}
        onClose={() => {
          setShowCancel(false)
          setReason('')
          setHasAcceptedPolicy(false)
        }}
        onConfirm={() => {
          cancelMutation.mutate({
            bookingId: booking.id,
            body: { reason: reason.trim(), policyAcknowledged: true },
          })
        }}
      />
    </div>
  )
}

export default function BookingDetailsAccordion() {
  const [searchParams] = useSearchParams()
  const requestedBookingId = searchParams.get('bookingId') || ''
  // const { data: bookings = [] } = useDashboardBookings('all')
  const { data: session } = useDashboardSession()
  const { data: packages = [] } = usePackages()
  const { searchTerm } = useDashboardSearch()
  const debouncedSearchTerm = useDebouncedValue(searchTerm)
  const { data: bookings = [] } = useDashboardBookings('all', { search: debouncedSearchTerm })
  // const { data: session } = useDashboardSession()
  const visibleBookings = useMemo(
    () =>
      bookings.filter(booking => {
        const normalizedStatus = String(booking?.status ?? '')
          .trim()
          .toLowerCase()
        return !['cancelled', 'canceled'].includes(normalizedStatus)
      }),
    [bookings]
  )
  const filteredBookings = useMemo(
    () =>
      visibleBookings.filter(booking =>
        matchesDashboardSearch(debouncedSearchTerm, [
          getBookingPackageNamesText(booking, 'Booking'),
          booking?.detailSubtitle,
          booking?.event?.name,
          booking?.package?.title,
          booking?.locationSummary,
          booking?.status,
          booking?.statusLabel,
          booking?.specialRequest,
          ...(booking?.items ?? []).map(item => item?.title),
        ])
      ),
    [debouncedSearchTerm, visibleBookings]
  )

  if (visibleBookings.length === 0) {
    return (
      <EmptyBooking
        title="No bookings available yet"
        body="Your booking details and event information will appear here once a booking is created."
        actionLabel="Explore Packages"
        actionTo="/package-listing"
      />
    )
  }

  if (visibleBookings.length > 0 && filteredBookings.length === 0) {
    return (
      <DashboardEmptyState
        title="No bookings match your search"
        body="Try searching by booking name, package, location, item, or status."
      />
    )
  }

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-2xl text-[#2E2E2E]">Booking Details</h1>
        <p className="text-sm text-gray-500">Click on a booking to view full details</p>
      </div>

      {bookings.map(booking => (
        <BookingAccordionCard
          key={booking.id}
          booking={booking}
          session={session}
          packages={packages}
          defaultOpen={requestedBookingId && String(booking.id) === String(requestedBookingId)}
        />
      ))}
    </div>
  )
}
