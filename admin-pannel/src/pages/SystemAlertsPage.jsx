import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ActionButton,
  ErrorState,
  LoadingState,
  ResultsEmptyState,
  SearchField,
  SectionLoadingState,
  SelectField,
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

function sentenceCase(value) {
  return String(value ?? '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function getEntityLabel(alert) {
  const type = sentenceCase(alert.relatedEntityType || 'System')
  return alert.relatedEntityId ? `${type} ${alert.relatedEntityId}` : type
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
  const type = String(alert.relatedEntityType ?? '').toLowerCase()
  if (type === 'booking') return '/bookings'
  if (type === 'payment') return '/payments'
  if (type === 'vendor') return '/vendors'
  return null
}

function SummaryCard({ label, value, helper, tone = 'neutral' }) {
  const toneClass =
    tone === 'danger'
      ? 'border-[#F1B7B7] bg-[#FFF3F3]'
      : tone === 'warning'
        ? 'border-[#F3D5B3] bg-[#FFF8ED]'
        : 'border-[#E4DED8] bg-white'

  return (
    <div className={`rounded-[8px] border px-5 py-4 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
        {label}
      </p>
      <p className="mt-2 text-[30px] leading-none text-[#1C1C1C]">{value}</p>
      <p className="mt-2 text-xs text-[#6B7280]">{helper}</p>
    </div>
  )
}

function AlertDetailPanel({ alert, onClose, onUpdate, isBusy, onNavigate }) {
  if (!alert) return null

  const route = getActionRoute(alert)
  const metadataEntries =
    alert.metadata && typeof alert.metadata === 'object'
      ? Object.entries(alert.metadata).filter(([, value]) => value !== null && value !== undefined)
      : []

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25" onClick={onClose}>
      <aside
        className="h-full w-full max-w-[520px] overflow-y-auto bg-[#FAFAFA] p-6 shadow-[-16px_0_40px_rgba(17,24,39,0.18)]"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
              Alert Detail
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#1C1C1C]">
              {sentenceCase(alert.alertType)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] border border-[#E4DED8] bg-white px-3 py-2 text-sm text-[#1C1C1C]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 rounded-[8px] border border-[#E4DED8] bg-white p-4">
          <p className="text-sm font-semibold text-[#1C1C1C]">{alert.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={alert.severity} />
            <StatusBadge status={alert.status} />
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
                <dd className="mt-1 text-[#1C1C1C]">{getEntityLabel(alert)}</dd>
              </div>
              <div>
                <dt className="text-[#8F8F8F]">Reason alert was triggered</dt>
                <dd className="mt-1 text-[#1C1C1C]">{getTriggerReason(alert)}</dd>
              </div>
              <div>
                <dt className="text-[#8F8F8F]">Created</dt>
                <dd className="mt-1 text-[#1C1C1C]">{formatDateTime(alert.createdAt)}</dd>
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
              <ActionButton tone="ghost" onClick={() => onNavigate(route)}>
                Go to {sentenceCase(alert.relatedEntityType)}
              </ActionButton>
            ) : null}
            {alert.status !== 'acknowledged' ? (
              <ActionButton
                tone="ghost"
                disabled={isBusy}
                onClick={() => onUpdate(alert.id, 'acknowledged')}
              >
                Mark acknowledged
              </ActionButton>
            ) : null}
            {alert.status !== 'snoozed' ? (
              <ActionButton
                tone="ghost"
                disabled={isBusy}
                onClick={() => onUpdate(alert.id, 'snoozed')}
              >
                Snooze
              </ActionButton>
            ) : null}
            {alert.status !== 'resolved' ? (
              <ActionButton
                tone="primary"
                disabled={isBusy}
                onClick={() => onUpdate(alert.id, 'resolved')}
              >
                Resolve alert
              </ActionButton>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default function SystemAlertsPage() {
  const navigate = useNavigate()
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
  const visiblePage = Math.min(currentPage, totalPages)

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

      <section className="rounded-[8px] border border-[#E4DED8] bg-[#F8F5F1] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <SearchField value={search} onChange={resetPage(setSearch)} placeholder="Search alerts" />
          <SelectField
            value={alertType}
            onChange={resetPage(setAlertType)}
            options={alertTypeOptions}
          />
          <SelectField value={severity} onChange={resetPage(setSeverity)}>
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </SelectField>
          <SelectField value={status} onChange={resetPage(setStatus)}>
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="snoozed">Snoozed</option>
            <option value="resolved">Resolved</option>
          </SelectField>
          <SelectField value={sortBy} onChange={resetPage(setSortBy)}>
            <option value="priority">Priority first</option>
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
          </SelectField>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6B7280]">
          <span className="font-semibold text-[#1C1C1C]">{totalAlerts}</span> alert
          {totalAlerts === 1 ? '' : 's'}
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            tone="ghost"
            disabled={!checkedIds.length || updateAlertMutation.isPending}
            onClick={() => handleBulkUpdate('acknowledged')}
          >
            Mark acknowledged
          </ActionButton>
          <ActionButton
            tone="primary"
            disabled={!checkedIds.length || updateAlertMutation.isPending}
            onClick={() => handleBulkUpdate('resolved')}
          >
            Resolve selected
          </ActionButton>
        </div>
      </div>

      {isResultsLoading ? (
        <SectionLoadingState label="Loading system alerts..." />
      ) : alerts.length ? (
        <div className="overflow-hidden rounded-[8px] border border-[#E4DED8] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left">
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
                    <td className="max-w-[320px] px-4 py-4 text-[#4B5563]">{alert.message}</td>
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
                      <ActionButton tone="ghost" onClick={() => setSelectedAlertId(alert.id)}>
                        Review
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[#F0EBE3] px-4 py-3">
            <ActionButton
              tone="ghost"
              disabled={visiblePage === 1}
              onClick={() => setCurrentPage(previous => Math.max(1, previous - 1))}
            >
              Previous
            </ActionButton>
            <span className="px-2 text-xs font-semibold text-[#6B7280]">
              {visiblePage} / {totalPages}
            </span>
            <ActionButton
              tone="ghost"
              disabled={visiblePage === totalPages}
              onClick={() => setCurrentPage(previous => Math.min(totalPages, previous + 1))}
            >
              Next
            </ActionButton>
          </div>
        </div>
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
        onNavigate={route => navigate(route)}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
