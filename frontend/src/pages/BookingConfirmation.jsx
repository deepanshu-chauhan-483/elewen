import { Link, useLocation } from 'react-router-dom'

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `Rs${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value) {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not provided'
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-gray-500">{label}</p>
      <p className="text-right text-[#2C2C2C]">{value}</p>
    </div>
  )
}

const DEFAULT_STEPS = [
  {
    title: 'Confirmation Email',
    desc: 'A booking confirmation has been sent to your email address.',
  },
  {
    title: 'Vendor Coordination',
    desc: 'Our team will contact you within 24 hours to confirm details.',
  },
  {
    title: 'Event Planning',
    desc: 'Your event brief and package notes will be reviewed internally.',
  },
  {
    title: 'Balance Payment',
    desc: 'The remaining amount will be due before the event date.',
  },
]

export default function BookingConfirmation() {
  const { state } = useLocation()
  const booking = state?.booking ?? null
  const payment = state?.payment ?? null
  const checkoutInfo = state?.checkoutInfo ?? {}

  const packageLabel = booking?.packageId ? `Package ID ${booking.packageId}` : 'Selected package'

  return (
    <div className="min-h-screen bg-[#FAF9F7] px-4 py-10 md:px-8 md:pt-24 lg:px-16">
      <div className="flex flex-col gap-[clamp(24px,6vw,150px)] md:flex-row">
        <div className="flex-1 space-y-6">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#B7B59F] text-xl text-white">
            ✓
          </div>

          <h1 className="mb-2 text-[16px] font-semibold text-[#2C2C2C] md:text-[27px]">
            Booking Confirmed!
          </h1>

          <p className="mb-6 text-[12px] text-gray-500 md:text-[16px]">
            Your event has been successfully booked. Details below.
          </p>

          <div className="mb-8 flex flex-wrap gap-4">
            <Link
              to="/"
              className="rounded-full border border-[#957960] px-3 py-2 text-[12px] text-[#957960]"
            >
              Back to Home
            </Link>

            <Link
              to="/cart"
              className="rounded-full bg-[#D8C9AF] px-3 py-2 text-[12px] text-[#6B5B4D]"
            >
              View Cart
            </Link>
          </div>

          <hr className="my-4 border-[#0000001A]" />

          <div className="mb-6 flex items-center justify-between rounded-xl bg-[#F8F4ED] p-5">
            <div>
              <p className="font-medium text-[#957960]">Advance Paid</p>
              <p className="text-sm text-gray-500">Balance due before event</p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-[#957960]">
                {formatCurrency(payment?.advanceAmount ?? booking?.advanceAmount)}
              </p>
              <p className="text-sm text-gray-700">
                {formatCurrency(payment?.balanceDue ?? booking?.remainingAmount)}
              </p>
            </div>
          </div>

          <hr className="my-4 border-[#0000001A]" />

          <div className="space-y-3 text-[12px] md:text-[14px]">
            <Detail label="Booking ID" value={booking?.id ?? 'Not available'} />
            <Detail
              label="Event Date"
              value={formatDate(checkoutInfo?.eventDate ?? booking?.eventDate)}
            />
            <Detail label="Location" value={checkoutInfo?.eventAddress || 'Not provided'} />
            <Detail
              label="Guests"
              value={checkoutInfo?.guestCount || booking?.guestCount || 'Not provided'}
            />
            <Detail label="Package" value={packageLabel} />
            <Detail label="Contact" value={checkoutInfo?.fullName || 'Not provided'} />
          </div>

          <hr className="my-4 border-[#0000001A]" />

          <p className="text-xs text-gray-500">
            Questions? Contact us at support@elewen.in or call +91 98XX XXXXX
          </p>
        </div>

        <div className="flex-1">
          <div className="h-fit max-w-[458px] rounded-2xl bg-[#EADEC8] p-6 lg:ml-auto">
            <h3 className="mb-6 text-[12px] font-medium text-[#591902]">What Happens Next</h3>

            <div className="relative space-y-8">
              <div className="absolute bottom-2 left-4 top-2 w-[1px] border-l border-dashed border-[#C8B89E]" />

              {DEFAULT_STEPS.map((step, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#CDB17E] bg-white text-[#957960]">
                    {i + 1}
                  </div>

                  <div>
                    <p className="text-[16px] font-medium text-[#1C1C1C]">{step.title}</p>
                    <p className="text-[12px] text-[#364022]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
