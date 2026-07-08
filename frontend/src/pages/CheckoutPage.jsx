import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DateTimePicker from '../components/common/DateTimePicker'
import { useToast } from '../components/common/useToast'
import { useCart } from '../hooks/useCart'
import {
  useCheckoutToastMessage,
  usePaymentCancelledToastMessage,
  usePaymentFailedToastMessage,
} from '../hooks/useMessagingContent'
import { useGlobalSettings } from '../hooks/useCmsPages'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { usePackages } from '../hooks/usePackages'
import CmsPageLoader from '../components/common/CmsPageLoader'
import { useStrapiPageLoading } from '../hooks/useStrapiPageLoading'
import { useServiceAreas } from '../hooks/useServiceAreas'
import { getDeliveryChargeForPincode, useDeliveryCharges } from '../hooks/useDeliveryCharges'
import PriceSummaryDiscountRows from '../components/cart/PriceSummaryDiscountRows'
import { getGuestCountFromCartItems } from '../lib/cateringAddonPricing'
import { aggregateAppliedGuestDiscounts, getCartItemSummary } from '../lib/cartItemPricing'
import { getPackageLineLabel, getSelectedOptionsText } from '../lib/bookingDisplay'
import { useCateringGuestDiscounts } from '../hooks/useCateringGuestDiscounts'
import {
  bookingAddNote,
  bookingCreate,
  getStoredJwt,
  paymentCreateOrder,
  paymentVerify,
} from '../lib/api'

const CART_META_SEPARATOR = '||__ELEWEN_META__||'
const CART_PIN_CODE_KEY = 'elewen_cart_pin_code'
const CART_ADDITIONAL_INFO_KEY = '__additional_info__'
const TEMP_BYPASS_PINCODE_VALIDATION = false

function formatCurrency(value) {
  const amount = Number(value ?? 0)
  return `Rs${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
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

function normalizePincode(value = '') {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6)
}

function getServiceAreaByPincode(value = '', serviceAreas = []) {
  const pincode = normalizePincode(value)

  if (pincode.length !== 6) return ''

  const numericPincode = Number(pincode)
  const matchingArea = (Array.isArray(serviceAreas) ? serviceAreas : []).find(area => {
    const start = Number(area?.pincodeStart)
    const end = Number(area?.pincodeEnd)
    const extraPincodes = Array.isArray(area?.extraPincodes) ? area.extraPincodes : []
    const inRange =
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      numericPincode >= start &&
      numericPincode <= end

    return inRange || extraPincodes.includes(pincode)
  })

  return matchingArea?.name ?? ''
}

function getPincodeValidationState(value = '', serviceAreas = [], isLoadingServiceAreas = false) {
  if (TEMP_BYPASS_PINCODE_VALIDATION) {
    return {
      isChecking: false,
      isValid: true,
      message: '',
    }
  }

  const normalizedPincode = normalizePincode(value)

  if (!normalizedPincode) {
    return {
      isChecking: false,
      isValid: false,
      message: '',
    }
  }

  if (normalizedPincode.length !== 6) {
    return {
      isChecking: false,
      isValid: false,
      message: 'Please enter a valid 6-digit pincode.',
    }
  }

  if (isLoadingServiceAreas) {
    return {
      isChecking: true,
      isValid: false,
      message: 'Checking availability...',
    }
  }

  const area = getServiceAreaByPincode(normalizedPincode, serviceAreas)

  if (area) {
    return {
      isChecking: false,
      isValid: true,
      message: `Service available in ${area}.`,
    }
  }

  return {
    isChecking: false,
    isValid: false,
    message: serviceAreas.length
      ? 'Service not available in your area.'
      : 'We could not verify service availability right now.',
  }
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

function getPaymentErrorMessage(error) {
  const gatewayError = error?.error ?? error?.response?.error ?? null

  const message =
    gatewayError?.description ||
    error?.description ||
    gatewayError?.message ||
    error?.message ||
    null

  if (message) {
    return message
  }

  if (
    gatewayError?.reason === 'international_transaction_not_allowed' ||
    error?.reason === 'international_transaction_not_allowed'
  ) {
    return 'International cards are not supported. Please contact our support team for help.'
  }

  return 'Payment failed. Please try again.'
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#767676]">{label}</span>
      <span className="text-[#1C1C1C] font-medium">{value}</span>
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

function parseCartItemTitle(value = '') {
  const rawTitle = String(value ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: {},
      itemType: 'package',
      addonTitle: '',
      parentPackageId: '',
      additionalInfo: '',
    }
  }

  try {
    const parsed = JSON.parse(metaPart)
    const parsedSelectedOptions =
      parsed?.selectedOptions && typeof parsed.selectedOptions === 'object'
        ? parsed.selectedOptions
        : {}

    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: parsedSelectedOptions,
      itemType: parsed?.itemType ?? 'package',
      addonTitle: parsed?.addonTitle ?? '',
      parentPackageId: parsed?.parentPackageId ?? '',
      additionalInfo: String(
        parsed?.additionalInfo ?? parsedSelectedOptions?.[CART_ADDITIONAL_INFO_KEY] ?? ''
      ).trim(),
    }
  } catch {
    return {
      displayTitle: displayTitle || rawTitle,
      selectedOptions: {},
      itemType: 'package',
      addonTitle: '',
      parentPackageId: '',
      additionalInfo: '',
    }
  }
}

function isAdditionalInfoOptionLabel(label = '') {
  return (
    String(label ?? '')
      .trim()
      .toLowerCase() === CART_ADDITIONAL_INFO_KEY
  )
}

function getCartItemDisplayName(item) {
  if (item?.itemType === 'addon') {
    return item?.displayTitle || item?.addonTitle || 'Add-on'
  }

  return item?.packageData?.title || item?.displayTitle || item?.title || 'Package'
}

function getCartItemNoteLabel(item) {
  const itemName = getCartItemDisplayName(item)
  const quantity = Math.max(1, Number(item?.quantity ?? 1))
  const selectedOptions = Object.fromEntries(
    Object.entries(item?.selectedOptions ?? {}).filter(
      ([label]) => !isAdditionalInfoOptionLabel(label)
    )
  )
  const optionValues = Object.values(selectedOptions).filter(Boolean)
  const optionSuffix = optionValues.length ? ` [${optionValues.join(', ')}]` : ''
  const additionalInfo = String(item?.additionalInfo ?? '').trim()
  const additionalInfoSuffix = additionalInfo ? ` | Additional info: ${additionalInfo}` : ''

  if (item?.itemType === 'addon') {
    return `Add-on: ${itemName} x${quantity}${optionSuffix}${additionalInfoSuffix}`
  }

  return `Package: ${itemName} x${quantity}${optionSuffix}${additionalInfoSuffix}`
}

function isBartendingPackageItem(item) {
  return (
    item?.itemType !== 'addon' &&
    Array.isArray(item?.packageData?.service_slugs) &&
    item.packageData.service_slugs.includes('bartending')
  )
}

function isAddonOptionLabel(label = '') {
  const normalizedLabel = String(label ?? '')
    .replace(/_\d+$/, '')
    .trim()
    .toLowerCase()

  return (
    normalizedLabel === 'add-ons' ||
    normalizedLabel === 'add on services' ||
    normalizedLabel === 'addon services'
  )
}

function getDisplaySelectedOptions(item) {
  const selectedOptions =
    item?.selectedOptions && typeof item.selectedOptions === 'object' ? item.selectedOptions : {}

  const filteredSelectedOptions = Object.fromEntries(
    Object.entries(selectedOptions).filter(([label]) => !isAdditionalInfoOptionLabel(label))
  )

  if (!isBartendingPackageItem(item)) return filteredSelectedOptions

  return Object.fromEntries(
    Object.entries(filteredSelectedOptions).filter(([label]) => !isAddonOptionLabel(label))
  )
}

function getCartItemQuantity(item) {
  return Math.max(1, Number(item?.quantity ?? 1))
}

function PaymentMethod({ selected, onChange }) {
  const options = [
    { id: 'upi', title: 'UPI / BHIM', desc: 'Google Pay, PhonePe, Paytm' },
    { id: 'card', title: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
    { id: 'netbanking', title: 'Net Banking', desc: 'All major banks supported' },
  ]

  return (
    <div className="rounded-xl border border-[#95796066] p-5">
      <h3 className="mb-4 text-lg font-medium" style={{ fontFamily: "'Poppins'" }}>
        Payment Method
      </h3>

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

function PaymentOptionPopup({
  open,
  onClose,
  onConfirm,
  selected,
  setSelected,
  advanceAmount,
  fullAmount,
  advancePercentage,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* POPUP */}
      <div
        className="relative z-50 w-full max-w-md rounded-[20px] border border-[#00000033] bg-white p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="text-[16px] font-semibold"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Choose Your Payment Option
            </h2>
            <p className="mt-1 text-[12px] text-gray-500">
              Secure your booking with an advance or pay in full for added benefits.
            </p>
          </div>

          <button type="button" onClick={onClose} className="text-[18px] leading-none">
            ✕
          </button>
        </div>

        {/* OPTIONS */}
        <div className="mt-5 space-y-5">
          {/* ADVANCE */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              checked={selected === 'advance'}
              onChange={() => setSelected('advance')}
              className="hidden"
            />

            <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#222815]">
              {selected === 'advance' && <div className="h-2.5 w-2.5 rounded-full bg-[#222815]" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium">Pay Advance ({advancePercentage}%)</p>
                <p className="text-[14px] font-medium">
                  ₹{Number(advanceAmount).toLocaleString('en-IN')}
                </p>
              </div>

              <p className="mt-1 text-[11px] leading-snug text-gray-500">
                Secure your booking today and pay the remaining amount closer to your event date.
              </p>
            </div>
          </label>

          {/* FULL */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              checked={selected === 'full'}
              onChange={() => setSelected('full')}
              className="hidden"
            />

            <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#222815]">
              {selected === 'full' && <div className="h-2.5 w-2.5 rounded-full bg-[#222815]" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium">Pay Full Amount</p>
                <p className="text-[14px] font-medium">
                  ₹{Number(fullAmount).toLocaleString('en-IN')}
                </p>
              </div>

              <p className="mt-1 text-[11px] leading-snug text-gray-500">
                Pay the full amount now and get a discount on your total booking.
              </p>
            </div>
          </label>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => onConfirm(selected)}
          className="mt-6 flex w-full items-center justify-between rounded-full bg-[#D4BA8E] py-2 pl-5 pr-2"
        >
          <span className="text-[14px] font-medium text-white">Confirm Booking</span>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
            <svg className="h-[18px] w-[18px] text-[#D4BA8E]" viewBox="0 0 20 20" fill="none">
              <path
                d="M5.82812 5.83398H14.1615M14.1615 5.83398V14.1673M14.1615 5.83398L5.82812 14.1673"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}

function SpecialRequest({ preferences, onChange, onSubmit, message }) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-[#95796066] p-5 bg-[#FFFFFF]">
      {/* TITLE */}
      <h2 className="text-lg font-medium text-[#2C2C2C]" style={{ fontFamily: "'Poppins'" }}>
        Special Request
      </h2>

      <p className="mb-4 mt-1 text-sm text-gray-500">
        Add any preferences or instructions for your order
      </p>

      {/* INPUT */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={preferences}
          onChange={e => onChange(e.target.value)}
          placeholder="Write Message"
          className="w-full border-b border-[#2D2D2D] bg-transparent py-2 text-[14px] text-[#2C2C2C] focus:outline-none"
        />
      </div>

      {/* MESSAGE */}
      {message && <p className="mt-2 text-sm text-[#5A1E0E]">{message}</p>}
    </form>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const savedUser = getSavedUser()
  const packagesQuery = usePackages()
  const globalSettingsQuery = useGlobalSettings()
  const cateringDiscountsQuery = useCateringGuestDiscounts()
  const serviceAreasQuery = useServiceAreas()
  const deliveryChargesQuery = useDeliveryCharges()
  const { data: packages = [] } = packagesQuery
  const { data: globalSettings = null } = globalSettingsQuery
  const { data: cateringDiscountSettings = null } = cateringDiscountsQuery
  const { data: serviceAreas = [], isLoading: isLoadingServiceAreas } = serviceAreasQuery
  const { data: deliveryCharges = [] } = deliveryChargesQuery
  const isStrapiLoading = useStrapiPageLoading(
    packagesQuery,
    globalSettingsQuery,
    cateringDiscountsQuery,
    serviceAreasQuery,
    deliveryChargesQuery
  )

  const { cart, loading, isLoggedIn, updateCartDetails } = useCart()
  const { data: checkoutToastMessage = 'Checkout is ready. Review your details and continue.' } =
    useCheckoutToastMessage()
  const {
    data: paymentFailedToastMessage = 'Your payment could not be completed. Please try again.',
  } = usePaymentFailedToastMessage()
  const {
    data: paymentCancelledToastMessage = 'Payment cancelled. You can continue from checkout anytime.',
  } = usePaymentCancelledToastMessage()
  const hasShownCheckoutToastRef = useRef(false)
  const draftBookingRef = useRef(null)
  const paymentFailureToastShownRef = useRef(false)
  const queryParams = new URLSearchParams(location.search)
  const isSampleTastingCheckout =
    queryParams.get('mode') === 'sample-tasting' ||
    location.state?.checkoutMode === 'sample-tasting'
  const sessionDetails = location.state?.sampleSessionDetails ?? {
    dateLabel: 'Saturday, 14 June',
    timeLabel: '2:00 PM',
    address: 'E-22 Vaishali nagar, jaipur, rajasthan',
  }

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
  const [pinCodeMessage, setPinCodeMessage] = useState('')
  const [isCheckingPincode, setIsCheckingPincode] = useState(false)
  const [isPincodeValid, setIsPincodeValid] = useState(false)
  const [guestCount, setGuestCount] = useState(
    cart?.guestCount != null ? String(cart.guestCount) : ''
  )
  const [specialRequest, setSpecialRequest] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const packageLookup = useMemo(
    () => new Map(packages.map(pkg => [String(pkg.id), pkg])),
    [packages]
  )

  const cartItems = useMemo(
    () =>
      (cart?.items ?? []).map(item => {
        const parsedTitle = parseCartItemTitle(item?.title)
        const selectedOptions =
          item?.selectedOptions && Object.keys(item.selectedOptions).length
            ? item.selectedOptions
            : parsedTitle.selectedOptions

        return {
          ...item,
          ...parsedTitle,
          selectedOptions,
          packageData: packageLookup.get(String(item.packageId)) ?? null,
        }
      }),
    [cart?.items, packageLookup]
  )

  // const itemCount = useMemo(
  //   () => cartItems.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0),
  //   [cartItems]
  // )

  const itemSummaries = useMemo(
    () =>
      cartItems.map(item => ({
        item,
        summary: getCartItemSummary(item, {
          cateringDiscountSettings,
          cartItems,
          deliveryCharge: isPincodeValid
            ? getDeliveryChargeForPincode(deliveryCharges, pinCode)
            : null,
        }),
      })),
    [cartItems, cateringDiscountSettings, deliveryCharges, isPincodeValid, pinCode]
  )
  const hasAutoFilledGuestCountRef = useRef(false)
  const computedSubtotal = useMemo(
    () => itemSummaries.reduce((sum, entry) => sum + Number(entry.summary.total ?? 0), 0),
    [itemSummaries]
  )
  const guestDiscountSummary = useMemo(
    () => aggregateAppliedGuestDiscounts(itemSummaries),
    [itemSummaries]
  )
  const discountAmount = Number(cart?.discountAmount ?? 0)
  const computedTotal = Math.max(0, computedSubtotal - discountAmount)
  const advancePercentage = Number(globalSettings?.advance_payment_percentage ?? 30)
  const advancePayable = computedTotal * (advancePercentage / 100)
  const balanceDue = Math.max(0, computedTotal - advancePayable)
  const pageContent = isSampleTastingCheckout
    ? {
        heading: 'Confirm Tasting',
        intro: 'Quick checkout - just a few details needed',
        summaryTitle: 'Tasting Summary',
        detailsTitle: 'Your Details',
        detailsIntro: "We'll use these details to confirm and coordinate your event",
        ctaLabel: 'Confirm Booking',
      }
    : {
        heading: 'Checkout',
        intro: 'Review your event packages and complete your booking.',
        summaryTitle: 'Booking Summary',
        detailsTitle: 'Event Information',
        detailsIntro: "We'll use these details to plan and coordinate your event.",
        ctaLabel: 'Pay Advance & Confirm Booking',
      }

  const [showPaymentPopup, setShowPaymentPopup] = useState(false)
  const [paymentOption, setPaymentOption] = useState('advance')
  const debouncedPinCode = useDebouncedValue(pinCode, 500)

  useEffect(() => {
    if (!location.state?.showCheckoutToast || hasShownCheckoutToastRef.current) return

    hasShownCheckoutToastRef.current = true
    showToast({
      message: location.state?.checkoutToastMessage || checkoutToastMessage,
    })
    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        ...(location.state ?? {}),
        showCheckoutToast: false,
      },
    })
  }, [
    checkoutToastMessage,
    location.pathname,
    location.search,
    location.state,
    navigate,
    showToast,
  ])

  useEffect(() => {
    try {
      localStorage.removeItem(CART_PIN_CODE_KEY)
    } catch {
      // Ignore storage failures and keep the page usable.
    }
  }, [])

  useEffect(() => {
    if (hasAutoFilledGuestCountRef.current) return

    const fromCart = Number(cart?.guestCount ?? 0)
    const fromCateringPackages = getGuestCountFromCartItems(cartItems)
    const value = fromCart > 0 ? fromCart : fromCateringPackages

    if (value > 0) {
      setGuestCount(String(value))
      hasAutoFilledGuestCountRef.current = true
    }
  }, [cart?.guestCount, cartItems])

  useEffect(() => {
    if (pinCode !== debouncedPinCode) {
      setIsCheckingPincode(false)
      setIsPincodeValid(false)
      setPinCodeMessage('')
      return
    }

    const nextState = getPincodeValidationState(
      debouncedPinCode,
      serviceAreas,
      isLoadingServiceAreas
    )
    setIsCheckingPincode(nextState.isChecking)
    setIsPincodeValid(nextState.isValid)

    let message = nextState.message
    if (nextState.isValid) {
      const deliveryCharge = getDeliveryChargeForPincode(deliveryCharges, debouncedPinCode)
      if (deliveryCharge?.location) {
        message = `Service available in ${deliveryCharge.location}. Zone transport add-on included in totals.`
      }
    }

    setPinCodeMessage(message)
  }, [debouncedPinCode, pinCode, isLoadingServiceAreas, serviceAreas, deliveryCharges])

  const handleCheckout = async paymentType => {
    const token = getStoredJwt()
    if (!token) {
      navigate('/login')
      return
    }

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setFormError('Please fill in your contact details.')
      return
    }

    if (
      !isSampleTastingCheckout &&
      (!eventDate || !eventAddress.trim() || !guestCount || Number(guestCount) < 1)
    ) {
      setFormError('Please complete the event information form before payment.')
      return
    }

    if (!isSampleTastingCheckout) {
      const nextPincodeState = getPincodeValidationState(
        pinCode,
        serviceAreas,
        isLoadingServiceAreas
      )
      if (!nextPincodeState.isValid) {
        setFormError(nextPincodeState.message || 'Please enter a valid serviceable pincode.')
        return
      }
    }

    setFormError('')
    setIsSubmitting(true)

    try {
      if (!isSampleTastingCheckout) {
        await updateCartDetails({
          eventDate,
          eventCity: eventAddress.trim(),
          guestCount: Number(guestCount),
        })
      }

      const sampleBookingDate =
        cart?.eventDate && String(cart.eventDate).slice(0, 10)
          ? String(cart.eventDate).slice(0, 10)
          : new Date().toISOString().slice(0, 10)

      let booking = draftBookingRef.current

      if (!booking?.id) {
        const bookingResponse = await bookingCreate(
          token,
          isSampleTastingCheckout
            ? {
                checkoutMode: 'sample-tasting',
                eventDate: sampleBookingDate,
                eventTime: sessionDetails.timeLabel || '',
                guestCount: 1,
              }
            : {
                eventTime: eventTime || '',
                deliveryPincode: pinCode,
              }
        )
        booking = bookingResponse?.booking
        if (booking?.id) {
          draftBookingRef.current = booking
        }
      }

      if (!booking?.id) {
        throw new Error('Booking could not be created.')
      }

      const tastingPackagesNote =
        Array.isArray(location.state?.sampleTasteSelections) &&
        location.state.sampleTasteSelections.length
          ? location.state.sampleTasteSelections
              .map(
                entry =>
                  `${entry.packageTitle || entry.packageId}: tasting menu to be confirmed after booking${
                    entry.guestCount ? ` (package guests: ${entry.guestCount})` : ''
                  }`
              )
              .join(' | ')
          : cartItems.map(getCartItemNoteLabel).join(' | ') || 'Not provided'

      const extraDetails = isSampleTastingCheckout
        ? [
            'Checkout mode: Sample tasting',
            'Tasting menu: Separate from event menu — dishes confirmed manually after booking',
            `Contact name: ${fullName.trim()}`,
            `Phone: ${phone.trim()}`,
            `Email: ${email.trim()}`,
            `Tasting date: ${sessionDetails.dateLabel || 'Not provided'}`,
            `Tasting time: ${sessionDetails.timeLabel || 'Not provided'}`,
            `Tasting address: ${sessionDetails.address || 'Not provided'}`,
            `Special request: ${specialRequest.trim() || 'Not provided'}`,
            `Packages booked for tasting: ${tastingPackagesNote}`,
          ].join('\n')
        : [
            `Contact name: ${fullName.trim()}`,
            `Phone: ${phone.trim()}`,
            `Email: ${email.trim()}`,
            `Event date: ${eventDate}`,
            `Event time: ${eventTime || 'Not provided'}`,
            `Event address: ${eventAddress.trim()}`,
            `PIN code: ${pinCode || 'Not provided'}`,
            `Guest count: ${guestCount}`,
            `Special request: ${specialRequest.trim() || 'Not provided'}`,
            `Selected items: ${cartItems.map(getCartItemNoteLabel).join(' | ') || 'Not provided'}`,
          ].join('\n')

      await bookingAddNote(token, booking.id, { note: extraDetails }).catch(() => {})

      const orderResponse = await paymentCreateOrder(token, {
        bookingId: booking.id,
        paymentType,
      })

      if (orderResponse?.testMode) {
        const verifyResponse = await paymentVerify(token, {
          paymentId: orderResponse.paymentId,
          razorpayOrderId: orderResponse.razorpayOrderId,
          razorpayPaymentId: `test_payment_${orderResponse.paymentId}`,
          razorpaySignature: 'test_signature_bypass',
          paymentMethod,
          testBypass: true,
        })

        setIsSubmitting(false)
        navigate(`/booking-confirmation?bookingId=${booking.id}`, {
          state: {
            booking: verifyResponse?.booking || booking,
            payment: {
              advanceAmount: orderResponse.amount,
              amountPaid: orderResponse.amount,
              paymentType,
              totalAmount: computedTotal,
              balanceDue: Math.max(0, computedTotal - Number(orderResponse.amount ?? 0)),
            },
            checkoutInfo: {
              fullName,
              phone,
              email,
              eventDate: isSampleTastingCheckout ? sessionDetails.dateLabel : eventDate,
              eventTime: isSampleTastingCheckout ? sessionDetails.timeLabel : eventTime,
              eventAddress: isSampleTastingCheckout ? sessionDetails.address : eventAddress,
              pinCode,
              guestCount,
              specialRequest,
              checkoutMode: isSampleTastingCheckout ? 'sample-tasting' : 'standard',
              selectedItems: itemSummaries.map(({ item, summary }) => ({
                id: item?.id,
                title: item?.title,
                amount: Number(summary?.total ?? item?.totalPrice ?? 0),
                additionalInfo: String(item?.additionalInfo ?? '').trim(),
              })),
              showBookingConfirmationToast: true,
            },
          },
        })
        return
      }

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
            paymentFailureToastShownRef.current = false
            const verifyResponse = await paymentVerify(token, {
              paymentId: orderResponse.paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod,
            })

            navigate(`/booking-confirmation?bookingId=${booking.id}`, {
              state: {
                booking: verifyResponse?.booking || booking,
                payment: {
                  advanceAmount: orderResponse.amount,
                  amountPaid: orderResponse.amount,
                  paymentType,
                  totalAmount: computedTotal,
                  balanceDue: Math.max(0, computedTotal - Number(orderResponse.amount ?? 0)),
                },
                checkoutInfo: {
                  fullName,
                  phone,
                  email,
                  eventDate: isSampleTastingCheckout ? sessionDetails.dateLabel : eventDate,
                  eventTime: isSampleTastingCheckout ? sessionDetails.timeLabel : eventTime,
                  eventAddress: isSampleTastingCheckout ? sessionDetails.address : eventAddress,
                  pinCode,
                  guestCount,
                  specialRequest,
                  checkoutMode: isSampleTastingCheckout ? 'sample-tasting' : 'standard',
                  selectedItems: itemSummaries.map(({ item, summary }) => ({
                    id: item?.id,
                    title: item?.title,
                    amount: Number(summary?.total ?? item?.totalPrice ?? 0),
                    additionalInfo: String(item?.additionalInfo ?? '').trim(),
                  })),
                  showBookingConfirmationToast: true,
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
            if (!paymentFailureToastShownRef.current) {
              showToast({ message: paymentCancelledToastMessage })
            }
            paymentFailureToastShownRef.current = false
            setIsSubmitting(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', response => {
        paymentFailureToastShownRef.current = true
        showToast({ message: paymentFailedToastMessage })
        setFormError(getPaymentErrorMessage(response))
        setIsSubmitting(false)
      })
      try {
        razorpay.open()
      } catch (gatewayErr) {
        setFormError(getPaymentErrorMessage(gatewayErr))
        setIsSubmitting(false)
      }
    } catch (err) {
      setFormError(getPaymentErrorMessage(err))
      setIsSubmitting(false)
    }
  }

  if (isStrapiLoading) {
    return <CmsPageLoader />
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] px-4 pt-24 md:px-8 lg:px-16">
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
    <div className="min-h-screen bg-[#FFFFFF] px-5 py-10 pt-24 md:px-8 lg:px-16">
      <div className="mb-10">
        <h2 className="text-4xl text-[#2C2C2C]">{pageContent.heading}</h2>
        <p className="mt-2 text-gray-500">{pageContent.intro}</p>
      </div>

      <div className="flex flex-col gap-[clamp(24px,5vw,100px)] md:flex-row">
        <div className="flex-1 space-y-6">
          {isSampleTastingCheckout ? (
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
          ) : (
            <SpecialRequest
              preferences={specialRequest}
              onChange={setSpecialRequest}
              onSubmit={event => event.preventDefault()}
            />
          )}
          <div className="overflow-hidden rounded-xl border border-[#95796066]">
            <div className="bg-[#1F2A16] px-5 py-3 text-white">
              <h3 className="font-medium" style={{ fontFamily: "'Poppins'" }}>
                {pageContent.summaryTitle}
              </h3>
            </div>

            <div className="space-y-4 p-5 text-sm">
              {itemSummaries.length ? (
                <div className="space-y-3">
                  {itemSummaries.map(({ item, summary }) => {
                    if (item?.itemType === 'addon') {
                      const addonPricing = summary?.cateringAddonPricing
                      const addonGuestLabel =
                        addonPricing?.guestCount > 0
                          ? ` · ${addonPricing.guestCount} guests × ₹${Number(addonPricing.perPerson).toLocaleString('en-IN')}/person`
                          : ''
                      const quantityLabel =
                        getCartItemQuantity(item) > 1 ? ` x${getCartItemQuantity(item)}` : ''

                      return (
                        <div key={item.id}>
                          <SummaryRow
                            label={`Add-on - ${getCartItemDisplayName(item)}${addonGuestLabel}${quantityLabel}`}
                            value={formatCurrency(summary.total)}
                          />
                          {item?.additionalInfo ? (
                            <p className="mt-1 text-xs text-[#767676]">
                              Additional Info: {item.additionalInfo}
                            </p>
                          ) : null}
                        </div>
                      )
                    }

                    const packageName = getCartItemDisplayName(item)
                    const packageLineLabel = getPackageLineLabel(item?.title, packageName)
                    const optionsText = getSelectedOptionsText(getDisplaySelectedOptions(item))
                    const labelWithOptions = optionsText
                      ? `${packageLineLabel} (${optionsText})`
                      : packageLineLabel
                    const quantityLabel =
                      getCartItemQuantity(item) > 1 ? ` x${getCartItemQuantity(item)}` : ''

                    return (
                      <div key={item.id}>
                        <SummaryRow
                          label={`${labelWithOptions}${quantityLabel}`}
                          value={formatCurrency(summary.total)}
                        />
                        {item?.additionalInfo ? (
                          <p className="mt-1 text-xs text-[#767676]">
                            Additional Info: {item.additionalInfo}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}

              <hr className="my-4 border-[#0000001A]" />

              <div className="space-y-2 text-gray-600">
                {guestDiscountSummary?.totalGuestDiscount > 0 ? (
                  <SummaryRow
                    label="Subtotal before guest discounts"
                    value={formatCurrency(guestDiscountSummary.grossSubtotalBeforeGuestDiscounts)}
                  />
                ) : null}

                <PriceSummaryDiscountRows
                  guestDiscountSummary={guestDiscountSummary}
                  couponDiscount={discountAmount}
                  formatCurrency={formatCurrency}
                />

                <SummaryRow
                  label="Subtotal (before GST)"
                  value={formatCurrency(computedSubtotal)}
                />
              </div>

              <hr className="my-4 border-[#0000001A]" />

              <div className="flex justify-between rounded-lg bg-[#F3EFE9] px-4 py-3 text-base font-medium">
                <span>Total Amount</span>
                <span>{formatCurrency(computedTotal)}</span>
              </div>

              <div className="flex justify-between rounded-lg bg-[#F1F1F1] px-4 py-3 text-base font-medium">
                <span>Advance Payable ({advancePercentage}%)</span>
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
            <h2
              className="text-[20px] font-semibold text-[#2C2C2C]"
              style={{ fontFamily: "'Poppins'" }}
            >
              {pageContent.detailsTitle}
            </h2>
            <p className="mt-3 text-[14px] text-[#7A7A7A]">{pageContent.detailsIntro}</p>

            <div className="mt-10 space-y-4">
              <input
                type="text"
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                placeholder="Full Name"
                className="w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none"
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <input
                  type="text"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  placeholder="Phone Number"
                  className="w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none"
                />

                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Email Address"
                  className="w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none"
                />
              </div>
            </div>

            {!isSampleTastingCheckout ? (
              <div className="mt-10">
                <h3
                  className="text-[18px] font-semibold text-[#2C2C2C]"
                  style={{ fontFamily: "'Poppins'" }}
                >
                  Event Details
                </h3>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <DateTimePicker
                    type="date"
                    min={getMinEventDate()}
                    value={eventDate}
                    onChange={event => setEventDate(event.target.value)}
                    className="w-full border-b border-[#2D2D2D] bg-transparent pb-3 text-[16px] outline-none"
                  />
                  <DateTimePicker
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
                    className="w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none"
                  />
                  <input
                    type="text"
                    value={pinCode}
                    onChange={event => {
                      setFormError('')
                      setPinCode(normalizePincode(event.target.value))
                    }}
                    placeholder="PIN Code"
                    className="w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none"
                  />
                  {pinCodeMessage ? (
                    <p
                      className={`text-[12px] md:col-span-2 ${
                        isPincodeValid ? 'text-[#2E7D32]' : 'text-[#B42318]'
                      }`}
                    >
                      {isCheckingPincode ? 'Checking availability...' : pinCodeMessage}
                    </p>
                  ) : null}
                  <input
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={event => setGuestCount(event.target.value)}
                    placeholder="Number of Guests"
                    className="w-full border-b border-[#2D2D2D] bg-transparent pb-[6px] text-[16px] outline-none md:col-span-2"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <PaymentMethod selected={paymentMethod} onChange={setPaymentMethod} />

          <div className="rounded-xl border border-[#95796066] p-5">
            <div className="mb-4 rounded-lg bg-[#E6F2E1] py-3 text-center text-sm">
              🔒 Secure payment · Instant confirmation · Easy cancellation
            </div>

            {formError ? <p className="mb-4 text-sm text-[#B42318]">{formError}</p> : null}

            <button
              type="button"
              onClick={() => setShowPaymentPopup(true)}
              disabled={isSubmitting}
              className="mx-auto mt-4 flex w-full items-center justify-between rounded-full bg-[#D4BA8E] py-1.5 pl-6 pr-1.5 transition-colors hover:bg-[#C6AB7F] group disabled:cursor-not-allowed disabled:bg-[#CFCBC5]"
            >
              <span className="mr-5 text-[15px] font-medium text-white">
                {isSubmitting ? 'Processing...' : pageContent.ctaLabel}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                <svg
                  className="h-[20px] w-[20px] text-[#D4BA8E] transition-transform duration-300 ease-out group-hover:rotate-45 group-hover:text-[#C6AB7F]"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.82812 5.83398H14.1615M14.1615 5.83398V14.1673M14.1615 5.83398L5.82812 14.1673"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <PaymentOptionPopup
        open={showPaymentPopup}
        onClose={() => setShowPaymentPopup(false)}
        selected={paymentOption}
        setSelected={setPaymentOption}
        advanceAmount={advancePayable}
        fullAmount={computedTotal}
        advancePercentage={advancePercentage}
        onConfirm={type => {
          setShowPaymentPopup(false)
          handleCheckout(type)
        }}
      />
    </div>
  )
}
