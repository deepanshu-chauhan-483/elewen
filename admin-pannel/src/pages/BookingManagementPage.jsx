import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  SectionLoadingState,
  SelectField,
} from '../components/ui/AdminUI'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useScrollToTop } from '../hooks/useScrollToTop'
import {
  useAdminAddBookingNote,
  useAdminBooking,
  useAdminBookings,
  useAdminCreateVendorAssignment,
  useAdminUpdateBookingStatus,
  useAdminVendors,
} from '../hooks/useAdminData'
import { getAdminBadgeClass } from '../lib/adminBadges'
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatters'

// ---------------------------------------------------------------------------
// Stage progression order - stages must follow this sequence
// ---------------------------------------------------------------------------
const STAGE_PROGRESSION = [
  'new',
  'confirmed',
  'info_collection',
  'planning',
  'pre_event',
  'execution',
  'post_event',
  'completed',
]

const VALID_BOOKING_BUCKETS = new Set(['all', 'active', 'today', 'upcoming', 'completed'])
const VALID_BOOKING_STATUSES = new Set([
  '',
  'new',
  'confirmed',
  'info_collection',
  'planning',
  'pre_event',
  'execution',
  'post_event',
  'completed',
  'cancelled',
])

function normalizeBookingBucket(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()
  return VALID_BOOKING_BUCKETS.has(normalizedValue) ? normalizedValue : 'all'
}

function normalizeBookingStatus(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()
  return VALID_BOOKING_STATUSES.has(normalizedValue) ? normalizedValue : ''
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const CART_META_SEPARATOR = '||__ELEWEN_META__||'

function startOfDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function getDaysSinceEvent(eventDate) {
  const eventDay = startOfDay(eventDate)
  const today = startOfDay(new Date())
  if (!eventDay || !today) return null
  return Math.floor((today.getTime() - eventDay.getTime()) / MS_PER_DAY)
}

function parseBookingItemTitle(title = '') {
  const rawTitle = String(title ?? '')
  const [displayTitle, metaPart] = rawTitle.split(CART_META_SEPARATOR)

  if (!metaPart) {
    return {
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: 'package',
    }
  }

  try {
    const parsed = JSON.parse(metaPart)
    return {
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: parsed?.itemType ?? 'package',
    }
  } catch {
    return {
      displayTitle: String(displayTitle || rawTitle).trim(),
      itemType: 'package',
    }
  }
}

function getBookingPackageNames(booking = null) {
  const packageNames = (Array.isArray(booking?.items) ? booking.items : [])
    .map(item => parseBookingItemTitle(item?.title))
    .filter(item => item.itemType !== 'addon')
    .map(item => item.displayTitle)
    .filter(Boolean)

  const uniquePackageNames = [...new Set(packageNames)]

  if (uniquePackageNames.length) return uniquePackageNames

  const fallbackTitle = String(booking?.package?.title ?? '').trim()
  return fallbackTitle ? [fallbackTitle] : []
}

function getBookingPackageNamesText(booking = null, fallback = 'Selected package') {
  const packageNames = getBookingPackageNames(booking)
  return packageNames.length ? packageNames.join(', ') : fallback
}

// Special case: cancelled can happen anytime
// const SPECIAL_STATUSES = ['cancelled']

function canProgressToStage(currentStatus, newStatus, remainingAmount = 0, eventDate = null) {
  // Special case: can always go to cancelled
  if (newStatus === 'cancelled') return { allowed: true }

  // Can't change to same status
  if (currentStatus === newStatus) return { allowed: false, message: 'Already in this stage.' }

  const currentIndex = STAGE_PROGRESSION.indexOf(currentStatus?.toLowerCase())
  const newIndex = STAGE_PROGRESSION.indexOf(newStatus?.toLowerCase())

  // If either status is not in progression order
  if (currentIndex === -1 || newIndex === -1) {
    return { allowed: false, message: 'Invalid stage transition.' }
  }

  // Can't go backward
  if (newIndex < currentIndex) {
    return { allowed: false, message: 'Cannot move back to a previous stage.' }
  }

  // Execution stage requires full payment
  if (newStatus === 'execution' && remainingAmount > 0) {
    return {
      allowed: false,
      message: `Cannot move to "Execution" stage. Remaining payment: ₹${remainingAmount.toLocaleString()}. Clear full payment first.`,
    }
  }

  const daysSinceEvent = getDaysSinceEvent(eventDate)
  if (['execution', 'post_event', 'completed'].includes(newStatus) && daysSinceEvent == null) {
    return {
      allowed: false,
      message: 'Event date is required before using execution, post-event, or completed stages.',
    }
  }

  if (newStatus === 'execution' && daysSinceEvent !== 0) {
    return {
      allowed: false,
      message: 'Execution stage is only available on the booking event date.',
    }
  }

  if (newStatus === 'post_event' && !(daysSinceEvent >= 1)) {
    return {
      allowed: false,
      message: 'Post Event stage becomes available after the event date has passed.',
    }
  }

  if (newStatus === 'completed' && !(daysSinceEvent >= 2)) {
    return {
      allowed: false,
      message: 'Completed stage becomes available two days after the event date.',
    }
  }

  return { allowed: true }
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
  return String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
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
  const advanceAmount = paymentSummary?.advanceAmount ?? booking?.advanceAmount ?? 0
  const remainingAmount = paymentSummary?.scheduledRemainingAmount ?? booking?.remainingAmount ?? 0
  const totalAmount = paymentSummary?.totalPrice ?? booking?.totalPrice ?? 0
  const bookedAt = booking?.bookedAt ?? booking?.createdAt ?? ''

  return [
    {
      id: `${booking?.id ?? 'booking'}-payment-advance`,
      label: 'Advance',
      amount: advanceAmount,
      bookedAt,
    },
    {
      id: `${booking?.id ?? 'booking'}-payment-remaining`,
      label: 'Remaining',
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
// ---------------------------------------------------------------------------
// Admin Booking Accordion Card
// ---------------------------------------------------------------------------
function BookingAccordionCard({ booking, open = false, onToggle }) {
  const [statusInput, setStatusInput] = useState(booking.status ?? '')
  const [statusNote, setStatusNote] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [statusError, setStatusError] = useState('')
  const bookingTitle = getBookingPackageNamesText(booking, booking.event?.name || booking.id)

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

          {/* ── Update Status ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Update Stage</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">New stage</p>
                  <SelectField
                    value={statusInput}
                    onChange={handleStatusInputChange}
                    className="min-h-10 rounded-full bg-[#F3F3F3]"
                  >
                    <option value="new" disabled={!isStatusAllowed('new')}>
                      New
                    </option>
                    <option value="confirmed" disabled={!isStatusAllowed('confirmed')}>
                      Confirmed
                    </option>
                    <option value="info_collection" disabled={!isStatusAllowed('info_collection')}>
                      Info Collection
                    </option>
                    <option value="planning" disabled={!isStatusAllowed('planning')}>
                      Planning
                    </option>
                    <option value="pre_event" disabled={!isStatusAllowed('pre_event')}>
                      Pre Event
                    </option>
                    <option value="execution" disabled={!isStatusAllowed('execution')}>
                      Execution
                    </option>
                    <option value="post_event" disabled={!isStatusAllowed('post_event')}>
                      Post Event
                    </option>
                    <option value="completed" disabled={!isStatusAllowed('completed')}>
                      Completed
                    </option>
                    <option value="cancelled">Cancelled</option>
                  </SelectField>
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

          {/* ── Vendor Assignment ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Vendor Assignment</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <SelectField
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
                  </SelectField>
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BookingManagementPage() {
  const [openBookingId, setOpenBookingId] = useState('')
  const [searchParams] = useSearchParams()
  const initialBucket = normalizeBookingBucket(searchParams.get('bucket'))
  const initialStatusFilter = normalizeBookingStatus(searchParams.get('status'))
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

    const timer = setTimeout(() => {
      setBucket(nextBucket)
      setStatusFilter(nextStatusFilter)
      setCurrentPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [searchParams])

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
          <SelectField
            value={bucket}
            onChange={value => {
              setBucket(value)
              setCurrentPage(1)
            }}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="all">All Buckets</option>
            <option value="active">Active</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </SelectField>
          <SelectField
            value={statusFilter}
            onChange={value => {
              setStatusFilter(value)
              setCurrentPage(1)
            }}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="">All Stages</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="info_collection">Info Collection</option>
            <option value="planning">Planning</option>
            <option value="pre_event">Pre Event</option>
            <option value="execution">Execution</option>
            <option value="post_event">Post Event</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </SelectField>
          <SelectField
            value={sortBy}
            onChange={value => {
              setSortBy(value)
              setCurrentPage(1)
            }}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="latest">Latest First</option>
            <option value="event_date">By Event Date</option>
          </SelectField>
        </div>
        <p className="mt-3 text-xs text-[#8F8F8F]">
          Bucket filters by booking group: Active, Today, Upcoming, or Completed. Stage filters by
          workflow status like Confirmed or Planning. Sort only changes the order of the results.
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
      ) : bookings.length ? (
        <div>
          <div className="space-y-3">
            {bookings.map(booking => (
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
