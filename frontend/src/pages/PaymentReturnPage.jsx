import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getStoredJwt, paymentCompleteReturn } from '../lib/api'

function parseApiError(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'We could not confirm your payment yet. Please check your email or dashboard in a few minutes.'
  )
}

export default function PaymentReturnPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('bookingId') || ''
  const gatewayOrderId =
    searchParams.get('order_id') || searchParams.get('orderId') || searchParams.get('orderid') || ''

  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Confirming your payment…')

  useEffect(() => {
    let active = true

    async function finalizeReturn() {
      const token = getStoredJwt()

      if (!gatewayOrderId) {
        if (!active) return
        setStatus('info')
        setMessage(
          'If your payment went through, you can close this page. We will email you once the booking is confirmed.'
        )
        return
      }

      if (!token) {
        if (!active) return
        setStatus('info')
        setMessage(
          'Payment received by Cashfree. If you paid using a QR code on another device, you can close this page — your checkout tab or email will update shortly.'
        )
        return
      }

      try {
        const response = await paymentCompleteReturn(token, {
          gatewayOrderId,
          bookingId: bookingId || undefined,
          paymentMethod: 'upi',
        })

        if (!active) return

        const booking = response?.booking
        const resolvedBookingId = booking?.id || bookingId

        navigate(`/booking-confirmation?bookingId=${resolvedBookingId}`, {
          replace: true,
          state: {
            booking,
            payment: response?.payment
              ? {
                  amountPaid: Number(response.payment.amount ?? 0),
                  paymentType: response.payment.paymentType,
                }
              : null,
            checkoutInfo: { showBookingConfirmationToast: true },
          },
        })
      } catch (err) {
        if (!active) return
        setStatus('pending')
        setMessage(parseApiError(err))
      }
    }

    finalizeReturn()

    return () => {
      active = false
    }
  }, [bookingId, gatewayOrderId, navigate])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-[#EDE8E1] bg-white p-8 text-center shadow-sm">
        {status === 'loading' ? (
          <p className="text-sm text-[#6B7280]">{message}</p>
        ) : (
          <>
            <h1 className="text-xl font-medium text-[#2C2C2C]">
              {status === 'pending' ? 'Payment is being confirmed' : 'Payment submitted'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">{message}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {bookingId ? (
                <Link
                  to={`/booking-confirmation?bookingId=${bookingId}`}
                  className="rounded-full bg-[#364022] px-5 py-2 text-sm font-medium text-white"
                >
                  View booking status
                </Link>
              ) : null}
              <Link
                to="/user-dashboard/active-booking"
                className="rounded-full border border-[#364022] px-5 py-2 text-sm font-medium text-[#364022]"
              >
                Go to dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
