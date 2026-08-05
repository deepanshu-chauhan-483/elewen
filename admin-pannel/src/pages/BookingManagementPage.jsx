import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  SectionLoadingState,
  CustomSelect,
} from '../components/ui/AdminUI'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useScrollToTop } from '../hooks/useScrollToTop'
import {
  useAdminAddBookingNote,
  useAdminBooking,
  useAdminBookingCouponSuggestion,
  useAdminBookings,
  useAdminCreateVendorAssignment,
  useAdminSendReferralCoupon,
  useAdminPreviewPersonalizationEmail,
  useAdminSendPersonalizationEmail,
  useAdminUpdateBookingStatus,
  useAdminVendors,
} from '../hooks/useAdminData'
import { getAdminBadgeClass } from '../lib/adminBadges'
import { bookingHasHookahCod } from '../lib/sheeshaCheckout'
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatters'
import {
  buildAddonItemRows,
  buildSelectedItemRows,
  formatInfoStatus,
  getBookingAdditionalInfoText,
  getBookingPackageNamesText,
} from '../lib/bookingDisplay'
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  canProgressToStage,
  getBookingStatusLabel,
} from '../lib/bookingStages'

const VALID_BOOKING_BUCKETS = new Set(['all', 'active', 'today', 'upcoming', 'completed', 'incomplete'])
const VALID_BOOKING_STATUSES = new Set(['', ...BOOKING_STATUSES])

function normalizeBookingBucket(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()
  if (normalizedValue === 'incomplete') return 'active'
  return VALID_BOOKING_BUCKETS.has(normalizedValue) ? normalizedValue : 'all'
}

function normalizeBookingStatus(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()
  return VALID_BOOKING_STATUSES.has(normalizedValue) ? normalizedValue : ''
}

function buildAdminMessageHref(bookingId = '') {
  const id = String(bookingId ?? '').trim()
  return id ? `/messages?bookingId=${encodeURIComponent(id)}` : '/messages'
}

function buildAdminSupportHref(bookingId = '') {
  const id = String(bookingId ?? '').trim()
  return id ? `/support?bookingId=${encodeURIComponent(id)}` : '/support'
}

// ---------------------------------------------------------------------------
// Status badge — normal text, no uppercase
// ---------------------------------------------------------------------------
// border accent per status (left when collapsed, top when expanded)
const borderColorMap = {
  new: 'border-[#C57A1E]',
  confirmed: 'border-[#16A34A]',
  info_collection: 'border-[#0383E4]',
  planning: 'border-[#6D28D9]',
  pre_event: 'border-[#C57A1E]',
  execution: 'border-[#16A34A]',
  post_event: 'border-[#0383E4]',
  completed: 'border-[#9CA3AF]',
  cancelled: 'border-[#8A1C1C]',
}

function StatusBadge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = getAdminBadgeClass(status, { preset: 'vivid' })
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? '' : 'rotate-180'

  return (
    <svg
      className={`h-6 w-6 ${rotationClass}`}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28.5 18H7.5M7.5 18L18 28.5M7.5 18L18 7.5"
        stroke="#1C1C1C"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Shared form primitives
// ---------------------------------------------------------------------------
function Textarea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-2xl border border-[#E4DED8] bg-[#F3F3F3] px-4 py-3 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition resize-none"
    />
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] hover:bg-[#C6AB7F] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold bg-[#CDB17E] text-[#FAFAFA] transition hover:bg-[#C6A15B] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function LinkBtn({ href, children }) {
  if (!href) return null

  const className =
    'inline-flex h-10 items-center justify-center rounded-full border border-[#CDB17E] bg-white px-5 text-sm text-[#CDB17E] transition hover:bg-[#FAF6F1]'

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Chevron icon
// ---------------------------------------------------------------------------
function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-5 w-5 text-[#8F8F8F] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Calendar icon
// ---------------------------------------------------------------------------
function CalIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#8F8F8F]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Section label (same style as user dashboard)
// ---------------------------------------------------------------------------
function SectionLabel({ children }) {
  return (
    <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-[#767676] uppercase">
      {children}
    </p>
  )
}

function formatStageLabel(value = '') {
  return getBookingStatusLabel(value)
}

function getSubtitle(booking) {
  return [
    // booking?.detailSubtitle,
    booking?.event?.name,
    booking?.package?.serviceCategories?.[0]?.name,
  ]
    .filter(Boolean)
    .join(' · ')
}
function getLatestStatusNote(statusLogs = []) {
  return [...(Array.isArray(statusLogs) ? statusLogs : [])]
    .reverse()
    .find(log => String(log?.note ?? '').trim())
}

function buildPaymentDetailRows(booking) {
  const paymentSummary = booking?.paymentSummary ?? {}
  const isCodBooking = Boolean(paymentSummary?.isCodBooking)
  const advanceAmount = paymentSummary?.advanceAmount ?? booking?.advanceAmount ?? 0
  const remainingAmount = paymentSummary?.scheduledRemainingAmount ?? booking?.remainingAmount ?? 0
  const totalAmount = paymentSummary?.totalPrice ?? booking?.totalPrice ?? 0
  const bookedAt = booking?.bookedAt ?? booking?.createdAt ?? ''

  return [
    {
      id: `${booking?.id ?? 'booking'}-payment-advance`,
      label: isCodBooking ? 'Advance (COD — none)' : 'Advance',
      amount: advanceAmount,
      bookedAt,
    },
    {
      id: `${booking?.id ?? 'booking'}-payment-remaining`,
      label: isCodBooking ? 'Due on delivery' : 'Remaining',
      amount: remainingAmount,
      bookedAt,
    },
    {
      id: `${booking?.id ?? 'booking'}-payment-total`,
      label: 'Total',
      amount: totalAmount,
      bookedAt,
      isTotal: true,
    },
  ]
}
const REFERRAL_TIER_OPTIONS = [
  { value: 'referral_500', label: 'Referral — Rs 500 off' },
  { value: 'referral_800', label: 'Referral — Rs 800 off' },
  { value: 'referral_1500', label: 'Referral — Rs 1,500 off' },
]

function PersonalizationEmailPanel({ bookingId, bookingStatus, customerEmail }) {
  const previewMutation = useAdminPreviewPersonalizationEmail()
  const sendMutation = useAdminSendPersonalizationEmail()
  const [serviceName, setServiceName] = useState('decor')
  const [designImage1, setDesignImage1] = useState('')
  const [designImage2, setDesignImage2] = useState('')
  const [designImage3, setDesignImage3] = useState('')
  const [responseDeadline, setResponseDeadline] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [emailTo, setEmailTo] = useState(String(customerEmail ?? '').trim())
  const [emailSubject, setEmailSubject] = useState("Let's personalise your booking with Elewen")
  const [emailHeadline, setEmailHeadline] = useState('')
  const [emailIntro, setEmailIntro] = useState('')
  const [emailNote, setEmailNote] = useState('')
  const [emailHtml, setEmailHtml] = useState('')
  const [previewStale, setPreviewStale] = useState(false)
  const [sendMessage, setSendMessage] = useState('')
  const [sendError, setSendError] = useState('')

  const status = String(bookingStatus ?? '').toLowerCase()
  const canSend = !['new', 'cancelled'].includes(status)

  if (!canSend) {
    return (
      <p className="text-sm text-[#8F8F8F]">
        Confirm the booking first, then send design / text / colour options to the customer.
      </p>
    )
  }

  const payloadFields = (includeCopy = true) => ({
    serviceName: serviceName.trim() || 'decor',
    designImage1: designImage1.trim(),
    designImage2: designImage2.trim(),
    designImage3: designImage3.trim(),
    responseDeadline: responseDeadline || undefined,
    channel: 'smtp',
    ...(includeCopy
      ? {
          subject: emailSubject.trim() || undefined,
          headline: emailHeadline.trim() || undefined,
          introText: emailIntro.trim() || undefined,
          customMessage: emailNote.trim() || undefined,
        }
      : {}),
  })

  const applyPreviewResult = (result, { seedCopy } = { seedCopy: false }) => {
    setEmailTo(result?.to || String(customerEmail ?? '').trim() || '')
    setEmailHtml(result?.html ?? '')
    if (seedCopy) {
      setEmailSubject(result?.subject ?? result?.defaults?.subject ?? '')
      setEmailHeadline(result?.headline ?? result?.defaults?.headline ?? '')
      setEmailIntro(result?.introText ?? result?.defaults?.introText ?? '')
      setEmailNote(result?.customMessage ?? '')
    } else if (result?.subject) {
      setEmailSubject(result.subject)
    }
    setPreviewStale(false)
    setComposerOpen(true)
  }

  const handlePreview = async ({ seedCopy = !composerOpen } = {}) => {
    setSendError('')
    setSendMessage('')
    try {
      const result = await previewMutation.mutateAsync({
        bookingId,
        body: payloadFields(composerOpen),
      })
      applyPreviewResult(result, { seedCopy })
    } catch (error) {
      if (!composerOpen) setComposerOpen(false)
      setSendError(error?.message ?? 'Could not preview personalization email.')
    }
  }

  const markCopyChanged = setter => event => {
    setter(event.target.value)
    setPreviewStale(true)
  }

  const handleSend = async () => {
    setSendError('')
    setSendMessage('')
    try {
      if (previewStale) {
        const refreshed = await previewMutation.mutateAsync({
          bookingId,
          body: payloadFields(true),
        })
        applyPreviewResult(refreshed, { seedCopy: false })
      }

      await sendMutation.mutateAsync({
        bookingId,
        body: payloadFields(true),
      })
      setSendMessage('Personalization email sent from Elewen to the customer.')
      setComposerOpen(false)
      setPreviewStale(false)
    } catch (error) {
      setSendError(error?.message ?? 'Could not send personalization email.')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#6B7280]">
        Preview the Elewen-branded email, edit wording in plain language if needed, then send from
        Elewen mail (not your personal Gmail/Outlook).
      </p>
      <div>
        <p className="mb-1.5 text-xs text-[#8F8F8F]">Service name</p>
        <input
          type="text"
          value={serviceName}
          onChange={event => setServiceName(event.target.value)}
          placeholder="e.g. decor backdrop"
          className="min-h-10 w-full rounded-full bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none"
        />
      </div>
      {[
        ['Design image 1 URL', designImage1, setDesignImage1],
        ['Design image 2 URL', designImage2, setDesignImage2],
        ['Design image 3 URL', designImage3, setDesignImage3],
      ].map(([label, value, setter]) => (
        <div key={label}>
          <p className="mb-1.5 text-xs text-[#8F8F8F]">{label}</p>
          <input
            type="url"
            value={value}
            onChange={event => setter(event.target.value)}
            placeholder="https://..."
            className="min-h-10 w-full rounded-full bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none"
          />
        </div>
      ))}
      <div>
        <p className="mb-1.5 text-xs text-[#8F8F8F]">Response deadline</p>
        <input
          type="date"
          value={responseDeadline}
          onChange={event => setResponseDeadline(event.target.value)}
          className="min-h-10 w-full rounded-full bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <PrimaryBtn
          disabled={previewMutation.isPending || sendMutation.isPending}
          onClick={() => handlePreview({ seedCopy: !composerOpen })}
        >
          {previewMutation.isPending
            ? 'Loading preview…'
            : composerOpen
              ? 'Refresh preview'
              : 'Preview Elewen email'}
        </PrimaryBtn>
        {composerOpen ? (
          <GhostBtn
            disabled={previewMutation.isPending}
            onClick={() => {
              setComposerOpen(false)
              setSendError('')
              setPreviewStale(false)
            }}
          >
            Close preview
          </GhostBtn>
        ) : null}
      </div>

      {composerOpen ? (
        <div className="space-y-4 rounded-2xl border border-[#E4DED8] bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-[#1C1C1C]">Elewen email preview</p>
            <p className="mt-1 text-xs text-[#8F8F8F]">
              Same branded format the customer will receive. Edit wording below if needed — no code.
            </p>
          </div>

          <div className="rounded-xl bg-[#FBF7F3] px-4 py-3 text-sm text-[#6B7280]">
            <p>
              <span className="font-medium text-[#2D2D2D]">From:</span> Elewen mail
            </p>
            <p className="mt-1">
              <span className="font-medium text-[#2D2D2D]">To:</span> {emailTo || '—'}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-[#8F8F8F]">Email subject</p>
            <input
              type="text"
              value={emailSubject}
              onChange={markCopyChanged(setEmailSubject)}
              className="min-h-10 w-full rounded-full bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs text-[#8F8F8F]">Title inside email</p>
            <input
              type="text"
              value={emailHeadline}
              onChange={markCopyChanged(setEmailHeadline)}
              className="min-h-10 w-full rounded-full bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs text-[#8F8F8F]">Opening message</p>
            <textarea
              value={emailIntro}
              onChange={markCopyChanged(setEmailIntro)}
              rows={3}
              className="w-full rounded-2xl bg-[#F3F3F3] px-4 py-3 text-sm leading-6 text-[#2D2D2D] outline-none"
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs text-[#8F8F8F]">Extra note from planner (optional)</p>
            <textarea
              value={emailNote}
              onChange={markCopyChanged(setEmailNote)}
              rows={3}
              placeholder="e.g. These are the three backdrop options we discussed on call."
              className="w-full rounded-2xl bg-[#F3F3F3] px-4 py-3 text-sm leading-6 text-[#2D2D2D] outline-none"
            />
          </div>

          {previewStale ? (
            <p className="rounded-xl bg-[#FFF8E8] px-3 py-2 text-xs text-[#8A6A2F]">
              Wording changed — click <strong>Refresh preview</strong> to update the mail view, or
              send and we will refresh automatically.
            </p>
          ) : null}

          <div>
            <p className="mb-1.5 text-xs text-[#8F8F8F]">Customer email preview</p>
            <iframe
              title="Personalization email preview"
              srcDoc={emailHtml}
              sandbox=""
              className="h-[520px] w-full rounded-2xl border border-[#E4DED8] bg-[#0d0d0d]"
            />
          </div>

          <PrimaryBtn
            disabled={
              sendMutation.isPending ||
              previewMutation.isPending ||
              !emailSubject.trim() ||
              !emailHtml.trim()
            }
            onClick={handleSend}
          >
            {sendMutation.isPending ? 'Sending…' : 'Send from Elewen'}
          </PrimaryBtn>
        </div>
      ) : null}

      {sendMessage ? <p className="text-sm text-[#12803D]">{sendMessage}</p> : null}
      {sendError ? <p className="text-sm text-[#8A1C1C]">{sendError}</p> : null}
    </div>
  )
}

function ReferralCouponPanel({ bookingId, bookingStatus, bookingTotal }) {
  const canSend = ['post_event', 'completed'].includes(String(bookingStatus ?? '').toLowerCase())
  const suggestionQuery = useAdminBookingCouponSuggestion(bookingId, canSend)
  const sendMutation = useAdminSendReferralCoupon()
  const [tierKey, setTierKey] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sendError, setSendError] = useState('')

  useEffect(() => {
    const suggested = suggestionQuery.data?.suggestedTier?.key
    if (suggested) setTierKey(suggested)
  }, [suggestionQuery.data?.suggestedTier?.key])

  if (!canSend) {
    return (
      <p className="text-sm text-[#8F8F8F]">
        Referral coupons can be sent manually after the booking reaches Post Event or Completed.
      </p>
    )
  }

  const existingGrant = suggestionQuery.data?.existingGrant

  if (existingGrant) {
    return (
      <div className="rounded-xl bg-white px-4 py-3">
        <p className="text-sm font-medium text-[#2D2D2D]">Referral coupon already sent</p>
        <p className="mt-1 text-sm text-[#6B7280]">
          Code <span className="font-semibold text-[#2D2D2D]">{existingGrant.code}</span> ·{' '}
          {existingGrant.status}
        </p>
        {existingGrant.terms_customer ? (
          <p className="mt-2 text-xs leading-5 text-[#8F8F8F]">{existingGrant.terms_customer}</p>
        ) : null}
      </div>
    )
  }

  const handleSend = async () => {
    setSendError('')
    setSendMessage('')
    try {
      const response = await sendMutation.mutateAsync({
        bookingId,
        body: { tierKey: tierKey || undefined },
      })
      setSendMessage(`Coupon ${response?.grant?.code ?? ''} sent by email and inbox.`)
    } catch (error) {
      setSendError(error?.message ?? 'Could not send referral coupon.')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#6B7280]">
        Booking total: {formatCurrency(bookingTotal)}. Suggested tier:{' '}
        {suggestionQuery.data?.suggestedTier?.title ?? 'None — choose manually.'}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <p className="mb-1.5 text-xs text-[#8F8F8F]">Referral tier</p>
          <CustomSelect
            value={tierKey}
            onChange={setTierKey}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="">Use suggested tier</option>
            {REFERRAL_TIER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </CustomSelect>
        </div>
        <PrimaryBtn disabled={sendMutation.isPending} onClick={handleSend}>
          {sendMutation.isPending ? 'Sending…' : 'Send referral coupon'}
        </PrimaryBtn>
      </div>
      {sendMessage ? <p className="text-sm text-[#12803D]">{sendMessage}</p> : null}
      {sendError ? <p className="text-sm text-[#8A1C1C]">{sendError}</p> : null}
      <p className="text-xs leading-5 text-[#8F8F8F]">
        Manual action only. Sends a unique one-time code by email and customer inbox. Valid for 2
        months and assigned to that customer only.
      </p>
    </div>
  )
}

function PendingValue({ value, notProvidedLabel = 'Pending' }) {
  const text = String(value ?? '').trim()
  if (!text) {
    return <span className="text-[#C57A1E]">{notProvidedLabel}</span>
  }
  return text
}

function CustomerInformationSection({ booking }) {
  const infoStatus = formatInfoStatus(booking?.infoStatus)
  const packageNamesText = getBookingPackageNamesText(booking, '')
  const selectedItemRows = buildSelectedItemRows(booking)
  const addonRows = buildAddonItemRows(booking)
  const additionalInfo = getBookingAdditionalInfoText(booking)
  const files = Array.isArray(booking?.files) ? booking.files : []
  const personalizations = Array.isArray(booking?.personalizations) ? booking.personalizations : []
  const locationText = String(booking?.locationSummary ?? booking?.address?.summary ?? '').trim()

  const summaryFields = [
    {
      label: 'PACKAGE',
      value: packageNamesText,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'EVENT',
      value: booking?.event?.name,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'EVENT DATE',
      value: booking?.eventDate ? formatDate(booking.eventDate) : '',
      notProvidedLabel: 'Pending',
    },
    {
      label: 'EVENT TIME',
      value: booking?.eventTime,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'GUESTS',
      value: booking?.guestCount ? String(booking.guestCount) : '',
      notProvidedLabel: 'Pending',
    },
    {
      label: 'LOCATION',
      value: locationText,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'PIN CODE',
      value: booking?.pinCode,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'SPECIAL REQUEST',
      value: booking?.specialRequest,
      notProvidedLabel: 'Not provided',
    },
    {
      label: 'ADDITIONAL INFO',
      value: additionalInfo,
      notProvidedLabel: 'Not provided',
    },
    {
      label: 'INFORMATION COLLECTION',
      value: infoStatus.label,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'CHECKOUT MODE',
      value: booking?.checkoutMode
        ? String(booking.checkoutMode).replace(/-/g, ' ')
        : 'Standard booking',
      notProvidedLabel: 'Standard booking',
    },
    {
      label: 'FEEDBACK',
      value: booking?.feedbackSubmitted ? 'Submitted' : '',
      notProvidedLabel: 'Pending',
    },
  ]

  return (
    <div className="py-6 border-t border-[#00000033]">
      <SectionLabel>Customer Information</SectionLabel>
      <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4 space-y-5">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {summaryFields.map(field => (
            <div key={field.label}>
              <p className="text-[11px] tracking-[0.16em] text-[#767676]">{field.label}</p>
              <p className="mt-0.5 text-sm text-[#2D2D2D]">
                <PendingValue value={field.value} notProvidedLabel={field.notProvidedLabel} />
              </p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-3 text-[11px] tracking-[0.16em] text-[#767676]">SELECTED ITEMS</p>
          {selectedItemRows.length ? (
            <div className="space-y-2">
              {selectedItemRows.map(item => (
                <div key={item.id} className="flex justify-between rounded-xl bg-white px-4 py-3">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm text-[#2D2D2D]">{item.title}</p>
                    {item.includes ? (
                      <p className="mt-1 text-xs text-[#8F8F8F]">{item.includes}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-[#8F8F8F]">
                      Additional info:{' '}
                      {item.additionalInfo ? (
                        item.additionalInfo
                      ) : (
                        <span className="text-[#C57A1E]">Pending</span>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-[#2D2D2D]">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#C57A1E]">Pending</p>
          )}
        </div>

        {addonRows.length ? (
          <div>
            <p className="mb-3 text-[11px] tracking-[0.16em] text-[#767676]">ADD-ONS</p>
            <div className="space-y-2">
              {addonRows.map(item => (
                <div key={item.id} className="flex justify-between rounded-xl bg-white px-4 py-3">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm text-[#2D2D2D]">{item.title}</p>
                    {item.includes ? (
                      <p className="mt-1 text-xs text-[#8F8F8F]">{item.includes}</p>
                    ) : null}
                    {item.additionalInfo ? (
                      <p className="mt-1 text-xs text-[#8F8F8F]">Additional info: {item.additionalInfo}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-medium text-[#2D2D2D]">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-3 text-[11px] tracking-[0.16em] text-[#767676]">UPLOADED FILES</p>
          {files.length ? (
            <div className="space-y-2">
              {files.map(file => (
                <div key={file.id} className="rounded-xl bg-white px-4 py-3">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[#7A5C2E] underline-offset-2 hover:underline"
                  >
                    {file.fileType || 'File'} — View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#C57A1E]">Pending</p>
          )}
        </div>

        <div>
          <p className="mb-3 text-[11px] tracking-[0.16em] text-[#767676]">PERSONALIZATION</p>
          {personalizations.length ? (
            <div className="space-y-2">
              {personalizations.map(entry => (
                <div key={entry.id} className="rounded-xl bg-white px-4 py-3">
                  <p className="text-sm font-medium text-[#2D2D2D]">
                    {entry.serviceName || 'Personalization'}
                  </p>
                  <p className="mt-1 text-xs text-[#8F8F8F]">
                    Status:{' '}
                    {String(entry.status ?? 'pending').toLowerCase() === 'pending' ? (
                      <span className="text-[#C57A1E]">Pending</span>
                    ) : (
                      entry.status
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[#8F8F8F]">
                    Customer choice:{' '}
                    {entry.customerChoice ? (
                      entry.customerChoice
                    ) : (
                      <span className="text-[#C57A1E]">Pending</span>
                    )}
                  </p>
                  {entry.customerText ? (
                    <p className="mt-1 text-sm text-[#2D2D2D]">{entry.customerText}</p>
                  ) : null}
                  {entry.customerNotes ? (
                    <p className="mt-1 text-xs text-[#8F8F8F]">Notes: {entry.customerNotes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8F8F8F]">No personalization request sent yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Admin Booking Accordion Card
// ---------------------------------------------------------------------------
function BookingAccordionCard({ booking, open = false, onToggle }) {
  const [statusInput, setStatusInput] = useState(booking.status ?? '')
  const [statusNote, setStatusNote] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [statusError, setStatusError] = useState('')
  const bookingTitle = getBookingPackageNamesText(booking, booking.event?.name || 'Booking')

  const bookingQuery = useAdminBooking(open ? booking.id : null)
  const vendorsQuery = useAdminVendors({
    limit: 100,
    status: 'approved',
    availability: 'available',
  })
  const updateStatusMutation = useAdminUpdateBookingStatus()
  const addNoteMutation = useAdminAddBookingNote()
  const createAssignmentMutation = useAdminCreateVendorAssignment()

  const borderColor = borderColorMap[booking.status?.toLowerCase()] ?? 'border-[#CDB17E]'
  const subtitle = getSubtitle(booking)
  const bookingDetails = bookingQuery.data ?? booking
  const paymentDetailRows = useMemo(() => buildPaymentDetailRows(bookingDetails), [bookingDetails])
  const showHookahCodBadge = bookingHasHookahCod(bookingDetails)
  const latestStatusNote = getLatestStatusNote(bookingDetails?.statusLogs)
  const internalNotes = (Array.isArray(bookingDetails?.notes) ? bookingDetails.notes : []).filter(
    entry => entry?.isInternal === true
  )

  const handleUpdateStatus = async () => {
    const remainingAmount = bookingDetails?.remainingAmount ?? 0
    const validation = canProgressToStage(
      booking.status,
      statusInput,
      remainingAmount,
      bookingDetails?.eventDate ?? booking?.eventDate
    )

    if (!validation.allowed) {
      setStatusError(validation.message || 'Invalid stage transition.')
      return
    }

    setStatusError('')
    await updateStatusMutation.mutateAsync({
      bookingId: booking.id,
      body: { status: statusInput, note: statusNote },
    })
    setStatusNote('')
  }

  const handleStatusInputChange = newStatus => {
    setStatusInput(newStatus)
    const remainingAmount = bookingDetails?.remainingAmount ?? 0
    const validation = canProgressToStage(
      booking.status,
      newStatus,
      remainingAmount,
      bookingDetails?.eventDate ?? booking?.eventDate
    )
    if (!validation.allowed) {
      setStatusError(validation.message || 'Invalid stage transition.')
    } else {
      setStatusError('')
    }
  }

  const handleSaveInternalNote = async () => {
    await addNoteMutation.mutateAsync({
      bookingId: booking.id,
      body: { note: internalNote },
    })
    setInternalNote('')
  }

  // Check which status options are allowed
  const isStatusAllowed = optionStatus => {
    const remainingAmount = bookingDetails?.remainingAmount ?? 0
    const validation = canProgressToStage(
      booking.status,
      optionStatus,
      remainingAmount,
      bookingDetails?.eventDate ?? booking?.eventDate
    )
    return validation.allowed
  }

  return (
    <div
      id={booking?.id ? `booking-card-${booking.id}` : undefined}
      className={[
        'rounded-2xl bg-white shadow-sm transition-all hover:shadow-md',
        open ? `border-t-4 ${borderColor}` : `border-l-4 ${borderColor}`,
      ].join(' ')}
    >
      {/* ── Collapsed / header row — always visible ── */}
      <div className="cursor-pointer p-5" onClick={onToggle}>
        <div className="flex items-start justify-between gap-4">
          {/* Left — title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3">
              <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E]">
                {bookingTitle}
              </h3>
              <div className="shrink-0">
                <StatusBadge status={booking.status} label={booking.statusLabel} />
              </div>
              {showHookahCodBadge ? (
                <div className="shrink-0">
                  <StatusBadge status="pending" label="Hookah · COD" />
                </div>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-gray-500">{subtitle || 'Active booking'}</p>

            <div className="mt-2 flex items-center gap-1.5 text-sm text-[#1C1C1C]">
              <CalIcon />
              {formatDate(booking.eventDate)}
            </div>
          </div>

          {/* Right — amounts + chevron (hidden when open) */}
          <div className="flex shrink-0 items-start gap-6">
            {!open && (
              <div className="hidden gap-6 text-sm md:flex">
                <div className="flex flex-col">
                  <p className="text-[11px] text-[#767676]">ADVANCE PAID</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {formatCurrency(booking.advanceAmount)}
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] text-[#767676]">REMAINING</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {formatCurrency(booking.remainingAmount)}
                  </p>
                </div>
              </div>
            )}
            <ChevronIcon open={open} />
          </div>
        </div>

        {/* Mobile amounts when collapsed */}
        {!open && (
          <div className="mt-3 flex gap-8 text-sm md:hidden">
            <div>
              <p className="text-[11px] text-[#767676]">ADVANCE PAID</p>
              <p className="font-medium">{formatCurrency(booking.advanceAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">REMAINING</p>
              <p className="font-medium">{formatCurrency(booking.remainingAmount)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Expanded content ── */}
      {open && (
        <div className="border-t border-[#00000033] px-5 py-6" onClick={e => e.stopPropagation()}>
          {/* Booking details grid */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 pb-6">
            {[
              { label: 'CUSTOMER', value: bookingDetails.customer?.name },
              { label: 'EMAIL', value: bookingDetails.customer?.email },
              { label: 'PHONE', value: bookingDetails.customer?.phone },
              {
                label: 'GUESTS',
                value: bookingDetails.guestCount ? String(bookingDetails.guestCount) : 'Pending',
              },
              { label: 'LOCATION', value: bookingDetails.locationSummary },
              { label: 'ADVANCE', value: formatCurrency(bookingDetails.advanceAmount) },
              { label: 'REMAINING', value: formatCurrency(bookingDetails.remainingAmount) },
              { label: 'BOOKING ID', value: `#${bookingDetails.id}` },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[11px] tracking-[0.16em] text-[#767676]">{f.label}</p>
                <p className="mt-0.5 text-sm text-[#2D2D2D]">{f.value || '—'}</p>
              </div>
            ))}
          </div>

          <CustomerInformationSection booking={bookingDetails} />

          {/* ── Update Status ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Update Stage</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">New stage</p>
                  <CustomSelect
                    value={statusInput}
                    onChange={handleStatusInputChange}
                    className="min-h-10 rounded-full bg-[#F3F3F3]"
                  >
                    {BOOKING_STATUSES.filter(status => status !== 'cancelled').map(status => (
                      <option key={status} value={status} disabled={!isStatusAllowed(status)}>
                        {BOOKING_STATUS_LABELS[status]}
                      </option>
                    ))}
                    <option value="cancelled">Cancelled</option>
                  </CustomSelect>
                </div>
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Note (optional)</p>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={e => setStatusNote(e.target.value)}
                    placeholder="Reason for change…"
                    className="h-10 w-full rounded-full border border-[#E4DED8] bg-[#FFFFFF] px-4 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
                  />
                </div>
                <PrimaryBtn
                  disabled={updateStatusMutation.isPending || !!statusError}
                  onClick={handleUpdateStatus}
                >
                  {updateStatusMutation.isPending ? 'Updating…' : 'Update Status'}
                </PrimaryBtn>
              </div>
              {statusError && (
                <div className="mt-3 rounded-xl bg-[#FFF3F3] px-4 py-3 border border-[#FCC5C5]">
                  <p className="text-sm text-[#8A1C1C]">{statusError}</p>
                </div>
              )}
              {latestStatusNote ? (
                <div className="mt-3 rounded-xl bg-white px-4 py-3">
                  <p className="text-[11px] tracking-[0.16em] text-[#8F8F8F] uppercase">
                    Latest stage note
                  </p>
                  <p className="mt-1.5 text-sm text-[#2D2D2D]">{latestStatusNote.note}</p>
                  <p className="mt-1 text-xs text-[#8F8F8F]">
                    {formatDateTime(latestStatusNote.createdAt)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Internal Note ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Internal Note</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Textarea
                    value={internalNote}
                    onChange={e => setInternalNote(e.target.value)}
                    placeholder="Add context, dependencies, or follow-ups (team-only)…"
                  />
                </div>
                <GhostBtn
                  disabled={addNoteMutation.isPending || !internalNote.trim()}
                  onClick={handleSaveInternalNote}
                >
                  {addNoteMutation.isPending ? 'Saving…' : 'Save Note'}
                </GhostBtn>
              </div>
              {internalNotes.length ? (
                <div className="mt-3 space-y-2">
                  {internalNotes.map(entry => (
                    <div key={entry.id} className="rounded-xl bg-white px-4 py-3">
                      <p className="text-sm text-[#2D2D2D]">{entry.note}</p>
                      <p className="mt-1 text-xs text-[#8F8F8F]">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#8F8F8F]">No internal notes saved yet.</p>
              )}
            </div>
          </div>

          {/* ── Personalization email (Mail 2) ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Personalization Email</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <PersonalizationEmailPanel
                bookingId={booking.id}
                bookingStatus={bookingDetails?.status ?? booking.status}
                customerEmail={bookingDetails?.customer?.email}
              />
            </div>
          </div>

          {/* ── Referral Coupon ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Referral Coupon</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <ReferralCouponPanel
                bookingId={booking.id}
                bookingStatus={bookingDetails?.status ?? booking.status}
                bookingTotal={bookingDetails?.totalPrice ?? booking.totalPrice}
              />
            </div>
          </div>

          {/* ── Vendor Assignment ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Vendor Assignment</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <CustomSelect
                    value={vendorId}
                    onChange={setVendorId}
                    placeholder="Select a vendor..."
                    className="min-h-10 rounded-full bg-[#F3F3F3]"
                  >
                    <option value="">Select a vendor…</option>
                    {(vendorsQuery.data?.vendors ?? []).map(v => (
                      <option key={v.id} value={v.id}>
                        {v.companyName}
                      </option>
                    ))}
                  </CustomSelect>
                </div>
                <PrimaryBtn
                  disabled={createAssignmentMutation.isPending || !vendorId}
                  onClick={() =>
                    createAssignmentMutation.mutate({ bookingId: booking.id, vendorId })
                  }
                >
                  Assign Vendor
                </PrimaryBtn>
              </div>

              {/* Assigned vendor list */}
              {bookingDetails.vendorAssignments?.length ? (
                <div className="mt-3 space-y-2">
                  {bookingDetails.vendorAssignments.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#2D2D2D]">
                          {a.vendor?.companyName || a.vendorId}
                        </p>
                        <p className="mt-0.5 text-xs text-[#8F8F8F]">
                          {a.vendor?.locationCity || 'Location pending'}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#8F8F8F]">No vendors assigned yet.</p>
              )}
            </div>
          </div>

          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Communication Snapshot</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">MESSAGE THREAD</p>
                  <p className="mt-2 text-sm text-[#2D2D2D]">
                    {bookingDetails.messageThread ? 'Live thread available' : 'No thread yet'}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">SUPPORT TICKETS</p>
                  <p className="mt-2 text-sm text-[#2D2D2D]">
                    {bookingDetails.supportTickets?.length ?? 0} linked ticket
                    {bookingDetails.supportTickets?.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">FEEDBACK STATUS</p>
                  <p className="mt-2 text-sm text-[#2D2D2D]">
                    {bookingDetails.feedbackSubmitted ? 'Submitted' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <LinkBtn href={buildAdminMessageHref(booking.id)}>Open Message Thread</LinkBtn>
                <LinkBtn href={buildAdminSupportHref(booking.id)}>Open Support Tickets</LinkBtn>
              </div>
            </div>
          </div>

          {/* ── Payment History ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Payment History</SectionLabel>
            {paymentDetailRows.length ? (
              <div className="rounded-xl bg-[#F3F3F3] p-3">
                {paymentDetailRows.map((payment, index) => (
                  <div
                    key={payment.id}
                    className={index !== paymentDetailRows.length - 1 ? 'mb-3' : ''}
                  >
                    <div
                      className={`flex items-center justify-between ${
                        payment.isTotal ? 'border-t border-[#00000033] pt-3' : ''
                      }`}
                    >
                      <div>
                        <p
                          className={`text-sm ${
                            payment.isTotal ? 'font-medium text-[#1C1C1C]' : 'text-[#2E2E2E]'
                          }`}
                        >
                          {payment.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[#767676]">
                          {formatDateTime(payment.bookedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-medium ${
                            payment.isTotal ? 'text-[#1C1C1C]' : 'text-[#2D2D2D]'
                          }`}
                        >
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8F8F8F]">No payments recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const bookingBucketTabs = [
  { key: 'today', label: "Today's Bookings" },
  { key: 'all', label: 'Total Bookings' },
  { key: 'active', label: 'Incomplete Bookings' },
  { key: 'completed', label: 'Completed Bookings' },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BookingManagementPage() {
  const [openBookingId, setOpenBookingId] = useState('')
  const [searchParams] = useSearchParams()
  const initialBucket = normalizeBookingBucket(searchParams.get('bucket'))
  const initialStatusFilter = normalizeBookingStatus(searchParams.get('status'))
  const initialOpenBookingId = String(searchParams.get('open') ?? '').trim()
  const [search, setSearch] = useState('')
  const [bucket, setBucket] = useState(initialBucket)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [sortBy, setSortBy] = useState('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    const nextBucket = normalizeBookingBucket(searchParams.get('bucket'))
    const nextStatusFilter = normalizeBookingStatus(searchParams.get('status'))
    const nextOpenBookingId = String(searchParams.get('open') ?? '').trim()

    const timer = setTimeout(() => {
      setBucket(nextBucket)
      setStatusFilter(nextStatusFilter)
      setOpenBookingId(nextOpenBookingId)
      setCurrentPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [searchParams])

  useEffect(() => {
    if (!initialOpenBookingId) return undefined
    const timer = setTimeout(() => setOpenBookingId(initialOpenBookingId), 0)
    return () => clearTimeout(timer)
  }, [initialOpenBookingId])

  useScrollToTop(currentPage)

  const bookingsQuery = useAdminBookings({
    search: debouncedSearch,
    bucket,
    status: statusFilter,
    sortBy,
    page: currentPage,
    limit: PAGE_SIZE,
  })
  const bookings = bookingsQuery.data?.bookings ?? []
  const totalBookings = Number(bookingsQuery.data?.total ?? 0)
  const totalPages = Math.max(1, Number(bookingsQuery.data?.pages ?? 1))
  const isResultsLoading = bookingsQuery.isFetching && !bookingsQuery.isLoading
  const linkedOpenBookingId = String(openBookingId || initialOpenBookingId || '').trim()
  const openedBookingQuery = useAdminBooking(linkedOpenBookingId || null)

  const displayBookings = useMemo(() => {
    if (!linkedOpenBookingId) return bookings

    if (bookings.some(booking => booking.id === linkedOpenBookingId)) {
      return bookings
    }

    const openedBooking = openedBookingQuery.data
    if (openedBooking?.id === linkedOpenBookingId) {
      return [openedBooking, ...bookings]
    }

    return bookings
  }, [bookings, linkedOpenBookingId, openedBookingQuery.data])

  useEffect(() => {
    if (!linkedOpenBookingId) return undefined

    const timer = setTimeout(() => {
      document.getElementById(`booking-card-${linkedOpenBookingId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 250)

    return () => clearTimeout(timer)
  }, [linkedOpenBookingId, openedBookingQuery.isLoading, bookingsQuery.isLoading])

  // if (bookingsQuery.isLoading) return <LoadingState label="Loading bookings…" />
  // if (bookingsQuery.error) return <ErrorState label="Bookings could not be loaded right now." />
  if (bookingsQuery.isLoading && !bookingsQuery.data) {
    return <LoadingState label="Loading bookings..." />
  }

  const hasBookings = (bookingsQuery.data?.bookings?.length ?? 0) > 0

  if (bookingsQuery.error && !hasBookings) {
    return <ErrorState label="Bookings could not be loaded right now." />
  }
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Booking Management</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Click any booking to expand it and update status, assign vendors, or review payments.
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-[#767676] uppercase">
          Filter Bookings
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {bookingBucketTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setBucket(tab.key)
                setCurrentPage(1)
              }}
              className={[
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                bucket === tab.key
                  ? 'border-[#D4BA8E] bg-[#D4BA8E] text-[#FAFAFA]'
                  : 'border-[#E4DED8] bg-white text-[#6B7280] hover:border-[#D4BA8E] hover:text-[#7A5C2E]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex w-full items-center gap-2.5 rounded-full bg-[#F0F0F0] focus:border-[#C6A15B] px-2.5 py-1.5 text-[#A19B94]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8B1A8] text-[#FAFAFA]">
              <span className="h-3.5 w-3.5">
                <SearchIcon />
              </span>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by package name..."
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>
          <CustomSelect
            value={bucket}
            onChange={value => {
              setBucket(value)
              setCurrentPage(1)
            }}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="all">All Buckets</option>
            <option value="active">Incomplete (in progress)</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </CustomSelect>
          <CustomSelect
            value={statusFilter}
            onChange={value => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="">All Stages</option>
            {BOOKING_STATUSES.map(status => (
              <option key={status} value={status}>
                {BOOKING_STATUS_LABELS[status]}
              </option>
            ))}
          </CustomSelect>
          <CustomSelect
            value={sortBy}
            onChange={value => {
              setSortBy(value)
              setCurrentPage(1)
            }}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="latest">Latest First</option>
            <option value="event_date">By Event Date</option>
          </CustomSelect>
        </div>
        <p className="mt-3 text-xs text-[#8F8F8F]">
          Total shows every booking. Incomplete shows in-progress bookings. Stage filters match the
          customer timeline steps. Sort only changes the order of the results.
        </p>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">
          {totalBookings} booking{totalBookings !== 1 ? 's' : ''}
        </span>

        {statusFilter && (
          <span className="text-sm text-[#8F8F8F]">
            in &quot;{formatStageLabel(statusFilter)}&quot; stage
          </span>
        )}
      </div>

      {bookingsQuery.error && hasBookings && (
        <div className="rounded-xl border border-[#F5C2C7] bg-[#FFF3F4] px-4 py-3">
          <p className="text-sm text-[#B42318]">
            Some results may be outdated because the latest search request failed.
          </p>
        </div>
      )}

      {/* ── Accordion list ── */}
      {isResultsLoading ? (
        <SectionLoadingState label="Loading bookings..." />
      ) : displayBookings.length ? (
        <div>
          <div className="space-y-3">
            {displayBookings.map(booking => (
              <BookingAccordionCard
                key={`${booking.id}:${booking.status ?? ''}`}
                booking={booking}
                open={openBookingId === booking.id}
                onToggle={() =>
                  setOpenBookingId(current => (current === booking.id ? '' : booking.id))
                }
              />
            ))}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowIcon direction="left" />
            </button>
            <div className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1C]">
              {Math.min(currentPage, totalPages)} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </div>
      ) : (
        <ResultsEmptyState
          title="No bookings found"
          body="Try a different search term or filter."
        />
      )}
    </div>
  )
}
