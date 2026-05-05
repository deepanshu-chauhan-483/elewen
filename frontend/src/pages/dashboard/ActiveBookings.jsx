import { useState } from 'react'

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

const StatusBadge = ({ status }) => {
  const tone =
    status === 'confirmed'
      ? 'bg-[#E0F6ED] text-[#238E64]'
      : status === 'in-progress'
        ? 'bg-[#FEF1DE] text-[#C07318]'
        : 'bg-[#E0EAFD] text-[#3061C6]'

  const label =
    status === 'confirmed' ? 'Confirmed' : status === 'in-progress' ? 'In Progress' : 'Upcoming'

  return <span className={`inline-block rounded-full px-3 py-1 text-xs ${tone}`}>{label}</span>
}

const BookingCard = ({ status = 'in-progress' }) => {
  const [open, setOpen] = useState(false)
  const isConfirmed = status === 'confirmed'

  return (
    <div
      className={`rounded-2xl bg-[#F3F3F3] p-6 transition-all ${
        status === 'in-progress'
          ? 'border-l-4 border-[#C07318]'
          : status === 'upcoming'
            ? 'border-l-4 border-[#3061C6]'
            : 'border-t-4 border-[#238E64]'
      }`}
      onClick={isConfirmed ? () => setOpen(current => !current) : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 md:justify-start">
            <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E] md:text-lg">
              {isConfirmed ? 'Sharma Wedding Reception' : 'Kapoor Anniversary Dinner'}
            </h3>

            <div className="shrink-0 md:pt-0.5">
              <StatusBadge status={status} />
            </div>
          </div>

          {!isConfirmed ? (
            <p className="mt-1 text-sm text-gray-500">Anniversary · Catering</p>
          ) : null}
        </div>

        {isConfirmed ? (
          <div className="hidden shrink-0 items-start gap-3 md:flex">
            {open ? (
              <>
                <button
                  type="button"
                  className="flex items-center rounded-full bg-[#CDB17E] px-4 py-2 text-sm text-white"
                  aria-label="View booking details"
                  onClick={event => event.stopPropagation()}
                >
                  View Details
                  <span className="pl-2">
                    <DetailsArrowIcon />
                  </span>
                </button>

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

        {!isConfirmed ? (
          <div className="mt-2 hidden shrink-0 gap-[24px] text-sm md:flex md:gap-[32px]">
            <div className="flex flex-col">
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p className="font-medium">₹ 1,25,000</p>
            </div>
            <div className="flex flex-col">
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p className="font-medium">₹ 75,000</p>
            </div>
          </div>
        ) : null}
      </div>

      {!isConfirmed ? (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <CalendarIcon />
          <span>22 June 2026</span>
        </div>
      ) : null}

      {isConfirmed && open ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[#00000033] pt-4 text-sm">
            <div>
              <p className="text-[11px] text-[#767676]">EVENT TYPE</p>
              <p>Wedding Reception</p>
            </div>

            <div>
              <p className="text-[11px] text-[#767676]">DATE</p>
              <p>14 June 2025</p>
            </div>

            <div>
              <p className="text-[11px] text-[#767676]">LOCATION</p>
              <p>The Grand Pavilion, Jaipur</p>
            </div>

            <div>
              <p className="text-[11px] text-[#767676]">AMOUNT PAID</p>
              <p>₹ 1,25,000</p>
            </div>

            <div>
              <p className="text-[11px] text-[#767676]">REMAINING BALANCE</p>
              <p>₹ 75,000</p>
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
              <span className="pl-3 text-[14px] md:text-[18px] leading-[1.35] text-[#957960]">
                Vendor will contact you within 24 hrs to confirm setup details
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end md:hidden">
            <button
              type="button"
              className="flex items-center rounded-full bg-[#CDB17E] px-6 py-3 text-[14px] font-medium text-white"
              aria-label="View booking details"
              onClick={event => event.stopPropagation()}
            >
              View Details
              <span className="pl-3">
                <DetailsArrowIcon />
              </span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

const ActiveBookings = () => {
  return (
    <div className="space-y-6 bg-[#F2F2F2]">
      <div>
        <h1 className="text-2xl font-serif text-[#2E2E2E]">Active Bookings</h1>
        <p className="text-sm text-gray-500">Track and manage your ongoing events</p>
      </div>

      <BookingCard status="in-progress" />
      <BookingCard status="confirmed" />
      <BookingCard status="upcoming" />
    </div>
  )
}

export default ActiveBookings
