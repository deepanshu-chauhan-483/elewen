import { useState } from 'react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageIntro,
  Panel,
  SearchField,
  SelectField,
  StatusBadge,
} from '../components/ui/AdminUI'
import { useAdminAlerts, useAdminUpdateAlert } from '../hooks/useAdminData'
import { formatDateTime } from '../lib/formatters'

export default function SystemAlertsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const alertsQuery = useAdminAlerts({ search, status, severity, limit: 24 })
  const updateAlertMutation = useAdminUpdateAlert()

  if (alertsQuery.isLoading) {
    return <LoadingState label="Loading system alerts..." />
  }

  if (alertsQuery.error) {
    return <ErrorState label="System alerts are unavailable right now." />
  }

  const summary = alertsQuery.data?.summary ?? {}
  const alerts = alertsQuery.data?.alerts ?? []

  return (
    <div className="space-y-6">
      <PageIntro
        title="System Alerts"
        subtitle="Track failed payments, unresolved operational gaps, and escalations that need acknowledgment or resolution."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total alerts" value={String(summary.total ?? 0)} helper="Current filtered result set" />
        <MetricCard label="Critical alerts" value={String(summary.critical ?? 0)} helper="Highest severity events" />
        <MetricCard label="Unresolved" value={String(summary.unresolved ?? 0)} helper="Needs active follow-up" />
      </div>

      <Panel
        title="Alert Feed"
        subtitle="Acknowledge, snooze, or resolve alerts without leaving the admin panel."
        action={
          <div className="grid gap-3 md:grid-cols-3">
            <SearchField value={search} onChange={setSearch} placeholder="Search alerts" />
            <SelectField value={severity} onChange={setSeverity}>
              <option value="">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </SelectField>
            <SelectField value={status} onChange={setStatus}>
              <option value="">All states</option>
              <option value="new">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="snoozed">Snoozed</option>
              <option value="resolved">Resolved</option>
            </SelectField>
          </div>
        }
      >
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="rounded-[24px] bg-[#FBF7F4] px-4 py-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-base font-medium text-[#2B211B]">{alert.message}</p>
                    <p className="mt-1 text-sm text-[#6F6257]">{alert.alertType} / {alert.relatedEntityType || 'system'} / {formatDateTime(alert.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={alert.severity} />
                    <StatusBadge status={alert.status} />
                  </div>
                </div>
                {alert.status !== 'resolved' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton
                      tone="ghost"
                      className="min-h-9 px-3"
                      onClick={() =>
                        updateAlertMutation.mutate({
                          alertId: alert.id,
                          body: { status: 'acknowledged' },
                        })
                      }
                    >
                      Acknowledge
                    </ActionButton>
                    <ActionButton
                      tone="ghost"
                      className="min-h-9 px-3"
                      onClick={() =>
                        updateAlertMutation.mutate({
                          alertId: alert.id,
                          body: { status: 'snoozed' },
                        })
                      }
                    >
                      Snooze
                    </ActionButton>
                    <ActionButton
                      className="min-h-9 px-3"
                      onClick={() =>
                        updateAlertMutation.mutate({
                          alertId: alert.id,
                          body: { status: 'resolved' },
                        })
                      }
                    >
                      Resolve
                    </ActionButton>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No alerts found" body="The alert feed is clear for the current filters." />
        )}
      </Panel>
    </div>
  )
}
