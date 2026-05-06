import { useState } from 'react'
import { useDashboardBookings, useDashboardCancelBooking } from '../../hooks/useDashboardData'
import {
  formatDashboardCurrency,
  formatDashboardDate,
} from '../../components/dashboard/dashboardUtils'

const CART_META_SEPARATOR = '||__ELEWEN_META__||'

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
    confirmed: 'bg-[#E0F6ED] text-[#238E64]',
    'in-progress': 'bg-[#FEF1DE] text-[#C07318]',
    upcoming: 'bg-[#E0EAFD] text-[#3061C6]',
  }

  const labels = {
    confirmed: 'Confirmed',
    'in-progress': 'In Progress',
    upcoming: 'Upcoming',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${styles[status] || 'bg-[#F3F3F3] text-[#2E2E2E]'}`}
    >
      {labels[status] || status}
    </span>
  )
}

function BookingAccordionCard({ booking }) {
  const [open, setOpen] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')
  const cancelMutation = useDashboardCancelBooking()

  const borderColor =
    booking.status === 'confirmed'
      ? 'border-[#238E64]'
      : booking.status === 'in-progress'
        ? 'border-[#C07318]'
        : 'border-[#3061C6]'

  return (
    <div
      className={`rounded-2xl border-l-4 bg-white p-6 shadow-sm transition hover:shadow-md ${borderColor}`}
    >
      <div className="cursor-pointer" onClick={() => setOpen(prev => !prev)}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 md:justify-start">
              <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E] md:text-lg">
                {booking.package?.title || 'Booking'}
              </h3> 

              <div className="shrink-0 md:pt-0.5">
                <StatusBadge status={booking.status} />
              </div>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {booking.event?.name} · {booking.locationSummary}
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

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
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
              <p className="text-[11px] text-[#767676]">EVENT</p>
              <p>{booking.event?.name}</p>
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
              {booking.items?.map(item => (
                <div key={item.id} className="flex justify-between rounded-xl bg-[#F3F3F3] p-3">
                  <span className="text-sm">{getSelectedItemDisplay(item.title)}</span>
                  <span className="text-sm font-medium">
                    {formatDashboardCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-[11px] text-[#767676]">PAYMENTS</h4>
            {booking.payments?.map(payment => (
              <div key={payment.id} className="mb-2 flex justify-between rounded-xl border p-3">
                <span className="text-sm text-[#2E2E2E]">{payment.paymentType}</span>
                <span className="text-sm font-medium">
                  {formatDashboardCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-full bg-[#C6A15B] px-5 py-2 text-white">
              Message Admin <ArrowIcon />
            </button>

            <button
              type="button"
              onClick={() => setShowCancel(prev => !prev)}
              className="rounded-full px-5 py-2 bg-[#FFFFFF] border border-[#C6A15B] text-[#C6A15B]"
            >
              Cancel Booking
            </button>
          </div>

          {showCancel ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-[#FFF5F5] p-4">
              <textarea
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder="Reason..."
                className="w-full rounded-lg p-3 bg-[#FFFFFF]"
              />

              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    cancelMutation.mutate({
                      bookingId: booking.id,
                      body: { reason },
                    })
                  }
                  className="rounded-full bg-[#591902] px-4 py-2 text-white"
                >
                  Confirm
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancel(false)}
                  className="rounded-full px-4 py-2 bg-[#FFFFFF] text-[#C6A15B]"
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

  return (
    <div className="space-y-6 bg-[#F2F2F2] p-6">
      <div>
        <h1 className="text-2xl text-[#2E2E2E]">Booking Details</h1>
        <p className="text-sm text-gray-500">Click on a booking to view full details</p>
      </div>

      {bookings.map(booking => (
        <BookingAccordionCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}
