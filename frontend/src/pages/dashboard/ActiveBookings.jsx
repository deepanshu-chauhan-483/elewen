import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardBookings, useDashboardSession } from '../../hooks/useDashboardData'
import {
  formatDashboardCurrency,
  formatDashboardDate,
} from '../../components/dashboard/dashboardUtils'
import { DashboardErrorState, DashboardLoadingState } from '../../components/dashboard/DashboardUI'
import EmptyBooking from '../../components/dashboard/EmptyBooking'
import { buildReceiptData, downloadReceipt } from '../../lib/receipt'

const CloseToggleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6L18 18M18 6L6 18" stroke="#957960" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

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

const NextStepIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8.00016 4.00065V8.00065L10.6668 9.33398M14.6668 8.00065C14.6668 11.6825 11.6821 14.6673 8.00016 14.6673C4.31826 14.6673 1.3335 11.6825 1.3335 8.00065C1.3335 4.31875 4.31826 1.33398 8.00016 1.33398C11.6821 1.33398 14.6668 4.31875 14.6668 8.00065Z"
      stroke="#957960"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const DetailsArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.33301 8.00065H12.6663M12.6663 8.00065L7.99967 3.33398M12.6663 8.00065L7.99967 12.6673"
      stroke="#FAFAFA"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function normalizeStatus(status) {
  const value = String(status ?? '').toLowerCase()

  if (value === 'confirmed') return 'confirmed'
  if (['new', 'info_collection'].includes(value)) return 'upcoming'
  return 'in-progress'
}

function getStatusLabel(status) {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'upcoming') return 'Upcoming'
  return 'In Progress'
}

function getStatusTone(status) {
  if (status === 'confirmed') return 'bg-[#E0F6ED] text-[#238E64]'
  if (status === 'upcoming') return 'bg-[#E0EAFD] text-[#3061C6]'
  return 'bg-[#FEF1DE] text-[#C07318]'
}

function getSubtitle(booking) {
  return [booking?.event?.name, booking?.package?.serviceCategories?.[0]?.name]
    .filter(Boolean)
    .join(' · ')
}

function getNextStepText(booking) {
  return booking?.latestStatusLog?.note || `Latest status: ${booking?.statusLabel || 'In Progress'}`
}

const StatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full px-3 py-1 text-xs ${getStatusTone(status)}`}>
    {getStatusLabel(status)}
  </span>
)

function BookingCard({ booking, session }) {
  const [open, setOpen] = useState(false)
  const status = normalizeStatus(booking?.status)
  const isConfirmed = status === 'confirmed'
  const title = booking?.package?.title || booking?.event?.name || 'Booking'
  const subtitle = getSubtitle(booking)
  const location = booking?.locationSummary || 'Location pending'
  const amountPaid = formatDashboardCurrency(booking?.paymentSummary?.amountPaid)
  const amountDue = formatDashboardCurrency(booking?.paymentSummary?.amountDue)
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
      className={`rounded-2xl bg-[#FFFFFF] p-6 transition-all ${
        status === 'in-progress'
          ? 'border-l-4 border-[#C07318]'
          : status === 'upcoming'
            ? 'border-l-4 border-[#3061C6]'
            : open
              ? 'border-t-4 border-[#238E64]'
              : 'border-l-4 border-[#238E64]'
      }`}
      onClick={isConfirmed ? () => setOpen(current => !current) : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 md:justify-start">
            <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E] md:text-lg">
              {title}
            </h3>

            <div className="shrink-0 md:pt-0.5">
              <StatusBadge status={status} />
            </div>
          </div>

          {!isConfirmed ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle || 'Active booking'}</p>
          ) : null}
        </div>

        {isConfirmed ? (
          <div className="hidden shrink-0 items-start gap-3 md:flex">
            {open ? (
              <>
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    downloadReceipt(receiptData)
                  }}
                  className="rounded-full border border-[#CDB17E] px-4 py-2 text-sm text-[#957960]"
                >
                  Download Receipt
                </button>

                <Link
                  to={`/user-dashboard/details?bookingId=${booking.id}`}
                  className="flex items-center rounded-full bg-[#CDB17E] px-4 py-2 text-sm text-white"
                  aria-label="View booking details"
                  onClick={event => event.stopPropagation()}
                >
                  View Details
                  <span className="pl-2">
                    <DetailsArrowIcon />
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    setOpen(false)
                  }}
                  aria-label="Collapse booking card"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[#957960] transition-colors hover:bg-[#E9E3DC]"
                >
                  <CloseToggleIcon />
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        {!open ? (
          <div className="mt-2 hidden shrink-0 gap-[24px] text-sm md:flex md:gap-[32px]">
            <div className="flex flex-col">
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p className="font-medium">{amountPaid}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p className="font-medium">{amountDue}</p>
            </div>
          </div>
        ) : null}
      </div>

      {!isConfirmed ? (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <CalendarIcon />
          <span>{formatDashboardDate(booking?.eventDate)}</span>
        </div>
      ) : null}

      {isConfirmed && open ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[#00000033] pt-4 text-sm">
            <div>
              <p className="text-[11px] text-[#767676]">EVENT TYPE</p>
              <p>{booking?.event?.name || 'Event pending'}</p>
            </div>

            <div>
              <p className="text-[11px] text-[#767676]">DATE</p>
              <p>{formatDashboardDate(booking?.eventDate)}</p>
            </div>

            <div>
              <p className="text-[11px] text-[#767676]">LOCATION</p>
              <p>{location}</p>
            </div>

            <div>
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p>{amountPaid}</p>
            </div>

            <div>
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p>{amountDue}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start gap-2 rounded-xl bg-[#E9E3DC] p-4 text-sm">
            <div className="flex">
              <p className="text-[11px] text-[#957960]">NEXT STEP</p>
            </div>
            <div className="flex items-start">
              <span className="pt-0.5">
                <NextStepIcon />
              </span>
              <span className="pl-3 text-[14px] leading-[1.35] text-[#957960] md:text-[18px]">
                {getNextStepText(booking)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3 md:hidden">
            <button
              type="button"
              onClick={event => {
                event.stopPropagation()
                downloadReceipt(receiptData)
              }}
              className="rounded-full border border-[#CDB17E] px-6 py-3 text-[14px] font-medium text-[#957960]"
            >
              Download Receipt
            </button>

            <Link
              to={`/user-dashboard/details?bookingId=${booking.id}`}
              className="flex items-center rounded-full bg-[#CDB17E] px-6 py-3 text-[14px] font-medium text-white"
              aria-label="View booking details"
              onClick={event => event.stopPropagation()}
            >
              View Details
              <span className="pl-3">
                <DetailsArrowIcon />
              </span>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default function ActiveBookings() {
  const { data: bookings = [], isLoading, error } = useDashboardBookings('active')
  const { data: session } = useDashboardSession()

  if (isLoading) {
    return <DashboardLoadingState title="Loading active bookings..." />
  }

  if (error) {
    return <DashboardErrorState title="We could not load active bookings." />
  }

  if (bookings.length === 0) {
    return (
      <EmptyBooking
        title="No active bookings yet"
        body="Your ongoing events will appear here once a booking is created."
        actionLabel="Explore Packages"
        actionTo="/package-listing"
      />
    )
  }

  return (
    <div className="space-y-6 bg-[#F2F2F2]">
      <div>
        <h1 className="text-2xl font-serif text-[#2E2E2E]">Active Bookings</h1>
        <p className="text-sm text-gray-500">Track and manage your ongoing events</p>
      </div>

      {bookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} session={session} />
      ))}
    </div>
  )
}
