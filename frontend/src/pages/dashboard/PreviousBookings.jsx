import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardSearch } from '../../components/dashboard/useDashboardSearch'
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
  StatusPill,
} from '../../components/dashboard/DashboardUI'
import { useDashboardBookings, useDashboardSession } from '../../hooks/useDashboardData'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  formatDashboardCurrency,
  formatDashboardDate,
  matchesDashboardSearch,
} from '../../components/dashboard/dashboardUtils'
import EmptyBooking from '../../components/dashboard/EmptyBooking'
import { buildReceiptData, downloadReceipt } from '../../lib/receipt'

const CART_META_SEPARATOR = '||__ELEWEN_META__||'
const CART_ADDITIONAL_INFO_KEY = '__additional_info__'

function isTerminalPreviousBooking(booking) {
  const normalizedStatus = String(booking?.status ?? '')
    .trim()
    .toLowerCase()

  return ['completed', 'cancelled', 'canceled'].includes(normalizedStatus)
}

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
  if (serviceSlug === 'bartending') return `/packages/bartending-single/${packageId}`
  if (serviceSlug === 'catering') return `/packages/catering-single/${packageId}`
  if (serviceSlug) return `/packages/${serviceSlug}/${packageId}`
  return '/package-listing'
}

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M6.66667 1.66602V4.99935M13.3333 1.66602V4.99935M2.5 8.33268H17.5M4.16667 3.33268H15.8333C16.7538 3.33268 17.5 4.07887 17.5 4.99935V16.666C17.5 17.5865 16.7538 18.3327 15.8333 18.3327H4.16667C3.24619 18.3327 2.5 17.5865 2.5 16.666V4.99935C2.5 4.07887 3.24619 3.33268 4.16667 3.33268Z"
      stroke="#1C1C1C"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="#fff" strokeWidth="1.5" />
  </svg>
)

function getSelectedItemDisplay(title = '') {
  const rawTitle = String(title ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) return displayTitle || rawTitle

  try {
    const parsed = JSON.parse(metaPart)
    const itemType = parsed?.itemType ?? 'package'
    const addonTitle = String(parsed?.addonTitle ?? '').trim()
    const selectedOptions = parsed?.selectedOptions

    if (itemType === 'addon') {
      const optionValues =
        selectedOptions && typeof selectedOptions === 'object'
          ? Object.entries(selectedOptions)
              .filter(
                ([key]) =>
                  String(key ?? '')
                    .trim()
                    .toLowerCase() !== CART_ADDITIONAL_INFO_KEY
              )
              .map(([, value]) => value)
              .filter(Boolean)
          : []

      return optionValues.length
        ? `${addonTitle || displayTitle || rawTitle} (${optionValues.join(', ')})`
        : addonTitle || displayTitle || rawTitle
    }

    if (selectedOptions && typeof selectedOptions === 'object') {
      const values = Object.entries(selectedOptions)
        .filter(
          ([key]) =>
            String(key ?? '')
              .trim()
              .toLowerCase() !== CART_ADDITIONAL_INFO_KEY
        )
        .map(([, value]) => value)
        .filter(Boolean)
      if (values.length) return values.join(', ')
    }
  } catch {
    return displayTitle || rawTitle
  }

  return displayTitle || rawTitle
}

function getSelectedItemAdditionalInfo(title = '') {
  const rawTitle = String(title ?? '')
  const [, metaPart] = rawTitle.split(CART_META_SEPARATOR)
  if (!metaPart) return ''

  try {
    const parsed = JSON.parse(metaPart)
    const selectedOptions =
      parsed?.selectedOptions && typeof parsed.selectedOptions === 'object'
        ? parsed.selectedOptions
        : {}
    return String(
      parsed?.additionalInfo ?? selectedOptions?.[CART_ADDITIONAL_INFO_KEY] ?? ''
    ).trim()
  } catch {
    return ''
  }
}

function ClaimCouponPanel({ onClose }) {
  return (
    <div
      className="mt-4 rounded-2xl border border-[#E7D2C4] bg-[#FBF7F3] p-5"
      onClick={event => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#2E2E2E]">Claim Rs. 350 off!</p>
          <p className="mt-2 text-xs leading-5 text-[#6B7280]">
            We know leaving reviews isn&apos;t everyone&apos;s favorite task. So here&apos;s a Thank
            you from us:
          </p>
          <p className="mt-2 text-xs leading-5 text-[#6B7280]">
            Leave a review on our website and send us a screenshot of your review on:{' '}
            <a
              href="https://wa.me/919810937700"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#957960] underline underline-offset-2"
              onClick={event => event.stopPropagation()}
            >
              +91 9810937700
            </a>
            {' / '}
            mail the screenshot at{' '}
            <a
              href="mailto:info@elewen.co.in"
              className="font-medium text-[#957960] underline underline-offset-2"
              onClick={event => event.stopPropagation()}
            >
              info@elewen.co.in
            </a>
            . We will send across your unique coupon code for all your efforts!
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8F8F8F] transition hover:bg-[#EDE5DA]"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function PreviousBookingCard({ booking, session }) {
  const [open, setOpen] = useState(false)
  const [showRefer, setShowRefer] = useState(false)
  const normalizedStatus = String(booking?.status ?? '').toLowerCase()
  const isCancelled = ['cancelled', 'canceled'].includes(normalizedStatus)
  const cancellationReason = isCancelled
    ? String(booking?.latestStatusLog?.note ?? '').trim() || 'No reason provided.'
    : ''
  const title = booking?.package?.title || booking?.event?.name || 'Booking'
  const subtitle = [booking?.detailSubtitle].filter(Boolean).join(' · ')
  const additionalInfo = (Array.isArray(booking?.items) ? booking.items : [])
    .map(item => getSelectedItemAdditionalInfo(item?.title))
    .filter(Boolean)
    .join(' | ')
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

  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md ${
        open ? 'border-t-4' : 'border-l-4'
      } ${isCancelled ? 'border-[#591902]' : 'border-[#238E64]'}`}
      onClick={() => setOpen(current => !current)}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 md:justify-start">
            <h2 className="text-[17px] font-medium leading-tight text-[#2E2E2E] md:text-lg">
              {title}
            </h2>

            <div className="shrink-0 md:pt-0.5">
              {isCancelled ? (
                <span className="inline-flex rounded-full bg-[#F8E7E2] px-3 py-1 text-xs font-medium text-[#591902]">
                  {booking?.statusLabel || 'Cancelled'}
                </span>
              ) : (
                <StatusPill label={booking?.statusLabel || 'Completed'} status="completed" />
              )}
            </div>
          </div>

          {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}

          <div className="mt-4 flex items-center gap-2 text-sm text-[#1C1C1C]">
            <CalendarIcon />
            <span>{formatDashboardDate(booking?.eventDate)}</span>
          </div>
        </div>

        <div className="flex min-w-[220px] flex-col gap-4 text-sm text-[#111827] lg:items-end lg:text-right">
          <div>
            <p className="text-[11px] text-[#767676]">FINAL PAID</p>
            <p className="font-medium">
              {formatDashboardCurrency(booking?.paymentSummary?.amountPaid)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              to={getBookAgainHref(booking)}
              onClick={event => event.stopPropagation()}
              className="flex items-center gap-2 rounded-full bg-[#CDB17E] px-4 py-2 text-white hover:bg-[#C6AB7F]"
            >
              Book Again <ArrowIcon />
            </Link>

            {open ? (
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  downloadReceipt(receiptData)
                }}
                className="inline-flex px-4 py-2 text-sm rounded-full border border-[#CDB17E] bg-[#FFFFFF] hover:bg-[#FAF6F1] text-[#CDB17E]"
              >
                Download Receipt
              </button>
            ) : null}

            <button
              type="button"
              onClick={event => {
                event.stopPropagation()
                setShowRefer(prev => !prev)
              }}
              className={`inline-flex rounded-full border px-4 py-2 text-sm transition ${
                showRefer
                  ? 'border-[#C6A15B] bg-[#FBF7F3] text-[#CDB17E]'
                  : 'border border-[#CDB17E] bg-[#FFFFFF] hover:bg-[#FAF6F1] text-[#CDB17E]'
              }`}
            >
              Claim your coupon
            </button>
          </div>
        </div>
      </div>

      {showRefer ? <ClaimCouponPanel onClose={() => setShowRefer(false)} /> : null}

      {open ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[#00000033] pt-6 text-sm md:grid-cols-3">
            <div>
              <p className="text-[11px] text-[#767676]">PACKAGE</p>
              <p>{title}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">DATE</p>
              <p>{formatDashboardDate(booking?.eventDate)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">LOCATION</p>
              <p>{booking.locationSummary || 'Not shared yet'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">GUESTS</p>
              <p>{booking.guestCount || 'Pending'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p>{formatDashboardCurrency(booking?.paymentSummary?.amountPaid)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p>{formatDashboardCurrency(booking?.paymentSummary?.amountDue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">ADDITIONAL INFO</p>
              <p>{additionalInfo || 'Not provided'}</p>
            </div>
          </div>

          {isCancelled ? (
            <div className="mt-6">
              <h4 className="mb-3 text-[11px] text-[#767676]">CANCELLATION REASON</h4>
              <div className="rounded-xl bg-[#F8E7E2] p-3 text-sm text-[#591902]">
                {cancellationReason}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <h4 className="mb-3 text-[11px] text-[#767676]">SELECTED ITEMS</h4>
            {booking.items?.length ? (
              <div className="space-y-2">
                {booking.items.map(item => (
                  <div key={item.id} className="flex justify-between rounded-xl bg-[#F3F3F3] p-3">
                    <div className="min-w-0 pr-4">
                      <span className="block text-sm">{getSelectedItemDisplay(item.title)}</span>
                      {getSelectedItemAdditionalInfo(item.title) ? (
                        <span className="mt-1 block text-xs text-[#767676]">
                          Additional Info: {getSelectedItemAdditionalInfo(item.title)}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium">
                      {formatDashboardCurrency(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-[#F3F3F3] p-3 text-sm text-[#6B7280]">
                No line items available.
              </div>
            )}
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-[11px] text-[#767676]">PAYMENTS</h4>
            {booking.payments?.length ? (
              booking.payments.map(payment => (
                <div
                  key={payment.id}
                  className="mb-2 flex justify-between rounded-xl bg-[#F3F3F3] p-3"
                >
                  <span className="text-sm">{payment.paymentType || 'Payment'}</span>
                  <span className="text-sm font-medium">
                    {formatDashboardCurrency(payment.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-[#F3F3F3] p-3 text-sm text-[#6B7280]">
                No payment entries available.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default function PreviousBookings() {
  // const { data: bookings = [], error } = useDashboardBookings('previous')
  const { data: session } = useDashboardSession()
  const { searchTerm } = useDashboardSearch()
  const debouncedSearchTerm = useDebouncedValue(searchTerm)
  const {
    data: bookings = [],
    error,
    isLoading,
  } = useDashboardBookings('previous', {
    search: debouncedSearchTerm,
  })
  const previousBookings = bookings.filter(isTerminalPreviousBooking)
  const filteredBookings = previousBookings.filter(booking =>
    matchesDashboardSearch(debouncedSearchTerm, [
      booking?.package?.title,
      booking?.event?.name,
      booking?.detailSubtitle,
      booking?.locationSummary,
      booking?.statusLabel,
      booking?.latestStatusLog?.note,
      ...(booking?.items ?? []).map(item => item?.title),
    ])
  )

  if (isLoading) {
    return <DashboardLoadingState title="Loading previous bookings..." />
  }

  if (error) {
    return <DashboardErrorState title="We could not load previous bookings." />
  }

  if (previousBookings.length === 0) {
    return (
      <EmptyBooking
        title="No previous bookings yet"
        body="Past events will be listed here once their date passes or they are marked complete."
      />
    )
  }

  if (!filteredBookings.length) {
    return (
      <DashboardEmptyState
        title="No previous bookings match your search"
        body="Try searching by package, event, location, item, or booking status."
      />
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Previous Bookings"
        subtitle="Look back at completed or past events with their final payment snapshot."
        meta={`${filteredBookings.length} past`}
      />

      {filteredBookings.map(booking => (
        <PreviousBookingCard key={booking.id} booking={booking} session={session} />
      ))}
    </div>
  )
}
