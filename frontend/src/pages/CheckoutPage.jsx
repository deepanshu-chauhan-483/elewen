import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { usePackages } from '../hooks/usePackages'
import {
  bookingAddNote,
  bookingCreate,
  getStoredJwt,
  paymentCreateOrder,
  paymentVerify,
} from '../lib/api'

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `Rs${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function normalizeServiceSlug(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/-single$/, '')
    .replace(/-services?$/, '')
}

function getMinEventDate() {
  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 6) // Disable next 5 days + today = 6 days minimum
  
  const year = minDate.getFullYear()
  const month = String(minDate.getMonth() + 1).padStart(2, '0')
  const day = String(minDate.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

function getSavedUser() {
  try {
    const raw = localStorage.getItem('elewen_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const existing = document.querySelector('script[data-razorpay="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpay = 'true'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function SummaryRow({ label, value, valueClassName = 'text-[#2C2C2C] font-medium' }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  )
}

function parseBreakdownAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const normalized = value.replace(/[^0-9.-]+/g, '')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function getBreakdownLabel(entry) {
  if (!entry || typeof entry !== 'object') return ''

  return (
    entry.label ?? entry.title ?? entry.name ?? entry.text ?? entry.description ?? entry.item ?? ''
  )
}

function getBreakdownAmount(entry) {
  if (!entry || typeof entry !== 'object') return 0

  const directAmount =
    entry.amount ??
    entry.price ??
    entry.value ??
    entry.cost ??
    entry.total ??
    entry.rate ??
    entry.base_price

  if (directAmount != null) {
    return parseBreakdownAmount(directAmount)
  }

  for (const [key, value] of Object.entries(entry)) {
    if (
      ['id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt'].includes(key) ||
      typeof value === 'object'
    ) {
      continue
    }

    const amount = parseBreakdownAmount(value)
    if (amount > 0) return amount
  }

  return 0
}

function getPackageBreakdownRows(pkg) {
  return (Array.isArray(pkg?.detail_price_breakdown) ? pkg.detail_price_breakdown : [])
    .map(entry => {
      const label = String(getBreakdownLabel(entry) ?? '').trim()
      const amount = getBreakdownAmount(entry)
      return label && amount > 0 ? { label, amount } : null
    })
    .filter(Boolean)
}

function getCartItemSummary(item) {
  const quantity = Math.max(1, Number(item?.quantity ?? 1))
  const breakdownRows = getPackageBreakdownRows(item?.packageData)

  if (!breakdownRows.length) {
    return {
      rows: [],
      total: Number(item?.totalPrice ?? 0),
    }
  }

  const rows = breakdownRows.map(row => ({
    ...row,
    total: row.amount * quantity,
  }))

  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.total, 0),
  }
}

function PaymentMethod({ selected, onChange }) {
  const options = [
    { id: 'upi', title: 'UPI / BHIM', desc: 'Google Pay, PhonePe, Paytm' },
    { id: 'card', title: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
    { id: 'netbanking', title: 'Net Banking', desc: 'All major banks supported' },
  ]

  return (
    <div className="rounded-xl border border-[#95796066] p-5">
      <h3 className="mb-4 text-lg font-medium">Payment Method</h3>

      <div className="space-y-3">
        {options.map(option => {
          const isActive = selected === option.id

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                isActive ? 'border-[#222815] bg-[#E9E9E2]' : 'border-transparent bg-[#F5F5F5]'
              }`}
            >
              <input
                type="radio"
                name="payment"
                className="hidden"
                checked={isActive}
                onChange={() => onChange(option.id)}
              />

              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  isActive ? 'border-[#222815]' : 'border-gray-400'
                }`}
              >
                {isActive ? <div className="h-2 w-2 rounded-full bg-[#222815]" /> : null}
              </div>

              <div>
                <p className="font-medium">{option.title}</p>
                <p className="text-sm text-gray-500">{option.desc}</p>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const savedUser = getSavedUser()
  const { data: packages = [] } = usePackages()
  const { cart, loading, isLoggedIn, updateCartDetails } = useCart()

  const [fullName, setFullName] = useState(
    [savedUser?.first_name, savedUser?.last_name].filter(Boolean).join(' ')
  )
  const [phone, setPhone] = useState(savedUser?.phone ?? '')
  const [email, setEmail] = useState(savedUser?.email ?? '')
  const [eventDate, setEventDate] = useState(
    cart?.eventDate ? String(cart.eventDate).slice(0, 10) : ''
  )
  const [eventTime, setEventTime] = useState('')
  const [eventAddress, setEventAddress] = useState(cart?.eventCity ?? '')
  const [pinCode, setPinCode] = useState('')
  const [guestCount, setGuestCount] = useState(
    cart?.guestCount != null ? String(cart.guestCount) : ''
  )
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const packageLookup = useMemo(
    () => new Map(packages.map(pkg => [String(pkg.id), pkg])),
    [packages]
  )

  const cartItems = useMemo(
    () =>
      (cart?.items ?? []).map(item => ({
        ...item,
        packageData: packageLookup.get(String(item.packageId)) ?? null,
      })),
    [cart?.items, packageLookup]
  )

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0),
    [cartItems]
  )
  const itemSummaries = useMemo(
    () =>
      cartItems.map(item => ({
        item,
        summary: getCartItemSummary(item),
      })),
    [cartItems]
  )
  const computedSubtotal = useMemo(
    () => itemSummaries.reduce((sum, entry) => sum + Number(entry.summary.total ?? 0), 0),
    [itemSummaries]
  )
  const discountAmount = Number(cart?.discountAmount ?? 0)
  const computedTotal = Math.max(0, computedSubtotal - discountAmount)
  const advancePayable = computedTotal * 0.3
  const balanceDue = Math.max(0, computedTotal - advancePayable)

  const handleCheckout = async () => {
    const token = getStoredJwt()
    if (!token) {
      navigate('/login')
      return
    }

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setFormError('Please fill in your contact details.')
      return
    }

    if (!eventDate || !eventAddress.trim() || !guestCount || Number(guestCount) < 1) {
      setFormError('Please complete the event information form before payment.')
      return
    }

    setFormError('')
    setIsSubmitting(true)

    try {
      await updateCartDetails({
        eventDate,
        eventCity: eventAddress.trim(),
        guestCount: Number(guestCount),
      })

      const bookingResponse = await bookingCreate(token)
      const booking = bookingResponse?.booking

      if (!booking?.id) {
        throw new Error('Booking could not be created.')
      }

      const extraDetails = [
        `Contact name: ${fullName.trim()}`,
        `Phone: ${phone.trim()}`,
        `Email: ${email.trim()}`,
        `Event date: ${eventDate}`,
        `Event time: ${eventTime || 'Not provided'}`,
        `Event address: ${eventAddress.trim()}`,
        `PIN code: ${pinCode || 'Not provided'}`,
        `Guest count: ${guestCount}`,
      ].join('\n')

      await bookingAddNote(token, booking.id, { note: extraDetails }).catch(() => {})

      const orderResponse = await paymentCreateOrder(token, {
        bookingId: booking.id,
        paymentType: 'advance',
      })

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay checkout could not be loaded.')
      }

      const options = {
        key: orderResponse.keyId,
        amount: Math.round(Number(orderResponse.amount) * 100),
        currency: orderResponse.currency || 'INR',
        name: 'Elewen',
        description: 'Advance payment for your booking',
        order_id: orderResponse.razorpayOrderId,
        prefill: {
          name: fullName.trim(),
          email: email.trim(),
          contact: phone.trim(),
        },
        theme: {
          color: '#D4BA8E',
        },
        handler: async response => {
          try {
            await paymentVerify(token, {
              paymentId: orderResponse.paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod,
            })

            navigate('/booking-confirmation', {
              state: {
                booking,
                payment: {
                  advanceAmount: orderResponse.amount,
                  balanceDue,
                },
                checkoutInfo: {
                  fullName,
                  phone,
                  email,
                  eventDate,
                  eventTime,
                  eventAddress,
                  pinCode,
                  guestCount,
                },
              },
            })
          } catch (verifyErr) {
            setFormError(verifyErr.message || 'Payment verification failed.')
          } finally {
            setIsSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', response => {
        setFormError(response?.error?.description || 'Payment failed. Please try again.')
        setIsSubmitting(false)
      })
      razorpay.open()
    } catch (err) {
      setFormError(err.message || 'Checkout failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] px-4 pt-24 md:px-8 lg:px-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#95796066] bg-white p-8 text-center">
          <p className="text-[24px] font-semibold text-[#1C1C1C]">Sign in to continue checkout</p>
          <p className="mt-2 text-gray-500">Your checkout is linked to your account cart.</p>
          <Link
            to="/login"
            className="mx-auto mt-6 flex w-fit items-center rounded-full bg-[#D4BA8E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C6AB7F]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] px-4 pt-24 md:px-8 lg:px-16">
        <div className="rounded-2xl border border-[#95796066] bg-white p-8 text-center text-gray-500">
          Loading checkout...
        </div>
      </div>
    )
  }

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] px-4 pt-24 md:px-8 lg:px-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#95796066] bg-white p-8 text-center">
          <p className="text-[24px] font-semibold text-[#1C1C1C]">Your cart is empty</p>
          <p className="mt-2 text-gray-500">Add a package before moving to checkout.</p>
          <Link
            to="/cart"
            className="mx-auto mt-6 flex w-fit items-center rounded-full bg-[#D4BA8E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#C6AB7F]"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] px-4 py-10 pt-24 md:px-8 lg:px-16">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold text-[#2C2C2C]">Checkout</h1>
        <p className="mt-2 text-gray-500">Review your event packages and complete your booking.</p>
      </div>

      <div className="flex flex-col gap-[clamp(24px,5vw,100px)] md:flex-row">
        <div className="flex-1 space-y-6">
          <div className="overflow-hidden rounded-xl border border-[#95796066]">
            <div className="bg-[#1F2A16] px-5 py-3 text-white">
              <h3 className="font-medium">Booking Summary</h3>
            </div>

            <div className="space-y-4 p-5 text-sm">
              {itemSummaries.map(({ item, summary }, index) => {
                const packageName = item.packageData?.title || item.title
                const serviceName = normalizeServiceSlug(item.packageData?.service_slugs?.[0] ?? '')
                const label = serviceName
                  ? `${serviceName.charAt(0).toUpperCase()}${serviceName.slice(1)} (${item.quantity} package${Number(item.quantity) > 1 ? 's' : ''})`
                  : `${packageName} (${item.quantity})`

                return (
                  <div key={item.id}>
                    {index === 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-base font-medium">
                          <span>Base Package - {packageName}</span>
                          <span>{formatCurrency(summary.total)}</span>
                        </div>
                        {summary.rows.map(row => (
                          <div
                            key={`${item.id}-${row.label}`}
                            className="flex justify-between text-gray-600"
                          >
                            <span>{row.label}</span>
                            <span>{formatCurrency(row.total)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-gray-600">
                          <span>{label}</span>
                          <span>{formatCurrency(summary.total)}</span>
                        </div>
                        {summary.rows.map(row => (
                          <div
                            key={`${item.id}-${row.label}`}
                            className="flex justify-between text-gray-500"
                          >
                            <span>{row.label}</span>
                            <span>{formatCurrency(row.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              <hr className="my-4 border-[#0000001A]" />

              <div className="space-y-2 text-gray-600">
                <SummaryRow label="Items" value={String(itemCount)} />
                <SummaryRow label="Subtotal" value={formatCurrency(computedSubtotal)} />
                <SummaryRow
                  label="Discount coupon applied"
                  value={`-${formatCurrency(discountAmount)}`}
                  valueClassName="font-medium text-[#B42318]"
                />
              </div>

              <hr className="my-4 border-[#0000001A]" />

              <div className="flex justify-between rounded-lg bg-[#F3EFE9] px-4 py-3 text-base font-medium">
                <span>Total Amount</span>
                <span>{formatCurrency(computedTotal)}</span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#F1F1F1] px-4 py-3 text-base font-medium">
                <span>Advance Payable (30%)</span>
                <span>{formatCurrency(advancePayable)}</span>
              </div>

              <p className="text-xs text-gray-500">
                Balance: {formatCurrency(balanceDue)} due on event day
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="rounded-[20px] border border-[#95796066] bg-white p-6 md:p-8">
            <h2 className="text-[24px] font-semibold text-[#2C2C2C]">Event Information</h2>
            <p className="mt-3 text-[14px] text-[#7A7A7A]">
              We&apos;ll use these details to plan and coordinate your event.
            </p>

            <div className="mt-10">
              <h3 className="text-[18px] font-semibold text-[#2C2C2C]">Contact Details</h3>

              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  value={fullName}
                  onChange={event => setFullName(event.target.value)}
                  placeholder="Full Name"
                  className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none"
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={event => setPhone(event.target.value)}
                    placeholder="Mobile Number"
                    className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="Email Address"
                    className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-[18px] font-semibold text-[#2C2C2C]">Event Details</h3>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <input
                  type="date"
                  min={getMinEventDate()}
                  value={eventDate}
                  onChange={event => setEventDate(event.target.value)}
                  className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none"
                />
                <input
                  type="time"
                  value={eventTime}
                  onChange={event => setEventTime(event.target.value)}
                  className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none"
                />
                <input
                  type="text"
                  value={eventAddress}
                  onChange={event => setEventAddress(event.target.value)}
                  placeholder="Event Address"
                  className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none"
                />
                <input
                  type="text"
                  value={pinCode}
                  onChange={event => setPinCode(event.target.value)}
                  placeholder="PIN Code"
                  className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={event => setGuestCount(event.target.value)}
                  placeholder="Number of Guests"
                  className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none md:col-span-2"
                />
              </div>
            </div>
          </div>

          <PaymentMethod selected={paymentMethod} onChange={setPaymentMethod} />

          <div className="rounded-xl border border-[#95796066] p-5">
            <div className="mb-4 rounded-lg bg-[#E6F2E1] py-3 text-center text-sm">
              Secure payment · Instant confirmation · Easy cancellation
            </div>

            {formError ? <p className="mb-4 text-sm text-[#B42318]">{formError}</p> : null}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="mx-auto mt-4 flex w-full items-center justify-between rounded-full bg-[#D4BA8E] py-1.5 pl-6 pr-1.5 transition-colors hover:bg-[#C6AB7F] group disabled:cursor-not-allowed disabled:bg-[#CFCBC5]"
            >
              <span className="mr-5 text-[15px] font-medium text-white">
                {isSubmitting ? 'Processing...' : 'Pay Advance & Confirm Booking'}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                <svg
                  className="h-[18px] w-[18px] text-[#D4BA8E] transition-colors transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
