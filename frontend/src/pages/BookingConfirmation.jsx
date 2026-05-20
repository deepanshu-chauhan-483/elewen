import { Link, useLocation } from 'react-router-dom'
import { useDashboardBooking, useDashboardSession } from '../hooks/useDashboardData'
import {
  buildReceiptData,
  downloadReceipt,
  formatReceiptDate,
  getReceiptPaymentSummary,
} from '../lib/receipt'
import { getBookingPackageNamesText } from '../lib/bookingDisplay'

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `Rs${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(value) {
  return formatReceiptDate(value, { includeWeekday: true })
}

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-gray-500">{label}</p>
      <p className="text-right text-[#2C2C2C]">{value}</p>
    </div>
  )
}

function LocationPinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 13.5C13.6569 13.5 15 12.1569 15 10.5C15 8.84315 13.6569 7.5 12 7.5C10.3431 7.5 9 8.84315 9 10.5C9 12.1569 10.3431 13.5 12 13.5Z"
        stroke="#0383E4"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 10.5C19.5 16.125 12 21 12 21C12 21 4.5 16.125 4.5 10.5C4.5 8.51088 5.29018 6.60322 6.6967 5.1967C8.10322 3.79018 10.0109 3 12 3C13.9891 3 15.8968 3.79018 17.3033 5.1967C18.7098 6.60322 19.5 8.51088 19.5 10.5Z"
        stroke="#0383E4"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

const SAMPLE_TASTING_STEPS = [
  {
    title: 'Order Confirmation',
    desc: 'You’ll receive a confirmation with your tasting details.',
  },
  {
    title: 'Preparation',
    desc: 'Our vendors will prepare fresh sample portions for you.',
  },
  {
    title: 'Delivery',
    desc: 'Your tasting will be delivered within your selected time window.',
  },
  {
    title: 'Try & Decide',
    desc: 'Taste the samples and finalize your event package with confidence.',
  },
]

export default function BookingConfirmation() {
  const { state } = useLocation()
  const bookingIdFromQuery = new URLSearchParams(window.location.search).get('bookingId')
  const bookingId = state?.booking?.id ?? bookingIdFromQuery ?? ''
  const { data: dashboardBooking } = useDashboardBooking(bookingId)
  const { data: session } = useDashboardSession()
  const booking = dashboardBooking ?? state?.booking ?? null
  const payment = state?.payment ?? null
  const checkoutInfo = state?.checkoutInfo ?? {}
  const isSampleTastingBooking = checkoutInfo?.checkoutMode === 'sample-tasting'
  const customer = {
    fullName:
      checkoutInfo?.fullName ||
      [session?.profile?.first_name, session?.profile?.last_name].filter(Boolean).join(' ') ||
      [session?.user?.first_name, session?.user?.last_name].filter(Boolean).join(' ') ||
      '',
    email: checkoutInfo?.email || session?.user?.email || '',
    phone: checkoutInfo?.phone || session?.user?.phone || '',
  }
  const paymentSummary = getReceiptPaymentSummary({
    booking,
    payment,
    checkoutInfo,
    isSampleTastingBooking,
  })
  const sessionDetails = {
    dateLabel: checkoutInfo?.eventDate ?? booking?.eventDate ?? '',
    timeLabel: checkoutInfo?.eventTime ?? '',
    address:
      checkoutInfo?.eventAddress ?? booking?.address?.summary ?? booking?.locationSummary ?? '',
  }
  const pageContent = isSampleTastingBooking
    ? {
        heading: 'Tasting Booked!',
        intro:
          'Your tasting session has been scheduled. We’ll deliver your selected samples to you shortly.',
        amountLabel: 'Total Amount Paid',
        amountSubtext: null,
        steps: SAMPLE_TASTING_STEPS,
      }
    : {
        heading: 'Booking Confirmed!',
        intro: 'Your event has been successfully booked. Details below.',
        amountLabel: paymentSummary.primaryLabel,
        amountSubtext: paymentSummary.isFullyPaid
          ? 'No balance is pending for this booking.'
          : 'Balance due before event',
        steps: paymentSummary.isFullyPaid
          ? [
              ...DEFAULT_STEPS.slice(0, 3),
              {
                title: 'Payment Completed',
                desc: 'Your booking has already been fully paid and your receipt is ready to download.',
              },
            ]
          : DEFAULT_STEPS,
      }

  const packageLabel = getBookingPackageNamesText(
    booking,
    booking?.packageId ? `Package ID ${booking.packageId}` : 'Selected package'
  )
  const receiptData = buildReceiptData({
    booking,
    payment,
    checkoutInfo,
    customer,
    isSampleTastingBooking,
  })

  return (
    <div className="min-h-screen bg-[#FAF9F7] px-4 py-10 md:px-8 md:pt-24 lg:px-16">
      <div className="flex flex-col gap-[clamp(24px,6vw,150px)] md:flex-row">
        <div className="flex-1 space-y-6">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#B7B59F] text-xl text-white">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="#FAFAFA"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mb-2 text-[16px] font-semibold text-[#2C2C2C] md:text-[27px]">
            {pageContent.heading}
          </h1>

          <p className="mb-6 text-[12px] text-gray-500 md:text-[16px]">{pageContent.intro}</p>

          {isSampleTastingBooking ? (
            <div className="flex items-start gap-4 rounded-xl border border-[#0383E4] bg-[#EAF5FF] px-4 py-3">
              <div className="mt-0.5 shrink-0">
                <LocationPinIcon />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#0383E4]">
                  {sessionDetails.dateLabel} - {sessionDetails.timeLabel}
                </p>
                <p className="mt-1 text-[11px] text-[#00477C]">{sessionDetails.address}</p>
              </div>
            </div>
          ) : null}

          <div className="mb-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => downloadReceipt(receiptData)}
              className="rounded-full bg-[#D8C9AF] px-4 py-2 text-[12px] text-[#6B5B4D]"
            >
              Download Receipt
            </button>

            <Link
              to="/"
              className="rounded-full border border-[#957960] px-4 py-2 text-[12px] text-[#957960]"
            >
              Back to Home
            </Link>
          </div>

          <hr className="my-4 border-[#0000001A]" />

          <div className="mb-6 flex items-center justify-between rounded-xl bg-[#F8F4ED] p-5">
            <div>
              <p className="font-medium text-[#957960]">{pageContent.amountLabel}</p>
              {pageContent.amountSubtext ? (
                <p className="text-sm text-gray-500">{pageContent.amountSubtext}</p>
              ) : null}
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-[#957960]">
                {formatCurrency(paymentSummary.amountPaid)}
              </p>
              {pageContent.amountSubtext ? (
                <p className="text-sm text-gray-700">
                  {paymentSummary.isFullyPaid
                    ? 'Fully paid'
                    : formatCurrency(paymentSummary.amountDue)}
                </p>
              ) : null}
            </div>
          </div>

          <hr className="my-4 border-[#0000001A]" />

          <div className="space-y-3 text-[12px] md:text-[14px]">
            <Detail label="Booking ID" value={booking?.id ?? 'Not available'} />
            <Detail
              label="Event Date"
              value={formatDate(checkoutInfo?.eventDate ?? booking?.eventDate)}
            />
            <Detail
              label="Location"
              value={
                checkoutInfo?.eventAddress ||
                booking?.address?.summary ||
                booking?.locationSummary ||
                'Not provided'
              }
            />
            <Detail
              label="PIN Code"
              value={checkoutInfo?.pinCode || booking?.pinCode || 'Not provided'}
            />
            <Detail
              label="Guests"
              value={checkoutInfo?.guestCount || booking?.guestCount || 'Not provided'}
            />
            <Detail label="Package" value={packageLabel} />
            <Detail label="Contact" value={customer.fullName || 'Not provided'} />
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

              {pageContent.steps.map((step, i) => (
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
