import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  CustomSelect,
} from '../components/ui/AdminUI'
import { useAdminOverview } from '../hooks/useAdminData'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { getAdminBadgeMeta } from '../lib/adminBadges'
import { formatCount, formatCurrency, formatDate } from '../lib/formatters'

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
const getStatusBadgeClasses = status => {
  const { key, className } = getAdminBadgeMeta(status, { preset: 'soft' })
  return {
    key,
    cls: className,
  }
}

const getTextColorHex = cls => cls.match(/text-\[(#[0-9A-Fa-f]{3,8})\]/)?.[1] ?? null

function StatusBadge({ status, label }) {
  const { key, cls } = getStatusBadgeClasses(status)
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '-'
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

function ClickableContainer({ children, onClick, className = '', style }) {
  if (!onClick) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      className={`${className} cursor-pointer text-left transition hover:border-[#D4BA8E]`}
      style={style}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------
function MetricCard({ label, value, helper, accent = false, onClick }) {
  return (
    <ClickableContainer
      onClick={onClick}
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
    </ClickableContainer>
  )
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------
function Panel({ title, subtitle, children, action, onClick }) {
  return (
    <ClickableContainer
      onClick={onClick}
      className="rounded-[20px] border border-[#F0EBE3] bg-[#FAFAF8] p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base text-[#1C1C1C]">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] text-gray-400">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </ClickableContainer>
  )
}

// ---------------------------------------------------------------------------
// ActionItem
// ---------------------------------------------------------------------------
function ActionItem({ item, onClick }) {
  return (
    <ClickableContainer
      onClick={onClick}
      className="flex items-start justify-between gap-3 rounded-xl border border-[#F0EBE3] bg-white px-4 py-3.5"
    >
      <div className="flex-1">
        <p className="text-sm text-[#1C1C1C]">{item.title}</p>
        <p className="mt-1 text-[13px] text-gray-500">{item.detail}</p>
      </div>
      <StatusBadge status={item.status} />
    </ClickableContainer>
  )
}

// ---------------------------------------------------------------------------
// AlertItem
// ---------------------------------------------------------------------------
function AlertItem({ alert, onClick }) {
  return (
    <ClickableContainer
      onClick={onClick}
      className="flex items-start justify-between gap-3 rounded-xl border border-[#F0EBE3] bg-white px-4 py-3.5"
    >
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
    </ClickableContainer>
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

function RevenueCard({ label, value, variant = 'default', onClick }) {
  return (
    <ClickableContainer
      onClick={onClick}
      className={`rounded-xl border-l-[3px] p-4 ${revenueVariants[variant]}`}
    >
      <p
        className={`text-[11px] font-normal uppercase tracking-widest ${revenueLabelVariants[variant]}`}
      >
        {label}
      </p>
      <p className={`mt-2 text-[22px] font-semibold leading-none ${revenueValueVariants[variant]}`}>
        {value}
      </p>
    </ClickableContainer>
  )
}

// ---------------------------------------------------------------------------
// HealthCard
// ---------------------------------------------------------------------------
function HealthCard({ item, onClick }) {
  const { cls } = getStatusBadgeClasses(item.status)
  const borderColor = getTextColorHex(cls) ?? '#D1D5DB'
  return (
    <ClickableContainer
      onClick={onClick}
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
    </ClickableContainer>
  )
}

// ---------------------------------------------------------------------------
// TableFilter
// ---------------------------------------------------------------------------
const TABLE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'new', label: 'New' },
  { key: 'cancelled_by_customer', label: 'Cancel new / in process' },
]

function TableFilter({ active, onChange }) {
  return (
    <div className="w-full sm:w-[160px]">
      <CustomSelect
        value={active}
        onChange={onChange}
        placeholder="Filter status"
        className="min-h-9 rounded-full border-[#E4DED8] bg-white py-2 text-xs font-semibold capitalize text-[#6B7280]"
      >
        {TABLE_TABS.map(tab => (
          <option key={tab.key} value={tab.key}>
            {tab.label}
          </option>
        ))}
      </CustomSelect>
    </div>
  )
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  const visiblePage = Math.min(currentPage, totalPages)

  return (
    <div className="flex items-center justify-end gap-2 border-t border-[#F0EBE3] px-4 py-3">
      <button
        type="button"
        onClick={() => onPageChange(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowIcon direction="left" />
      </button>
      <div className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1C]">
        {visiblePage} / {totalPages}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowIcon direction="right" />
      </button>
    </div>
  )
}

function UpcomingEventCard({ booking, onClick }) {
  const eventTitle = booking.event?.name || booking.package?.title || booking.id
  const vendorAssigned = Boolean(booking.vendorAssignments?.length)

  return (
    <article
      className={`rounded-2xl border border-[#E4DED8] bg-white p-4 shadow-sm${
        onClick ? ' cursor-pointer transition hover:border-[#D4BA8E]' : ''
      }`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            {formatDate(booking.eventDate)}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold leading-tight text-[#1C1C1C]">
            {eventTitle}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge
            status={vendorAssigned ? 'confirmed' : 'pending'}
            label={vendorAssigned ? 'Assigned' : 'Unassigned'}
          />
          <StatusBadge status={booking.status} label={booking.statusLabel} />
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-gray-400">Location</dt>
          <dd className="text-right text-[#4B5563]">
            {booking.locationSummary || 'Venue pending'}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-400">Customer</dt>
          <dd className="text-right text-[#1C1C1C]">{booking.customer?.name || 'Customer'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-400">Service</dt>
          <dd className="text-right text-[#4B5563]">
            {booking.package?.serviceCategories?.[0]?.name || 'General service'}
          </dd>
        </div>
      </dl>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const TABLE_COLS = [
  'Event Date',
  'Event Type',
  'Location',
  'Customer',
  'Service',
  'Vendor',
  'Status',
]
const TABLE_PAGE_SIZE = 10

const getPendingActionRoute = itemId => {
  switch (itemId) {
    case 'bookings-needing-attention':
      return '/bookings?status=new'
    case 'vendor-pending':
      return '/vendors'
    case 'support-queue':
      return '/support'
    default:
      return ''
  }
}

const getBookingOverviewRoute = metricKey => {
  switch (metricKey) {
    case 'total':
      return '/bookings?bucket=all'
    case 'today':
      return '/bookings?bucket=today'
    case 'live':
      return '/bookings?bucket=live'
    case 'completed':
      return '/bookings?bucket=completed'
    case 'upcoming':
      return '/bookings?bucket=upcoming'
    case 'cancelled':
      return '/bookings?bucket=cancelled'
    default:
      return '/bookings?bucket=all'
  }
}

const getBookingDetailRoute = bookingId =>
  `/bookings?bucket=cancelled&open=${encodeURIComponent(bookingId)}`

const getHealthRoute = label => {
  switch (label) {
    case 'Platform status':
      return '/alerts'
    case 'Payment gateway':
      return '/payments'
    case 'Notification service':
      return '/support'
    case 'Bookings per day':
      return '/bookings'
    default:
      return ''
  }
}

export default function OverviewPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const overviewQuery = useAdminOverview()
  const overview = overviewQuery.data ?? {}
  const metrics = overview.metrics ?? {}
  const pendingActions = overview.pendingActions ?? []
  const healthIndicators = overview.systemHealth ?? []
  const overdueAlerts = overview.overdueAlerts?.length
    ? overview.overdueAlerts
    : (overview.alerts ?? [])
  const upcomingBookings = overview.upcomingBookings ?? []
  const customerCancelledBookings = overview.customerCancelledBookings ?? []

  const filteredBookings =
    tab === 'cancelled_by_customer'
      ? customerCancelledBookings
      : tab === 'all'
        ? upcomingBookings
        : upcomingBookings.filter(b => b.status === tab)
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / TABLE_PAGE_SIZE))
  const visiblePage = Math.min(currentPage, totalPages)
  const paginatedBookings = filteredBookings.slice(
    (visiblePage - 1) * TABLE_PAGE_SIZE,
    visiblePage * TABLE_PAGE_SIZE
  )

  useScrollToTop(currentPage)

  if (overviewQuery.isLoading) {
    return <LoadingState label="Loading operational overview..." />
  }

  if (overviewQuery.error) {
    return <ErrorState label="Overview data could not be loaded right now." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl tracking-tight text-[#1C1C1C]">Overview</h1>
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
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Today's booking"
          value={formatCount(metrics.todayBookingsCount)}
          helper="Events today"
          accent
          onClick={() => navigate(getBookingOverviewRoute('today'))}
        />
        <MetricCard
          label="Live booking"
          value={formatCount(metrics.activeBookingsCount)}
          helper="Live / in progress"
          accent
          onClick={() => navigate(getBookingOverviewRoute('live'))}
        />
        <MetricCard
          label="Completed"
          value={formatCount(metrics.completedBookingsCount)}
          helper="Closed events"
          accent
          onClick={() => navigate(getBookingOverviewRoute('completed'))}
        />
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Upcoming Events"
          value={formatCount(metrics.upcomingEventsCount)}
          helper="Next 15 days · advance paid"
          accent
          onClick={() => navigate(getBookingOverviewRoute('upcoming'))}
        />
        <MetricCard
          label="Revenue Collected"
          value={formatCurrency(metrics.collectedAmount)}
          helper="Successful payments"
          accent
          onClick={() => navigate('/payments')}
        />
        <MetricCard
          label="Pending Balance"
          value={formatCurrency(metrics.pendingPaymentAmount)}
          helper="Awaiting payment"
          accent
          onClick={() => navigate('/payments')}
        />
        <MetricCard
          label="Cancelled booking"
          value={formatCount(metrics.cancelledBookingsCount)}
          helper="Advance paid, then cancelled"
          accent
          onClick={() => navigate(getBookingOverviewRoute('cancelled'))}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Pending Actions" subtitle="Approvals, messages & missing data">
          {pendingActions.length ? (
            <div className="space-y-2.5">
              {pendingActions.map(item => (
                <ActionItem
                  key={item.id}
                  item={item}
                  onClick={() => {
                    const route = getPendingActionRoute(item.id)
                    if (route) navigate(route)
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No pending actions" body="No outstanding action items right now." />
          )}
        </Panel>

        <Panel
          title="Overdue Alerts"
          subtitle="Items needing immediate attention"
          onClick={() => navigate('/alerts')}
        >
          {overdueAlerts.length ? (
            <div className="space-y-2.5">
              {overdueAlerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} onClick={() => navigate('/alerts')} />
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

      <Panel
        title="Upcoming Events"
        subtitle="Next 15 days · advance paid"
        action={
          <TableFilter
            active={tab}
            onChange={value => {
              setTab(value)
              setCurrentPage(1)
            }}
          />
        }
      >
        {filteredBookings.length ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full border-separate border-spacing-y-2">
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
                  {paginatedBookings.map(booking => {
                    const isCancelledTab = tab === 'cancelled_by_customer'
                    const openCancelled = () => navigate(getBookingDetailRoute(booking.id))
                    return (
                      <tr
                        key={booking.id}
                        className={`bg-white${isCancelledTab ? ' cursor-pointer transition hover:bg-[#FBF8F3]' : ''}`}
                        onClick={isCancelledTab ? openCancelled : undefined}
                        onKeyDown={
                          isCancelledTab
                            ? event => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  openCancelled()
                                }
                              }
                            : undefined
                        }
                        role={isCancelledTab ? 'button' : undefined}
                        tabIndex={isCancelledTab ? 0 : undefined}
                      >
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
                    )
                  })}
                </tbody>
              </table>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {paginatedBookings.map(booking => (
                <UpcomingEventCard
                  key={booking.id}
                  booking={booking}
                  onClick={
                    tab === 'cancelled_by_customer'
                      ? () => navigate(getBookingDetailRoute(booking.id))
                      : undefined
                  }
                />
              ))}
              <div className="overflow-hidden rounded-[8px] border border-[#E4DED8] bg-white">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </>
        ) : (
          <ResultsEmptyState title="No events" body="No bookings match this filter." />
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Revenue Snapshot"
          subtitle="Payment collection summary"
          onClick={() => navigate('/payments')}
        >
          <div className="grid grid-cols-2 gap-3">
            <RevenueCard
              label="Collected"
              value={formatCurrency(metrics.collectedAmount)}
              variant="good"
              onClick={() => navigate('/payments')}
            />
            <RevenueCard
              label="Pending Balance"
              value={formatCurrency(metrics.pendingPaymentAmount)}
              variant="default"
              onClick={() => navigate('/payments')}
            />
            <RevenueCard
              label="Failed Payments"
              value={formatCount(metrics.failedPaymentsCount)}
              variant="warn"
              onClick={() => navigate('/payments')}
            />
            <RevenueCard
              label="Vendor Payouts Due"
              value={formatCurrency(metrics.pendingVendorPayoutAmount)}
              variant="default"
              onClick={() => navigate('/payments')}
            />
          </div>
        </Panel>

        <Panel title="System Health" subtitle="Platform status indicators">
          {healthIndicators.length ? (
            <div className="grid grid-cols-2 gap-3">
              {healthIndicators.map(item => (
                <HealthCard
                  key={item.label}
                  item={item}
                  onClick={() => {
                    const route = getHealthRoute(item.label)
                    if (route) navigate(route)
                  }}
                />
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
