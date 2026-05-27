import { useState } from 'react'
import {
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  SectionLoadingState,
  SelectField,
} from '../components/ui/AdminUI'
import {
  useAdminRecordSampleTasteDecision,
  useAdminSampleTastes,
  useAdminUpdateSampleTasteStatus,
  useAdminVendors,
} from '../hooks/useAdminData'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { getAdminBadgeClass } from '../lib/adminBadges'
import { formatDate } from '../lib/formatters'

const borderColorMap = {
  new: 'border-[#0383E4]',
  assigned: 'border-[#C57A1E]',
  delivered: 'border-[#6D28D9]',
  completed: 'border-[#16A34A]',
}

const stages = [
  { key: 'new', label: 'New' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
]

const stageIndex = { new: 0, assigned: 1, delivered: 2, completed: 3 }

const decisionOptions = [
  { value: 'convert_full', label: 'Convert to Full Booking' },
  { value: 'save', label: 'Save for Later' },
  { value: 'cancel', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
]

function buildBookingWorkspaceHref(bookingId = '') {
  const id = String(bookingId ?? '').trim()
  return id ? `/bookings?open=${encodeURIComponent(id)}` : '/bookings'
}

function Badge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = getAdminBadgeClass(status, { preset: 'vivid' })
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '-'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] hover:bg-[#C6AB7F] disabled:cursor-not-allowed disabled:opacity-50"
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
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#CDB17E] bg-[#FFFFFF] px-5 text-sm text-[#CDB17E] hover:bg-[#FAF6F1] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
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

function StageProgress({ status }) {
  const current = stageIndex[status?.toLowerCase()] ?? 0
  return (
    <div className="flex items-center">
      {stages.map((stage, i) => {
        const done = i < current
        const active = i === current
        const last = i === stages.length - 1
        return (
          <div key={stage.key} className="flex flex-1 items-center">
            <div className="flex min-w-[72px] flex-col items-center">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition',
                  done
                    ? 'border-[#CDB17E] bg-[#CDB17E] text-white'
                    : active
                      ? 'border-[#CDB17E] bg-white text-[#CDB17E]'
                      : 'border-[#E4DED8] bg-white text-[#8F8F8F]',
                ].join(' ')}
              >
                {done ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-[#CDB17E]' : done ? 'text-[#6B7280]' : 'text-[#D1C9C2]'}`}
              >
                {stage.label}
              </span>
            </div>
            {!last && (
              <div
                className={`mb-4 h-px flex-1 ${i < current ? 'bg-[#CDB17E]' : 'bg-[#E4DED8]'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SampleAccordionCard({ sample, open = false, onToggle }) {
  const [vendorId, setVendorId] = useState(sample.vendors?.[0]?.vendorId ?? '')
  const [deliveryDate, setDeliveryDate] = useState(
    sample.deliveryDate ? sample.deliveryDate.slice(0, 10) : ''
  )
  const [decision, setDecision] = useState(sample.decision ?? 'convert_full')
  const [decisionNotes, setDecisionNotes] = useState(sample.decisionNotes ?? '')
  const [feedbackText, setFeedbackText] = useState(sample.vendors?.[0]?.feedbackText ?? '')
  const [vendorRatings, setVendorRatings] = useState(() =>
    Object.fromEntries(
      (sample.vendors ?? []).map(vendor => [vendor.vendorId, String(vendor.rating ?? '')])
    )
  )

  const vendorsQuery = useAdminVendors({
    limit: 100,
    status: 'approved',
    availability: 'available',
  })
  const updateSampleMutation = useAdminUpdateSampleTasteStatus()
  const recordDecisionMutation = useAdminRecordSampleTasteDecision()

  const borderColor = borderColorMap[sample.status?.toLowerCase()] ?? 'border-[#CDB17E]'
  const st = sample.status?.toLowerCase() ?? ''
  const isBusy = updateSampleMutation.isPending || recordDecisionMutation.isPending
  const feedbackSnapshot =
    (sample.vendors ?? []).find(vendor => vendor.feedbackText)?.feedbackText ||
    sample.decisionNotes ||
    ''
  const decisionLabel =
    decisionOptions.find(option => option.value === sample.decision)?.label ?? 'Pending'

  const handleVendorRatingChange = (targetVendorId, value) => {
    setVendorRatings(current => ({ ...current, [targetVendorId]: value }))
  }

  const handleRecordDecision = async () => {
    const normalizedVendorRatings = (sample.vendors ?? [])
      .map(vendor => ({
        vendorId: vendor.vendorId,
        rating: Number(vendorRatings[vendor.vendorId]),
      }))
      .filter(entry => Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 5)

    await recordDecisionMutation.mutateAsync({
      sampleId: sample.id,
      body: {
        decision,
        decisionNotes,
        feedbackText,
        vendorRatings: normalizedVendorRatings,
      },
    })
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
                {sample.customer?.name || 'Customer'}
              </h3>
              <Badge status={sample.status} label={sample.statusLabel} />
            </div>
            <p className="mt-1 text-sm text-[#6B7280]">
              {sample.package?.title || sample.event?.name || 'Sample request'}
            </p>
            <p className="mt-1 text-xs text-[#8F8F8F]">
              Booked {formatDate(sample.bookingDate)}
              {sample.deliveryDate ? ` · Delivery ${formatDate(sample.deliveryDate)}` : ''}
            </p>
          </div>

          <div className="flex shrink-0 items-start gap-6">
            {!open && (
              <div className="hidden gap-6 text-sm md:flex">
                <div className="flex flex-col items-start">
                  <p className="text-[11px] text-[#767676]">GUESTS</p>
                  <p className="font-medium text-[#2D2D2D]">{sample.guestCount || '-'}</p>
                </div>
                <div className="flex flex-col items-start">
                  <p className="text-[11px] text-[#767676]">VENDOR</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {sample.vendors?.length
                      ? sample.vendors[0].vendor?.companyName || 'Assigned'
                      : 'Unassigned'}
                  </p>
                </div>
              </div>
            )}
            <ChevronIcon open={open} />
          </div>
        </div>

        {!open && (
          <div className="mt-3 flex gap-8 text-sm md:hidden">
            <div>
              <p className="text-[11px] text-[#767676]">GUESTS</p>
              <p className="font-medium">{sample.guestCount || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">VENDOR</p>
              <p className="font-medium">
                {sample.vendors?.length
                  ? sample.vendors[0].vendor?.companyName || 'Assigned'
                  : 'Unassigned'}
              </p>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div
          className="border-t border-[#00000019] px-5 pb-6 pt-5"
          onClick={event => event.stopPropagation()}
        >
          <div className="grid grid-cols-2 gap-5 pb-6 md:grid-cols-4">
            {[
              { label: 'CUSTOMER', value: sample.customer?.name },
              { label: 'EMAIL', value: sample.customer?.email },
              { label: 'PACKAGE', value: sample.package?.title || sample.event?.name },
              {
                label: 'GUESTS',
                value: sample.guestCount ? String(sample.guestCount) : 'Not shared',
              },
              { label: 'BOOKED ON', value: formatDate(sample.bookingDate) },
              { label: 'DELIVERY DATE', value: formatDate(sample.deliveryDate) },
              { label: 'DECISION', value: decisionLabel },
              {
                label: 'BOOKING LINK',
                value: sample.bookingId ? 'Converted booking linked' : 'No linked booking yet',
              },
            ].map(field => (
              <div key={field.label}>
                <p className="text-[11px] tracking-[0.16em] text-[#767676]">{field.label}</p>
                <p className="mt-0.5 text-sm text-[#2D2D2D]">{field.value || '-'}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-[#00000033] py-6">
            <SectionLabel>Request Progress</SectionLabel>
            <StageProgress status={sample.status} />
          </div>

          <div className="border-t border-[#00000033] py-6">
            <SectionLabel>Assigned Vendor</SectionLabel>
            {sample.vendors?.length ? (
              <div className="space-y-2">
                {sample.vendors.map(vendor => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between rounded-xl bg-[#F3F3F3] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {vendor.vendor?.companyName || vendor.vendorId}
                      </p>
                      <p className="mt-0.5 text-xs text-[#767676]">
                        {vendor.vendor?.locationCity || 'Location pending'}
                      </p>
                      {vendor.rating ? (
                        <p className="mt-1 text-xs text-[#8F8F8F]">Rating: {vendor.rating}/5</p>
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold text-[#CDB17E]">Assigned</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8F8F8F]">No vendor linked to this tasting yet.</p>
            )}
          </div>

          <div className="border-t border-[#00000033] py-6">
            <SectionLabel>Step 1 - Assign Vendor</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Select vendor</p>
                  <SelectField value={vendorId} onChange={setVendorId}>
                    <option value="">Choose a vendor...</option>
                    {(vendorsQuery.data?.vendors ?? []).map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.companyName}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <PrimaryBtn
                  disabled={isBusy || st !== 'new' || !vendorId}
                  onClick={() =>
                    updateSampleMutation.mutate({
                      sampleId: sample.id,
                      body: { status: 'assigned', vendorId },
                    })
                  }
                >
                  {updateSampleMutation.isPending ? 'Saving...' : 'Assign Vendor'}
                </PrimaryBtn>
              </div>
              {st !== 'new' ? (
                <p className="mt-2 text-[11px] text-[#8F8F8F]">Only available at the New stage.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <SectionLabel>Step 2 - Mark Delivered</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[180px] flex-1">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Delivery date</p>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={event => setDeliveryDate(event.target.value)}
                    className="h-10 w-full rounded-full border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none transition focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E]"
                  />
                </div>
                <GhostBtn
                  disabled={isBusy || st !== 'assigned'}
                  onClick={() =>
                    updateSampleMutation.mutate({
                      sampleId: sample.id,
                      body: { status: 'delivered', deliveryDate: deliveryDate || undefined },
                    })
                  }
                >
                  Mark Delivered
                </GhostBtn>
              </div>
              {st !== 'assigned' ? (
                <p className="mt-2 text-[11px] text-[#8F8F8F]">
                  Available once a vendor is assigned.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <SectionLabel>Step 3 - Complete Request</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <GhostBtn
                disabled={isBusy || st !== 'delivered'}
                onClick={() =>
                  updateSampleMutation.mutate({
                    sampleId: sample.id,
                    body: { status: 'completed' },
                  })
                }
              >
                Complete Request
              </GhostBtn>
              {st !== 'delivered' ? (
                <p className="mt-2 text-[11px] text-[#8F8F8F]">
                  Available once the sample has been delivered.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 border-t border-[#00000033] pt-6">
            <SectionLabel>Customer Decision Tracker</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Decision</p>
                  <SelectField
                    value={decision}
                    onChange={setDecision}
                    disabled={st === 'new' || st === 'assigned'}
                  >
                    {decisionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Feedback status</p>
                  <div className="flex h-10 items-center rounded-full border border-[#E4DED8] bg-white px-4 text-sm text-[#2D2D2D]">
                    {sample.feedbackSubmitted ? 'Submitted' : 'Awaiting submission'}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-xs text-[#8F8F8F]">Decision notes</p>
                <textarea
                  value={decisionNotes}
                  onChange={event => setDecisionNotes(event.target.value)}
                  disabled={st === 'new' || st === 'assigned'}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-[#E4DED8] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none transition focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E]"
                  placeholder="Capture customer decision details or follow-up context..."
                />
              </div>

              {(sample.vendors ?? []).length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {sample.vendors.map(vendor => (
                    <div
                      key={vendor.id}
                      className="rounded-xl border border-[#E4DED8] bg-white px-4 py-4"
                    >
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {vendor.vendor?.companyName || vendor.vendorId}
                      </p>
                      <p className="mt-2 text-xs text-[#8F8F8F]">Vendor rating</p>
                      <SelectField
                        value={vendorRatings[vendor.vendorId] ?? ''}
                        onChange={value => handleVendorRatingChange(vendor.vendorId, value)}
                        disabled={st === 'new' || st === 'assigned'}
                      >
                        <option value="">Select rating...</option>
                        <option value="1">1 / 5</option>
                        <option value="2">2 / 5</option>
                        <option value="3">3 / 5</option>
                        <option value="4">4 / 5</option>
                        <option value="5">5 / 5</option>
                      </SelectField>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-3">
                <p className="mb-1.5 text-xs text-[#8F8F8F]">Feedback summary</p>
                <textarea
                  value={feedbackText}
                  onChange={event => setFeedbackText(event.target.value)}
                  disabled={st === 'new' || st === 'assigned'}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-[#E4DED8] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none transition focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E]"
                  placeholder="Capture tasting feedback, customer preference, or revisions..."
                />
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {sample.bookingId ? (
                  <a
                    href={buildBookingWorkspaceHref(sample.bookingId)}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#CDB17E] bg-white px-5 text-sm text-[#CDB17E] hover:bg-[#FAF6F1]"
                  >
                    View Booking Details
                  </a>
                ) : null}
                <PrimaryBtn
                  disabled={isBusy || (st !== 'delivered' && st !== 'completed')}
                  onClick={handleRecordDecision}
                >
                  {recordDecisionMutation.isPending ? 'Saving...' : 'Save Decision'}
                </PrimaryBtn>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-[#00000033] pt-6">
            <SectionLabel>Feedback Overview</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">FEEDBACK STATUS</p>
                  <p className="mt-2 text-sm text-[#2D2D2D]">
                    {sample.feedbackSubmitted ? 'Submitted' : 'Awaiting submission'}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">DECISION</p>
                  <p className="mt-2 text-sm text-[#2D2D2D]">
                    {sample.decision ? decisionLabel : 'Pending'}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-4 py-4">
                  <p className="text-[11px] tracking-[0.16em] text-[#767676]">BOOKING LINK</p>
                  <p className="mt-2 text-sm text-[#2D2D2D]">
                    {sample.bookingId ? 'Converted booking linked' : 'No linked booking yet'}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white px-4 py-4">
                <p className="text-[11px] tracking-[0.16em] text-[#767676]">LATEST FEEDBACK</p>
                <p className="mt-2 text-sm leading-6 text-[#2D2D2D]">
                  {feedbackSnapshot || 'No feedback has been captured yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SampleTastePage() {
  const [openSampleId, setOpenSampleId] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const debouncedSearch = useDebouncedValue(search)

  const samplesQuery = useAdminSampleTastes({
    search: debouncedSearch,
    status,
    page: currentPage,
    limit: PAGE_SIZE,
  })
  const samples = samplesQuery.data?.samples ?? []
  const totalSamples = Number(samplesQuery.data?.total ?? 0)
  const totalPages = Math.max(1, Number(samplesQuery.data?.pages ?? 1))
  const visiblePage = Math.min(currentPage, totalPages)

  useScrollToTop(currentPage)
  const isResultsLoading = samplesQuery.isFetching && !samplesQuery.isLoading

  if (samplesQuery.isLoading) return <LoadingState label="Loading sample taste bookings..." />
  if (samplesQuery.error)
    return <ErrorState label="Sample tasting data is unavailable right now." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Sample Taste Booking</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Track tasting requests from submission through vendor assignment, delivery, completion,
          and final customer decision.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#767676]">
          Filter Requests
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex w-full items-center gap-2.5 rounded-full bg-[#F0F0F0] px-2.5 py-1.5 text-[#A19B94]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8B1A8] text-[#FAFAFA]">
              <span className="h-3.5 w-3.5">
                <SearchIcon />
              </span>
            </span>
            <input
              type="text"
              value={search}
              onChange={event => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by customer name..."
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>
          <SelectField
            value={status}
            onChange={value => {
              setStatus(value)
              setCurrentPage(1)
            }}
          >
            <option value="">All Stages</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
          </SelectField>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">{totalSamples}</span>
        <span className="text-sm text-[#8F8F8F]">request{totalSamples !== 1 ? 's' : ''}</span>
      </div>

      {isResultsLoading ? (
        <SectionLoadingState label="Loading sample taste bookings..." />
      ) : samples.length ? (
        <div className="space-y-3">
          {samples.map(sample => (
            <SampleAccordionCard
              key={`${sample.id}:${sample.status ?? ''}:${sample.decision ?? ''}:${sample.updatedAt ?? ''}`}
              sample={sample}
              open={openSampleId === sample.id}
              onToggle={() => setOpenSampleId(current => (current === sample.id ? '' : sample.id))}
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
          title="No sample requests found"
          body="Try a different search term or filter."
        />
      )}
    </div>
  )
}
