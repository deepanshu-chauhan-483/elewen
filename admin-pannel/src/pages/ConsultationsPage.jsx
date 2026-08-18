import { useMemo, useState } from 'react'
import { useAdminToast } from '../components/common/AdminToastProvider'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionLoadingState,
  CustomSelect,
} from '../components/ui/AdminUI'
import { useAdminConsultations, useAdminUpdateConsultation } from '../hooks/useAdminData'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { getAdminBadgeClass } from '../lib/adminBadges'
import { formatDate, formatDateTime } from '../lib/formatters'

const STATUS_ACTIONS = [
  { value: 'new', label: 'Mark new' },
  { value: 'contacted', label: 'Mark contacted' },
  { value: 'converted', label: 'Mark converted' },
  { value: 'closed', label: 'Mark closed' },
]

function Badge({ status }) {
  const key = String(status ?? 'new').toLowerCase()
  const cls = getAdminBadgeClass(key, { preset: 'vivid' })
  const label = key.charAt(0).toUpperCase() + key.slice(1)
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  )
}

function ConsultationCard({ consultation, onStatusChange, isUpdating }) {
  const packageTitle = consultation.interested_package_title?.trim() || '—'
  const status = consultation.planner_lead_status || 'new'

  return (
    <div className="rounded-[24px] border border-[#E8E0D8] bg-white p-5 shadow-[0_8px_24px_rgba(89,25,2,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium text-[#2E2E2E]">
            {consultation.full_name || 'Customer'}
          </h3>
          <p className="mt-1 text-sm text-[#8F8F8F]">
            {[consultation.email, consultation.phone].filter(Boolean).join(' · ') || 'No contact'}
          </p>
        </div>
        <Badge status={status} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-[#8F8F8F]">Interested package</p>
          <p className="mt-1 text-sm font-semibold text-[#591902]">{packageTitle}</p>
        </div>
        <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-[#8F8F8F]">Event date</p>
          <p className="mt-1 text-sm font-medium text-[#2E2E2E]">
            {consultation.event_date ? formatDate(consultation.event_date) : '—'}
          </p>
        </div>
        <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-[#8F8F8F]">Submitted</p>
          <p className="mt-1 text-sm font-medium text-[#2E2E2E]">
            {consultation.createdAt ? formatDateTime(consultation.createdAt) : '—'}
          </p>
        </div>
      </div>

      {(consultation.city || consultation.event_type || consultation.budget_range) && (
        <p className="mt-3 text-sm text-[#6B6B6B]">
          {[consultation.event_type, consultation.city, consultation.budget_range]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {consultation.vision_notes ? (
        <p className="mt-3 text-sm leading-6 text-[#2D2D2D]">{consultation.vision_notes}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_ACTIONS.filter(action => action.value !== status).map(action => (
          <button
            key={action.value}
            type="button"
            disabled={isUpdating}
            onClick={() => onStatusChange(consultation, action.value)}
            className="inline-flex h-9 items-center justify-center rounded-full border border-[#CDB17E] bg-white px-4 text-xs font-medium text-[#CDB17E] hover:bg-[#FAF6F1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ConsultationsPage() {
  useScrollToTop()
  const { showToast } = useAdminToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 300)

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status || undefined,
      page,
      limit: 12,
    }),
    [debouncedSearch, page, status]
  )

  const consultationsQuery = useAdminConsultations(params)
  const updateMutation = useAdminUpdateConsultation()

  const consultations = consultationsQuery.data?.consultations ?? []
  const totalPages = consultationsQuery.data?.pages ?? 1
  const total = consultationsQuery.data?.total ?? 0

  async function handleStatusChange(consultation, nextStatus) {
    const consultationId = consultation.id || consultation.documentId
    if (!consultationId) {
      showToast({ message: 'Missing consultation id — cannot update status.', tone: 'error' })
      return
    }

    try {
      await updateMutation.mutateAsync({
        consultationId,
        body: { planner_lead_status: nextStatus },
      })
      showToast({ message: `Marked as ${nextStatus}.`, tone: 'success' })
    } catch (error) {
      showToast({
        message: error?.message || 'Could not update consultation status.',
        tone: 'error',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Consultations</h1>
        {/* <p className="mt-2 max-w-2xl text-sm text-[#8F8F8F]">
          Customers who booked a consultation call. Package interest is shown when they started from
          a corporate decor package page.
        </p> */}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={event => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search name, email, phone, package…"
          className="h-11 w-full rounded-full border border-[#E4DED8] bg-white px-5 text-sm text-[#2D2D2D] outline-none focus:border-[#CDB17E] sm:max-w-md"
        />
        <div className="w-full sm:w-[200px]">
          <CustomSelect
            value={status}
            onChange={value => {
              setStatus(value)
              setPage(1)
            }}
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </CustomSelect>
        </div>
      </div>

      <p className="text-sm text-[#8F8F8F]">
        {total} consultation{total === 1 ? '' : 's'}
      </p>

      {consultationsQuery.isLoading ? (
        <LoadingState label="Loading consultations…" />
      ) : consultationsQuery.isError ? (
        <ErrorState
          title="Could not load consultations"
          message={consultationsQuery.error?.message || 'Please try again.'}
        />
      ) : consultations.length === 0 ? (
        <EmptyState
          title="No consultations yet"
          message="When a customer submits the Book a Consultation form, they will appear here."
        />
      ) : (
        <div className="space-y-4">
          {consultationsQuery.isFetching ? <SectionLoadingState label="Refreshing…" /> : null}
          {consultations.map(consultation => (
            <ConsultationCard
              key={consultation.id || consultation.documentId}
              consultation={consultation}
              onStatusChange={handleStatusChange}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(current => Math.max(1, current - 1))}
            className="rounded-full border border-[#E4DED8] px-4 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-[#8F8F8F]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(current => Math.min(totalPages, current + 1))}
            className="rounded-full border border-[#E4DED8] px-4 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
