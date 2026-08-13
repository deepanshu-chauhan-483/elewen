import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DateTimePicker from '../../components/common/DateTimePicker'
import { useDashboardSearch } from '../../components/dashboard/useDashboardSearch'
import {
  DashboardErrorState,
  DashboardLoadingState,
  CustomSelect,
} from '../../components/dashboard/DashboardUI'
import {
  useDashboardSampleTasteDecision,
  useDashboardSampleTastes,
} from '../../hooks/useDashboardData'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useWishlist } from '../../hooks/useWishlist'
import {
  formatDashboardCurrency,
  formatDashboardDate,
  matchesDashboardSearch,
} from '../../components/dashboard/dashboardUtils'
import EmptyBooking from '../../components/dashboard/EmptyBooking'
import { getDateInputMin } from '../../lib/dateInput'

// ---------------------------------------------------------------------------
// Shared primitives — mirrored from admin SampleTastePage
// ---------------------------------------------------------------------------

const badgeMap = {
  new: 'bg-[#DBEAFE] text-[#0383E4]',
  assigned: 'bg-[#FCE7CF] text-[#C57A1E]',
  delivered: 'bg-[#EDE9FE] text-[#6D28D9]',
  completed: 'bg-[#DDF7E5] text-[#16A34A]',
  cancelled: 'bg-[#FEE2E2] text-[#B91C1C]',
}

const borderColorMap = {
  new: 'border-[#0383E4]',
  assigned: 'border-[#C57A1E]',
  delivered: 'border-[#6D28D9]',
  completed: 'border-[#16A34A]',
  cancelled: 'border-[#B91C1C]',
}

const stages = [
  { key: 'new', label: 'New' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
]
const stageIndex = { new: 0, assigned: 1, delivered: 2, completed: 3 }

const ONGOING_STATUSES = ['new', 'assigned', 'delivered']
const COMPLETED_STATUSES = ['completed', 'cancelled']

function Badge({ status, label }) {
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

function PrimaryBtn({ children, onClick, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] transition hover:bg-[#C6A15B] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled, as, to, type = 'button' }) {
  const cls =
    'inline-flex h-10 items-center justify-center rounded-full border border-[#E4DED8] bg-white px-5 text-sm font-semibold text-[#591902] transition hover:bg-[#F4EFE5] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed'
  if (as === 'link') {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-[#767676] uppercase">
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

// ---------------------------------------------------------------------------
// Star Rating
// ---------------------------------------------------------------------------
function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          className={`text-xl leading-none transition-colors ${
            star <= value ? 'text-[#C6A15B]' : 'text-[#D7CEC4] hover:text-[#C6A15B]'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage progress bar
// ---------------------------------------------------------------------------
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
            <div className="flex flex-col items-center gap-1">
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
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  active ? 'text-[#CDB17E]' : done ? 'text-[#6B7280]' : 'text-[#D1C9C2]'
                }`}
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

// ---------------------------------------------------------------------------
// Sample Accordion Card — customer side
// ---------------------------------------------------------------------------
function SampleAccordionCard({ sample, decisionMutation, toggleSavedPackage, pendingPackageId }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [vendorRatings, setVendorRatings] = useState({})

  const borderColor = borderColorMap[sample.status?.toLowerCase()] ?? 'border-[#CDB17E]'
  const st = sample.status?.toLowerCase() ?? ''
  const isBusy = decisionMutation.isPending
  const isSaving = String(pendingPackageId) === String(sample.packageId)

  const buildRatings = () =>
    sample.vendors
      ?.map(v => ({
        vendorId: v.vendorId,
        rating: vendorRatings[`${sample.id}_${v.vendorId}`] ?? null,
      }))
      .filter(r => r.rating !== null) ?? []

  const handleProceed = async () => {
    const vendorId = sample.vendors?.[0]?.vendorId
    const ratings = buildRatings()
    await decisionMutation.mutateAsync({
      sampleId: sample.id,
      body: {
        decision: 'convert_full',
        vendorId,
        feedbackText: feedback || undefined,
        vendorRatings: ratings.length ? ratings : undefined,
      },
    })
    navigate('/checkout?mode=sample-tasting')
  }

  const handleSave = async () => {
    const ratings = buildRatings()
    await decisionMutation.mutateAsync({
      sampleId: sample.id,
      body: {
        decision: 'save',
        feedbackText: feedback || undefined,
        vendorRatings: ratings.length ? ratings : undefined,
      },
    })
    await toggleSavedPackage({ packageId: sample.packageId })
  }

  const handleCancel = async () => {
    const ratings = buildRatings()
    await decisionMutation.mutateAsync({
      sampleId: sample.id,
      body: {
        decision: 'cancel',
        feedbackText: feedback || undefined,
        vendorRatings: ratings.length ? ratings : undefined,
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
      {/* ── Header — always visible ── */}
      <div className="cursor-pointer p-5" onClick={() => setOpen(p => !p)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3">
              <h3 className="text-[17px] font-medium leading-tight text-[#2E2E2E]">
                {sample.package?.title || 'Sample Taste Request'}
              </h3>
              <Badge status={sample.status} label={sample.statusLabel} />
            </div>
            <p className="mt-0.5 text-xs text-[#A89080]">ID #{sample.id}</p>
            <p className="mt-1 text-sm text-[#6B7280]">
              {sample.event?.name || 'Saved for tasting review'}
            </p>
            <p className="mt-1 text-xs text-[#8F8F8F]">
              Booked {formatDashboardDate(sample.bookingDate)}
              {sample.deliveryDate ? ` · Delivery ${formatDashboardDate(sample.deliveryDate)}` : ''}
            </p>
          </div>

          <div className="flex shrink-0 items-start gap-6">
            {!open && (
              <div className="hidden gap-6 text-sm md:flex">
                <div className="flex flex-col items-end">
                  <p className="text-[11px] text-[#767676]">GUESTS</p>
                  <p className="font-medium text-[#2D2D2D]">{sample.guestCount || '—'}</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[11px] text-[#767676]">VENDORS</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {sample.vendors?.length ? `${sample.vendors.length} selected` : 'Unassigned'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[11px] text-[#767676]">DELIVERY</p>
                  <p className="font-medium text-[#2D2D2D]">
                    {formatDashboardDate(sample.deliveryDate) || '—'}
                  </p>
                </div>
              </div>
            )}
            <ChevronIcon open={open} />
          </div>
        </div>

        {/* Mobile summary when collapsed */}
        {!open && (
          <div className="mt-3 flex gap-8 text-sm md:hidden">
            <div>
              <p className="text-[11px] text-[#767676]">GUESTS</p>
              <p className="font-medium">{sample.guestCount || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">VENDORS</p>
              <p className="font-medium">
                {sample.vendors?.length ? `${sample.vendors.length} selected` : 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#767676]">DELIVERY</p>
              <p className="font-medium">{formatDashboardDate(sample.deliveryDate) || '—'}</p>
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
          {/* Details grid — Section A */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { label: 'BOOKING ID', value: `#${sample.id}` },
              { label: 'PACKAGE', value: sample.package?.title || sample.event?.name },
              { label: 'EVENT', value: sample.event?.name },
              { label: 'GUESTS', value: sample.guestCount ? String(sample.guestCount) : 'TBD' },
              { label: 'BOOKED ON', value: formatDashboardDate(sample.bookingDate) },
              { label: 'DELIVERY DATE', value: formatDashboardDate(sample.deliveryDate) },
              {
                label: 'DELIVERY ADDRESS',
                value:
                  sample.deliveryAddress ||
                  sample.address ||
                  sample.locationSummary ||
                  'Not provided',
              },
              {
                label: 'AMOUNT PAID',
                value: formatDashboardCurrency(
                  sample.paymentSummary?.amountPaid ?? sample.amountPaid ?? 0
                ),
              },
              {
                label: 'EXPIRY WINDOW',
                value:
                  typeof sample.daysUntilExpiry === 'number'
                    ? `${Math.max(sample.daysUntilExpiry, 0)} day${
                        Math.max(sample.daysUntilExpiry, 0) === 1 ? '' : 's'
                      } left`
                    : 'Not set',
              },
              {
                label: 'DECISION',
                value: sample.decision ? sample.decision.replace(/_/g, ' ') : 'Pending',
              },
              { label: 'STATUS', value: sample.statusLabel || sample.status },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[11px] tracking-[0.16em] text-[#767676]">{f.label}</p>
                <p className="mt-0.5 text-sm text-[#2D2D2D]">{f.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Stage progress */}
          <div className="mt-6">
            <SectionLabel>Request Progress</SectionLabel>
            <StageProgress status={sample.status} />
          </div>

          {/* ── Vendor comparison + ratings ── */}
          <div className="mt-6">
            <SectionLabel>
              {(sample.vendors?.length ?? 0) > 1 ? 'Vendor Comparison' : 'Assigned Vendor'}
            </SectionLabel>
            {sample.vendors?.length ? (
              <div className="space-y-2">
                {sample.vendors.map(vendor => {
                  const ratingKey = `${sample.id}_${vendor.vendorId}`
                  return (
                    <div
                      key={vendor.id}
                      className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm font-medium text-[#591902]">
                            {vendor.vendor?.companyName || `Vendor #${vendor.vendorId}`}
                          </p>
                          <p className="mt-0.5 text-xs text-[#8C5A2C]">
                            {vendor.menuItems || 'Menu items will appear here once assigned.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-[#8F8F8F]">
                            Rate
                          </p>
                          <StarRating
                            value={vendorRatings[ratingKey] ?? 0}
                            onChange={rating =>
                              setVendorRatings(prev => ({ ...prev, [ratingKey]: rating }))
                            }
                          />
                          {vendorRatings[ratingKey] > 0 && (
                            <span className="text-xs text-[#C6A15B]">
                              {vendorRatings[ratingKey]}/5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[#8F8F8F]">
                Vendor assignment is still pending for this tasting request.
              </p>
            )}
          </div>

          {/* ── Feedback ── */}
          <div className="mt-6">
            <SectionLabel>Your Feedback</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <p className="mb-2 text-xs text-[#8F8F8F]">
                Rating and feedback are optional — decisions unlock regardless.
              </p>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
                placeholder="Share your overall tasting experience..."
                className="w-full rounded-xl border border-[#E4DED8] bg-white px-4 py-3 text-sm outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
              />
            </div>
          </div>

          {/* ── Decisions ── */}
          <div className="mt-6">
            <SectionLabel>Your Decision</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              {st === 'delivered' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <PrimaryBtn disabled={isBusy} onClick={handleProceed}>
                    {isBusy ? 'Saving…' : 'Proceed with Full Booking'}
                  </PrimaryBtn>
                  <GhostBtn disabled={isBusy || isSaving} onClick={handleSave}>
                    {isSaving ? 'Saving…' : 'Save Package'}
                  </GhostBtn>
                  <GhostBtn disabled={isBusy} onClick={handleCancel}>
                    Cancel Request
                  </GhostBtn>
                  <GhostBtn as="link" to="/sample-test-booking">
                    Try Same Package from Different Vendors
                  </GhostBtn>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#6B7280]">
                    Decision controls unlock once the tasting is delivered.
                  </p>
                  <GhostBtn as="link" to="/sample-test-booking">
                    Try Same Package from Different Vendors
                  </GhostBtn>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SampleTasteBooking() {
  const decisionMutation = useDashboardSampleTasteDecision()
  const { toggleSavedPackage, pendingPackageId } = useWishlist()
  const { searchTerm } = useDashboardSearch()
  const debouncedSearchTerm = useDebouncedValue(searchTerm)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState('ongoing')
  const [deliveryDateFrom, setDeliveryDateFrom] = useState('')
  const [deliveryDateTo, setDeliveryDateTo] = useState('')
  const [expiryStatus, setExpiryStatus] = useState('')
  const [vendorCount, setVendorCount] = useState('')
  const debouncedLocalSearch = useDebouncedValue(search)
  const {
    data: samples = [],
    error,
    isLoading,
  } = useDashboardSampleTastes({
    search: debouncedLocalSearch || debouncedSearchTerm,
    status,
  })

  const handleTabChange = nextTab => {
    if (nextTab === activeTab) return
    setActiveTab(nextTab)
    setStatus('')
  }

  const ongoingCount = useMemo(
    () => samples.filter(s => ONGOING_STATUSES.includes(s.status?.toLowerCase())).length,
    [samples]
  )
  const completedCount = useMemo(
    () => samples.filter(s => COMPLETED_STATUSES.includes(s.status?.toLowerCase())).length,
    [samples]
  )

  const filtered = useMemo(() => {
    const term = debouncedLocalSearch.trim().toLowerCase()
    return samples.filter(s => {
      const sStatus = s.status?.toLowerCase() ?? ''

      // Tab filter
      if (activeTab === 'ongoing' && !ONGOING_STATUSES.includes(sStatus)) return false
      if (activeTab === 'completed' && !COMPLETED_STATUSES.includes(sStatus)) return false

      // Status filter within tab
      if (status && sStatus !== status) return false

      // Delivery date range
      if (deliveryDateFrom && s.deliveryDate) {
        if (new Date(s.deliveryDate) < new Date(deliveryDateFrom)) return false
      }
      if (deliveryDateTo && s.deliveryDate) {
        if (new Date(s.deliveryDate) > new Date(deliveryDateTo)) return false
      }

      // Expiry status
      if (
        expiryStatus === 'active' &&
        typeof s.daysUntilExpiry === 'number' &&
        s.daysUntilExpiry <= 0
      )
        return false
      if (
        expiryStatus === 'expired' &&
        typeof s.daysUntilExpiry === 'number' &&
        s.daysUntilExpiry > 0
      )
        return false

      // Vendor count
      if (vendorCount === '1' && (s.vendors?.length ?? 0) !== 1) return false
      if (vendorCount === '2' && (s.vendors?.length ?? 0) < 2) return false

      const matchesLocalSearch = matchesDashboardSearch(term, [
        s.package?.title,
        s.event?.name,
        s.statusLabel,
      ])
      const matchesNavbarSearch = matchesDashboardSearch(debouncedSearchTerm, [
        s.package?.title,
        s.event?.name,
        s.statusLabel,
        ...(s.vendors?.map(vendor => vendor?.vendor?.companyName) ?? []),
      ])
      return matchesLocalSearch && matchesNavbarSearch
    })
  }, [
    debouncedLocalSearch,
    debouncedSearchTerm,
    samples,
    status,
    activeTab,
    deliveryDateFrom,
    deliveryDateTo,
    expiryStatus,
    vendorCount,
  ])

  if (isLoading) {
    return <DashboardLoadingState title="Loading sample taste requests..." />
  }

  if (error) {
    return <DashboardErrorState title="We could not load sample taste bookings." />
  }

  if (samples.length === 0) {
    return (
      <EmptyBooking
        title="No sample taste requests yet"
        body="When you book a tasting from the customer journey, it will appear here with assigned vendor details and delivery progress."
        actionLabel="Book Sample Taste"
        actionTo="/sample-test-booking"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Sample Taste Booking</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Review your tasting requests, assigned vendors, delivery progress, and finalize your
          decision.
        </p>
      </div>

      {/* ── Tabs: Ongoing / Completed ── */}
      <div className="flex rounded-full bg-[#F3F3F3] p-1">
        {[
          { key: 'ongoing', label: 'Ongoing', count: ongoingCount },
          { key: 'completed', label: 'Completed', count: completedCount },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-[#591902] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#2D2D2D]'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#E8E2DA] text-[#6B7280]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-[#767676] uppercase">
          Filter Requests
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <label className="flex w-full items-center gap-2.5 rounded-full bg-[#F0F0F0] px-2.5 py-1.5 text-[#A19B94] sm:col-span-2 lg:col-span-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8B1A8] text-[#FAFAFA]">
              <span className="h-3.5 w-3.5">
                <SearchIcon />
              </span>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by package or event…"
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>
          <CustomSelect
            value={status}
            onChange={setStatus}
            placeholder="All Statuses"
            options={
              activeTab === 'ongoing'
                ? [
                    { value: '', label: 'All Statuses' },
                    { value: 'new', label: 'New' },
                    { value: 'assigned', label: 'Assigned' },
                    { value: 'delivered', label: 'Delivered' },
                  ]
                : [
                    { value: '', label: 'All Statuses' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]
            }
          />
          <CustomSelect
            value={expiryStatus}
            onChange={setExpiryStatus}
            placeholder="All Expiry"
            options={[
              { value: '', label: 'All Expiry' },
              { value: 'active', label: 'Active (not expired)' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
          <CustomSelect
            value={vendorCount}
            onChange={setVendorCount}
            placeholder="All Vendor Counts"
            options={[
              { value: '', label: 'All Vendor Counts' },
              { value: '1', label: '1 Vendor' },
              { value: '2', label: '2+ Vendors' },
            ]}
          />
          {/* Delivery Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.14em] text-[#767676] uppercase">
              Delivery From
            </label>
            <DateTimePicker
              type="date"
              min={getDateInputMin({ offsetDays: 3 })}
              value={deliveryDateFrom}
              onChange={e => setDeliveryDateFrom(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
            />
          </div>
          {/* Delivery Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.14em] text-[#767676] uppercase">
              Delivery To
            </label>
            <DateTimePicker
              type="date"
              min={getDateInputMin({ offsetDays: 3 })}
              value={deliveryDateTo}
              onChange={e => setDeliveryDateTo(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
            />
          </div>
        </div>
      </div>

      {/* ── Stage pill tabs ── */}
      {/* <div className="flex flex-wrap gap-2">
        {stageTabs.map(t => {
          const count =
            t.key === '' ? samples.length : samples.filter(s => s.status === t.key).length
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatus(t.key)}
              className={[
                'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition',
                status === t.key
                  ? 'border-[#D4BA8E] bg-[#D4BA8E] text-[#FAFAFA]'
                  : 'border-[#E4DED8] bg-white text-[#6B7280] hover:border-[#D4BA8E] hover:text-[#7A5C2E]',
              ].join(' ')}
            >
              {t.label}
              <span
                className={[
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  status === t.key ? 'bg-white/30 text-white' : 'bg-[#F0EBE3] text-[#8C7D70]',
                ].join(' ')}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div> */}

      {/* ── Results count ── */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">{filtered.length}</span>
        <span className="text-sm text-[#8F8F8F]">request{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Accordion list ── */}
      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map(sample => (
            <SampleAccordionCard
              key={sample.id}
              sample={sample}
              decisionMutation={decisionMutation}
              toggleSavedPackage={toggleSavedPackage}
              pendingPackageId={pendingPackageId}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E4DED8] bg-white p-8 text-center">
          <p className="text-sm text-[#6B7280]">
            No requests match your current filters. Try clearing the search or status.
          </p>
        </div>
      )}
    </div>
  )
}
