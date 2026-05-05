import { DashboardEmptyState, DashboardErrorState, DashboardLoadingState, DashboardPageIntro, SectionCard, StatusPill } from '../../components/dashboard/DashboardUI'
import { useDashboardSampleTastes } from '../../hooks/useDashboardData'
import { formatDashboardDate } from '../../components/dashboard/dashboardUtils'

export default function SampleTasteBooking() {
  const { data: samples = [], isLoading, error } = useDashboardSampleTastes()

  if (isLoading) {
    return <DashboardLoadingState title="Loading sample taste requests..." />
  }

  if (error) {
    return <DashboardErrorState title="We could not load sample taste bookings." />
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Sample Taste Booking"
        subtitle="Review sample requests, assigned vendors, and upcoming tastings."
        meta={`${samples.length} requests`}
      />

      {samples.length === 0 ? (
        <DashboardEmptyState
          title="No sample taste requests yet"
          body="When you book a tasting from the customer journey, it will appear here with assigned vendor details and delivery progress."
          actionLabel="Book Sample Taste"
          actionTo="/sample-test-booking"
        />
      ) : null}

      {samples.map(sample => (
        <SectionCard
          key={sample.id}
          title={sample.package?.title || 'Sample Taste Request'}
          subtitle={[sample.event?.name, `${sample.guestCount || 'TBD'} guests`].filter(Boolean).join(' · ')}
          action={<StatusPill label={sample.statusLabel || 'Status'} status={sample.status} />}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Requested For</p>
              <p className="mt-2 text-sm text-[#2E2E2E]">{formatDashboardDate(sample.bookingDate)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Delivery Date</p>
              <p className="mt-2 text-sm text-[#2E2E2E]">{formatDashboardDate(sample.deliveryDate)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Expiry Window</p>
              <p className="mt-2 text-sm text-[#2E2E2E]">
                {typeof sample.daysUntilExpiry === 'number'
                  ? `${Math.max(sample.daysUntilExpiry, 0)} day${Math.max(sample.daysUntilExpiry, 0) === 1 ? '' : 's'} left`
                  : 'Not set'}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Decision</p>
              <p className="mt-2 text-sm text-[#2E2E2E]">
                {sample.decision ? sample.decision.replace(/_/g, ' ') : 'Pending'}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Assigned Vendors</p>
            {sample.vendors?.length ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {sample.vendors.map(vendor => (
                  <div key={vendor.id} className="rounded-full bg-[#F6EEE6] px-4 py-2 text-sm text-[#591902]">
                    {vendor.vendor?.companyName || `Vendor #${vendor.vendorId}`}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#6B7280]">Vendor assignment is still pending for this tasting request.</p>
            )}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
