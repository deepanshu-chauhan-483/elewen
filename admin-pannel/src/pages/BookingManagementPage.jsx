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
  TextAreaField,
} from '../components/ui/AdminUI'
import {
  useAdminAddBookingNote,
  useAdminBooking,
  useAdminBookings,
  useAdminCreateVendorAssignment,
  useAdminUpdateBookingStatus,
  useAdminVendors,
} from '../hooks/useAdminData'
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatters'

export default function BookingManagementPage() {
  const [search, setSearch] = useState('')
  const [bucket, setBucket] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [statusInput, setStatusInput] = useState('')
  const [note, setNote] = useState('')
  const [vendorId, setVendorId] = useState('')

  const bookingsQuery = useAdminBookings({ search, bucket, status: statusFilter, limit: 24 })
  const bookingQuery = useAdminBooking(selectedId)
  const vendorsQuery = useAdminVendors({ limit: 100, status: 'approved', availability: 'available' })
  const updateStatusMutation = useAdminUpdateBookingStatus()
  const addNoteMutation = useAdminAddBookingNote()
  const createAssignmentMutation = useAdminCreateVendorAssignment()

  const bookings = bookingsQuery.data?.bookings ?? []
  const selectedFromList = useMemo(
    () => bookings.find(booking => booking.id === selectedId) ?? bookings[0] ?? null,
    [bookings, selectedId]
  )
  const booking = bookingQuery.data ?? selectedFromList

  useEffect(() => {
    if (selectedFromList && selectedFromList.id !== selectedId) {
      setSelectedId(selectedFromList.id)
    }
  }, [selectedFromList, selectedId])

  useEffect(() => {
    setStatusInput(booking?.status ?? '')
    setVendorId('')
  }, [booking?.id])

  if (bookingsQuery.isLoading) {
    return <LoadingState label="Loading bookings..." />
  }

  if (bookingsQuery.error) {
    return <ErrorState label="Bookings could not be loaded right now." />
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Booking Management"
        subtitle="Work through new, active, and completed bookings with internal notes and vendor assignment actions."
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel
          title="Booking Queue"
          subtitle="Search by booking ID, customer, or package."
          action={
            <div className="grid gap-3 md:grid-cols-3">
              <SearchField value={search} onChange={setSearch} placeholder="Search bookings" />
              <SelectField value={bucket} onChange={setBucket}>
                <option value="all">All buckets</option>
                <option value="active">Active</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="new">New</option>
                <option value="completed">Completed</option>
              </SelectField>
              <SelectField value={statusFilter} onChange={setStatusFilter}>
                <option value="">All stages</option>
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
          }
        >
          {bookings.length ? (
            <div className="space-y-3">
              {bookings.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`block w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    booking?.id === item.id
                      ? 'border-[#5D2E17] bg-[#F7EEE8]'
                      : 'border-[#E7DDD6] bg-[#FBF7F4]'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-medium text-[#2B211B]">{item.package?.title || item.event?.name || item.id}</p>
                      <p className="mt-1 text-sm text-[#6F6257]">{item.customer?.name || 'Customer'} / {formatDate(item.eventDate)}</p>
                      <p className="mt-1 text-sm text-[#8C7D70]">{item.locationSummary || 'Venue pending'}</p>
                    </div>
                    <StatusBadge status={item.status} label={item.statusLabel} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No bookings found" body="Try a different search term or bucket filter." />
          )}
        </Panel>

        <Panel title="Booking Detail" subtitle="Update status, capture internal notes, and attach a vendor.">
          {booking ? (
            <div className="space-y-6">
              <FieldList
                items={[
                  { label: 'Customer', value: booking.customer?.name },
                  { label: 'Email', value: booking.customer?.email },
                  { label: 'Phone', value: booking.customer?.phone },
                  { label: 'Event date', value: formatDate(booking.eventDate) },
                  { label: 'Location', value: booking.locationSummary },
                  { label: 'Guests', value: booking.guestCount ? String(booking.guestCount) : 'Pending' },
                  { label: 'Advance', value: formatCurrency(booking.advanceAmount) },
                  { label: 'Remaining', value: formatCurrency(booking.remainingAmount) },
                ]}
              />

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                  <h3 className="text-lg font-semibold text-[#2B211B]">Status Control</h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <SelectField value={statusInput} onChange={setStatusInput}>
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
                    <TextAreaField
                      value={note}
                      onChange={event => setNote(event.target.value)}
                      placeholder="Add the context that should be recorded in the status log."
                    />
                    <ActionButton
                      disabled={updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          bookingId: booking.id,
                          body: {
                            status: statusInput,
                            note,
                          },
                        })
                      }
                    >
                      {updateStatusMutation.isPending ? 'Updating...' : 'Update Booking Status'}
                    </ActionButton>
                  </div>
                </div>

                <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                  <h3 className="text-lg font-semibold text-[#2B211B]">Internal Note</h3>
                  <TextAreaField
                    className="mt-4 w-full"
                    value={note}
                    onChange={event => setNote(event.target.value)}
                    placeholder="Share internal context, dependencies, or customer nuances."
                  />
                  <ActionButton
                    className="mt-4"
                    tone="ghost"
                    disabled={addNoteMutation.isPending || !note.trim()}
                    onClick={() =>
                      addNoteMutation.mutate({
                        bookingId: booking.id,
                        body: { note },
                      })
                    }
                  >
                    {addNoteMutation.isPending ? 'Saving...' : 'Save Internal Note'}
                  </ActionButton>
                </div>
              </div>

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2B211B]">Vendor Assignments</h3>
                    <p className="mt-1 text-sm text-[#6F6257]">Link the booking to an approved vendor from the live Strapi directory.</p>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <SelectField value={vendorId} onChange={setVendorId}>
                      <option value="">Select vendor</option>
                      {(vendorsQuery.data?.vendors ?? []).map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.companyName}
                        </option>
                      ))}
                    </SelectField>
                    <ActionButton
                      disabled={createAssignmentMutation.isPending || !vendorId}
                      onClick={() =>
                        createAssignmentMutation.mutate({
                          bookingId: booking.id,
                          vendorId,
                        })
                      }
                    >
                      Assign Vendor
                    </ActionButton>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {booking.vendorAssignments?.length ? (
                    booking.vendorAssignments.map(assignment => (
                      <div key={assignment.id} className="rounded-2xl bg-white px-4 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#2B211B]">{assignment.vendor?.companyName || assignment.vendorId}</p>
                            <p className="mt-1 text-sm text-[#6F6257]">{assignment.vendor?.locationCity || 'Location pending'}</p>
                          </div>
                          <StatusBadge status={assignment.status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6F6257]">No vendors are attached to this booking yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <h3 className="text-lg font-semibold text-[#2B211B]">Payment History</h3>
                <div className="mt-4 space-y-3">
                  {booking.payments?.length ? (
                    booking.payments.map(payment => (
                      <div key={payment.id} className="rounded-2xl bg-white px-4 py-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#2B211B]">{payment.paymentType} payment / {formatCurrency(payment.amount)}</p>
                            <p className="mt-1 text-sm text-[#6F6257]">{formatDateTime(payment.createdAt)}</p>
                          </div>
                          <StatusBadge status={payment.status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#6F6257]">No payments recorded for this booking yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="No booking selected" body="Choose a booking from the queue to inspect and update it." />
          )}
        </Panel>
      </div>
    </div>
  )
}
