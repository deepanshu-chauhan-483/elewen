import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
} from '../components/ui/AdminUI'
import { useAdminOverview } from '../hooks/useAdminData'
import { formatCount, formatCurrency, formatDate } from '../lib/formatters'

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
const badgeClasses = {
  urgent:    'bg-red-100 text-red-800',
  overdue:   'bg-amber-100 text-amber-800',
  pending:   'bg-blue-50 text-blue-700',
  confirmed: 'bg-green-100 text-green-800',
  new:       'bg-[#F5EDD9] text-[#7A5C2E]',
  high:      'bg-red-100 text-red-800',
  medium:    'bg-amber-100 text-amber-800',
  low:       'bg-green-100 text-green-800',
  open:      'bg-gray-100 text-gray-700',
  healthy:   'bg-green-100 text-green-800',
  warning:   'bg-amber-100 text-amber-800',
  error:     'bg-red-100 text-red-800',
}

function StatusBadge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = badgeClasses[key] ?? 'bg-gray-100 text-gray-700'
  const text = label ?? (key.charAt(0).toUpperCase() + key.slice(1)) ?? '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] tracking-wide whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------
function MetricCard({ label, value, helper, accent = false }) {
  return (
    <div
      className={[
        'flex flex-col gap-1 rounded-2xl border border-[#F0EBE3] bg-white px-5 py-5',
        accent ? 'border-t-[3px] border-t-[#D4BA8E]' : '',
      ].join(' ')}
    >
      <span className="text-[11px] font-normal uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <span className="text-[28px] font-semibold leading-none text-[#1C1C1C]">{value}</span>
      <span className="text-xs text-gray-500">{helper}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------
function Panel({ title, subtitle, children, action }) {
  return (
    <div className="rounded-[20px] border border-[#F0EBE3] bg-[#FAFAF8] p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base text-[#1C1C1C]">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-[13px] text-gray-400">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ActionItem
// ---------------------------------------------------------------------------
function ActionItem({ item }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[#F0EBE3] bg-white px-4 py-3.5">
      <div className="flex-1">
        <p className="text-sm text-[#1C1C1C]">{item.title}</p>
        <p className="mt-1 text-[13px] text-gray-500">{item.detail}</p>
      </div>
      <StatusBadge status={item.status} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// AlertItem
// ---------------------------------------------------------------------------
function AlertItem({ alert }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[#F0EBE3] bg-white px-4 py-3.5">
      <div className="flex-1">
        <p className="text-sm text-[#1C1C1C]">{alert.message}</p>
        <p className="mt-1 text-[11px] uppercase tracking-widest text-gray-400">
          {alert.alertType} · {formatDate(alert.createdAt)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StatusBadge status={alert.severity} />
        <StatusBadge status={alert.status} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RevenueCard
// ---------------------------------------------------------------------------
const revenueVariants = {
  good:    'border-green-200 bg-green-50',
  warn:    'border-red-200 bg-red-50',
  default: 'border-[#F0EBE3] bg-white',
}
const revenueLabelVariants = {
  good:    'text-green-700',
  warn:    'text-red-700',
  default: 'text-gray-400',
}
const revenueValueVariants = {
  good:    'text-green-800',
  warn:    'text-red-800',
  default: 'text-gray-900',
}

function RevenueCard({ label, value, variant = 'default' }) {
  return (
    <div className={`rounded-xl border p-4 ${revenueVariants[variant]}`}>
      <p className={`text-[11px] font-normal uppercase tracking-widest ${revenueLabelVariants[variant]}`}>
        {label}
      </p>
      <p className={`mt-2 text-[22px] font-semibold leading-none ${revenueValueVariants[variant]}`}>
        {value}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HealthCard
// ---------------------------------------------------------------------------
const healthBorderVariants = {
  healthy: 'border-l-green-500',
  warning: 'border-l-amber-400',
  error:   'border-l-red-500',
}

function HealthCard({ item }) {
  const borderCls = healthBorderVariants[item.status] ?? 'border-l-gray-300'
  return (
    <div
      className={`rounded-xl border border-[#F0EBE3] border-l-[3px] bg-white p-4 ${borderCls}`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {item.label}
        </p>
        <StatusBadge status={item.status} />
      </div>
      <p className="text-[15px] font-bold text-gray-900">{item.value}</p>
      <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TableTabs
// ---------------------------------------------------------------------------
const TABLE_TABS = ['all', 'confirmed', 'pending', 'new']

function TableTabs({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABLE_TABS.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={[
            'rounded-full border px-3.5 py-1 text-xs font-semibold capitalize transition',
            active === t
              ? 'border-[#D4BA8E] bg-[#D4BA8E] text-[#FAFAFA]'
              : 'border-[#E4DED8] bg-white text-[#6B7280] hover:border-[#D4BA8E]',
          ].join(' ')}
        >
          {t === 'all' ? 'All' : t}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const TABLE_COLS = [
  'Event Date', 'Event Type', 'Location',
  'Customer', 'Service', 'Vendor', 'Status',
]

export default function OverviewPage() {
  const [tab, setTab] = useState('all')
  const overviewQuery = useAdminOverview()

  if (overviewQuery.isLoading) {
    return <LoadingState label="Loading operational overview..." />
  }

  if (overviewQuery.error) {
    return <ErrorState label="Overview data could not be loaded right now." />
  }

  const overview         = overviewQuery.data ?? {}
  const metrics          = overview.metrics ?? {}
  const pendingActions   = overview.pendingActions ?? []
  const healthIndicators = overview.systemHealth ?? []
  const overdueAlerts    = overview.overdueAlerts?.length
    ? overview.overdueAlerts
    : overview.alerts ?? []
  const upcomingBookings = overview.upcomingBookings ?? []

  const filteredBookings =
    tab === 'all'
      ? upcomingBookings
      : upcomingBookings.filter(b => b.status === tab)

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl tracking-tight text-gray-900">
            Overview
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Admin snapshot ·{' '}
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link
          to="/alerts"
          className="inline-flex min-h-11 items-center rounded-[8px] bg-[#D4BA8E] px-4 text-sm font-medium text-[#FAFAFA] transition hover:bg-[#c7aa76]"
        >
          Review Alerts
        </Link>
      </div>

      {/* ── Booking metrics ── */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Bookings"
          value={formatCount(metrics.totalBookings)}
          helper="All records"
          accent
        />
        <MetricCard
          label="New"
          value={formatCount(metrics.newBookingsCount)}
          helper="Need confirmation"
          accent
        />
        <MetricCard
          label="Ongoing"
          value={formatCount(metrics.activeBookingsCount)}
          helper="Confirmed / active"
          accent
        />
        <MetricCard
          label="Completed"
          value={formatCount(metrics.completedBookingsCount)}
          helper="Closed events"
          accent
        />
      </div>

      {/* ── Financial / misc metrics ── */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Upcoming Events"
          value={formatCount(metrics.upcomingEventsCount)}
          helper="Next 15 days"
          accent
        />
        <MetricCard
          label="Revenue Collected"
          value={formatCurrency(metrics.collectedAmount)}
          helper="Successful payments"
          accent
        />
        <MetricCard
          label="Pending Balance"
          value={formatCurrency(metrics.pendingPaymentAmount)}
          helper="Awaiting payment"
          accent
        />
        <MetricCard
          label="Vendor Approvals"
          value={formatCount(metrics.pendingVendorApprovalsCount)}
          helper="Awaiting review"
          accent
        />
      </div>

      {/* ── Pending Actions + Overdue Alerts ── */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Pending Actions" subtitle="Approvals, messages & missing data">
          {pendingActions.length ? (
            <div className="space-y-2.5">
              {pendingActions.map(item => (
                <ActionItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending actions"
              body="No outstanding action items right now."
            />
          )}
        </Panel>

        <Panel title="Overdue Alerts" subtitle="Items needing immediate attention">
          {overdueAlerts.length ? (
            <div className="space-y-2.5">
              {overdueAlerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No overdue alerts"
              body="No overdue alerts in the current snapshot."
            />
          )}
        </Panel>
      </div>

      {/* ── Upcoming Events Table ── */}
      <Panel
        title="Upcoming Events"
        subtitle="Next 15 days"
        action={<TableTabs active={tab} onChange={setTab} />}
      >
        {filteredBookings.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left">
                  {TABLE_COLS.map(col => (
                    <th
                      key={col}
                      className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="bg-white">
                    <td className="rounded-l-xl px-3 py-3.5 text-sm text-gray-800">
                      {formatDate(booking.eventDate)}
                    </td>
                    <td className="px-3 py-3.5 text-sm font-semibold text-[#1C1C1C]">
                      {booking.event?.name || booking.package?.title || booking.id}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-500">
                      {booking.locationSummary || 'Venue pending'}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-800">
                      {booking.customer?.name || 'Customer'}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-gray-500">
                      {booking.package?.serviceCategories?.[0]?.name || 'General service'}
                    </td>
                    <td className="px-3 py-3.5 text-sm">
                      <StatusBadge
                        status={booking.vendorAssignments?.length ? 'confirmed' : 'pending'}
                        label={booking.vendorAssignments?.length ? 'Assigned' : 'Unassigned'}
                      />
                    </td>
                    <td className="rounded-r-xl px-3 py-3.5 text-sm">
                      <StatusBadge status={booking.status} label={booking.statusLabel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No events" body="No bookings match this filter." />
        )}
      </Panel>

      {/* ── Revenue Snapshot + System Health ── */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Revenue Snapshot" subtitle="Payment collection summary">
          <div className="grid grid-cols-2 gap-3">
            <RevenueCard
              label="Collected"
              value={formatCurrency(metrics.collectedAmount)}
              variant="good"
            />
            <RevenueCard
              label="Pending Balance"
              value={formatCurrency(metrics.pendingPaymentAmount)}
              variant="default"
            />
            <RevenueCard
              label="Failed Payments"
              value={formatCount(metrics.failedPaymentsCount)}
              variant="warn"
            />
            <RevenueCard
              label="Vendor Payouts Due"
              value={formatCurrency(metrics.pendingVendorPayoutAmount)}
              variant="default"
            />
          </div>
        </Panel>

        <Panel title="System Health" subtitle="Platform status indicators">
          {healthIndicators.length ? (
            <div className="grid grid-cols-2 gap-3">
              {healthIndicators.map(item => (
                <HealthCard key={item.label} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Health data unavailable"
              body="Health indicators will appear once the API returns them."
            />
          )}
        </Panel>
      </div>

    </div>
  )
}
