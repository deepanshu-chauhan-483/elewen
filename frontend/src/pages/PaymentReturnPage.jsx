import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getValidStoredJwt, paymentVerify } from '../lib/api'

function readParam(searchParams, ...keys) {
  for (const key of keys) {
    const value = searchParams.get(key)
    if (value) return value
  }
  return ''
}

export default function PaymentReturnPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const startedRef = useRef(false)

  const paymentId = readParam(searchParams, 'payment_id', 'paymentId')
  const bookingId = readParam(searchParams, 'booking_id', 'bookingId')
  const gatewayOrderId = readParam(searchParams, 'order_id', 'orderId', 'order_token')

  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Confirming your payment…')

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function completeReturn() {
      if (!paymentId || !gatewayOrderId) {
        setStatus('error')
        setMessage('Payment reference is missing. Please return to checkout and try again.')
        return
      }

      const token = await getValidStoredJwt()
      if (!token) {
        const returnPath = `/payment/return?${searchParams.toString()}`
        navigate(`/login?redirect=${encodeURIComponent(returnPath)}`, { replace: true })
        return
      }

      try {
        const verifyResponse = await paymentVerify(token, {
          paymentId,
          gatewayOrderId,
          gatewayPaymentId: null,
          paymentMethod: 'upi',
        })

        const booking = verifyResponse?.booking
        const payment = verifyResponse?.payment
        const resolvedBookingId = booking?.id || bookingId

        if (!resolvedBookingId) {
          setStatus('error')
          setMessage('Payment was received but booking details could not be loaded.')
          return
        }

        navigate(`/booking-confirmation?bookingId=${resolvedBookingId}`, {
          replace: true,
          state: {
            booking,
            payment: {
              advanceAmount: Number(payment?.amount ?? 0),
              amountPaid: Number(payment?.amount ?? 0),
              paymentType: payment?.paymentType ?? 'advance',
              totalAmount: Number(booking?.totalPrice ?? payment?.amount ?? 0),
              balanceDue: Math.max(
                0,
                Number(booking?.totalPrice ?? 0) - Number(payment?.amount ?? 0)
              ),
            },
            checkoutInfo: {
              showBookingConfirmationToast: true,
            },
          },
        })
      } catch (err) {
        setStatus('error')
        setMessage(
          err?.message ||
            'We could not confirm your payment yet. If money was deducted, check your bookings or contact support.'
        )
      }
    }

    completeReturn()
  }, [bookingId, gatewayOrderId, navigate, paymentId, searchParams])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[#EDE8E1] bg-white p-8 text-center">
        {status === 'loading' ? (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#364022] border-t-transparent" />
            <h1 className="text-xl text-[#2C2C2C]">Processing payment</h1>
            <p className="mt-2 text-sm text-[#7A7A7A]">{message}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl text-[#2C2C2C]">Payment status unclear</h1>
            <p className="mt-2 text-sm text-[#7A7A7A]">{message}</p>
            <div className="mt-6 flex flex-col gap-3">
              {bookingId ? (
                <Link
                  to={`/user-dashboard/details?bookingId=${bookingId}`}
                  className="rounded-full bg-[#364022] px-5 py-2.5 text-sm font-medium text-white"
                >
                  View booking
                </Link>
              ) : null}
              <Link
                to="/checkout"
                className="rounded-full border border-[#364022] px-5 py-2.5 text-sm font-medium text-[#364022]"
              >
                Back to checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
