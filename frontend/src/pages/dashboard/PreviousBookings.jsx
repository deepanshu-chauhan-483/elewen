import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
  StatusPill,
} from '../../components/dashboard/DashboardUI'
import { useDashboardBookings } from '../../hooks/useDashboardData'
import {
  formatDashboardCurrency,
  formatDashboardDate,
} from '../../components/dashboard/dashboardUtils'
import EmptyBooking from '../../components/dashboard/EmptyBooking'

const CART_META_SEPARATOR = '||__ELEWEN_META__||'

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
  const [, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) return rawTitle

  try {
    const parsed = JSON.parse(metaPart)
    const selectedOptions = parsed?.selectedOptions

    if (selectedOptions && typeof selectedOptions === 'object') {
      const values = Object.values(selectedOptions).filter(Boolean)
      if (values.length) return values.join(', ')
    }
  } catch {
    return rawTitle.split(CART_META_SEPARATOR)[0] || rawTitle
  }

  return rawTitle.split(CART_META_SEPARATOR)[0] || rawTitle
}

function PreviousBookingCard({ booking }) {
  const [open, setOpen] = useState(false)
  const normalizedStatus = String(booking?.status ?? '').toLowerCase()
  const isCancelled = ['cancelled', 'canceled'].includes(normalizedStatus)
  const title = booking?.package?.title || booking?.event?.name || 'Booking'
  const subtitle = [booking?.event?.name, booking?.locationSummary].filter(Boolean).join(' · ')
  // const accentColor = isCancelled ? '#591902' : '#238E64'

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
              className="flex items-center gap-2 rounded-full bg-[#CDB17E] hover:bg-[#C6AB7F] px-5 py-2 text-white hover:opacity-90"
            >
              Book Again <ArrowIcon />
            </Link>
            <Link
              to={`/user-dashboard/support?bookingId=${booking.id}`}
              onClick={event => event.stopPropagation()}
              className="inline-flex rounded-full border border-[#EDE5DA] bg-[#FFFFFF] text-[#9C8878] hover:bg-[#FAF6F1] hover:border-[#E7D3BC] px-5 py-3 text-sm"
            >
              Refer a Friend
            </Link>
          </div>
        </div>
      </div>

      {open ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[#00000033] pt-6 text-sm md:grid-cols-3">
            <div>
              <p className="text-[11px] text-[#767676]">EVENT</p>
              <p>{booking.event?.name || 'Not shared yet'}</p>
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
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-[11px] text-[#767676]">SELECTED ITEMS</h4>
            {booking.items?.length ? (
              <div className="space-y-2">
                {booking.items.map(item => (
                  <div key={item.id} className="flex justify-between rounded-xl bg-[#F3F3F3] p-3">
                    <span className="text-sm">{getSelectedItemDisplay(item.title)}</span>
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
  const { data: bookings = [], isLoading, error } = useDashboardBookings('previous')

  if (isLoading) {
    return <DashboardLoadingState title="Loading previous bookings..." />
  }

  if (error) {
    return <DashboardErrorState title="We could not load previous bookings." />
  }

  if (bookings.length === 0) {
    return (
      <EmptyBooking
        title="No previous bookings yet"
        body="Past events will be listed here once their date passes or they are marked complete."
      />
    )
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Previous Bookings"
        subtitle="Look back at completed or past events with their final payment snapshot."
        meta={`${bookings.length} past`}
      />

      {bookings.map(booking => (
        <PreviousBookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
