import { useEffect, useMemo, useState } from 'react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  FieldList,
  InputField,
  LoadingState,
  PageIntro,
  Panel,
  SearchField,
  SelectField,
  StatusBadge,
} from '../components/ui/AdminUI'
import { useAdminSampleTastes, useAdminUpdateSampleTasteStatus, useAdminVendors } from '../hooks/useAdminData'
import { formatDate } from '../lib/formatters'

export default function SampleTastePage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')

  const samplesQuery = useAdminSampleTastes({ search, status, limit: 24 })
  const vendorsQuery = useAdminVendors({ limit: 100, status: 'approved', availability: 'available' })
  const updateSampleMutation = useAdminUpdateSampleTasteStatus()

  const samples = samplesQuery.data?.samples ?? []
  const selectedSample = useMemo(
    () => samples.find(sample => sample.id === selectedId) ?? samples[0] ?? null,
    [samples, selectedId]
  )

  useEffect(() => {
    if (selectedSample && selectedSample.id !== selectedId) {
      setSelectedId(selectedSample.id)
    }
  }, [selectedId, selectedSample])

  useEffect(() => {
    setVendorId(selectedSample?.vendors?.[0]?.vendorId ?? '')
    setDeliveryDate(selectedSample?.deliveryDate ? selectedSample.deliveryDate.slice(0, 10) : '')
  }, [selectedSample?.id])

  if (samplesQuery.isLoading) {
    return <LoadingState label="Loading sample taste bookings..." />
  }

  if (samplesQuery.error) {
    return <ErrorState label="Sample tasting data is unavailable right now." />
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Sample Taste Booking"
        subtitle="Track tasting requests from request to assignment, delivery, and final completion."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel
          title="Request Queue"
          subtitle="Filter by customer, package, or stage."
          action={
            <div className="flex flex-col gap-3 lg:flex-row">
              <SearchField value={search} onChange={setSearch} placeholder="Search sample bookings" />
              <SelectField value={status} onChange={setStatus}>
                <option value="">All stages</option>
                <option value="new">New</option>
                <option value="assigned">Assigned</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </SelectField>
            </div>
          }
        >
          {samples.length ? (
            <div className="space-y-3">
              {samples.map(sample => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => setSelectedId(sample.id)}
                  className={`block w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    selectedSample?.id === sample.id
                      ? 'border-[#5D2E17] bg-[#F7EEE8]'
                      : 'border-[#E7DDD6] bg-[#FBF7F4]'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-medium text-[#2B211B]">{sample.customer?.name || 'Customer'}</p>
                      <p className="mt-1 text-sm text-[#6F6257]">{sample.package?.title || sample.event?.name || 'Sample request'}</p>
                      <p className="mt-1 text-sm text-[#8C7D70]">Booking date: {formatDate(sample.bookingDate)}</p>
                    </div>
                    <StatusBadge status={sample.status} label={sample.statusLabel} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No sample requests" body="New tasting bookings will appear here as customers submit them." />
          )}
        </Panel>

        <Panel title="Sample Detail" subtitle="Assign a vendor, capture delivery timing, and move the request through its operational stages.">
          {selectedSample ? (
            <div className="space-y-6">
              <FieldList
                items={[
                  { label: 'Customer', value: selectedSample.customer?.name },
                  { label: 'Email', value: selectedSample.customer?.email },
                  { label: 'Package', value: selectedSample.package?.title || selectedSample.event?.name },
                  { label: 'Guests', value: selectedSample.guestCount ? String(selectedSample.guestCount) : 'Not shared' },
                  { label: 'Booking date', value: formatDate(selectedSample.bookingDate) },
                  { label: 'Delivery date', value: formatDate(selectedSample.deliveryDate) },
                ]}
              />

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#2B211B]">Assigned Vendors</h3>
                  <StatusBadge status={selectedSample.status} label={selectedSample.statusLabel} />
                </div>
                <div className="mt-4 space-y-3">
                  {selectedSample.vendors?.length ? (
                    selectedSample.vendors.map(vendor => (
                      <div key={vendor.id} className="rounded-2xl bg-white px-4 py-4">
                        <p className="text-sm font-medium text-[#2B211B]">{vendor.vendor?.companyName || vendor.vendorId}</p>
                        <p className="mt-1 text-sm text-[#6F6257]">{vendor.vendor?.locationCity || 'Location pending'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6F6257]">No vendor has been linked to this tasting yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <h3 className="text-lg font-semibold text-[#2B211B]">Stage Actions</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SelectField value={vendorId} onChange={setVendorId}>
                    <option value="">Select vendor</option>
                    {(vendorsQuery.data?.vendors ?? []).map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.companyName}
                      </option>
                    ))}
                  </SelectField>

                  <InputField
                    type="date"
                    value={deliveryDate}
                    onChange={event => setDeliveryDate(event.target.value)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <ActionButton
                    disabled={updateSampleMutation.isPending || selectedSample.status !== 'new' || !vendorId}
                    onClick={() =>
                      updateSampleMutation.mutate({
                        sampleId: selectedSample.id,
                        body: {
                          status: 'assigned',
                          vendorId,
                        },
                      })
                    }
                  >
                    Assign Vendor
                  </ActionButton>

                  <ActionButton
                    tone="ghost"
                    disabled={updateSampleMutation.isPending || selectedSample.status !== 'assigned'}
                    onClick={() =>
                      updateSampleMutation.mutate({
                        sampleId: selectedSample.id,
                        body: {
                          status: 'delivered',
                          deliveryDate: deliveryDate || undefined,
                        },
                      })
                    }
                  >
                    Mark Delivered
                  </ActionButton>

                  <ActionButton
                    tone="ghost"
                    disabled={updateSampleMutation.isPending || selectedSample.status !== 'delivered'}
                    onClick={() =>
                      updateSampleMutation.mutate({
                        sampleId: selectedSample.id,
                        body: { status: 'completed' },
                      })
                    }
                  >
                    Complete Request
                  </ActionButton>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="No tasting selected" body="Choose a tasting request from the queue to view details and actions." />
          )}
        </Panel>
      </div>
    </div>
  )
}
