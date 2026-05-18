import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState, SelectField } from '../components/ui/AdminUI'
import { useAdminAlerts, useAdminUpdateAlert } from '../hooks/useAdminData'
import { formatDateTime } from '../lib/formatters'

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const severityBadge = {
  low:      'bg-[#E5E7EB] text-[#4B5563]',
  medium:   'bg-[#FCE7CF] text-[#C57A1E]',
  high:     'bg-[#FFF3F3] text-[#8A1C1C]',
  critical: 'bg-[#8A1C1C] text-white',
}

const statusBadge = {
  new:          'bg-[#DBEAFE] text-[#0383E4]',
  acknowledged: 'bg-[#FCE7CF] text-[#C57A1E]',
  snoozed:      'bg-[#E5E7EB] text-[#4B5563]',
  resolved:     'bg-[#DDF7E5] text-[#16A34A]',
}

// Left border accent per severity
const severityBorder = {
  low:      'border-l-gray-300',
  medium:   'border-l-amber-400',
  high:     'border-l-red-400',
  critical: 'border-l-red-700',
}

// Severity dot colour
const severityDot = {
  low:      'bg-gray-400',
  medium:   'bg-amber-400',
  high:     'bg-red-400',
  critical: 'bg-red-700',
}

function Badge({ status, map, fallback = 'bg-[#E5E7EB] text-[#4B5563]' }) {
  const key = status?.toLowerCase() ?? ''
  const cls = (map ?? {})[key] ?? fallback
  const text = key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}>
      {text}
    </span>
  )
}

function MetricCard({ label, value, helper, accent }) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border bg-white px-5 py-5 ${accent ? 'border-t-[3px] border-t-[#D4BA8E] border-[#E4DED8]' : 'border-[#E4DED8]'}`}>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8F8F8F]">{label}</span>
      <span className="text-[28px] font-bold leading-none text-[#1C1C1C]">{value}</span>
      <span className="text-xs text-[#6B7280]">{helper}</span>
    </div>
  )
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition"
    >
      {children}
    </select>
  )
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center justify-center rounded-full border border-[#E4DED8] bg-white px-4 text-sm font-semibold text-[#591902] transition hover:bg-[#F4EFE5] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center justify-center rounded-full bg-[#CDB17E] px-4 text-sm font-semibold text-[#FAFAFA] transition hover:bg-[#C6A15B] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

// Search icon
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  )
}

// Bell icon for empty state
function BellIcon() {
  return (
    <svg className="mx-auto mb-3 h-10 w-10 text-[#D4BA8E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Alert card
// ---------------------------------------------------------------------------
function AlertCard({ alert, onUpdate, isBusy }) {
  const sev    = alert.severity?.toLowerCase() ?? 'low'
  const st     = alert.status?.toLowerCase() ?? 'new'
  const border = severityBorder[sev] ?? 'border-l-gray-300'
  const dot    = severityDot[sev] ?? 'bg-gray-400'
  const resolved = st === 'resolved'

  return (
    <div className={`rounded-2xl border border-[#E4DED8] border-l-[3px] bg-white px-5 py-4 transition hover:shadow-[0_2px_12px_rgba(62,39,35,0.07)] ${border}`}>

      {/* Top row — message + badges */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-1 min-w-0 items-start gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1C1C1C] leading-snug">{alert.message}</p>
            <p className="mt-1 text-xs text-[#8F8F8F]">
              {alert.alertType}
              {alert.relatedEntityType ? ` · ${alert.relatedEntityType}` : ''}
              {' · '}{formatDateTime(alert.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge status={alert.severity} map={severityBadge} />
          <Badge status={alert.status}   map={statusBadge} />
        </div>
      </div>

      {/* Action row — only when not resolved */}
      {!resolved && (
        <div className="mt-4 flex flex-wrap gap-2 pl-5">
          {st !== 'acknowledged' && (
            <GhostBtn
              disabled={isBusy}
              onClick={() => onUpdate(alert.id, 'acknowledged')}
            >
              Acknowledge
            </GhostBtn>
          )}
          {st !== 'snoozed' && (
            <GhostBtn
              disabled={isBusy}
              onClick={() => onUpdate(alert.id, 'snoozed')}
            >
              Snooze
            </GhostBtn>
          )}
          <PrimaryBtn
            disabled={isBusy}
            onClick={() => onUpdate(alert.id, 'resolved')}
          >
            Resolve
          </PrimaryBtn>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SystemAlertsPage() {
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [severity, setSeverity] = useState('')

  const alertsQuery        = useAdminAlerts({ search, status, severity, limit: 24 })
  const updateAlertMutation = useAdminUpdateAlert()

  if (alertsQuery.isLoading) return <LoadingState label="Loading system alerts…" />
  if (alertsQuery.error)     return <ErrorState label="System alerts are unavailable right now." />

  const summary = alertsQuery.data?.summary ?? {}
  const alerts  = alertsQuery.data?.alerts ?? []

  const handleUpdate = (alertId, newStatus) => {
    updateAlertMutation.mutate({ alertId, body: { status: newStatus } })
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">System Alerts</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Track failed payments, operational gaps, and escalations. Acknowledge, snooze, or resolve from here.
        </p>
      </div>

      {/* ── Metric strip ── */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        <MetricCard
          label="Total Alerts"
          value={String(summary.total ?? 0)}
          helper="Matching current filters"
          accent
        />
        <MetricCard
          label="Critical"
          value={String(summary.critical ?? 0)}
          helper="Highest severity events"
          accent
        />
        <MetricCard
          label="Unresolved"
          value={String(summary.unresolved ?? 0)}
          helper="Needs active follow-up"
          accent
        />
      </div>

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#8F8F8F]">
          Filter Alerts
        </p>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {/* Search */}
          <label className="flex w-full items-center gap-2.5 rounded-full bg-[#F0F0F0] focus:border-[#C6A15B] px-2.5 py-1.5 text-[#A19B94]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B8B1A8] text-[#FAFAFA]">
              <span className="h-3.5 w-3.5">
                <SearchIcon />
              </span>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[15px] font-medium tracking-wide text-[#5B534B] placeholder:text-[#B0AAA4] focus:outline-none"
            />
          </label>
          <SelectField value={severity} onChange={setSeverity}>
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </SelectField>
          <SelectField value={status} onChange={setStatus}>
            <option value="">All States</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="snoozed">Snoozed</option>
            <option value="resolved">Resolved</option>
          </SelectField>
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-[#1C1C1C]">{alerts.length}</span>
        <span className="text-sm text-[#8F8F8F]">alert{alerts.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Alert feed ── */}
      {alerts.length ? (
        <div className="space-y-2.5">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onUpdate={handleUpdate}
              isBusy={updateAlertMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E4DED8] bg-white p-10 text-center">
          <BellIcon />
          <p className="text-base font-semibold text-[#1C1C1C]">No alerts found</p>
          <p className="mt-1 text-sm text-[#6B7280]">The alert feed is clear for the current filters.</p>
        </div>
      )}

    </div>
  )
}