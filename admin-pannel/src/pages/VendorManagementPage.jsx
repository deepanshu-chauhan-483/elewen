import { useEffect, useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AdminUI'
import {
  useAdminBookings,
  useAdminCreateVendorAssignment,
  useAdminUpdateVendor,
  useAdminUpdateVendorAssignment,
  useAdminVendorAssignments,
  useAdminVendorWorkspace,
} from '../hooks/useAdminData'
import { formatCurrency } from '../lib/formatters'

// ---------------------------------------------------------------------------
// Shared primitives — matches BookingManagementPage exactly
// ---------------------------------------------------------------------------

const badgeMap = {
  pending:     'bg-[#FCE7CF] text-[#C57A1E]',
  approved:    'bg-[#DDF7E5] text-[#16A34A]',
  rejected:    'bg-[#FFF3F3] text-[#8A1C1C]',
  inactive:    'bg-[#E5E7EB] text-[#4B5563]',
  available:   'bg-[#DDF7E5] text-[#16A34A]',
  unavailable: 'bg-[#FFF3F3] text-[#8A1C1C]',
  assigned:    'bg-[#DDF7E5] text-[#16A34A]',
  confirmed:   'bg-[#DDF7E5] text-[#16A34A]',
  completed:   'bg-[#E5E7EB] text-[#4B5563]',
  cancelled:   'bg-[#FFF3F3] text-[#8A1C1C]',
  success:     'bg-[#DDF7E5] text-[#16A34A]',
  failed:      'bg-[#FFF3F3] text-[#8A1C1C]',
}

// Left border accent per vendor status
const borderColorMap = {
  pending:  'border-[#C57A1E]',
  approved: 'border-[#16A34A]',
  rejected: 'border-[#8A1C1C]',
  inactive: 'border-[#9CA3AF]',
}

function Badge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = badgeMap[key] ?? 'bg-[#E5E7EB] text-[#4B5563]'
  const text = label ?? (key.charAt(0).toUpperCase() + key.slice(1)) ?? '—'
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}>
      {text}
    </span>
  )
}

function MetricCard({ label, value, helper, accent }) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border bg-white px-5 py-5 ${accent ? 'border-t-[3px] border-t-[#D4BA8E] border-[#E4DED8]' : 'border-[#E4DED8]'}`}>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8F8F8F]">{label}</span>
      <span className="text-[26px] font-bold leading-none text-[#1C1C1C]">{value}</span>
      <span className="text-xs text-[#6B7280]">{helper}</span>
    </div>
  )
}

function Select({ value, onChange, children, className = '' }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition ${className}`}
    >
      {children}
    </select>
  )
}

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
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] transition hover:bg-[#C6A15B] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed">
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#E4DED8] bg-white px-5 text-sm font-semibold text-[#591902] transition hover:bg-[#F4EFE5] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed">
      {children}
    </button>
  )
}

function DangerBtn({ children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full border border-[#FECACA] bg-[#FFF3F3] px-5 text-sm font-semibold text-[#8A1C1C] transition hover:bg-[#FFE4E4] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed">
      {children}
    </button>
  )
}

function SectionLabel({ children }) {
  return <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-[#767676] uppercase">{children}</p>
}

function ChevronIcon({ open }) {
  return (
    <svg className={`h-5 w-5 text-[#8F8F8F] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------
function filterVendors(vendors, { search, category, location, availability }) {
  const s = search?.trim().toLowerCase() ?? ''
  const c = category?.trim().toLowerCase() ?? ''
  const l = location?.trim().toLowerCase() ?? ''
  return vendors.filter(v => {
    if (availability === 'available'   && !v.isAvailable) return false
    if (availability === 'unavailable' &&  v.isAvailable) return false
    if (c && !(v.serviceCategories ?? []).some(sc => sc.name?.toLowerCase().includes(c))) return false
    if (l && !v.locationCity?.toLowerCase().includes(l)) return false
    if (!s) return true
    return [v.companyName, v.contactPerson, v.locationCity,
      ...(v.serviceCategories ?? []).map(sc => sc.name)].join(' ').toLowerCase().includes(s)
  })
}

// ---------------------------------------------------------------------------
// Vendor Accordion Card — mirrors BookingAccordionCard pattern
// ---------------------------------------------------------------------------
function VendorAccordionCard({ vendor, tab, bookingsQuery }) {
  const [open, setOpen]               = useState(false)
  const [vendorStatus, setVendorStatus] = useState(vendor.vendorStatus ?? 'pending')
  const [isAvailable, setIsAvailable]  = useState(Boolean(vendor.isAvailable))
  const [minimumPrice, setMinimumPrice] = useState(vendor.minimumPrice ? String(vendor.minimumPrice) : '')
  const [leadTimeDays, setLeadTimeDays] = useState(vendor.leadTimeDays ? String(vendor.leadTimeDays) : '')
  const [bookingId, setBookingId]      = useState('')

  const updateVendorMutation      = useAdminUpdateVendor()
  const assignVendorMutation      = useAdminCreateVendorAssignment()
  const updateAssignmentMutation  = useAdminUpdateVendorAssignment()
  const assignmentsQuery          = useAdminVendorAssignments({ vendorId: vendor.id, enabled: open })

  useEffect(() => {
    setVendorStatus(vendor.vendorStatus ?? 'pending')
    setIsAvailable(Boolean(vendor.isAvailable))
    setMinimumPrice(vendor.minimumPrice ? String(vendor.minimumPrice) : '')
    setLeadTimeDays(vendor.leadTimeDays ? String(vendor.leadTimeDays) : '')
  }, [vendor.id])

  const borderColor = borderColorMap[vendor.vendorStatus?.toLowerCase()] ?? 'border-[#CDB17E]'
  const isBusy = updateVendorMutation.isPending

  const serviceNames = (vendor.serviceCategories ?? []).map(s => s.name).filter(Boolean).join(', ')

  return (
    <div className={[
      'rounded-2xl bg-white shadow-sm transition-all hover:shadow-md',
      open ? `border-t-4 ${borderColor}` : `border-l-4 ${borderColor}`,
    ].join(' ')}>

      {/* ── Header — always visible ── */}
      <div className="cursor-pointer p-5" onClick={() => setOpen(p => !p)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
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
            {serviceNames && (
              <p className="mt-0.5 text-xs text-[#8F8F8F]">{serviceNames}</p>
            )}
          </div>

          <div className="flex shrink-0 items-start gap-6">
            {!open && (
              <div className="hidden gap-6 text-sm md:flex">
                <div className="flex flex-col items-end">
                  <p className="text-[11px] text-[#767676]">MIN PRICE</p>
                  <p className="font-medium text-[#2D2D2D]">{formatCurrency(vendor.minimumPrice)}</p>
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

        {/* Mobile summary when collapsed */}
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

      {/* ── Expanded content ── */}
      {open && (
        <div className="border-t border-[#00000019] px-5 pb-6 pt-5" onClick={e => e.stopPropagation()}>

          {/* Vendor details grid */}
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[
              { label: 'COMPANY',         value: vendor.companyName },
              { label: 'CONTACT',         value: vendor.contactPerson },
              { label: 'EMAIL',           value: vendor.email },
              { label: 'PHONE',           value: vendor.phone },
              { label: 'CITY',            value: vendor.locationCity },
              { label: 'SERVICES',        value: serviceNames || '—' },
              { label: 'MIN PRICE',       value: formatCurrency(vendor.minimumPrice) },
              { label: 'PENDING PAYOUTS', value: formatCurrency(vendor.pendingPayoutAmount) },
              { label: 'LEAD TIME',       value: vendor.leadTimeDays ? `${vendor.leadTimeDays} days` : '—' },
              { label: 'ACTIVE BOOKINGS', value: String(vendor.activeAssignmentsCount ?? 0) },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[11px] tracking-[0.16em] text-[#767676]">{f.label}</p>
                <p className="mt-0.5 text-sm text-[#2D2D2D]">{f.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* ── Vendor Controls ── */}
          <div className="mt-6">
            <SectionLabel>Vendor Controls</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Status</p>
                  <Select value={vendorStatus} onChange={setVendorStatus}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Availability</p>
                  <Select value={isAvailable ? 'true' : 'false'} onChange={v => setIsAvailable(v === 'true')}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </Select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Minimum price (₹)</p>
                  <Input type="number" value={minimumPrice} onChange={e => setMinimumPrice(e.target.value)} placeholder="e.g. 5000" />
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Lead time (days)</p>
                  <Input type="number" value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value)} placeholder="e.g. 3" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <PrimaryBtn
                  disabled={isBusy}
                  onClick={() =>
                    updateVendorMutation.mutate({
                      vendorId: vendor.id,
                      body: {
                        vendor_status: vendorStatus,
                        is_available: isAvailable,
                        minimum_price: minimumPrice ? Number(minimumPrice) : undefined,
                        lead_time_days: leadTimeDays ? Number(leadTimeDays) : undefined,
                      },
                    })
                  }
                >
                  {isBusy ? 'Saving…' : 'Save Changes'}
                </PrimaryBtn>

                {/* Quick approve / reject — only for pending tab */}
                {tab === 'pending' && (
                  <>
                    <GhostBtn
                      disabled={isBusy}
                      onClick={() =>
                        updateVendorMutation.mutate({
                          vendorId: vendor.id,
                          body: { vendor_status: 'approved', is_available: true },
                        })
                      }
                    >
                      Approve
                    </GhostBtn>
                    <DangerBtn
                      disabled={isBusy}
                      onClick={() =>
                        updateVendorMutation.mutate({
                          vendorId: vendor.id,
                          body: { vendor_status: 'rejected' },
                        })
                      }
                    >
                      Reject
                    </DangerBtn>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Assign to Booking ── */}
          <div className="mt-6">
            <SectionLabel>Assign to Active Booking</SectionLabel>
            <div className="rounded-xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Select booking</p>
                  <Select value={bookingId} onChange={setBookingId}>
                    <option value="">Choose a booking…</option>
                    {(bookingsQuery.data?.bookings ?? []).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.package?.title || b.event?.name || b.id}
                      </option>
                    ))}
                  </Select>
                </div>
                <PrimaryBtn
                  disabled={assignVendorMutation.isPending || !bookingId}
                  onClick={() =>
                    assignVendorMutation.mutate({ bookingId, vendorId: vendor.id })
                  }
                >
                  Assign Vendor
                </PrimaryBtn>
              </div>
            </div>
          </div>

          {/* ── Linked Booking Assignments ── */}
          <div className="mt-6">
            <SectionLabel>Linked Booking Assignments</SectionLabel>
            {(assignmentsQuery.data?.assignments ?? []).length ? (
              <div className="space-y-2">
                {assignmentsQuery.data.assignments.map(a => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F3F3F3] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {a.booking?.package?.title || a.booking?.id || a.bookingId}
                      </p>
                      <p className="mt-0.5 text-xs text-[#767676]">
                        {a.booking?.customer?.name || 'Customer'}
                        {a.booking?.locationSummary ? ` · ${a.booking.locationSummary}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={a.status} />
                      {a.status === 'assigned' && (
                        <GhostBtn
                          onClick={() =>
                            updateAssignmentMutation.mutate({ assignmentId: a.id, body: { status: 'confirmed' } })
                          }
                        >
                          Confirm
                        </GhostBtn>
                      )}
                      {a.status === 'confirmed' && (
                        <GhostBtn
                          onClick={() =>
                            updateAssignmentMutation.mutate({ assignmentId: a.id, body: { status: 'completed' } })
                          }
                        >
                          Complete
                        </GhostBtn>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8F8F8F]">No booking assignments linked to this vendor yet.</p>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab pills
// ---------------------------------------------------------------------------
const vendorTabs = [
  { key: 'pending',    label: 'Pending Requests' },
  { key: 'assigned',   label: 'Assigned' },
  { key: 'unassigned', label: 'Unassigned' },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function VendorManagementPage() {
  const [tab, setTab]               = useState('pending')
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('')
  const [location, setLocation]     = useState('')
  const [availability, setAvailability] = useState('')

  const workspaceQuery = useAdminVendorWorkspace()
  const bookingsQuery  = useAdminBookings({ bucket: 'active', limit: 100 })

  const workspace = workspaceQuery.data ?? {}
  const summary   = workspace.summary ?? {}

  const vendorGroups = {
    pending:    workspace.pendingRequests  ?? [],
    assigned:   workspace.assignedVendors  ?? [],
    unassigned: workspace.unassignedVendors ?? [],
  }

  const activeList = useMemo(
    () => filterVendors(vendorGroups[tab] ?? [], { search, category, location, availability }),
    [availability, category, location, search, tab, vendorGroups]
  )

  if (workspaceQuery.isLoading) return <LoadingState label="Loading vendors…" />
  if (workspaceQuery.error)     return <ErrorState label="Vendor data could not be loaded right now." />

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl  text-[#1C1C1C]">Vendor Management</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Review pending registrations, manage approved vendors, and link them to active bookings.
        </p>
      </div>

      {/* ── Metrics ── */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Requests"   value={String(summary.pendingRequests  ?? 0)} helper="Registrations waiting review"  accent />
        <MetricCard label="Assigned Vendors"   value={String(summary.assignedVendors  ?? 0)} helper="Attached to active bookings" accent/>
        <MetricCard label="Unassigned Vendors" value={String(summary.unassignedVendors ?? 0)} helper="Approved but not linked" accent/>
        <MetricCard label="Available Now"      value={String(summary.availableNow     ?? 0)} helper="Ready for assignment" accent/>
      </div>

      {/* ── Tab bar ── */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#8F8F8F]">
          Vendor Pool
        </p>
        <div className="flex flex-wrap gap-2">
          {vendorTabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={[
                'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition',
                tab === t.key
                  ? 'border-[#D4BA8E] bg-[#D4BA8E] text-[#FAFAFA]'
                  : 'border-[#E4DED8] bg-white text-[#6B7280] hover:border-[#D4BA8E] hover:text-[#7A5C2E]',
              ].join(' ')}
            >
              {t.label}
              <span className={[
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                tab === t.key ? 'bg-white/30 text-white' : 'bg-[#F0EBE3] text-[#8C7D70]',
              ].join(' ')}>
                {(vendorGroups[t.key] ?? []).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-[#767676] uppercase">
          Filter Vendors
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* Search */}
          <label className="flex w-full items-center gap-2.5 rounded-full bg-[#F0F0F0] px-2.5 py-1.5 text-[#A19B94]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8B1A8] text-[#FAFAFA]">
              <span className="h-3.5 w-3.5"><SearchIcon /></span>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors"
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>
          <Input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Service category"
          />
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="City / location"
          />
          <Select value={availability} onChange={setAvailability}>
            <option value="">Any Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </Select>
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">{activeList.length}</span>
        <span className="text-sm text-[#8F8F8F]">vendor{activeList.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Accordion list ── */}
      {activeList.length ? (
        <div className="space-y-3">
          {activeList.map(vendor => (
            <VendorAccordionCard
              key={vendor.id}
              vendor={vendor}
              tab={tab}
              bookingsQuery={bookingsQuery}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E4DED8] bg-white p-8">
          <EmptyState title="No vendors found" body="Try a different search term or switch tabs." />
        </div>
      )}

    </div>
  )
}

// ---------------------------------------------------------------------------
// Standalone Input (used in filter bar)
// ---------------------------------------------------------------------------
// function Input({ value, onChange, placeholder }) {
//   return (
//     <input
//       type="text"
//       value={value}
//       onChange={onChange}
//       placeholder={placeholder}
//       className="h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
//     />
//   )
// }
