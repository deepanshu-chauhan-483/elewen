import { useEffect, useState } from 'react'
import { EmptyState, ErrorState, LoadingState, SelectField } from '../components/ui/AdminUI'
import {
  useAdminAddBookingNote,
  useAdminBookings,
  useAdminCreateVendorAssignment,
  useAdminUpdateBookingStatus,
  useAdminVendors,
} from '../hooks/useAdminData'
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatters'

// ---------------------------------------------------------------------------
// Status badge — normal text, no uppercase
// ---------------------------------------------------------------------------
const badgeMap = {
  new: 'bg-[#FCE7CF] text-[#C57A1E]',
  confirmed: 'bg-[#DDF7E5] text-[#16A34A]',
  info_collection: 'bg-[#DBEAFE] text-[#0383E4]',
  planning: 'bg-[#EDE9FE] text-[#6D28D9]',
  pre_event: 'bg-[#FCE7CF] text-[#C57A1E]',
  execution: 'bg-[#DDF7E5] text-[#16A34A]',
  post_event: 'bg-[#DBEAFE] text-[#0383E4]',
  completed: 'bg-[#E5E7EB] text-[#4B5563]',
  cancelled: 'bg-[#FFF3F3] text-[#8A1C1C]',
  pending: 'bg-[#FCE7CF] text-[#C57A1E]',
  assigned: 'bg-[#DDF7E5] text-[#16A34A]',
  failed: 'bg-[#FFF3F3] text-[#8A1C1C]',
  paid: 'bg-[#DDF7E5] text-[#16A34A]',
  refunded: 'bg-[#E5E7EB] text-[#4B5563]',
}

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
  const cls = badgeMap[key] ?? 'bg-[#E5E7EB] text-[#4B5563]'
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
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
      className="w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 py-3 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition resize-none"
    />
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] transition hover:bg-[#C6A15B] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
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
function getSubtitle(booking) {
  return [
    // booking?.detailSubtitle,
    booking?.event?.name,
    booking?.package?.serviceCategories?.[0]?.name,
  ]
    .filter(Boolean)
    .join(' · ')
}
// ---------------------------------------------------------------------------
// Admin Booking Accordion Card
// ---------------------------------------------------------------------------
function BookingAccordionCard({ booking }) {
  const [open, setOpen] = useState(false)
  const [statusInput, setStatusInput] = useState(booking.status ?? '')
  const [note, setNote] = useState('')
  const [vendorId, setVendorId] = useState('')

  const vendorsQuery = useAdminVendors({
    limit: 100,
    status: 'approved',
    availability: 'available',
  })
  const updateStatusMutation = useAdminUpdateBookingStatus()
  const addNoteMutation = useAdminAddBookingNote()
  const createAssignmentMutation = useAdminCreateVendorAssignment()

  useEffect(() => {
    setStatusInput(booking.status ?? '')
  }, [booking.id])

  const borderColor = borderColorMap[booking.status?.toLowerCase()] ?? 'border-[#CDB17E]'
  const subtitle = getSubtitle(booking)

  return (
    <div
      className={[
        'rounded-2xl bg-white shadow-sm transition-all hover:shadow-md',
        open ? `border-t-4 ${borderColor}` : `border-l-4 ${borderColor}`,
      ].join(' ')}
    >
      {/* ── Collapsed / header row — always visible ── */}
      <div className="cursor-pointer p-5" onClick={() => setOpen(prev => !prev)}>
        <div className="flex items-start justify-between gap-4">
          {/* Left — title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3">
              <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E]">
                {booking.package?.title || booking.event?.name || booking.id}
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
                <div className="flex flex-col items-end">
                  <p className="text-[11px] text-[#767676]">ADVANCE PAID</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {formatCurrency(booking.advanceAmount)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
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
        <div
          className="border-t border-[#00000019] px-5 pb-6 pt-5"
          onClick={e => e.stopPropagation()}
        >
          {/* Booking details grid */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { label: 'CUSTOMER', value: booking.customer?.name },
              { label: 'EMAIL', value: booking.customer?.email },
              { label: 'PHONE', value: booking.customer?.phone },
              {
                label: 'GUESTS',
                value: booking.guestCount ? String(booking.guestCount) : 'Pending',
              },
              { label: 'LOCATION', value: booking.locationSummary },
              { label: 'ADVANCE', value: formatCurrency(booking.advanceAmount) },
              { label: 'REMAINING', value: formatCurrency(booking.remainingAmount) },
              { label: 'BOOKING ID', value: `#${booking.id}` },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[11px] tracking-[0.16em] text-[#767676]">{f.label}</p>
                <p className="mt-0.5 text-sm text-[#2D2D2D]">{f.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* ── Update Status ── */}
          <div className="mt-6">
            <SectionLabel>Update Stage</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">New stage</p>
                  <SelectField
                    value={statusInput}
                    onChange={setStatusInput}
                    className="min-h-10 rounded-full bg-[#F3F3F3]"
                  >
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
                </div>
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Note (optional)</p>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Reason for change…"
                    className="h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
                  />
                </div>
                <PrimaryBtn
                  disabled={updateStatusMutation.isPending}
                  onClick={() =>
                    updateStatusMutation.mutate({
                      bookingId: booking.id,
                      body: { status: statusInput, note },
                    })
                  }
                >
                  {updateStatusMutation.isPending ? 'Updating…' : 'Update Status'}
                </PrimaryBtn>
              </div>
            </div>
          </div>

          {/* ── Internal Note ── */}
          <div className="mt-6">
            <SectionLabel>Internal Note</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Add context, dependencies, or follow-ups (team-only)…"
                  />
                </div>
                <GhostBtn
                  disabled={addNoteMutation.isPending || !note.trim()}
                  onClick={() => addNoteMutation.mutate({ bookingId: booking.id, body: { note } })}
                >
                  {addNoteMutation.isPending ? 'Saving…' : 'Save Note'}
                </GhostBtn>
              </div>
            </div>
          </div>

          {/* ── Vendor Assignment ── */}
          <div className="mt-6">
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
              {booking.vendorAssignments?.length ? (
                <div className="mt-3 space-y-2">
                  {booking.vendorAssignments.map(a => (
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
          <div className="mt-6">
            <SectionLabel>Payment History</SectionLabel>
            {booking.payments?.length ? (
              <div className="space-y-2">
                {booking.payments.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-[#F3F3F3] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-[#2E2E2E]">{p.paymentType}</p>
                      <p className="mt-0.5 text-xs text-[#767676]">{formatDateTime(p.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#2D2D2D]">
                        {formatCurrency(p.amount)}
                      </span>
                      <StatusBadge status={p.status} />
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
  const [search, setSearch] = useState('')
  const [bucket, setBucket] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')

  const bookingsQuery = useAdminBookings({ search, bucket, status: statusFilter, limit: 24 })
  const bookings = bookingsQuery.data?.bookings ?? []

  if (bookingsQuery.isLoading) return <LoadingState label="Loading bookings…" />
  if (bookingsQuery.error) return <ErrorState label="Bookings could not be loaded right now." />

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
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex w-full items-center gap-2.5 rounded-full bg-[#F0F0F0] focus:border-[#C6A15B] px-2.5 py-1.5 text-[#A19B94]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8B1A8] text-[#FAFAFA]">
              <span className="h-3.5 w-3.5">
                <SearchIcon />
              </span>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>
          <SelectField
            value={bucket}
            onChange={setBucket}
            className="min-h-10 rounded-full bg-[#F3F3F3]"
          >
            <option value="all">All Buckets</option>
            <option value="active">Active</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="new">New</option>
            <option value="completed">Completed</option>
          </SelectField>
          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
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
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </span>
        {statusFilter && <span className="text-sm text-[#8F8F8F]">in "{statusFilter}" stage</span>}
      </div>

      {/* ── Accordion list ── */}
      {bookings.length ? (
        <div className="space-y-3">
          {bookings.map(booking => (
            <BookingAccordionCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E4DED8] bg-white p-8">
          <EmptyState title="No bookings found" body="Try a different search term or filter." />
        </div>
      )}
    </div>
  )
}
