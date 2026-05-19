import { useEffect, useMemo, useState } from 'react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SelectField,
} from '../components/ui/AdminUI'
import {
  useAdminAddSupportMessage,
  useAdminSupportTicket,
  useAdminSupportTickets,
  useAdminUpdateSupportTicket,
} from '../hooks/useAdminData'
import { formatDateTime } from '../lib/formatters'

// ---------------------------------------------------------------------------
// Shared primitives — consistent with BookingManagementPage & PaymentManagementPage
// ---------------------------------------------------------------------------

const badgeMap = {
  open: 'bg-[#DBEAFE] text-[#0383E4]',
  in_progress: 'bg-[#FCE7CF] text-[#C57A1E]',
  resolved: 'bg-[#DDF7E5] text-[#16A34A]',
  closed: 'bg-[#E5E7EB] text-[#4B5563]',
  low: 'bg-[#E5E7EB] text-[#4B5563]',
  medium: 'bg-[#FCE7CF] text-[#C57A1E]',
  high: 'bg-[#FFF3F3] text-[#8A1C1C]',
}

const priorityDot = {
  low: 'bg-gray-400',
  medium: 'bg-amber-400',
  high: 'bg-red-500',
}

function isArchivedTicket(ticket) {
  const status = String(ticket?.status ?? '').toLowerCase()
  return status === 'resolved' || status === 'closed'
}

function Badge({ status, label }) {
  const key = status?.toLowerCase() ?? ''
  const cls = badgeMap[key] ?? 'bg-[#E5E7EB] text-[#4B5563]'
  const text = label ?? key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '—'
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${cls}`}>
      {text}
    </span>
  )
}

function Input({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition ${className}`}
    />
  )
}

function Select({ value, onChange, children, className = '' }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`h-10 w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 text-sm text-[#2D2D2D] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition ${className}`}
    >
      {children}
    </select>
  )
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-[#E4DED8] bg-[#F3F3F3] px-4 py-3 text-sm text-[#2D2D2D] placeholder:text-[#8F8F8F] outline-none focus:border-[#CDB17E] focus:ring-1 focus:ring-[#CDB17E] transition resize-none"
    />
  )
}

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] transition hover:bg-[#C6A15B] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex h-10 items-center justify-center rounded-full border px-5 text-sm font-semibold transition hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed',
        active
          ? 'border-[#CDB17E] bg-[#F5EDD9] text-[#7A5C2E]'
          : 'border-[#E4DED8] bg-white text-[#591902] hover:bg-[#F4EFE5]',
      ].join(' ')}
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

// ---------------------------------------------------------------------------
// Ticket list item
// ---------------------------------------------------------------------------
function TicketItem({ item, isActive, onClick }) {
  const dot = priorityDot[item.priority?.toLowerCase()] ?? 'bg-gray-400'
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-2xl border px-4 py-4 text-left transition hover:-translate-y-px',
        isActive
          ? 'border-[#591902] bg-[#F4EFE5] shadow-[0_2px_16px_rgba(89,25,2,0.06)]'
          : 'border-[#E4DED8] bg-white hover:border-[#CDB17E] hover:bg-[#FBF7F3]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Priority dot + subject */}
          <div className="flex items-center gap-2">
            <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <p className="truncate text-sm font-semibold text-[#1C1C1C]">{item.subject}</p>
          </div>
          <p className="mt-1 pl-4 text-xs text-[#6B7280]">
            {item.customer?.name || 'Customer'}
            {item.customer?.email ? ` · ${item.customer.email}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge status={item.status} />
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------
function MessageBubble({ entry }) {
  const isNote = entry.isInternalNote
  return (
    <div className={`rounded-2xl px-4 py-3.5 ${isNote ? 'bg-[#F5EDD9] border border-[#E4C98A]' : 'bg-white border border-[#E4DED8]'}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#2D2D2D]">
            {entry.sender?.name || 'Unknown'}
          </span>
          {isNote && (
            <span className="rounded-full bg-[#E4C98A] px-2 py-0.5 text-[10px] font-semibold text-[#7A5C2E]">
              Internal Note
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#8F8F8F]">{formatDateTime(entry.createdAt)}</span>
      </div>
      <p className="text-sm leading-relaxed text-[#2D2D2D]">{entry.message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [queueTab, setQueueTab] = useState('active')
  const [selectedId, setSelectedId] = useState('')
  const [statusInput, setStatusInput] = useState('open')
  const [priorityInput, setPriorityInput] = useState('medium')
  const [message, setMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)

  const ticketsQuery = useAdminSupportTickets({ search, status, priority, limit: 24 })
  const ticketList = ticketsQuery.data?.tickets ?? []
  const activeTickets = useMemo(
    () => ticketList.filter(ticket => !isArchivedTicket(ticket)),
    [ticketList]
  )
  const archivedTickets = useMemo(
    () => ticketList.filter(ticket => isArchivedTicket(ticket)),
    [ticketList]
  )

  const selectedListTicket = useMemo(
    () => ticketList.find(t => t.id === selectedId) ?? ticketList[0] ?? null,
    [selectedId, ticketList]
  )

  const ticketQuery = useAdminSupportTicket(selectedListTicket?.id)
  const updateTicketMutation = useAdminUpdateSupportTicket()
  const addMessageMutation = useAdminAddSupportMessage()

  const ticket = ticketQuery.data ?? selectedListTicket
  const isReadOnly = isArchivedTicket(ticket)

  useEffect(() => {
    if (queueTab === 'active' && activeTickets.length === 0 && archivedTickets.length > 0) {
      setQueueTab('archived')
      return
    }

    if (queueTab === 'archived' && archivedTickets.length === 0 && activeTickets.length > 0) {
      setQueueTab('active')
    }
  }, [activeTickets.length, archivedTickets.length, queueTab])

  useEffect(() => {
    if (selectedListTicket && selectedListTicket.id !== selectedId) {
      setSelectedId(selectedListTicket.id)
    }
  }, [selectedId, selectedListTicket])

  useEffect(() => {
    setStatusInput(ticket?.status ?? 'open')
    setPriorityInput(ticket?.priority ?? 'medium')
  }, [ticket?.id, ticket?.priority, ticket?.status])

  if (ticketsQuery.isLoading) return <LoadingState label="Loading support tickets…" />
  if (ticketsQuery.error) return <ErrorState label="Support tickets are unavailable right now." />

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Help & Support</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage customer tickets, update their status, and reply with public messages or internal notes.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">

        {/* ════════════════════════════════
            LEFT — Ticket queue
        ════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* Filters */}
          <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#8F8F8F]">
              Filter Tickets
            </p>
            <div className="flex flex-col gap-2.5">
              {/* Search with icon */}
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
              <div className="grid grid-cols-2 gap-2.5">
                <SelectField value={status} onChange={setStatus}>
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </SelectField>
                <SelectField value={priority} onChange={setPriority}>
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </SelectField>
              </div>
            </div>
          </div>

          {/* Count */}
          <div className="px-1">
            <span className="text-sm font-semibold text-[#1C1C1C]">{ticketList.length}</span>
            <span className="ml-1.5 text-sm text-[#8F8F8F]">
              ticket{ticketList.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* List */}
          {ticketList.length ? (
            <div className="flex flex-col gap-2">
              {ticketList.map(item => (
                <TicketItem
                  key={item.id}
                  item={item}
                  isActive={ticket?.id === item.id}
                  onClick={() => setSelectedId(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E4DED8] bg-white p-6">
              <EmptyState title="No tickets found" body="Try a different search or filter." />
            </div>
          )}
        </div>

        {/* ════════════════════════════════
            RIGHT — Ticket detail
        ════════════════════════════════ */}
        {ticket ? (
          <div className="flex flex-col gap-5">

            {/* ── Ticket header ── */}
            <div className="rounded-2xl border border-[#E4DED8] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#1C1C1C]">{ticket.subject}</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {ticket.customer?.name || 'Customer'}
                    {ticket.customer?.email ? ` · ${ticket.customer.email}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge status={ticket.status} />
                  <Badge status={ticket.priority} />
                </div>
              </div>
            </div>

            {/* ── Ticket controls ── */}
            <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
              <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">Update Ticket</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Status</p>
                  <Select value={statusInput} onChange={setStatusInput}>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <p className="mb-1.5 text-xs text-[#8F8F8F]">Priority</p>
                  <Select value={priorityInput} onChange={setPriorityInput}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </div>
                <PrimaryBtn
                  disabled={updateTicketMutation.isPending}
                  onClick={() =>
                    updateTicketMutation.mutate({
                      ticketId: ticket.id,
                      body: { status: statusInput, priority: priorityInput },
                    })
                  }
                >
                  {updateTicketMutation.isPending ? 'Updating…' : 'Save Changes'}
                </PrimaryBtn>
              </div>
            </div>

            {/* ── Conversation thread ── */}
            <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
              <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">Conversation</h3>
              <div className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
                {ticket.messages?.length ? (
                  ticket.messages.map(entry => (
                    <MessageBubble key={entry.id} entry={entry} />
                  ))
                ) : (
                  <EmptyState
                    title="No messages yet"
                    body="Replies and internal notes for this ticket will appear here."
                  />
                )}
              </div>
            </div>

            {/* ── Reply composer ── */}
            <div className="rounded-2xl border border-[#E4DED8] bg-[#FBF7F3] p-5">
              <h3 className="mb-4 text-base font-semibold text-[#1C1C1C]">
                {isInternalNote ? 'Add Internal Note' : 'Reply to Customer'}
              </h3>

              {/* Toggle: Reply vs Internal note */}
              <div className="mb-3 flex gap-2">
                <GhostBtn active={!isInternalNote} onClick={() => setIsInternalNote(false)}>
                  Reply
                </GhostBtn>
                <GhostBtn active={isInternalNote} onClick={() => setIsInternalNote(true)}>
                  Internal Note
                </GhostBtn>
              </div>

              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  isInternalNote
                    ? 'Add internal context, follow-ups, or team notes…'
                    : 'Type your reply to the customer…'
                }
              />

              {/* Note hint */}
              {isInternalNote && (
                <p className="mt-2 text-xs text-[#C57A1E]">
                  This message will only be visible to the admin team.
                </p>
              )}

              <div className="mt-4">
                <PrimaryBtn
                  disabled={addMessageMutation.isPending || !message.trim()}
                  onClick={async () => {
                    await addMessageMutation.mutateAsync({
                      ticketId: ticket.id,
                      body: { message, isInternalNote },
                    })
                    setMessage('')
                    setIsInternalNote(false)
                  }}
                >
                  {addMessageMutation.isPending
                    ? 'Sending…'
                    : isInternalNote ? 'Save Note' : 'Send Reply'}
                </PrimaryBtn>
              </div>
            </div>

          </div>
        ) : (
          <div className="rounded-2xl border border-[#E4DED8] bg-white p-8">
            <EmptyState
              title="No ticket selected"
              body="Choose a support ticket from the list to view the conversation and take action."
            />
          </div>
        )}
      </div>
    </div>
  )
}
