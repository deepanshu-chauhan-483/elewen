import { Link } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageIntro,
  Panel,
  StatusBadge,
} from '../components/ui/AdminUI'
import { useAdminOverview } from '../hooks/useAdminData'
import { formatCount, formatCurrency, formatDate } from '../lib/formatters'

function TableFiltersPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      {['Date range', 'Vendor assigned / unassigned', 'Service type'].map(filter => (
        <span
          key={filter}
          className="inline-flex rounded-full border border-[#E4DED8] bg-white px-3 py-1 text-xs text-[#6B7280]"
        >
          {filter}
        </span>
      ))}
    </div>
  )
}

export default function OverviewPage() {
  const overviewQuery = useAdminOverview()

  if (overviewQuery.isLoading) {
    return <LoadingState label="Loading operational overview..." />
  }

  if (overviewQuery.error) {
    return <ErrorState label="Overview data could not be loaded right now." />
  }

  const overview = overviewQuery.data ?? {}
  const metrics = overview.metrics ?? {}
  const pendingActions = overview.pendingActions ?? []
  const healthIndicators = overview.systemHealth ?? []
  const overdueAlerts = overview.overdueAlerts?.length ? overview.overdueAlerts : overview.alerts ?? []

  return (
    <div className="space-y-6">
      <PageIntro
        title="Overview"
        subtitle="Operational modules snapshot arranged by the IA breakdown: booking volume, revenue, pending actions, upcoming events, alerts, and system health."
        action={
          <Link
            to="/alerts"
            className="inline-flex min-h-11 items-center rounded-[8px] bg-[#D4BA8E] px-4 text-sm font-medium text-[#FAFAFA] transition hover:bg-[#c7aa76]"
          >
            Review Alerts
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Bookings" value={formatCount(metrics.totalBookings)} helper="All booking records" />
        <MetricCard label="New" value={formatCount(metrics.newBookingsCount)} helper="Need confirmation" />
        <MetricCard label="Ongoing" value={formatCount(metrics.activeBookingsCount)} helper="Confirmed / in progress" />
        <MetricCard label="Completed" value={formatCount(metrics.completedBookingsCount)} helper="Closed or completed events" />
        <MetricCard label="Upcoming Events" value={formatCount(metrics.upcomingEventsCount)} helper="Next 15 days" />
        <MetricCard label="Revenue Collected" value={formatCurrency(metrics.collectedAmount)} helper="Successful payments only" />
        <MetricCard label="Pending Balance" value={formatCurrency(metrics.pendingPaymentAmount)} helper="Customer payments pending" />
        <MetricCard label="Vendor Approvals" value={formatCount(metrics.pendingVendorApprovalsCount)} helper="Registrations waiting review" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Pending Actions Panel"
          subtitle="Second row from the IA: approvals, customer messages, missing booking data, and unresolved operations tasks."
        >
          {pendingActions.length ? (
            <div className="space-y-3">
              {pendingActions.map(item => (
                <div key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#2E2E2E]">{item.title}</p>
                      <p className="mt-1 text-sm text-[#6B7280]">{item.detail}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No pending actions" body="This overview currently has no outstanding action items." />
          )}
        </Panel>

        <Panel title="Overdue Alerts" subtitle="Items crossing 7 days or needing immediate attention.">
          {overdueAlerts.length ? (
            <div className="space-y-3">
              {overdueAlerts.map(alert => (
                <div key={alert.id} className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#2E2E2E]">{alert.message}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#8F8F8F]">
                        {alert.alertType} / {formatDate(alert.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={alert.severity} />
                      <StatusBadge status={alert.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No overdue alerts" body="The current admin snapshot does not contain overdue alerts." />
          )}
        </Panel>
      </div>

      <Panel
        title="Upcoming Events Table"
        subtitle="Third row from the IA: event date, type, location, customer, service type, and vendor assignment state."
        action={<TableFiltersPreview />}
      >
        {(overview.upcomingBookings ?? []).length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left">
                  {['Event date', 'Event type', 'Location', 'Customer name', 'Service type', 'Vendor status', 'Booking status'].map(column => (
                    <th key={column} className="px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8F8F8F]">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.upcomingBookings.map(booking => (
                  <tr key={booking.id} className="bg-white">
                    <td className="rounded-l-2xl px-3 py-4 text-sm text-[#2E2E2E]">{formatDate(booking.eventDate)}</td>
                    <td className="px-3 py-4 text-sm text-[#2E2E2E]">{booking.event?.name || booking.package?.title || booking.id}</td>
                    <td className="px-3 py-4 text-sm text-[#6B7280]">{booking.locationSummary || 'Venue pending'}</td>
                    <td className="px-3 py-4 text-sm text-[#2E2E2E]">{booking.customer?.name || 'Customer'}</td>
                    <td className="px-3 py-4 text-sm text-[#6B7280]">{booking.package?.serviceCategories?.[0]?.name || 'General service'}</td>
                    <td className="px-3 py-4 text-sm">
                      <StatusBadge
                        status={booking.vendorAssignments?.length ? 'confirmed' : 'pending'}
                        label={booking.vendorAssignments?.length ? 'Assigned' : 'Unassigned'}
                      />
                    </td>
                    <td className="rounded-r-2xl px-3 py-4 text-sm">
                      <StatusBadge status={booking.status} label={booking.statusLabel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No upcoming events" body="Future bookings will populate this table once event data is available." />
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Recent Revenue Snapshot" subtitle="Collection overview from the IA top row.">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Collected</p>
              <p className="admin-serif mt-2 text-[30px] leading-none text-[#111827]">{formatCurrency(metrics.collectedAmount)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Pending Balance</p>
              <p className="admin-serif mt-2 text-[30px] leading-none text-[#111827]">{formatCurrency(metrics.pendingPaymentAmount)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Failed Payments</p>
              <p className="admin-serif mt-2 text-[30px] leading-none text-[#111827]">{formatCount(metrics.failedPaymentsCount)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Pending Vendor Payouts</p>
              <p className="admin-serif mt-2 text-[30px] leading-none text-[#111827]">{formatCurrency(metrics.pendingVendorPayoutAmount)}</p>
            </div>
          </div>
        </Panel>

        <Panel title="System Health Indicators" subtitle="Bottom row from the IA: platform, payment gateway, notifications, and bookings/day health summary.">
          {healthIndicators.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {healthIndicators.map(item => (
                <div key={item.label} className="rounded-2xl bg-white p-4 shadow-[0_1px_0_rgba(17,24,39,0.03)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">{item.label}</p>
                      <p className="mt-2 text-sm font-medium text-[#2E2E2E]">{item.value}</p>
                      <p className="mt-2 text-sm text-[#6B7280]">{item.detail}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="System health not available" body="Health indicators will appear once the admin overview API returns them." />
          )}
        </Panel>
      </div>
    </div>
  )
}
