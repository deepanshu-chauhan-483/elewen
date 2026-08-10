import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  SectionLoadingState,
  CustomSelect,
  StatusBadge,
} from '../components/ui/AdminUI'
import { useAdminAlerts, useAdminUpdateAlert } from '../hooks/useAdminData'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { formatDateTime } from '../lib/formatters'

const PAGE_SIZE = 10

const severityRank = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const alertTypeOptions = [
  { value: '', label: 'All alert types' },
  { value: 'failed_payment', label: 'Payment failed' },
  { value: 'refund_requested', label: 'Refund requested' },
  { value: 'refund_failed', label: 'Refund failed' },
  { value: 'booking_cancelled', label: 'Booking cancelled' },
  { value: 'vendor_unassigned', label: 'Vendor unassigned' },
  { value: 'overdue_action', label: 'Overdue action' },
  { value: 'system_health', label: 'System health' },
]

function SearchIcon() {
  return (
    <svg
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
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

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] hover:bg-[#C6AB7F] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center px-5 text-sm rounded-full border border-[#CDB17E] bg-[#FFFFFF] hover:bg-[#FAF6F1] text-[#CDB17E] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
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
        {Math.min(currentPage, totalPages)} / {totalPages}
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

function AlertCard({ alert, checked, onToggleCheck, onReview }) {
  return (
    <article className="rounded-2xl border border-[#E4DED8] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleCheck}
          className="mt-1 shrink-0"
          aria-label={`Select ${sentenceCase(alert.alertType)} alert`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold leading-tight text-[#1C1C1C]">
              {sentenceCase(alert.alertType)}
            </h3>
            <StatusBadge status={alert.severity} />
            <StatusBadge status={alert.status} />
          </div>
          <p className="mt-1 text-xs text-[#8F8F8F]">{getEntityLabel(alert)}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{getDisplayMessage(alert)}</p>
          <div className="mt-3 text-xs text-[#8F8F8F]">
            <p>{formatDateTime(alert.createdAt)}</p>
            <p className="mt-0.5">{getAgeLabel(alert.createdAt)}</p>
          </div>
          <div className="mt-4">
            <PrimaryBtn onClick={onReview}>Review</PrimaryBtn>
          </div>
        </div>
      </div>
    </article>
  )
}

function sentenceCase(value) {
  return String(value ?? '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function formatShortEntityId(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const compact = raw.replace(/^#/, '')
  return `#${compact.slice(0, 8).toUpperCase()}`
}

function getAlertMetadata(alert) {
  return alert?.metadata && typeof alert.metadata === 'object' ? alert.metadata : {}
}

/** Prefer bookingId from metadata so payment/refund alerts still show the booking. */
function getAlertBookingId(alert) {
  const metadata = getAlertMetadata(alert)
  if (metadata.bookingId != null && String(metadata.bookingId).trim()) {
    return String(metadata.bookingId).trim()
  }
  if (String(alert?.relatedEntityType ?? '').toLowerCase() === 'booking' && alert?.relatedEntityId) {
    return String(alert.relatedEntityId).trim()
  }
  return ''
}

function getEntityLabel(alert) {
  const bookingId = getAlertBookingId(alert)
  if (bookingId) return `Booking ${formatShortEntityId(bookingId)}`

  const type = sentenceCase(alert.relatedEntityType || 'System')
  if (!alert.relatedEntityId) return type
  return `${type} ${formatShortEntityId(alert.relatedEntityId)}`
}

function getDisplayMessage(alert) {
  let message = String(alert?.message ?? '')
  if (!message) return ''

  const bookingId = getAlertBookingId(alert)
  if (bookingId) {
    message = message.split(bookingId).join(formatShortEntityId(bookingId))
  }

  const relatedId = String(alert?.relatedEntityId ?? '').trim()
  if (relatedId && relatedId !== bookingId) {
    message = message.split(relatedId).join(formatShortEntityId(relatedId))
  }

  const metadata = getAlertMetadata(alert)
  for (const key of ['paymentId', 'refundId']) {
    const value = metadata[key] != null ? String(metadata[key]).trim() : ''
    if (value) message = message.split(value).join(formatShortEntityId(value))
  }

  return message
}

function getAgeLabel(createdAt) {
  const created = new Date(createdAt).getTime()
  if (!Number.isFinite(created)) return 'Unknown age'

  const diffHours = Math.max(0, Math.floor((Date.now() - created) / 36e5))
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h old`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d old`
}

function getTriggerReason(alert) {
  const metadata = alert.metadata && typeof alert.metadata === 'object' ? alert.metadata : {}
  if (metadata.reason) return metadata.reason
  if (metadata.errorDescription) return metadata.errorDescription
  if (alert.alertType === 'failed_payment') return 'Payment gateway reported a failed payment'
  if (alert.alertType === 'vendor_unassigned') return 'Booking still needs vendor assignment'
  if (alert.alertType === 'booking_cancelled') return 'Customer or admin cancelled the booking'
  if (alert.alertType === 'refund_requested') return 'Refund is waiting for admin review'
  return 'Created by the alert workflow'
}

function getActionRoute(alert) {
  const type = String(alert.relatedEntityType ?? '')
    .toLowerCase()
    .trim()
  const alertType = String(alert.alertType ?? '')
    .toLowerCase()
    .trim()
  const metadata = alert.metadata && typeof alert.metadata === 'object' ? alert.metadata : {}
  const bookingId =
    metadata.bookingId != null && String(metadata.bookingId).trim()
      ? String(metadata.bookingId).trim()
      : type === 'booking' && alert.relatedEntityId
        ? String(alert.relatedEntityId)
        : ''

  if (type === 'booking' || ['booking_cancelled', 'vendor_unassigned'].includes(alertType)) {
    return bookingId
      ? `/bookings?open=${encodeURIComponent(bookingId)}&bucket=live`
      : '/bookings'
  }

  if (type === 'payment' || alertType.includes('payment') || alertType.includes('refund')) {
    if (alertType.includes('refund')) return '/payments?section=refunds'
    if (alertType === 'failed_payment') return '/payments?section=customer&tab=failed'
    return '/payments?section=customer'
  }

  if (type === 'vendor') return '/vendors'
  return null
}

function getActionLabel(alert) {
  const type = String(alert.relatedEntityType ?? '')
    .toLowerCase()
    .trim()
  const alertType = String(alert.alertType ?? '')
    .toLowerCase()
    .trim()
  if (type === 'payment' || alertType.includes('payment') || alertType.includes('refund')) {
    return 'Payment'
  }
  if (type === 'vendor') return 'Vendor'
  if (type === 'booking' || ['booking_cancelled', 'vendor_unassigned'].includes(alertType)) {
    return 'Booking'
  }
  return sentenceCase(alert.relatedEntityType || 'Details')
}

// function SummaryCard({ label, value, helper, tone = 'neutral' }) {
//   const toneClass =
//     tone === 'danger'
//       ? 'border-[#F1B7B7] bg-[#FFF3F3]'
//       : tone === 'warning'
//         ? 'border-[#F3D5B3] bg-[#FFF8ED]'
//         : 'border-[#E4DED8] bg-white'

//   return (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         strokeWidth="2.5"
//         d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
//       />
//     </svg>
//   )
// }

// function SummaryCard({ label, value, helper, tone = 'neutral' }) {
//   const toneClass =
//     tone === 'danger'
//       ? 'border-[#F1B7B7] bg-[#FFF3F3]'
//       : tone === 'warning'
//         ? 'border-[#F3D5B3] bg-[#FFF8ED]'
//         : 'border-[#E4DED8] bg-white'

//   return (
//     <div className={`rounded-[8px] border px-5 py-4 ${toneClass}`}>
//       <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
//         {label}
//       </p>
//       <p className="mt-2 text-[30px] leading-none text-[#1C1C1C]">{value}</p>
//       <p className="mt-2 text-xs text-[#6B7280]">{helper}</p>
//     </div>
//   )
// }

function SummaryCard({ label, value, helper }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border-t-[3px] border-t-[#D4BA8E] bg-white px-5 py-5">
      <span className="text-[11px] uppercase tracking-widest text-[#8F8F8F]">{label}</span>
      <span className="text-[26px] font-semibold leading-none text-[#1C1C1C]">{value}</span>
      <span className="text-xs text-[#6B7280]">{helper}</span>
    </div>
  )
}

function AlertDetailPanel({ alert, onClose, onUpdate, isBusy }) {
  const [renderedAlert, setRenderedAlert] = useState(alert)
  const [isPanelVisible, setIsPanelVisible] = useState(false)

  useEffect(() => {
    if (alert) {
      const frameId = requestAnimationFrame(() => {
        setRenderedAlert(alert)
        setIsPanelVisible(true)
      })
      return () => cancelAnimationFrame(frameId)
    }

    const frameId = requestAnimationFrame(() => setIsPanelVisible(false))
    const timeoutId = setTimeout(() => setRenderedAlert(null), 300)
    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timeoutId)
    }
  }, [alert])

  if (!renderedAlert) return null

  const route = getActionRoute(renderedAlert)
  const metadataEntries =
    renderedAlert.metadata && typeof renderedAlert.metadata === 'object'
      ? Object.entries(renderedAlert.metadata).filter(
          ([, value]) => value !== null && value !== undefined
        )
      : []

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black/25 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isPanelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
    >
      <aside
        className={`h-full w-full max-w-[520px] overflow-y-auto bg-[#FAFAFA] p-6 shadow-[-16px_0_40px_rgba(17,24,39,0.18)] hide-scrollbar transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isPanelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
              Alert Detail
            </p>
            <h2 className="mt-2 text-xl text-[#1C1C1C]">{sentenceCase(renderedAlert.alertType)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#957960] transition hover:bg-[#F3EEE8] p-2"
            aria-label="Close alerts popup"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="#1C1C1C"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-6 rounded-[8px] border border-[#E4DED8] bg-white p-4">
          <p className="text-sm font-semibold text-[#1C1C1C]">{getDisplayMessage(renderedAlert)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={renderedAlert.severity} />
            <StatusBadge status={renderedAlert.status} />
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="rounded-[8px] border border-[#E4DED8] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
              Context Summary
            </p>
            <dl className="mt-3 grid gap-3 text-sm">
              <div>
                <dt className="text-[#8F8F8F]">Related item</dt>
                <dd className="mt-1 text-[#1C1C1C]">{getEntityLabel(renderedAlert)}</dd>
              </div>
              <div>
                <dt className="text-[#8F8F8F]">Reason alert was triggered</dt>
                <dd className="mt-1 text-[#1C1C1C]">{getTriggerReason(renderedAlert)}</dd>
              </div>
              <div>
                <dt className="text-[#8F8F8F]">Created</dt>
                <dd className="mt-1 text-[#1C1C1C]">{formatDateTime(renderedAlert.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {metadataEntries.length ? (
            <div className="rounded-[8px] border border-[#E4DED8] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
                Alert Metadata
              </p>
              <dl className="mt-3 grid gap-2 text-sm">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="grid gap-1 sm:grid-cols-[140px_1fr]">
                    <dt className="text-[#8F8F8F]">{sentenceCase(key)}</dt>
                    <dd className="break-words text-[#1C1C1C]">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-[8px] border border-[#E4DED8] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
            Admin Action
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {route ? (
              <Link
                to={route}
                onClick={event => {
                  event.stopPropagation()
                  onClose()
                }}
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#CDB17E] bg-[#FFFFFF] px-5 text-sm text-[#CDB17E] hover:bg-[#FAF6F1]"
              >
                Go to {getActionLabel(renderedAlert)}
              </Link>
            ) : null}
            {renderedAlert.status !== 'acknowledged' ? (
              <GhostBtn
                disabled={isBusy}
                onClick={() => onUpdate(renderedAlert.id, 'acknowledged')}
              >
                Mark acknowledged
              </GhostBtn>
            ) : null}
            {renderedAlert.status !== 'snoozed' ? (
              <GhostBtn
                tone="ghost"
                disabled={isBusy}
                onClick={() => onUpdate(renderedAlert.id, 'snoozed')}
              >
                Snooze
              </GhostBtn>
            ) : null}
            {renderedAlert.status !== 'resolved' ? (
              <PrimaryBtn
                tone="primary"
                disabled={isBusy}
                onClick={() => onUpdate(renderedAlert.id, 'resolved')}
              >
                Resolve alert
              </PrimaryBtn>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default function SystemAlertsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [alertType, setAlertType] = useState('')
  const [sortBy, setSortBy] = useState('priority')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAlertId, setSelectedAlertId] = useState(null)
  const [checkedIds, setCheckedIds] = useState([])
  const debouncedSearch = useDebouncedValue(search)

  const alertsQuery = useAdminAlerts({
    search: debouncedSearch,
    status,
    severity,
    alertType,
    sortBy: sortBy === 'oldest' ? 'oldest' : 'latest',
    page: currentPage,
    limit: PAGE_SIZE,
  })
  const updateAlertMutation = useAdminUpdateAlert()

  const alerts = useMemo(() => {
    const rows = alertsQuery.data?.alerts ?? []
    if (sortBy !== 'priority') return rows

    return [...rows].sort((left, right) => {
      const rightRank = severityRank[String(right.severity ?? '').toLowerCase()] ?? 0
      const leftRank = severityRank[String(left.severity ?? '').toLowerCase()] ?? 0
      return rightRank - leftRank || new Date(left.createdAt) - new Date(right.createdAt)
    })
  }, [alertsQuery.data?.alerts, sortBy])

  const selectedAlert = alerts.find(alert => alert.id === selectedAlertId) ?? null
  const summary = alertsQuery.data?.summary ?? {}
  const totalAlerts = Number(alertsQuery.data?.total ?? 0)
  const totalPages = Math.max(1, Number(alertsQuery.data?.pages ?? 1))

  useScrollToTop(currentPage)
  const isResultsLoading = alertsQuery.isFetching && !alertsQuery.isLoading
  const allVisibleChecked =
    alerts.length > 0 && alerts.every(alert => checkedIds.includes(alert.id))

  const resetPage = setter => value => {
    setter(value)
    setCurrentPage(1)
    setCheckedIds([])
  }

  const handleUpdate = async (alertId, newStatus) => {
    await updateAlertMutation.mutateAsync({ alertId, body: { status: newStatus } })
  }

  const handleBulkUpdate = async newStatus => {
    await Promise.all(
      checkedIds.map(alertId =>
        updateAlertMutation.mutateAsync({ alertId, body: { status: newStatus } })
      )
    )
    setCheckedIds([])
  }
  const toggleAllVisible = () => {
    setCheckedIds(current =>
      allVisibleChecked
        ? current.filter(id => !alerts.some(alert => alert.id === id))
        : [...new Set([...current, ...alerts.map(alert => alert.id)])]
    )
  }

  if (alertsQuery.isLoading) return <LoadingState label="Loading system alerts..." />
  if (alertsQuery.error) return <ErrorState label="System alerts are unavailable right now." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
          Operational Checklist
        </p>
        <h1 className="text-2xl text-[#1C1C1C]">System Alerts</h1>
        <p className="max-w-3xl text-sm text-[#6B7280]">
          Quick urgency check for failed payments, booking gaps, vendor issues, and system events
          that need admin review.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="High Priority"
          value={String(summary.highPriority ?? summary.critical ?? 0)}
          helper="Critical or high unresolved alerts"
          tone="danger"
        />
        <SummaryCard
          label="Pending Attention"
          value={String(summary.pendingAttention ?? summary.unresolved ?? 0)}
          helper="Open alerts that need review"
          tone="warning"
        />
        <SummaryCard
          label="Informational"
          value={String(summary.informational ?? 0)}
          helper="Low severity or already resolved"
        />
      </div>

      <section className="rounded-2xl border border-[#E4DED8] bg-[#FAFAFA] p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#767676]">
          Filter Alerts
        </p>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <label className="flex w-full items-center gap-2.5 rounded-full bg-[#F5F5F5] px-2.5 py-1.5 text-[#A19B94] border border-[#D9D2CB]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8B1A8] text-[#FAFAFA]">
              <span className="h-3.5 w-3.5">
                <SearchIcon />
              </span>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search"
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#A19B94] focus:outline-none"
            />
          </label>
          <CustomSelect
            value={alertType}
            onChange={resetPage(setAlertType)}
            options={alertTypeOptions}
          />
          <CustomSelect value={severity} onChange={resetPage(setSeverity)}>
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </CustomSelect>
          <CustomSelect value={status} onChange={resetPage(setStatus)}>
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="snoozed">Snoozed</option>
            <option value="resolved">Resolved</option>
          </CustomSelect>
          <CustomSelect value={sortBy} onChange={resetPage(setSortBy)}>
            <option value="priority">Priority first</option>
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
          </CustomSelect>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6B7280]">
          <span className="font-semibold text-[#1C1C1C]">{totalAlerts}</span> alert
          {totalAlerts === 1 ? '' : 's'}
        </div>
        <div className="flex flex-wrap gap-2">
          <GhostBtn
            disabled={!checkedIds.length || updateAlertMutation.isPending}
            onClick={() => handleBulkUpdate('acknowledged')}
          >
            Mark acknowledged
          </GhostBtn>
          <PrimaryBtn
            disabled={!checkedIds.length || updateAlertMutation.isPending}
            onClick={() => handleBulkUpdate('resolved')}
          >
            Resolve selected
          </PrimaryBtn>
        </div>
      </div>

      {isResultsLoading ? (
        <SectionLoadingState label="Loading system alerts..." />
      ) : alerts.length ? (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[8px] border border-[#E4DED8] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#F3F3F3] text-[11px] uppercase tracking-[0.16em] text-[#8F8F8F]">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleChecked}
                        onChange={toggleAllVisible}
                      />
                    </th>
                    <th className="px-4 py-3">Alert Type</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Related To</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE3] text-sm">
                  {alerts.map(alert => (
                    <tr key={alert.id} className="align-top transition hover:bg-[#FBF7F3]">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={checkedIds.includes(alert.id)}
                          onChange={() =>
                            setCheckedIds(current =>
                              current.includes(alert.id)
                                ? current.filter(id => id !== alert.id)
                                : [...current, alert.id]
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#1C1C1C]">
                        {sentenceCase(alert.alertType)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={alert.severity} />
                      </td>
                      <td className="px-4 py-4 text-[#4B5563]">{getEntityLabel(alert)}</td>
                      <td className="max-w-[320px] px-4 py-4 text-[#4B5563]">
                        {getDisplayMessage(alert)}
                      </td>
                      <td className="px-4 py-4 text-[#4B5563]">
                        <div>{formatDateTime(alert.createdAt)}</div>
                        <div className="mt-1 text-xs text-[#8F8F8F]">
                          {getAgeLabel(alert.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={alert.status} />
                      </td>
                      <td className="px-4 py-4">
                        <PrimaryBtn onClick={() => setSelectedAlertId(alert.id)}>Review</PrimaryBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            <div className="flex items-center gap-2 rounded-[8px] border border-[#E4DED8] bg-[#F3F3F3] px-4 py-3">
              <input
                type="checkbox"
                checked={allVisibleChecked}
                onChange={toggleAllVisible}
                aria-label="Select all alerts on this page"
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8F8F8F]">
                Select all on page
              </span>
            </div>

            {alerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                checked={checkedIds.includes(alert.id)}
                onToggleCheck={() =>
                  setCheckedIds(current =>
                    current.includes(alert.id)
                      ? current.filter(id => id !== alert.id)
                      : [...current, alert.id]
                  )
                }
                onReview={() => setSelectedAlertId(alert.id)}
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
        <ResultsEmptyState
          title="No alerts found"
          body="The alert feed is clear for the current filters."
        />
      )}

      <AlertDetailPanel
        alert={selectedAlert}
        isBusy={updateAlertMutation.isPending}
        onClose={() => setSelectedAlertId(null)}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
