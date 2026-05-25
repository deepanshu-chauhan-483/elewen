import { useState } from 'react'
import {
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  SectionLoadingState,
  SelectField,
} from '../components/ui/AdminUI'
import {
  useAdminBookings,
  useAdminCreateVendorAssignment,
  useAdminReassignVendorAssignment,
  useAdminUpdateVendor,
  useAdminUpdateVendorAssignment,
  useAdminVendorAssignments,
  useAdminVendorWorkspace,
} from '../hooks/useAdminData'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { getAdminBadgeClass } from '../lib/adminBadges'
import { formatCurrency, formatDate, formatDateTime, sentenceCase } from '../lib/formatters'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const ACTIVE_ASSIGNMENT_STATUSES = ['assigned', 'confirmed']

const borderColorMap = {
  pending: 'border-[#C57A1E]',
  approved: 'border-[#16A34A]',
  rejected: 'border-[#8A1C1C]',
  inactive: 'border-[#9CA3AF]',
}

function Badge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = getAdminBadgeClass(status, { preset: ['vivid', 'soft'] })
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '-'

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

function MetricCard({ label, value, helper, accent }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border bg-white px-5 py-5 ${accent ? 'border-t-[3px] border-t-[#D4BA8E] border-[#E4DED8]' : 'border-[#E4DED8]'}`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8F8F8F]">
        {label}
      </span>
      <span className="text-[26px] font-bold leading-none text-[#1C1C1C]">{value}</span>
      <span className="text-xs text-[#6B7280]">{helper}</span>
    </div>
  )
}

// function Select({ value, onChange, children, className = '' }) {
//   return (
//     <select
//       value={value}
//       onChange={e => onChange(e.target.value)}
//       className={`h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition ${className}`}
//     >
//       {children}
//     </select>
//   )
// }

function Input({ type = 'text', value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
    />
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] transition hover:bg-[#C6A15B] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
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
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#E4DED8] bg-white px-5 text-sm font-semibold text-[#591902] transition hover:bg-[#F4EFE5] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function DangerBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#FECACA] bg-[#FFF3F3] px-5 text-sm font-semibold text-[#8A1C1C] transition hover:bg-[#FFE4E4] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function ExternalAction({ href, children }) {
  if (!href) return null

  const external = /^https?:\/\//i.test(href)

  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#E4DED8] bg-white px-5 text-sm font-semibold text-[#591902] transition hover:bg-[#F4EFE5] hover:-translate-y-px"
    >
      {children}
    </a>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#767676]">
      {children}
    </p>
  )
}

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

function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? '' : 'rotate-180'

  return (
    <svg className={`h-6 w-6 ${rotationClass}`} viewBox="0 0 36 36" fill="none">
      <path
        d="M28.5 18H7.5M7.5 18L18 28.5M7.5 18L18 7.5"
        stroke="#1C1C1C"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (value == null || value === '') return []
  return [value]
}

function normalizeUrl(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function buildMailtoHref(to, subject, bodyLines = []) {
  const recipient = String(to ?? '').trim()
  if (!recipient) return ''

  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)

  const body = bodyLines.filter(Boolean).join('\n')
  if (body) params.set('body', body)

  const query = params.toString()
  return `mailto:${recipient}${query ? `?${query}` : ''}`
}

function FieldGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
      {items.map(item => (
        <div key={item.label}>
          <p className="text-[11px] tracking-[0.16em] text-[#767676]">{item.label}</p>
          <p className="mt-0.5 text-sm text-[#2D2D2D]">{item.value || '-'}</p>
        </div>
      ))}
    </div>
  )
}

function VendorAccordionCard({ vendor, tab, bookingsQuery, open = false, onToggle }) {
  const [vendorStatus, setVendorStatus] = useState(vendor.vendorStatus ?? 'pending')
  const [isAvailable, setIsAvailable] = useState(Boolean(vendor.isAvailable))
  const [minimumPrice, setMinimumPrice] = useState(
    vendor.minimumPrice ? String(vendor.minimumPrice) : ''
  )
  const [leadTimeDays, setLeadTimeDays] = useState(
    vendor.leadTimeDays ? String(vendor.leadTimeDays) : ''
  )
  const [bookingId, setBookingId] = useState('')
  const [expandedAssignmentId, setExpandedAssignmentId] = useState('')
  const [reassignTargets, setReassignTargets] = useState({})

  const updateVendorMutation = useAdminUpdateVendor()
  const assignVendorMutation = useAdminCreateVendorAssignment()
  const reassignAssignmentMutation = useAdminReassignVendorAssignment()
  const updateAssignmentMutation = useAdminUpdateVendorAssignment()
  const assignmentsQuery = useAdminVendorAssignments({ vendorId: vendor.id, enabled: open })

  const assignments = assignmentsQuery.data?.assignments ?? []
  const activeAssignments = assignments.filter(assignment =>
    ACTIVE_ASSIGNMENT_STATUSES.includes(String(assignment.status ?? '').toLowerCase())
  )
  const historicalAssignments = assignments.filter(
    assignment =>
      !ACTIVE_ASSIGNMENT_STATUSES.includes(String(assignment.status ?? '').toLowerCase())
  )

  const activeBookingIds = new Set(
    activeAssignments.map(assignment => String(assignment.bookingId))
  )
  const assignableBookings = (bookingsQuery.data?.bookings ?? []).filter(
    booking => !activeBookingIds.has(String(booking.id))
  )

  const borderColor = borderColorMap[vendor.vendorStatus?.toLowerCase()] ?? 'border-[#CDB17E]'
  const isBusy = updateVendorMutation.isPending
  const serviceNames = (vendor.serviceCategories ?? [])
    .map(service => service.name)
    .filter(Boolean)
    .join(', ')

  const registration = vendor.registrationData ?? {}
  const eventTypes = toArray(registration.event_types).join(', ') || '-'
  const websiteHref = normalizeUrl(registration.website_social_portfolio)
  const portfolioHref = normalizeUrl(registration.portfolio_link)
  const vendorMailto = buildMailtoHref(
    vendor.email,
    `Elewen vendor update for ${vendor.companyName}`,
    [
      `Hi ${vendor.contactPerson || vendor.companyName},`,
      '',
      'Sharing an update from the Elewen admin team.',
    ]
  )

  const registrationFields = [
    { label: 'SUBMITTED', value: formatDate(registration.submitted_at || vendor.createdAt) },
    {
      label: 'OPERATING AREA',
      value: registration.operating_location || vendor.serviceArea || '-',
    },
    { label: 'EVENT TYPES', value: eventTypes },
    {
      label: 'EXPERIENCE',
      value: vendor.experienceYears ? `${vendor.experienceYears} years` : '-',
    },
    { label: 'TEAM SIZE', value: vendor.teamSize ? String(vendor.teamSize) : '-' },
    { label: 'DOCS ON FILE', value: String(vendor.documentsCount ?? 0) },
    { label: 'PORTFOLIO ITEMS', value: String(vendor.portfolioCount ?? 0) },
    {
      label: 'COMPLETED BOOKINGS',
      value: String(vendor.completedAssignmentsCount ?? 0),
    },
  ]

  const handleSaveVendor = () =>
    updateVendorMutation.mutate({
      vendorId: vendor.id,
      body: {
        vendor_status: vendorStatus,
        is_available: isAvailable,
        minimum_price: minimumPrice ? Number(minimumPrice) : undefined,
        lead_time_days: leadTimeDays ? Number(leadTimeDays) : undefined,
      },
    })

  const handleApprove = () =>
    updateVendorMutation.mutate({
      vendorId: vendor.id,
      body: { vendor_status: 'approved', is_available: true },
    })

  const handleReject = () =>
    updateVendorMutation.mutate({
      vendorId: vendor.id,
      body: { vendor_status: 'rejected', is_available: false },
    })

  const handleReassign = async assignmentId => {
    const nextBookingId = reassignTargets[assignmentId]
    if (!nextBookingId) return

    await reassignAssignmentMutation.mutateAsync({
      assignmentId,
      body: { bookingId: nextBookingId },
    })

    setReassignTargets(current => ({ ...current, [assignmentId]: '' }))
  }

  return (
    <div
      className={[
        'rounded-2xl bg-white shadow-sm transition-all hover:shadow-md',
        open ? `border-t-4 ${borderColor}` : `border-l-4 ${borderColor}`,
      ].join(' ')}
    >
      <div className="cursor-pointer p-5" onClick={onToggle}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E]">
                {vendor.companyName}
              </h3>
              <Badge status={vendor.vendorStatus} />
              <Badge
                status={vendor.isAvailable ? 'available' : 'unavailable'}
                label={vendor.isAvailable ? 'Available' : 'Unavailable'}
              />
            </div>
            <p className="mt-1 text-sm text-[#6B7280]">
              {vendor.contactPerson || 'Contact pending'}
              {vendor.locationCity ? ` · ${vendor.locationCity}` : ''}
            </p>
            {serviceNames && <p className="mt-0.5 text-xs text-[#8F8F8F]">{serviceNames}</p>}
          </div>

          <div className="flex shrink-0 items-start gap-6">
            {!open && (
              <div className="hidden gap-6 text-sm md:flex">
                <div className="flex flex-col items-end">
                  <p className="text-[11px] text-[#767676]">MIN PRICE</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {formatCurrency(vendor.minimumPrice)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[11px] text-[#767676]">ACTIVE BOOKINGS</p>
                  <p className="font-medium text-[#2D2D2D]">{vendor.activeAssignmentsCount ?? 0}</p>
                </div>
              </div>
            )}
            <ChevronIcon open={open} />
          </div>
        </div>

        {!open && (
          <div className="mt-3 flex gap-8 text-sm md:hidden">
            <div>
              <p className="text-[11px] text-[#767676]">MIN PRICE</p>
              <p className="font-medium">{formatCurrency(vendor.minimumPrice)}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">ACTIVE BOOKINGS</p>
              <p className="font-medium">{vendor.activeAssignmentsCount ?? 0}</p>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div
          className="border-t border-[#00000019] px-5 pb-6 pt-5"
          onClick={event => event.stopPropagation()}
        >
          <FieldGrid
            items={[
              { label: 'COMPANY', value: vendor.companyName },
              { label: 'CONTACT', value: vendor.contactPerson },
              { label: 'EMAIL', value: vendor.email },
              { label: 'PHONE', value: vendor.phone },
              { label: 'CITY', value: vendor.locationCity },
              { label: 'SERVICES', value: serviceNames || '-' },
              { label: 'MIN PRICE', value: formatCurrency(vendor.minimumPrice) },
              { label: 'PENDING PAYOUTS', value: formatCurrency(vendor.pendingPayoutAmount) },
              {
                label: 'LEAD TIME',
                value: vendor.leadTimeDays ? `${vendor.leadTimeDays} days` : '-',
              },
              { label: 'ACTIVE BOOKINGS', value: String(vendor.activeAssignmentsCount ?? 0) },
              { label: 'BANK PREF', value: vendor.bankInfo?.paymentPreference || '-' },
              { label: 'LAST UPDATED', value: formatDate(vendor.updatedAt) },
            ]}
          />

          <div className="mt-6">
            <SectionLabel>Registration Review</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <FieldGrid items={registrationFields} />

              {registration.description ? (
                <div className="mt-4 rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">DESCRIPTION</p>
                  <p className="mt-2 text-sm leading-6 text-[#2D2D2D]">
                    {registration.description}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">DOCUMENTS</p>
                  {(vendor.vendorDocuments ?? []).length ? (
                    <div className="mt-3 space-y-2">
                      {vendor.vendorDocuments.map(document => (
                        <div
                          key={document.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F7F4EF] px-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#2D2D2D]">
                              {sentenceCase(document.documentType)}
                            </p>
                            <p className="mt-0.5 text-xs text-[#767676]">
                              {document.fileName || 'Uploaded file'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              status={document.verified ? 'success' : 'pending'}
                              label={document.verified ? 'Verified' : 'Pending'}
                            />
                            <ExternalAction href={document.fileUrl}>Open File</ExternalAction>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#8F8F8F]">
                      {registration.verification_document_name ||
                        'No uploaded documents are linked yet.'}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">WORK SAMPLES</p>
                  {(vendor.vendorPortfolios ?? []).length ? (
                    <div className="mt-3 space-y-2">
                      {vendor.vendorPortfolios.map(portfolio => (
                        <div
                          key={portfolio.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F7F4EF] px-3 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#2D2D2D]">
                              {portfolio.title || 'Portfolio item'}
                            </p>
                            <p className="mt-0.5 text-xs text-[#767676]">
                              {portfolio.description || portfolio.imageName || 'Uploaded sample'}
                            </p>
                          </div>
                          <ExternalAction href={portfolio.imageUrl}>Open Sample</ExternalAction>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#8F8F8F]">
                      {registration.work_sample_name || 'No work sample assets are linked yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>Vendor Controls</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Status</p>
                  <SelectField value={vendorStatus} onChange={setVendorStatus}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="inactive">Inactive</option>
                  </SelectField>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Availability</p>
                  <SelectField
                    value={isAvailable ? 'true' : 'false'}
                    onChange={value => setIsAvailable(value === 'true')}
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </SelectField>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Minimum price (INR)</p>
                  <Input
                    type="number"
                    value={minimumPrice}
                    onChange={event => setMinimumPrice(event.target.value)}
                    placeholder="e.g. 5000"
                    className="rounded-2xl"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Lead time (days)</p>
                  <Input
                    type="number"
                    value={leadTimeDays}
                    onChange={event => setLeadTimeDays(event.target.value)}
                    placeholder="e.g. 3"
                    className="rounded-2xl"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryBtn disabled={isBusy} onClick={handleSaveVendor}>
                  {isBusy ? 'Saving...' : 'Save Changes'}
                </PrimaryBtn>
                <ExternalAction href={vendorMailto}>Email Vendor</ExternalAction>
                <ExternalAction href={vendor.phone ? `tel:${vendor.phone}` : ''}>
                  Call Vendor
                </ExternalAction>
                <ExternalAction href={websiteHref || portfolioHref}>
                  Open Portfolio Link
                </ExternalAction>
                {tab === 'pending' && (
                  <>
                    <GhostBtn disabled={isBusy} onClick={handleApprove}>
                      Approve
                    </GhostBtn>
                    <DangerBtn disabled={isBusy} onClick={handleReject}>
                      Reject and Close
                    </DangerBtn>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>Assign to Active Booking</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              {vendorStatus !== 'approved' ? (
                <p className="text-sm text-[#8F8F8F]">
                  Approve this vendor first to enable booking assignment.
                </p>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1">
                    <p className="mb-1.5 text-xs text-[#8F8F8F]">Select booking</p>
                    <SelectField value={bookingId} onChange={setBookingId}>
                      <option value="">Choose a booking...</option>
                      {assignableBookings.map(booking => (
                        <option key={booking.id} value={booking.id}>
                          {booking.package?.title || booking.event?.name || booking.id}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <PrimaryBtn
                    disabled={assignVendorMutation.isPending || !bookingId}
                    onClick={() =>
                      assignVendorMutation.mutate(
                        { bookingId, vendorId: vendor.id },
                        { onSuccess: () => setBookingId('') }
                      )
                    }
                  >
                    {assignVendorMutation.isPending ? 'Assigning...' : 'Assign Vendor'}
                  </PrimaryBtn>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>Active Booking Assignments</SectionLabel>
            {assignmentsQuery.isLoading ? (
              <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
                <p className="text-sm text-[#8F8F8F]">Loading assignment history...</p>
              </div>
            ) : activeAssignments.length ? (
              <div className="space-y-3">
                {activeAssignments.map(assignment => {
                  const isExpanded = expandedAssignmentId === assignment.id
                  const customerMailto = buildMailtoHref(
                    assignment.booking?.customer?.email,
                    `Elewen booking update ${assignment.booking?.id || ''}`.trim(),
                    [
                      `Hi ${assignment.booking?.customer?.name || 'there'},`,
                      '',
                      'Sharing a quick update on your booking.',
                    ]
                  )

                  const reassignOptions = (bookingsQuery.data?.bookings ?? []).filter(
                    booking =>
                      String(booking.id) !== String(assignment.bookingId) &&
                      !activeBookingIds.has(String(booking.id))
                  )

                  return (
                    <div key={assignment.id} className="rounded-xl bg-[#F3F3F3] px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#2D2D2D]">
                            {assignment.booking?.package?.title ||
                              assignment.booking?.id ||
                              assignment.bookingId}
                          </p>
                          <p className="mt-0.5 text-xs text-[#767676]">
                            {assignment.booking?.customer?.name || 'Customer'}
                            {assignment.booking?.locationSummary
                              ? ` · ${assignment.booking.locationSummary}`
                              : ''}
                          </p>
                          <p className="mt-1 text-xs text-[#8F8F8F]">
                            Assigned {formatDateTime(assignment.assignedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge status={assignment.status} />
                          <GhostBtn
                            onClick={() =>
                              setExpandedAssignmentId(current =>
                                current === assignment.id ? '' : assignment.id
                              )
                            }
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </GhostBtn>
                          {assignment.status === 'assigned' && (
                            <GhostBtn
                              disabled={updateAssignmentMutation.isPending}
                              onClick={() =>
                                updateAssignmentMutation.mutate({
                                  assignmentId: assignment.id,
                                  body: { status: 'confirmed' },
                                })
                              }
                            >
                              Confirm
                            </GhostBtn>
                          )}
                          {assignment.status === 'confirmed' && (
                            <GhostBtn
                              disabled={updateAssignmentMutation.isPending}
                              onClick={() =>
                                updateAssignmentMutation.mutate({
                                  assignmentId: assignment.id,
                                  body: { status: 'completed' },
                                })
                              }
                            >
                              Complete
                            </GhostBtn>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t border-[#E4DED8] pt-4">
                          <FieldGrid
                            items={[
                              {
                                label: 'BOOKING ID',
                                value: assignment.booking?.id || assignment.bookingId,
                              },
                              {
                                label: 'STATUS',
                                value:
                                  assignment.booking?.statusLabel ||
                                  sentenceCase(assignment.booking?.status || 'active'),
                              },
                              {
                                label: 'EVENT DATE',
                                value: formatDate(assignment.booking?.eventDate),
                              },
                              {
                                label: 'GUESTS',
                                value: assignment.booking?.guestCount
                                  ? String(assignment.booking.guestCount)
                                  : 'Pending',
                              },
                              {
                                label: 'CUSTOMER',
                                value: assignment.booking?.customer?.name || '-',
                              },
                              { label: 'EMAIL', value: assignment.booking?.customer?.email || '-' },
                              { label: 'PHONE', value: assignment.booking?.customer?.phone || '-' },
                              {
                                label: 'LOCATION',
                                value: assignment.booking?.locationSummary || '-',
                              },
                              {
                                label: 'ADVANCE',
                                value: formatCurrency(assignment.booking?.advanceAmount),
                              },
                              {
                                label: 'REMAINING',
                                value: formatCurrency(assignment.booking?.remainingAmount),
                              },
                            ]}
                          />

                          <div className="flex flex-wrap gap-2">
                            <ExternalAction href={customerMailto}>Email Customer</ExternalAction>
                            <ExternalAction href="/bookings">
                              Open Bookings Workspace
                            </ExternalAction>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-4">
                            <p className="text-[11px] tracking-[0.16em] text-[#767676]">
                              REASSIGN VENDOR
                            </p>
                            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end">
                              <div className="flex-1">
                                <p className="mb-1.5 text-xs text-[#8F8F8F]">
                                  Move to another active booking
                                </p>
                                <SelectField
                                  value={reassignTargets[assignment.id] ?? ''}
                                  onChange={value =>
                                    setReassignTargets(current => ({
                                      ...current,
                                      [assignment.id]: value,
                                    }))
                                  }
                                >
                                  <option value="">Choose a new booking...</option>
                                  {reassignOptions.map(booking => (
                                    <option key={booking.id} value={booking.id}>
                                      {booking.package?.title || booking.event?.name || booking.id}
                                    </option>
                                  ))}
                                </SelectField>
                              </div>
                              <PrimaryBtn
                                disabled={
                                  reassignAssignmentMutation.isPending ||
                                  !reassignTargets[assignment.id] ||
                                  vendorStatus !== 'approved'
                                }
                                onClick={() => handleReassign(assignment.id)}
                              >
                                {reassignAssignmentMutation.isPending
                                  ? 'Reassigning...'
                                  : 'Reassign Vendor'}
                              </PrimaryBtn>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
                <p className="text-sm text-[#8F8F8F]">
                  No active booking assignments for this vendor.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <SectionLabel>Assignment History</SectionLabel>
            {historicalAssignments.length ? (
              <div className="space-y-2">
                {historicalAssignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F8F7F4] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {assignment.booking?.package?.title ||
                          assignment.booking?.id ||
                          assignment.bookingId}
                      </p>
                      <p className="mt-0.5 text-xs text-[#767676]">
                        {sentenceCase(assignment.status)} · {formatDateTime(assignment.assignedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={assignment.status} />
                      <ExternalAction
                        href={buildMailtoHref(vendor.email, 'Elewen vendor follow-up')}
                      >
                        Email Vendor
                      </ExternalAction>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
                <p className="text-sm text-[#8F8F8F]">
                  No prior completed or reassigned bookings for this vendor yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const vendorTabs = [
  { key: 'pending', label: 'Pending Requests' },
  { key: 'assigned', label: 'Assigned Vendors' },
  { key: 'unassigned', label: 'Unassigned Vendors' },
]

export default function VendorManagementPage() {
  const [openVendorId, setOpenVendorId] = useState('')
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [availability, setAvailability] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const [bookingCount, setBookingCount] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const debouncedCategory = useDebouncedValue(category)
  const debouncedLocation = useDebouncedValue(location)

  const workspaceQuery = useAdminVendorWorkspace({
    tab,
    search: debouncedSearch,
    category: debouncedCategory,
    location: debouncedLocation,
    availability,
    page: currentPage,
    limit: PAGE_SIZE,
  })
  const bookingsQuery = useAdminBookings({ bucket: 'active', limit: 100 })

  const workspace = workspaceQuery.data ?? {}
  const summary = workspace.summary ?? {}
  const tabCounts = {
    pending: Number(summary.pendingRequests ?? 0),
    assigned: Number(summary.assignedVendors ?? 0),
    unassigned: Number(summary.unassignedVendors ?? 0),
  }
  const activeList = workspace.activeList ?? []
  const totalPages = Math.max(1, Number(workspace.pages ?? 1))
  const visiblePage = Math.min(currentPage, totalPages)

  useScrollToTop(currentPage)
  const isResultsLoading = workspaceQuery.isFetching && !workspaceQuery.isLoading

  if (workspaceQuery.isLoading) return <LoadingState label="Loading vendors..." />
  if (workspaceQuery.error) return <ErrorState label="Vendor data could not be loaded right now." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Vendor Management</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Review registrations, manage approved vendors, reassign active vendors, and track booking
          history from one workspace.
        </p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending Requests"
          value={String(summary.pendingRequests ?? 0)}
          helper="Registrations waiting review"
          accent
        />
        <MetricCard
          label="Assigned Vendors"
          value={String(summary.assignedVendors ?? 0)}
          helper="Attached to active bookings"
          accent
        />
        <MetricCard
          label="Unassigned Vendors"
          value={String(summary.unassignedVendors ?? 0)}
          helper="Approved but not linked"
          accent
        />
        <MetricCard
          label="Available Now"
          value={String(summary.availableNow ?? 0)}
          helper="Ready for assignment"
          accent
        />
      </div>

      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#8F8F8F]">
          Vendor Pool
        </p>
        <div className="flex flex-wrap gap-2">
          {vendorTabs.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setTab(item.key)
                setCurrentPage(1)
              }}
              className={[
                'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition',
                tab === item.key
                  ? 'border-[#D4BA8E] bg-[#D4BA8E] text-[#FAFAFA]'
                  : 'border-[#E4DED8] bg-white text-[#6B7280] hover:border-[#D4BA8E] hover:text-[#7A5C2E]',
              ].join(' ')}
            >
              {item.label}
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  tab === item.key ? 'bg-white/30 text-white' : 'bg-[#F0EBE3] text-[#8C7D70]',
                ].join(' ')}
              >
                {tabCounts[item.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#767676]">
          Filter Vendors
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="flex w-full items-center gap-2.5 rounded-full bg-[#F0F0F0] px-2.5 py-1.5 text-[#A19B94]">
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
              placeholder="Search vendors"
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>

          <Input
            value={category}
            onChange={e => {
              setCategory(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Service category"
          />

          <Input
            value={location}
            onChange={e => {
              setLocation(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="City / location"
          />
          <SelectField
            value={availability}
            onChange={value => {
              setAvailability(value)
              setCurrentPage(1)
            }}
          >
            <option value="">Any Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </SelectField>

          <SelectField value={bookingCount} onChange={setBookingCount}>
            <option value="">Booking Count</option>
            <option value="none">0 Active Bookings</option>
            <option value="one_plus">1+ Active Bookings</option>
            <option value="three_plus">3+ Active Bookings</option>
          </SelectField>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">
          {Number(workspace.total ?? 0)}
        </span>
        <span className="text-sm text-[#8F8F8F]">
          vendor{Number(workspace.total ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Accordion list ── */}
      {isResultsLoading ? (
        <SectionLoadingState label="Loading vendorsâ€¦" />
      ) : activeList.length ? (
        <div className="space-y-3">
          {activeList.map(vendor => (
            <VendorAccordionCard
              key={`${vendor.id}:${vendor.vendorStatus ?? ''}:${vendor.isAvailable ? '1' : '0'}:${vendor.activeAssignmentsCount ?? 0}:${vendor.documentsCount ?? 0}`}
              vendor={vendor}
              tab={tab}
              bookingsQuery={bookingsQuery}
              open={openVendorId === vendor.id}
              onToggle={() => setOpenVendorId(current => (current === vendor.id ? '' : vendor.id))}
            />
          ))}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={visiblePage === 1}
              className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowIcon direction="left" />
            </button>
            <div className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1C]">
              {visiblePage} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={visiblePage === totalPages}
              className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </div>
      ) : (
        <ResultsEmptyState
          title="No vendors found"
          body="Try a different search term, filter, or tab."
        />
      )}
    </div>
  )
}
