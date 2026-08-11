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
  useAdminUploadDesignImage,
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
  getBookingCustomerPhone,
  getBookingPackageNamesText,
} from '../lib/bookingDisplay'
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  canProgressToStage,
  getBookingStatusLabel,
} from '../lib/bookingStages'

const VALID_BOOKING_BUCKETS = new Set([
  'all',
  'today',
  'live',
  'active',
  'cancelled',
  'incomplete',
  'upcoming',
  'completed',
])
const VALID_BOOKING_STATUSES = new Set(['', ...BOOKING_STATUSES])
const VALID_CANCELLED_BY = new Set(['', 'client', 'admin'])

function normalizeBookingBucket(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()
  if (normalizedValue === 'active') return 'live'
  return VALID_BOOKING_BUCKETS.has(normalizedValue) ? normalizedValue : 'today'
}

function normalizeBookingStatus(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()
  return VALID_BOOKING_STATUSES.has(normalizedValue) ? normalizedValue : ''
}

function normalizeCancelledBy(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()
  return VALID_CANCELLED_BY.has(normalizedValue) ? normalizedValue : ''
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
  completed: 'border-[#238E64]',
  cancelled: 'border-[#8A1C1C]',
  cancelled_by_client: 'border-[#8A1C1C]',
  cancelled_by_admin: 'border-[#7C3AED]',
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

function getBookingPaymentDisplay(booking) {
  const paymentSummary = booking?.paymentSummary ?? {}
  const isCodBooking = Boolean(paymentSummary?.isCodBooking)
  const amountPaid = Number(paymentSummary?.amountPaid ?? booking?.amountPaid ?? 0)
  const amountDue = Number(
    paymentSummary?.amountDue ?? booking?.remainingAmount ?? booking?.amountDue ?? 0
  )
  const requiredAdvance = Number(paymentSummary?.advanceAmount ?? booking?.advanceAmount ?? 0)
  const advancePaidAmount = Number(
    paymentSummary?.advancePaidAmount ??
      booking?.advancePaidAmount ??
      (isCodBooking ? 0 : Math.min(amountPaid, requiredAdvance > 0 ? requiredAdvance : 0))
  )

  return {
    isCodBooking,
    requiredAdvance,
    advancePaidAmount,
    amountDue,
    amountPaid,
    totalAmount: Number(paymentSummary?.totalPrice ?? booking?.totalPrice ?? 0),
  }
}

function buildPaymentDetailRows(booking) {
  const { isCodBooking, requiredAdvance, amountDue, totalAmount } = getBookingPaymentDisplay(booking)
  const bookedAt = booking?.bookedAt ?? booking?.createdAt ?? ''

  return [
    {
      id: `${booking?.id ?? 'booking'}-payment-advance`,
      label: isCodBooking ? 'Advance (COD — none)' : 'Advance required',
      amount: requiredAdvance,
      bookedAt,
    },
    {
      id: `${booking?.id ?? 'booking'}-payment-remaining`,
      label: isCodBooking ? 'Due on delivery' : 'Remaining due',
      amount: amountDue,
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function DesignImageDropzone({
  label,
  optionLabel,
  onOptionLabelChange,
  value,
  onChange,
  missing,
  uploadMutation,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleFile = async file => {
    if (!file) return
    setLocalError('')
    if (!String(file.type || '').startsWith('image/')) {
      setLocalError('Please choose an image file (JPG, PNG, WebP).')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setLocalError('Image must be 8MB or smaller.')
      return
    }

    setUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const result = await uploadMutation.mutateAsync({
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        },
      })
      if (!result?.url) throw new Error('Upload did not return an image URL.')
      onChange(result.url)
    } catch (error) {
      setLocalError(error?.message || 'Could not upload image. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-[#E4DED8] bg-[#FBF8F3] p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1">
          <p className="mb-1.5 text-xs text-[#8F8F8F]">{label} title</p>
          <input
            type="text"
            value={optionLabel}
            onChange={event => onOptionLabelChange(event.target.value)}
            placeholder={label}
            className="min-h-10 w-full rounded-full bg-white px-4 text-sm text-[#2D2D2D] outline-none"
          />
        </div>
        {value ? (
          <GhostBtn
            onClick={() => {
              onChange('')
              setLocalError('')
            }}
          >
            Remove image
          </GhostBtn>
        ) : null}
      </div>

      {value ? (
        <div className="overflow-hidden rounded-xl border border-[#E4DED8] bg-white">
          <img src={value} alt={optionLabel || label} className="max-h-48 w-full object-cover" />
        </div>
      ) : (
        <label
          onDragEnter={event => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragOver={event => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={event => {
            event.preventDefault()
            setDragOver(false)
          }}
          onDrop={event => {
            event.preventDefault()
            setDragOver(false)
            const file = event.dataTransfer?.files?.[0]
            handleFile(file)
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-8 text-center transition ${
            missing
              ? 'border-[#C45C4A] bg-[#FFF1EE]'
              : dragOver
                ? 'border-[#C9A96E] bg-[#FFF8E8]'
                : 'border-[#D6CFC7] bg-white'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading || uploadMutation.isPending}
            onChange={event => {
              const file = event.target.files?.[0]
              event.target.value = ''
              handleFile(file)
            }}
          />
          <span className="text-sm font-medium text-[#2D2D2D]">
            {uploading || uploadMutation.isPending
              ? 'Uploading…'
              : 'Drag & drop image here, or click to browse'}
          </span>
          <span className="text-xs text-[#8F8F8F]">Optional — leave empty to hide this option in the email</span>
        </label>
      )}

      {localError ? <p className="text-xs text-[#8A1C1C]">{localError}</p> : null}
    </div>
  )
}

function PersonalizationEmailPanel({ bookingId, bookingStatus, customerEmail }) {
  const previewMutation = useAdminPreviewPersonalizationEmail()
  const sendMutation = useAdminSendPersonalizationEmail()
  const uploadMutation = useAdminUploadDesignImage()
  const [serviceName, setServiceName] = useState('decor')
  const [designImage1, setDesignImage1] = useState('')
  const [designImage2, setDesignImage2] = useState('')
  const [designImage3, setDesignImage3] = useState('')
  const [responseDeadline, setResponseDeadline] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [emailTo, setEmailTo] = useState(String(customerEmail ?? '').trim())
  const [emailSubject, setEmailSubject] = useState("Let's personalise your booking with Elewen")
  const [emailHeadline, setEmailHeadline] = useState("Let's personalise your booking ✨")
  const [emailIntro, setEmailIntro] = useState('')
  const [emailNote, setEmailNote] = useState('')
  const [chooseHeading, setChooseHeading] = useState('Please choose your preferred design')
  const [chooseSubtext, setChooseSubtext] = useState('')
  const [optionLabel1, setOptionLabel1] = useState('Design Option 1')
  const [optionLabel2, setOptionLabel2] = useState('Design Option 2')
  const [optionLabel3, setOptionLabel3] = useState('Design Option 3')
  const [replyPrompt, setReplyPrompt] = useState('')
  const [ctaLabel, setCtaLabel] = useState('Open My Booking')
  const [textSectionHeading, setTextSectionHeading] = useState('What would you like it to say?')
  const [textSectionBody, setTextSectionBody] = useState(
    "Please share the exact text you'd like us to use. For example:"
  )
  const [textExamples, setTextExamples] = useState(
    "Welcome to Aarav's First Birthday\nHappy 25th Anniversary\nCongratulations, Riya & Arjun"
  )
  const [anythingElseHeading, setAnythingElseHeading] = useState(
    "Anything else you'd like us to know?"
  )
  const [anythingElseBody, setAnythingElseBody] = useState(
    'If you have any special requests or instructions, you can add them while submitting your selections. We will review your request and check its feasibility.'
  )
  const [deadlineText, setDeadlineText] = useState(
    'Please send us your selections by {{deadline}} so our team has enough time to prepare everything for your event.'
  )
  const [noReplyText, setNoReplyText] = useState(
    "If we don't hear back by then, we'll proceed with the default option discussed during your booking."
  )
  const [signOff, setSignOff] = useState('Team Elewen\n9810937700')
  const [emailHtml, setEmailHtml] = useState('')
  const [previewStale, setPreviewStale] = useState(false)
  const [imagesMissing, setImagesMissing] = useState(false)
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

  const hasDesignImage = Boolean(
    designImage1.trim() || designImage2.trim() || designImage3.trim()
  )

  const friendlyPreviewError = error => {
    const raw = String(error?.message ?? '')
    if (/design image/i.test(raw) || /at least one/i.test(raw)) {
      return 'Please upload at least one design image above, then try Preview again.'
    }
    if (/cancelled/i.test(raw)) {
      return 'This booking is cancelled, so the personalization email cannot be sent.'
    }
    if (/no email|user email/i.test(raw)) {
      return 'This customer has no email on file. Add an email before sending.'
    }
    if (/^API\s+\d+/i.test(raw)) {
      return 'Something went wrong while preparing the email. Please check the details above and try again.'
    }
    return raw || 'Could not prepare the email preview. Please try again.'
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
          chooseHeading: chooseHeading.trim() || undefined,
          chooseSubtext: chooseSubtext.trim() || undefined,
          optionLabel1: optionLabel1.trim() || undefined,
          optionLabel2: optionLabel2.trim() || undefined,
          optionLabel3: optionLabel3.trim() || undefined,
          replyPrompt: replyPrompt.trim() || undefined,
          ctaLabel: ctaLabel.trim() || undefined,
          textSectionHeading: textSectionHeading.trim() || undefined,
          textSectionBody: textSectionBody.trim() || undefined,
          textExamples: textExamples.trim() || undefined,
          anythingElseHeading: anythingElseHeading.trim() || undefined,
          anythingElseBody: anythingElseBody.trim() || undefined,
          deadlineText: deadlineText.trim() || undefined,
          noReplyText: noReplyText.trim() || undefined,
          signOff: signOff.trim() || undefined,
        }
      : {}),
  })

  const applyPreviewResult = (result, { seedCopy } = { seedCopy: false }) => {
    setEmailTo(result?.to || String(customerEmail ?? '').trim() || '')
    setEmailHtml(result?.html ?? '')
    if (seedCopy) {
      const defaults = result?.defaults ?? {}
      setEmailSubject(result?.subject ?? defaults.subject ?? '')
      setEmailHeadline(result?.headline ?? defaults.headline ?? '')
      setEmailIntro(result?.introText ?? defaults.introText ?? '')
      setEmailNote(result?.customMessage ?? '')
      setChooseHeading(result?.chooseHeading ?? defaults.chooseHeading ?? '')
      setChooseSubtext(result?.chooseSubtext ?? defaults.chooseSubtext ?? '')
      setOptionLabel1(result?.optionLabel1 ?? defaults.optionLabel1 ?? 'Design Option 1')
      setOptionLabel2(result?.optionLabel2 ?? defaults.optionLabel2 ?? 'Design Option 2')
      setOptionLabel3(result?.optionLabel3 ?? defaults.optionLabel3 ?? 'Design Option 3')
      setReplyPrompt(result?.replyPrompt ?? defaults.replyPrompt ?? '')
      setCtaLabel(result?.ctaLabel ?? defaults.ctaLabel ?? 'Open My Booking')
      setTextSectionHeading(result?.textSectionHeading ?? defaults.textSectionHeading ?? '')
      setTextSectionBody(result?.textSectionBody ?? defaults.textSectionBody ?? '')
      setTextExamples(result?.textExamples ?? defaults.textExamples ?? '')
      setAnythingElseHeading(result?.anythingElseHeading ?? defaults.anythingElseHeading ?? '')
      setAnythingElseBody(result?.anythingElseBody ?? defaults.anythingElseBody ?? '')
      setDeadlineText(result?.deadlineText ?? defaults.deadlineText ?? '')
      setNoReplyText(result?.noReplyText ?? defaults.noReplyText ?? '')
      setSignOff(result?.signOff ?? defaults.signOff ?? '')
    } else if (result?.subject) {
      setEmailSubject(result.subject)
    }
    setPreviewStale(false)
    setComposerOpen(true)
  }

  const ensureDesignImages = () => {
    if (hasDesignImage) {
      setImagesMissing(false)
      return true
    }
    setImagesMissing(true)
    setComposerOpen(false)
    setSendMessage('')
    setSendError(
      'Upload at least one design image above (Option 1, 2, or 3), then click Preview. Empty options are hidden in the email.'
    )
    return false
  }

  const handlePreview = async ({ seedCopy = !composerOpen } = {}) => {
    setSendError('')
    setSendMessage('')
    if (!ensureDesignImages()) return

    try {
      const result = await previewMutation.mutateAsync({
        bookingId,
        body: payloadFields(true),
      })
      applyPreviewResult(result, { seedCopy })
    } catch (error) {
      if (!composerOpen) setComposerOpen(false)
      if (/design image|at least one/i.test(String(error?.message ?? ''))) {
        setImagesMissing(true)
      }
      setSendError(friendlyPreviewError(error))
    }
  }

  const markCopyChanged = setter => event => {
    setter(event.target.value)
    setPreviewStale(true)
  }

  const handleImageChange = setter => url => {
    setter(url)
    setImagesMissing(false)
    setPreviewStale(true)
    if (sendError) setSendError('')
  }

  const handleSend = async () => {
    setSendError('')
    setSendMessage('')
    if (!ensureDesignImages()) return

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
      if (/design image|at least one/i.test(String(error?.message ?? ''))) {
        setImagesMissing(true)
      }
      setSendError(friendlyPreviewError(error))
    }
  }

  const fieldClass =
    'min-h-10 w-full rounded-full bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none'
  const areaClass =
    'w-full rounded-2xl bg-[#F3F3F3] px-4 py-3 text-sm leading-6 text-[#2D2D2D] outline-none'

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#6B7280]">
        Upload design photos, customise every line of the email, preview, then send. Only options
        with an image appear in the mail.
      </p>
      <div>
        <p className="mb-1.5 text-xs text-[#8F8F8F]">Service name</p>
        <input
          type="text"
          value={serviceName}
          onChange={event => {
            setServiceName(event.target.value)
            setPreviewStale(true)
          }}
          placeholder="e.g. decor backdrop"
          className={fieldClass}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-[#2D2D2D]">
          Design images <span className="text-[#C45C4A]">*</span>
          <span className="ml-1 font-normal text-[#8F8F8F]">
            (upload at least one — empty slots stay hidden in the email)
          </span>
        </p>
        <DesignImageDropzone
          label="Design Option 1"
          optionLabel={optionLabel1}
          onOptionLabelChange={value => {
            setOptionLabel1(value)
            setPreviewStale(true)
          }}
          value={designImage1}
          onChange={handleImageChange(setDesignImage1)}
          missing={imagesMissing && !hasDesignImage}
          uploadMutation={uploadMutation}
        />
        <DesignImageDropzone
          label="Design Option 2"
          optionLabel={optionLabel2}
          onOptionLabelChange={value => {
            setOptionLabel2(value)
            setPreviewStale(true)
          }}
          value={designImage2}
          onChange={handleImageChange(setDesignImage2)}
          missing={false}
          uploadMutation={uploadMutation}
        />
        <DesignImageDropzone
          label="Design Option 3"
          optionLabel={optionLabel3}
          onOptionLabelChange={value => {
            setOptionLabel3(value)
            setPreviewStale(true)
          }}
          value={designImage3}
          onChange={handleImageChange(setDesignImage3)}
          missing={false}
          uploadMutation={uploadMutation}
        />
        {imagesMissing ? (
          <p className="rounded-xl bg-[#FFF1EE] px-3 py-2 text-sm text-[#8A1C1C]">
            Please upload at least one design photo above before previewing or sending.
          </p>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-xs text-[#8F8F8F]">Response deadline</p>
        <input
          type="date"
          value={responseDeadline}
          onChange={event => {
            setResponseDeadline(event.target.value)
            setPreviewStale(true)
          }}
          className={fieldClass}
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
              Edit any wording below. Empty design slots never appear in the customer email.
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

          {[
            ['Email subject', emailSubject, setEmailSubject, 'input'],
            ['Title inside email', emailHeadline, setEmailHeadline, 'input'],
            ['Opening message', emailIntro, setEmailIntro, 'textarea'],
            ['Extra note from planner (optional)', emailNote, setEmailNote, 'textarea'],
            ['Choose section heading', chooseHeading, setChooseHeading, 'input'],
            ['Choose section subtext', chooseSubtext, setChooseSubtext, 'textarea'],
            ['Reply prompt', replyPrompt, setReplyPrompt, 'textarea'],
            ['Button label', ctaLabel, setCtaLabel, 'input'],
            ['Text section heading', textSectionHeading, setTextSectionHeading, 'input'],
            ['Text section body', textSectionBody, setTextSectionBody, 'textarea'],
            ['Text examples (one per line)', textExamples, setTextExamples, 'textarea'],
            ['Anything else heading', anythingElseHeading, setAnythingElseHeading, 'input'],
            ['Anything else body', anythingElseBody, setAnythingElseBody, 'textarea'],
            [
              'Deadline text (use {{deadline}} for the date)',
              deadlineText,
              setDeadlineText,
              'textarea',
            ],
            ['No-reply fallback text', noReplyText, setNoReplyText, 'textarea'],
            ['Sign-off', signOff, setSignOff, 'textarea'],
          ].map(([label, value, setter, kind]) => (
            <div key={label}>
              <p className="mb-1.5 text-xs text-[#8F8F8F]">{label}</p>
              {kind === 'textarea' ? (
                <textarea
                  value={value}
                  onChange={markCopyChanged(setter)}
                  rows={3}
                  className={areaClass}
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={markCopyChanged(setter)}
                  className={fieldClass}
                />
              )}
            </div>
          ))}

          {previewStale ? (
            <p className="rounded-xl bg-[#FFF8E8] px-3 py-2 text-xs text-[#8A6A2F]">
              Wording or images changed — click <strong>Refresh preview</strong> to update the mail
              view, or send and we will refresh automatically.
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
  const info = booking?.infoCollection ?? {}
  const customer = booking?.customer ?? {}

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
      value: booking?.eventDate ? formatDate(booking.eventDate) : info.eventDate,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'EVENT TIME',
      value: booking?.eventTime || info.eventTime,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'GUESTS',
      value: booking?.guestCount ? String(booking.guestCount) : info.guestCount,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'LOCATION',
      value: locationText || info.eventAddress,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'PIN CODE',
      value: booking?.pinCode || info.pinCode,
      notProvidedLabel: 'Pending',
    },
    {
      label: 'SPECIAL REQUEST',
      value: booking?.specialRequest || info.specialRequest,
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

  const infoCollectionFields = [
    { label: 'FULL NAME', value: info.fullName || customer?.name },
    { label: 'EMAIL', value: info.email || customer?.email },
    { label: 'PHONE', value: info.phone || getBookingCustomerPhone(booking) },
    { label: 'EVENT DATE', value: info.eventDate || booking?.eventDate },
    { label: 'EVENT TIME', value: info.eventTime || booking?.eventTime },
    { label: 'ADDRESS LINE 1', value: info.addressLine1 },
    { label: 'ADDRESS LINE 2', value: info.addressLine2 },
    { label: 'FLOOR', value: info.addressFloor },
    { label: 'PIN CODE', value: info.pinCode || booking?.pinCode },
    { label: 'LIFT', value: info.hasLift },
    { label: 'GUEST COUNT', value: info.guestCount || booking?.guestCount },
    { label: 'SETUP ARRIVAL', value: info.setupArrivalTime },
    { label: 'EVENT-DAY CONTACT', value: info.eventDayContactName },
    { label: 'EVENT-DAY MOBILE', value: info.eventDayContactPhone },
    { label: 'PARKING / LOADING', value: info.parkingInstructions },
    { label: 'SPECIAL INSTRUCTIONS', value: info.specialRequest || booking?.specialRequest },
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
          <p className="mb-3 text-[11px] tracking-[0.16em] text-[#767676]">
            INFO COLLECTION FORM
          </p>
          <p className="mb-3 text-xs text-[#8F8F8F]">
            Prefills from checkout. Customer can update remaining fields on the Information
            Collection status. Status:{' '}
            <span className="font-medium text-[#2D2D2D]">{infoStatus.label}</span>
          </p>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
            {infoCollectionFields.map(field => (
              <div key={field.label}>
                <p className="text-[11px] tracking-[0.16em] text-[#767676]">{field.label}</p>
                <p className="mt-0.5 text-sm text-[#2D2D2D]">
                  <PendingValue value={field.value} notProvidedLabel="Not provided" />
                </p>
              </div>
            ))}
          </div>
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
function BookingAccordionCard({ booking, open = false, onToggle, onStatusUpdated }) {
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

  const cancelledBadge = getCancelledBadgeMeta(booking)
  const borderStatusKey =
    String(booking.status ?? '').toLowerCase() === 'cancelled'
      ? cancelledBadge.status
      : booking.status?.toLowerCase()
  const borderColor = borderColorMap[borderStatusKey] ?? 'border-[#CDB17E]'
  const subtitle = getSubtitle(booking)
  const bookingDetails = bookingQuery.data ?? booking
  const paymentDisplay = getBookingPaymentDisplay(bookingDetails)
  const paymentDetailRows = useMemo(() => buildPaymentDetailRows(bookingDetails), [bookingDetails])
  const showHookahCodBadge = bookingHasHookahCod(bookingDetails)
  const latestStatusNote = getLatestStatusNote(bookingDetails?.statusLogs)
  const internalNotes = (Array.isArray(bookingDetails?.notes) ? bookingDetails.notes : []).filter(
    entry => entry?.isInternal === true
  )
  const statusBadge =
    String(booking.status ?? '').toLowerCase() === 'cancelled'
      ? cancelledBadge
      : { status: booking.status, label: booking.statusLabel }
  const remainingForValidation =
    bookingDetails?.paymentSummary?.amountDue ??
    bookingDetails?.remainingAmount ??
    booking?.remainingAmount ??
    0

  const handleUpdateStatus = async () => {
    const validation = canProgressToStage(
      booking.status,
      statusInput,
      remainingForValidation
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
    onStatusUpdated?.(booking.id, statusInput)
  }

  const handleStatusInputChange = newStatus => {
    setStatusInput(newStatus)
    const validation = canProgressToStage(
      booking.status,
      newStatus,
      remainingForValidation
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
    const validation = canProgressToStage(
      booking.status,
      optionStatus,
      remainingForValidation
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
                <StatusBadge status={statusBadge.status} label={statusBadge.label} />
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
                    {formatCurrency(paymentDisplay.advancePaidAmount)}
                  </p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[11px] text-[#767676]">REMAINING</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {formatCurrency(paymentDisplay.amountDue)}
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
              <p className="font-medium">{formatCurrency(paymentDisplay.advancePaidAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">REMAINING</p>
              <p className="font-medium">{formatCurrency(paymentDisplay.amountDue)}</p>
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
              { label: 'PHONE', value: getBookingCustomerPhone(bookingDetails) },
              {
                label: 'GUESTS',
                value: bookingDetails.guestCount ? String(bookingDetails.guestCount) : 'Pending',
              },
              { label: 'LOCATION', value: bookingDetails.locationSummary },
              {
                label: 'ADVANCE PAID',
                value: formatCurrency(paymentDisplay.advancePaidAmount),
              },
              { label: 'REMAINING', value: formatCurrency(paymentDisplay.amountDue) },
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
  { key: 'upcoming', label: 'Upcoming Events' },
  { key: 'live', label: 'Live Bookings' },
  { key: 'cancelled', label: 'Cancelled Bookings' },
  { key: 'incomplete', label: 'Incomplete Bookings' },
  { key: 'completed', label: 'Completed Bookings' },
]

const cancelledByTabs = [
  { key: '', label: 'All cancelled' },
  { key: 'client', label: 'Cancelled by client' },
  { key: 'admin', label: 'Cancelled by admin' },
]

function getCancelledBadgeMeta(booking) {
  const source = String(booking?.cancelledBy ?? '').toLowerCase()
  if (source === 'client') {
    return { status: 'cancelled_by_client', label: 'Cancelled by client' }
  }
  if (source === 'admin') {
    return { status: 'cancelled_by_admin', label: 'Cancelled by admin' }
  }
  return { status: booking.status, label: booking.statusLabel }
}

// Deep-link open must not pin a booking into the wrong bucket (e.g. cancelled on Today).
function bookingBelongsInBucket(booking, bucket, cancelledBy = '') {
  const status = String(booking?.status ?? '').toLowerCase()
  const source = String(booking?.cancelledBy ?? '').toLowerCase()

  if (bucket === 'cancelled') {
    if (status !== 'cancelled') return false
    if (cancelledBy === 'client' || cancelledBy === 'admin') {
      return source === cancelledBy
    }
    return true
  }

  if (bucket === 'completed') {
    return status === 'completed'
  }

  if (bucket === 'today' || bucket === 'live' || bucket === 'active' || bucket === 'upcoming' || bucket === 'incomplete') {
    return status !== 'cancelled' && status !== 'completed'
  }

  return true
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BookingManagementPage() {
  const [openBookingId, setOpenBookingId] = useState('')
  const [searchParams] = useSearchParams()
  const initialBucket = normalizeBookingBucket(searchParams.get('bucket'))
  const initialStatusFilter = normalizeBookingStatus(searchParams.get('status'))
  const initialCancelledBy = normalizeCancelledBy(searchParams.get('cancelledBy'))
  const initialOpenBookingId = String(searchParams.get('open') ?? '').trim()
  const [search, setSearch] = useState('')
  const [bucket, setBucket] = useState(initialBucket)
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [cancelledBy, setCancelledBy] = useState(initialCancelledBy)
  const [sortBy, setSortBy] = useState('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    const nextBucket = normalizeBookingBucket(searchParams.get('bucket'))
    const nextStatusFilter = normalizeBookingStatus(searchParams.get('status'))
    const nextCancelledBy = normalizeCancelledBy(searchParams.get('cancelledBy'))
    const nextOpenBookingId = String(searchParams.get('open') ?? '').trim()

    const timer = setTimeout(() => {
      setBucket(nextBucket)
      setStatusFilter(nextStatusFilter)
      setCancelledBy(nextCancelledBy)
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
    cancelledBy: bucket === 'cancelled' ? cancelledBy : '',
    sortBy,
    page: currentPage,
    limit: PAGE_SIZE,
  })
  const bookings = bookingsQuery.data?.bookings ?? []
  const totalBookings = Number(bookingsQuery.data?.total ?? 0)
  const totalPages = Math.max(1, Number(bookingsQuery.data?.pages ?? 1))
  const isResultsLoading = bookingsQuery.isFetching && !bookingsQuery.isLoading
  const linkedOpenBookingId = String(openBookingId || '').trim()
  const openedBookingQuery = useAdminBooking(linkedOpenBookingId || null)

  // Drop deep-link pin once the open booking no longer belongs in this bucket
  // (cancel on Today must not keep showing "Cancelled by admin" here).
  useEffect(() => {
    if (!linkedOpenBookingId) return
    const openedBooking = openedBookingQuery.data
    if (!openedBooking || openedBooking.id !== linkedOpenBookingId) return
    if (bookingBelongsInBucket(openedBooking, bucket, cancelledBy)) return
    setOpenBookingId('')
  }, [linkedOpenBookingId, openedBookingQuery.data, bucket, cancelledBy])

  const displayBookings = useMemo(() => {
    const bucketBookings = bookings.filter(booking =>
      bookingBelongsInBucket(booking, bucket, cancelledBy)
    )

    if (!linkedOpenBookingId) return bucketBookings

    if (bucketBookings.some(booking => booking.id === linkedOpenBookingId)) {
      return bucketBookings
    }

    const openedBooking = openedBookingQuery.data
    if (
      openedBooking?.id === linkedOpenBookingId &&
      bookingBelongsInBucket(openedBooking, bucket, cancelledBy)
    ) {
      return [openedBooking, ...bucketBookings]
    }

    return bucketBookings
  }, [bookings, linkedOpenBookingId, openedBookingQuery.data, bucket, cancelledBy])

  const filteredOutCount = bookings.filter(
    booking => !bookingBelongsInBucket(booking, bucket, cancelledBy)
  ).length
  const shownBookingTotal = Math.max(0, totalBookings - filteredOutCount)

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
                if (tab.key !== 'cancelled') setCancelledBy('')
                setOpenBookingId('')
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
        {bucket === 'cancelled' ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {cancelledByTabs.map(tab => (
              <button
                key={tab.key || 'all-cancelled'}
                type="button"
                onClick={() => {
                  setCancelledBy(tab.key)
                  setCurrentPage(1)
                }}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  cancelledBy === tab.key
                    ? tab.key === 'admin'
                      ? 'border-[#7C3AED] bg-[#7C3AED] text-[#FAFAFA]'
                      : tab.key === 'client'
                        ? 'border-[#8A1C1C] bg-[#8A1C1C] text-[#FAFAFA]'
                        : 'border-[#D4BA8E] bg-[#D4BA8E] text-[#FAFAFA]'
                    : 'border-[#E4DED8] bg-white text-[#6B7280] hover:border-[#D4BA8E] hover:text-[#7A5C2E]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}
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
              placeholder="Search by booking ID..."
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>
          <CustomSelect
            value={bucket}
            onChange={value => {
              setBucket(value)
              if (value !== 'cancelled') setCancelledBy('')
              setOpenBookingId('')
              setCurrentPage(1)
            }}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="today">Today's Bookings</option>
            <option value="upcoming">Upcoming Events</option>
            <option value="live">Live Bookings</option>
            <option value="cancelled">Cancelled Bookings</option>
            <option value="incomplete">Incomplete Bookings</option>
            <option value="completed">Completed Bookings</option>
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
          Today shows bookings placed today with advance paid (Hookah COD allowed at ₹0). Unpaid
          non-Hookah stay in Incomplete. Admin/customer cancels leave Today and appear under
          Cancelled. Upcoming shows advance-paid events in the next 15 days. Live shows all
          advance-paid ongoing bookings. Incomplete shows bookings with no advance paid yet.
          Completed shows finished bookings with full payment cleared.
        </p>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">
          {shownBookingTotal} booking{shownBookingTotal !== 1 ? 's' : ''}
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
                onStatusUpdated={(_bookingId, nextStatus) => {
                  const preview = {
                    ...booking,
                    status: nextStatus,
                    cancelledBy: nextStatus === 'cancelled' ? booking.cancelledBy || 'admin' : null,
                  }
                  if (!bookingBelongsInBucket(preview, bucket, cancelledBy)) {
                    setOpenBookingId('')
                  }
                }}
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
