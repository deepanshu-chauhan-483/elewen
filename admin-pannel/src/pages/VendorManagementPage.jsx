import { useEffect, useMemo, useState } from 'react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  FieldList,
  InputField,
  LoadingState,
  MetricCard,
  PageIntro,
  Panel,
  SearchField,
  SelectField,
  StatusBadge,
} from '../components/ui/AdminUI'
import {
  useAdminBookings,
  useAdminCreateVendorAssignment,
  useAdminUpdateVendor,
  useAdminUpdateVendorAssignment,
  useAdminVendorAssignments,
  useAdminVendorWorkspace,
} from '../hooks/useAdminData'
import { formatCurrency } from '../lib/formatters'

const vendorTabs = [
  { key: 'pending', label: 'Pending Requests' },
  { key: 'assigned', label: 'Assigned Vendors' },
  { key: 'unassigned', label: 'Unassigned Vendors' },
]

function SectionTabs({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-full px-4 py-2 text-sm transition ${
            value === item.key ? 'bg-[#5D2E17] text-white' : 'bg-white text-[#6F6257]'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function filterVendors(vendors, { search, category, location, availability }) {
  const searchTerm = String(search ?? '').trim().toLowerCase()
  const categoryTerm = String(category ?? '').trim().toLowerCase()
  const locationTerm = String(location ?? '').trim().toLowerCase()

  return vendors.filter(vendor => {
    if (availability === 'available' && !vendor.isAvailable) return false
    if (availability === 'unavailable' && vendor.isAvailable) return false

    if (categoryTerm) {
      const categoryMatch = (vendor.serviceCategories ?? []).some(service =>
        String(service.name ?? '').toLowerCase().includes(categoryTerm)
      )
      if (!categoryMatch) return false
    }

    if (locationTerm && !String(vendor.locationCity ?? '').toLowerCase().includes(locationTerm)) {
      return false
    }

    if (!searchTerm) return true

    const haystack = [
      vendor.companyName,
      vendor.contactPerson,
      vendor.locationCity,
      ...(vendor.serviceCategories ?? []).map(service => service.name),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(searchTerm)
  })
}

export default function VendorManagementPage() {
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [availability, setAvailability] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [vendorStatus, setVendorStatus] = useState('pending')
  const [isAvailable, setIsAvailable] = useState(true)
  const [minimumPrice, setMinimumPrice] = useState('')
  const [leadTimeDays, setLeadTimeDays] = useState('')
  const [bookingId, setBookingId] = useState('')

  const workspaceQuery = useAdminVendorWorkspace()
  const bookingsQuery = useAdminBookings({ bucket: 'active', limit: 100 })
  const updateVendorMutation = useAdminUpdateVendor()
  const assignVendorMutation = useAdminCreateVendorAssignment()
  const updateAssignmentMutation = useAdminUpdateVendorAssignment()

  const workspace = workspaceQuery.data ?? {}
  const vendorGroups = {
    pending: workspace.pendingRequests ?? [],
    assigned: workspace.assignedVendors ?? [],
    unassigned: workspace.unassignedVendors ?? [],
  }

  const activeList = useMemo(
    () =>
      filterVendors(vendorGroups[tab] ?? [], {
        search,
        category,
        location,
        availability,
      }),
    [availability, category, location, search, tab, vendorGroups]
  )

  const selectedVendor = useMemo(
    () => activeList.find(vendor => vendor.id === selectedId) ?? activeList[0] ?? null,
    [activeList, selectedId]
  )

  const assignmentsQuery = useAdminVendorAssignments({
    vendorId: selectedVendor?.id,
    enabled: Boolean(selectedVendor?.id),
  })

  useEffect(() => {
    if (selectedVendor?.id && selectedVendor.id !== selectedId) {
      setSelectedId(selectedVendor.id)
    }
  }, [selectedId, selectedVendor])

  useEffect(() => {
    setVendorStatus(selectedVendor?.vendorStatus ?? 'pending')
    setIsAvailable(Boolean(selectedVendor?.isAvailable))
    setMinimumPrice(selectedVendor?.minimumPrice ? String(selectedVendor.minimumPrice) : '')
    setLeadTimeDays(selectedVendor?.leadTimeDays ? String(selectedVendor.leadTimeDays) : '')
  }, [selectedVendor?.id])

  if (workspaceQuery.isLoading) {
    return <LoadingState label="Loading vendors..." />
  }

  if (workspaceQuery.error) {
    return <ErrorState label="Vendor data could not be loaded right now." />
  }

  const summary = workspace.summary ?? {}

  return (
    <div className="space-y-6">
      <PageIntro
        title="Vendor Management"
        subtitle="Live vendor operations arranged by the IA breakdown: pending requests, assigned vendors, and approved but unassigned vendors."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Requests" value={String(summary.pendingRequests ?? 0)} helper="Registrations waiting review" />
        <MetricCard label="Assigned Vendors" value={String(summary.assignedVendors ?? 0)} helper="Attached to active bookings" />
        <MetricCard label="Unassigned Vendors" value={String(summary.unassignedVendors ?? 0)} helper="Approved but not linked" />
        <MetricCard label="Available Now" value={String(summary.availableNow ?? 0)} helper="Ready for booking assignment" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <Panel
          title="Vendor Directory"
          subtitle="Use the IA tabs and filters to review pending, assigned, and unassigned vendor pools."
          action={<SectionTabs items={vendorTabs} value={tab} onChange={setTab} />}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SearchField value={search} onChange={setSearch} placeholder="Search vendors" />
            <InputField value={category} onChange={event => setCategory(event.target.value)} placeholder="Category / service" />
            <InputField value={location} onChange={event => setLocation(event.target.value)} placeholder="Location" />
            <SelectField value={availability} onChange={setAvailability}>
              <option value="">Any availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </SelectField>
          </div>

          <div className="mt-6 space-y-3">
            {activeList.length ? (
              activeList.map(vendor => (
                <button
                  key={vendor.id}
                  type="button"
                  onClick={() => setSelectedId(vendor.id)}
                  className={`block w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    selectedVendor?.id === vendor.id
                      ? 'border-[#5D2E17] bg-[#F7EEE8]'
                      : 'border-[#E7DDD6] bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-medium text-[#2B211B]">{vendor.companyName}</p>
                      <p className="mt-1 text-sm text-[#6F6257]">
                        {vendor.contactPerson || 'Contact pending'} / {vendor.locationCity || 'City pending'}
                      </p>
                      <p className="mt-2 text-sm text-[#6F6257]">
                        {(vendor.serviceCategories ?? []).map(service => service.name).filter(Boolean).join(', ') || 'Service category pending'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={vendor.vendorStatus} />
                      <StatusBadge status={vendor.isAvailable ? 'success' : 'failed'} label={vendor.isAvailable ? 'Available' : 'Unavailable'} />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState title="No vendors found" body="Try a different filter or switch to another IA tab." />
            )}
          </div>
        </Panel>

        <Panel title="Vendor Detail" subtitle="Review registration details, update vendor state, and manage linked bookings.">
          {selectedVendor ? (
            <div className="space-y-6">
              <FieldList
                items={[
                  { label: 'Company', value: selectedVendor.companyName },
                  { label: 'Contact', value: selectedVendor.contactPerson },
                  { label: 'Email', value: selectedVendor.email },
                  { label: 'Phone', value: selectedVendor.phone },
                  { label: 'City', value: selectedVendor.locationCity },
                  { label: 'Services', value: (selectedVendor.serviceCategories ?? []).map(service => service.name).filter(Boolean).join(', ') },
                  { label: 'Minimum price', value: formatCurrency(selectedVendor.minimumPrice) },
                  { label: 'Pending payouts', value: formatCurrency(selectedVendor.pendingPayoutAmount) },
                  { label: 'Lead time', value: selectedVendor.leadTimeDays ? `${selectedVendor.leadTimeDays} days` : 'Not set' },
                  { label: 'Active bookings', value: String(selectedVendor.activeAssignmentsCount ?? 0) },
                ]}
              />

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <h3 className="text-lg font-semibold text-[#2B211B]">Vendor Controls</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SelectField value={vendorStatus} onChange={setVendorStatus}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="inactive">Inactive</option>
                  </SelectField>
                  <SelectField value={isAvailable ? 'true' : 'false'} onChange={value => setIsAvailable(value === 'true')}>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </SelectField>
                  <InputField type="number" value={minimumPrice} onChange={event => setMinimumPrice(event.target.value)} placeholder="Minimum price" />
                  <InputField type="number" value={leadTimeDays} onChange={event => setLeadTimeDays(event.target.value)} placeholder="Lead time days" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ActionButton
                    disabled={updateVendorMutation.isPending}
                    onClick={() =>
                      updateVendorMutation.mutate({
                        vendorId: selectedVendor.id,
                        body: {
                          vendor_status: vendorStatus,
                          is_available: isAvailable,
                          minimum_price: minimumPrice ? Number(minimumPrice) : undefined,
                          lead_time_days: leadTimeDays ? Number(leadTimeDays) : undefined,
                        },
                      })
                    }
                  >
                    {updateVendorMutation.isPending ? 'Saving...' : 'Save Vendor Changes'}
                  </ActionButton>

                  {tab === 'pending' ? (
                    <>
                      <ActionButton
                        tone="gold"
                        disabled={updateVendorMutation.isPending}
                        onClick={() =>
                          updateVendorMutation.mutate({
                            vendorId: selectedVendor.id,
                            body: { vendor_status: 'approved', is_available: true },
                          })
                        }
                      >
                        Approve Vendor
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        disabled={updateVendorMutation.isPending}
                        onClick={() =>
                          updateVendorMutation.mutate({
                            vendorId: selectedVendor.id,
                            body: { vendor_status: 'rejected' },
                          })
                        }
                      >
                        Reject Vendor
                      </ActionButton>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <h3 className="text-lg font-semibold text-[#2B211B]">Assign to Active Booking</h3>
                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <SelectField value={bookingId} onChange={setBookingId}>
                    <option value="">Select active booking</option>
                    {(bookingsQuery.data?.bookings ?? []).map(booking => (
                      <option key={booking.id} value={booking.id}>
                        {booking.package?.title || booking.event?.name || booking.id}
                      </option>
                    ))}
                  </SelectField>
                  <ActionButton
                    disabled={assignVendorMutation.isPending || !bookingId}
                    onClick={() =>
                      assignVendorMutation.mutate({
                        bookingId,
                        vendorId: selectedVendor.id,
                      })
                    }
                  >
                    Assign Vendor
                  </ActionButton>
                </div>
              </div>

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <h3 className="text-lg font-semibold text-[#2B211B]">Linked Booking Assignments</h3>
                <div className="mt-4 space-y-3">
                  {(assignmentsQuery.data?.assignments ?? []).length ? (
                    assignmentsQuery.data.assignments.map(assignment => (
                      <div key={assignment.id} className="rounded-2xl bg-white px-4 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#2B211B]">
                              {assignment.booking?.package?.title || assignment.booking?.id || assignment.bookingId}
                            </p>
                            <p className="mt-1 text-sm text-[#6F6257]">
                              {assignment.booking?.customer?.name || 'Customer'} / {assignment.booking?.locationSummary || 'Venue pending'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge status={assignment.status} />
                            {assignment.status === 'assigned' ? (
                              <ActionButton
                                tone="ghost"
                                className="min-h-9 px-3"
                                onClick={() =>
                                  updateAssignmentMutation.mutate({
                                    assignmentId: assignment.id,
                                    body: { status: 'confirmed' },
                                  })
                                }
                              >
                                Confirm
                              </ActionButton>
                            ) : null}
                            {assignment.status === 'confirmed' ? (
                              <ActionButton
                                tone="ghost"
                                className="min-h-9 px-3"
                                onClick={() =>
                                  updateAssignmentMutation.mutate({
                                    assignmentId: assignment.id,
                                    body: { status: 'completed' },
                                  })
                                }
                              >
                                Complete
                              </ActionButton>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6F6257]">No linked booking assignments for this vendor yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="No vendor selected" body="Choose a vendor from the directory to review and update them." />
          )}
        </Panel>
      </div>
    </div>
  )
}
