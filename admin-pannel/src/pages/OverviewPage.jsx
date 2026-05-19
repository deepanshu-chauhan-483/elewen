import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  SelectField,
} from '../components/ui/AdminUI'
import { useAdminOverview } from '../hooks/useAdminData'
import { formatCount, formatCurrency, formatDate } from '../lib/formatters'

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
const badgeClasses = {
  urgent: 'bg-[#FFF1F0] text-[#591902]',
  overdue: 'bg-[#FFF4E5] text-[#C07318]',
  pending: 'bg-[#EEF4FF] text-[#3061C6]',
  confirmed: 'bg-[#EAF8F1] text-[#238E64]',

  new: 'bg-[#EEF4FF] text-[#3061C6]',

  high: 'bg-[#FFF1F0] text-[#591902]',
  medium: 'bg-[#FFF4E5] text-[#C07318]',
  low: 'bg-[#F3F4F6] text-[#6B7280]',

  open: 'bg-[#F3F4F6] text-[#6B7280]',

  healthy: 'bg-[#EAF8F1] text-[#238E64]',
  warning: 'bg-[#FFF4E5] text-[#C07318]',
  error: 'bg-[#FFF1F0] text-[#591902]',
  in_progress: 'bg-[#FFF4E5] text-[#C07318]',
  success: 'text-[#238E64] bg-[#EAF8F1]',
  resolved: 'text-[#238E64] bg-[#EAF8F1]',
}

const getStatusKey = status => status?.toLowerCase()?.replace(/[\s-]+/g, '_') ?? ''
const getStatusBadgeClasses = status => {
  const key = getStatusKey(status)
  return {
    key,
    cls: badgeClasses[key] ?? 'bg-[#FFF4E5] text-[#C07318]',
  }
}

const getTextColorHex = cls => cls.match(/text-\[(#[0-9A-Fa-f]{3,8})\]/)?.[1] ?? null

function StatusBadge({ status, label }) {
  const { key, cls } = getStatusBadgeClasses(status)
  const text = label ?? (key.charAt(0).toUpperCase() + key.slice(1)) ?? '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] tracking-wide whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? '' : 'rotate-180'

  return (
    <svg
      className={`h-6 w-6 ${rotationClass}`}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
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
  good: 'border-l-[#238E64]',
  warn: 'border-l-[#591902]',
  default: 'border-l-[#3061C6]',
}
const revenueLabelVariants = {
  good: 'text-[#238E64]',
  warn: 'text-[#591902]',
  default: 'text-[#6B7280]',
}
const revenueValueVariants = {
  good: 'text-[#238E64]',
  warn: 'text-[#591902]',
  default: 'text-[#1F2937]',
}

function RevenueCard({ label, value, variant = 'default' }) {
  return (
    <div className={`rounded-xl border-l-[3px] p-4 ${revenueVariants[variant]}`}>
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
function HealthCard({ item }) {
  const { cls } = getStatusBadgeClasses(item.status)
  const borderColor = getTextColorHex(cls) ?? '#D1D5DB'
  return (
    <div
      className="rounded-xl border border-[#F0EBE3] border-l-[3px] bg-white p-4"
      style={{ borderLeftColor: borderColor }}
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
// TableFilter
// ---------------------------------------------------------------------------
const TABLE_TABS = ['all', 'confirmed', 'pending', 'new']

function TableFilter({ active, onChange }) {
  return (
    <div className="w-[160px]">
      <SelectField
        value={active}
        onChange={onChange}
        placeholder="Filter status"
        className="min-h-9 rounded-full border-[#E4DED8] bg-white py-2 text-xs font-semibold capitalize text-[#6B7280]"
      >
        {TABLE_TABS.map(tab => (
          <option key={tab} value={tab}>
            {tab === 'all' ? 'All' : tab}
          </option>
        ))}
      </SelectField>
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
const TABLE_PAGE_SIZE = 10

export default function OverviewPage() {
  const [tab, setTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const overviewQuery = useAdminOverview()
  const overview = overviewQuery.data ?? {}
  const metrics = overview.metrics ?? {}
  const pendingActions = overview.pendingActions ?? []
  const healthIndicators = overview.systemHealth ?? []
  const overdueAlerts = overview.overdueAlerts?.length
    ? overview.overdueAlerts
    : overview.alerts ?? []
  const upcomingBookings = overview.upcomingBookings ?? []

  const filteredBookings =
    tab === 'all'
      ? upcomingBookings
      : upcomingBookings.filter(b => b.status === tab)
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / TABLE_PAGE_SIZE))
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [tab])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if (overviewQuery.isLoading) {
    return <LoadingState label="Loading operational overview..." />
  }

  if (overviewQuery.error) {
    return <ErrorState label="Overview data could not be loaded right now." />
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl tracking-tight text-[#1C1C1C]">
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
        {/* <Link
          to="/alerts"
          className="inline-flex min-h-11 items-center rounded-[8px] bg-[#D4BA8E] px-4 text-sm font-medium text-[#FAFAFA] transition hover:bg-[#c7aa76]"
        >
          Review Alerts
        </Link> */}
      </div>

      {/* ── Booking metrics ── */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-5 lg:grid-cols-2">
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
        action={<TableFilter active={tab} onChange={setTab} />}
      >
        {filteredBookings.length ? (
          <div>
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
                  {paginatedBookings.map(booking => (
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

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowIcon direction="left" />
              </button>
              <div className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#6B7280]">
                {currentPage} / {totalPages}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowIcon direction="right" />
              </button>
            </div>
          </div>
        ) : (
          <EmptyState title="No events" body="No bookings match this filter." />
        )}
      </Panel>

      {/* ── Revenue Snapshot + System Health ── */}
      <div className="grid gap-5 lg:grid-cols-2">
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
