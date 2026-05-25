import { useState } from 'react'
import {
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  SectionLoadingState,
  SelectField,
} from '../components/ui/AdminUI'
import {
  useAdminSampleTastes,
  useAdminUpdateSampleTasteStatus,
  useAdminVendors,
} from '../hooks/useAdminData'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { getAdminBadgeClass } from '../lib/adminBadges'
import { formatDate } from '../lib/formatters'

// ---------------------------------------------------------------------------
// Shared primitives — identical to BookingManagementPage / VendorManagementPage
// ---------------------------------------------------------------------------

// Left border (collapsed) / top border (expanded) per status
const borderColorMap = {
  new: 'border-[#0383E4]',
  assigned: 'border-[#C57A1E]',
  delivered: 'border-[#6D28D9]',
  completed: 'border-[#16A34A]',
}

// Stage progress config
const stages = [
  { key: 'new', label: 'New' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
]
const stageIndex = { new: 0, assigned: 1, delivered: 2, completed: 3 }

function Badge({ status, label }) {
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

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] hover:bg-[#C6AB7F] disabled:opacity-50 disabled:cursor-not-allowed"
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
      className="inline-flex h-10 items-center justify-center rounded-full px-5 text-sm border border-[#CDB17E] bg-[#FFFFFF] hover:bg-[#FAF6F1] text-[#CDB17E] disabled:opacity-50 disabled:cursor-not-allowed"
    >
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

// ---------------------------------------------------------------------------
// Sample Accordion Card — mirrors BookingAccordionCard / VendorAccordionCard
// ---------------------------------------------------------------------------
function SampleAccordionCard({ sample, open = false, onToggle }) {
  const [vendorId, setVendorId] = useState(sample.vendors?.[0]?.vendorId ?? '')
  const [deliveryDate, setDeliveryDate] = useState(
    sample.deliveryDate ? sample.deliveryDate.slice(0, 10) : ''
  )

  const vendorsQuery = useAdminVendors({
    limit: 100,
    status: 'approved',
    availability: 'available',
  })
  const updateSampleMutation = useAdminUpdateSampleTasteStatus()

  const borderColor = borderColorMap[sample.status?.toLowerCase()] ?? 'border-[#CDB17E]'
  const st = sample.status?.toLowerCase() ?? ''
  const isBusy = updateSampleMutation.isPending

  return (
    <div
      className={[
        'rounded-2xl bg-white shadow-sm transition-all hover:shadow-md',
        open ? `border-t-4 ${borderColor}` : `border-l-4 ${borderColor}`,
      ].join(' ')}
    >
      {/* ── Header — always visible ── */}
      <div className="cursor-pointer p-5" onClick={onToggle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
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
                  <p className="font-medium text-[#2D2D2D]">{sample.guestCount || '—'}</p>
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

        {/* Mobile summary when collapsed */}
        {!open && (
          <div className="mt-3 flex gap-8 text-sm md:hidden">
            <div>
              <p className="text-[11px] text-[#767676]">GUESTS</p>
              <p className="font-medium">{sample.guestCount || '—'}</p>
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

      {/* ── Expanded content ── */}
      {open && (
        <div
          className="border-t border-[#00000019] px-5 pb-6 pt-5"
          onClick={e => e.stopPropagation()}
        >
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 pb-6">
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
            ].map(f => (
              <div key={f.label}>
                <p className="text-[11px] tracking-[0.16em] text-[#767676]">{f.label}</p>
                <p className="mt-0.5 text-sm text-[#2D2D2D]">{f.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Stage progress */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Request Progress</SectionLabel>
            <StageProgress status={sample.status} />
          </div>

          {/* ── Assigned vendors ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Assigned Vendor</SectionLabel>
            {sample.vendors?.length ? (
              <div className="space-y-2">
                {sample.vendors.map(v => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-xl bg-[#F3F3F3] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {v.vendor?.companyName || v.vendorId}
                      </p>
                      <p className="mt-0.5 text-xs text-[#767676]">
                        {v.vendor?.locationCity || 'Location pending'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#CDB17E]">Assigned</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8F8F8F]">No vendor linked to this tasting yet.</p>
            )}
          </div>

          {/* ── Step 1 — Assign Vendor ── */}
          <div className="py-6 border-t border-[#00000033]">
            <SectionLabel>Step 1 — Assign Vendor</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Select vendor</p>
                  <SelectField value={vendorId} onChange={setVendorId}>
                    <option value="">Choose a vendor…</option>
                    {(vendorsQuery.data?.vendors ?? []).map(v => (
                      <option key={v.id} value={v.id}>
                        {v.companyName}
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
                  {isBusy ? 'Saving…' : 'Assign Vendor'}
                </PrimaryBtn>
              </div>
              {st !== 'new' && (
                <p className="mt-2 text-[11px] text-[#8F8F8F]">Only available at the New stage.</p>
              )}
            </div>
          </div>

          {/* ── Step 2 — Mark Delivered ── */}
          <div className="mt-4">
            <SectionLabel>Step 2 — Mark Delivered</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Delivery date</p>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className="h-10 w-full rounded-full border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
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
              {st !== 'assigned' && (
                <p className="mt-2 text-[11px] text-[#8F8F8F]">
                  Available once a vendor is assigned.
                </p>
              )}
            </div>
          </div>

          {/* ── Step 3 — Complete ── */}
          <div className="mt-4">
            <SectionLabel>Step 3 — Complete Request</SectionLabel>
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
              {st !== 'delivered' && (
                <p className="mt-2 text-[11px] text-[#8F8F8F]">
                  Available once the sample has been delivered.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage filter tabs
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
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

  if (samplesQuery.isLoading) return <LoadingState label="Loading sample taste bookings…" />
  if (samplesQuery.error)
    return <ErrorState label="Sample tasting data is unavailable right now." />

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Sample Taste Booking</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Track tasting requests from submission through vendor assignment, delivery, and
          completion.
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-[#767676] uppercase">
          Filter Requests
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Search */}
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
              placeholder="Search by customer name..."
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>
          {/* Stage select */}
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

      {/* ── Stage pill tabs ── */}
      {/* <div className="flex flex-wrap gap-2">
        {stageTabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setStatus(t.key)
              setCurrentPage(1)
            }}
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
              {t.key === ''
                ? Object.values(statusCounts).reduce((sum, value) => sum + Number(value ?? 0), 0)
                : status === t.key
                  ? totalSamples
                  : Number(statusCounts[t.key] ?? 0)}
            </span>
          </button>
        ))}
      </div> */}

      {/* ── Results count ── */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">{totalSamples}</span>
        <span className="text-sm text-[#8F8F8F]">request{totalSamples !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Accordion list ── */}
      {isResultsLoading ? (
        <SectionLoadingState label="Loading sample taste bookingsâ€¦" />
      ) : samples.length ? (
        <div className="space-y-3">
          {samples.map(sample => (
            <SampleAccordionCard
              key={`${sample.id}:${sample.deliveryDate ?? ''}:${sample.vendors?.[0]?.vendorId ?? ''}`}
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
