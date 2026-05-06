import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
  DashboardSelectorList,
  SectionCard,
  StatusPill,
} from '../../components/dashboard/DashboardUI'
import {
  useDashboardSampleTasteDecision,
  useDashboardSampleTastes,
} from '../../hooks/useDashboardData'
import { useWishlist } from '../../hooks/useWishlist'
import { formatDashboardDate } from '../../components/dashboard/dashboardUtils'
import EmptyBooking from '../../components/dashboard/EmptyBooking'

export default function SampleTasteBooking() {
  const navigate = useNavigate()
  const { data: samples = [], isLoading, error } = useDashboardSampleTastes()
  const decisionMutation = useDashboardSampleTasteDecision()
  const { toggleSavedPackage, pendingPackageId } = useWishlist()
  const [selectedSampleId, setSelectedSampleId] = useState('')
  const [feedbackDraft, setFeedbackDraft] = useState({})

  const ongoingSamples = useMemo(
    () => samples.filter(sample => sample.status !== 'completed' && sample.status !== 'cancelled'),
    [samples]
  )
  const completedSamples = useMemo(
    () => samples.filter(sample => sample.status === 'completed' || sample.status === 'cancelled'),
    [samples]
  )

  const activeSampleId = selectedSampleId || ongoingSamples[0]?.id || completedSamples[0]?.id || ''
  const selectedSample = useMemo(
    () => samples.find(sample => sample.id === activeSampleId) ?? null,
    [activeSampleId, samples]
  )

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
      <DashboardPageIntro
        title="Sample Taste Booking"
        subtitle="Review sample requests, assigned vendors, and upcoming tastings."
        meta={`${samples.length} requests`}
      />

      <>
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionCard
            title="Ongoing"
            subtitle="Requests where the tasting is still in progress or waiting for your decision."
          >
            {ongoingSamples.length ? (
              <DashboardSelectorList
                items={ongoingSamples}
                selectedId={activeSampleId}
                onSelect={setSelectedSampleId}
                getLabel={item => item.package?.title || 'Sample Taste Request'}
                getSubLabel={item =>
                  `${item.statusLabel} · ${formatDashboardDate(item.bookingDate)}`
                }
              />
            ) : (
              <p className="text-sm text-[#6B7280]">No ongoing sample taste requests right now.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Completed"
            subtitle="Delivered requests where the booking has already been saved, converted, or closed."
          >
            {completedSamples.length ? (
              <DashboardSelectorList
                items={completedSamples}
                selectedId={activeSampleId}
                onSelect={setSelectedSampleId}
                getLabel={item => item.package?.title || 'Sample Taste Request'}
                getSubLabel={item =>
                  `${item.statusLabel} · ${formatDashboardDate(item.bookingDate)}`
                }
              />
            ) : (
              <p className="text-sm text-[#6B7280]">
                Completed sample taste requests will appear here.
              </p>
            )}
          </SectionCard>
        </div>

        {selectedSample ? (
          <SectionCard
            title={selectedSample.package?.title || 'Sample Taste Request'}
            subtitle={[selectedSample.event?.name, `${selectedSample.guestCount || 'TBD'} guests`]
              .filter(Boolean)
              .join(' · ')}
            action={
              <StatusPill
                label={selectedSample.statusLabel || 'Status'}
                status={selectedSample.status}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
                  Requested For
                </p>
                <p className="mt-2 text-sm text-[#2E2E2E]">
                  {formatDashboardDate(selectedSample.bookingDate)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
                  Delivery Date
                </p>
                <p className="mt-2 text-sm text-[#2E2E2E]">
                  {formatDashboardDate(selectedSample.deliveryDate)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
                  Expiry Window
                </p>
                <p className="mt-2 text-sm text-[#2E2E2E]">
                  {typeof selectedSample.daysUntilExpiry === 'number'
                    ? `${Math.max(selectedSample.daysUntilExpiry, 0)} day${
                        Math.max(selectedSample.daysUntilExpiry, 0) === 1 ? '' : 's'
                      } left`
                    : 'Not set'}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Decision</p>
                <p className="mt-2 text-sm text-[#2E2E2E]">
                  {selectedSample.decision ? selectedSample.decision.replace(/_/g, ' ') : 'Pending'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
                  Booking Summary Card
                </p>
                <p className="mt-3 text-sm text-[#2E2E2E]">
                  {selectedSample.package?.title || 'Sample Taste Request'}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {selectedSample.event?.name
                    ? `Best suited for ${selectedSample.event.name}.`
                    : 'Saved for tasting review.'}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Vendors</p>
                {selectedSample.vendors?.length ? (
                  <div className="mt-3 space-y-3">
                    {selectedSample.vendors.map(vendor => (
                      <div
                        key={vendor.id}
                        className="rounded-2xl bg-[#F6EEE6] px-4 py-3 text-sm text-[#591902]"
                      >
                        <p>{vendor.vendor?.companyName || `Vendor #${vendor.vendorId}`}</p>
                        <p className="mt-1 text-xs text-[#8C5A2C]">
                          {vendor.menuItems || 'Menu items will appear here once assigned.'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#6B7280]">
                    Vendor assignment is still pending for this tasting request.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
                  Feedback Section
                </p>
                <textarea
                  value={feedbackDraft[selectedSample.id] || ''}
                  onChange={event =>
                    setFeedbackDraft(current => ({
                      ...current,
                      [selectedSample.id]: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Add tasting feedback for this request..."
                  className="mt-3 w-full rounded-3xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
                  Primary Decisions
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {selectedSample.status === 'delivered' ? (
                    <>
                      <button
                        type="button"
                        disabled={decisionMutation.isPending}
                        onClick={async () => {
                          const vendorId = selectedSample.vendors?.[0]?.vendorId
                          await decisionMutation.mutateAsync({
                            sampleId: selectedSample.id,
                            body: {
                              decision: 'convert_full',
                              vendorId,
                              feedbackText: feedbackDraft[selectedSample.id] || undefined,
                            },
                          })
                          navigate('/checkout?mode=sample-tasting')
                        }}
                        className="rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Proceed with Full Booking
                      </button>

                      <button
                        type="button"
                        disabled={
                          decisionMutation.isPending ||
                          String(pendingPackageId) === String(selectedSample.packageId)
                        }
                        onClick={async () => {
                          await decisionMutation.mutateAsync({
                            sampleId: selectedSample.id,
                            body: {
                              decision: 'save',
                              feedbackText: feedbackDraft[selectedSample.id] || undefined,
                            },
                          })
                          await toggleSavedPackage({ packageId: selectedSample.packageId })
                        }}
                        className="rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {String(pendingPackageId) === String(selectedSample.packageId)
                          ? 'Saving...'
                          : 'Save Package'}
                      </button>

                      <button
                        type="button"
                        disabled={decisionMutation.isPending}
                        onClick={async () => {
                          await decisionMutation.mutateAsync({
                            sampleId: selectedSample.id,
                            body: {
                              decision: 'cancel',
                              feedbackText: feedbackDraft[selectedSample.id] || undefined,
                            },
                          })
                        }}
                        className="rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-[#6B7280]">
                      Decision controls unlock once the tasting is delivered.
                    </p>
                  )}

                  <Link
                    to="/sample-test-booking"
                    className="rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902]"
                  >
                    Try Same Package from Different Vendors
                  </Link>
                </div>
              </div>
            </div>
          </SectionCard>
        ) : null}
      </>
    </div>
  )
}
