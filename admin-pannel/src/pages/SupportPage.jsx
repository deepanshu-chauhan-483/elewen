import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionLoadingState,
  SelectField,
} from '../components/ui/AdminUI'
import {
  useAdminAddSupportMessage,
  useAdminSupportTicket,
  useAdminSupportTickets,
  useAdminUpdateSupportTicket,
} from '../hooks/useAdminData'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { formatDateTime } from '../lib/formatters'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function isClosedTicket(ticket) {
  return ['resolved', 'closed'].includes(String(ticket?.status ?? '').toLowerCase())
}

// ---------------------------------------------------------------------------
// Arrow icon (pagination)
// ---------------------------------------------------------------------------
function ArrowIcon({ direction = 'right' }) {
  const rotationClass = direction === 'left' ? '' : 'rotate-180'
  return (
    <svg className={`h-6 w-6 ${rotationClass}`} viewBox="0 0 36 36" fill="none">
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
// Avatar
// ---------------------------------------------------------------------------
function Avatar({ name = '', size = 'md' }) {
  const initials = getInitials(name) || '?'
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#591902] font-semibold text-[#FAFAFA] ${sizeClass}`}
    >
      {initials}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const statusStyles = {
  open: 'bg-[#EEF4FF] text-[#3061C6]',
  in_progress: 'bg-[#FFF4E5] text-[#C07318]',
  resolved: 'bg-[#EAF8F1] text-[#238E64]',
  closed: 'bg-[#F3F4F6] text-[#6B7280]',
}

const priorityStyles = {
  low: { dot: 'bg-[#9CA3AF]', cls: 'bg-[#F3F4F6] text-[#6B7280]' },
  medium: { dot: 'bg-[#F59E0B]', cls: 'bg-[#FFF7E6] text-[#B45309]' },
  high: { dot: 'bg-[#DC2626]', cls: 'bg-[#FFF1F0] text-[#DC2626]' },
}

function StatusBadge({ status }) {
  const key = status?.toLowerCase()?.replace(/[\s-]+/g, '_') ?? ''
  const cls = statusStyles[key] ?? 'bg-[#FFF4E5] text-[#C07318]'
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const key = priority?.toLowerCase() ?? 'medium'
  const cfg = priorityStyles[key] ?? priorityStyles.medium
  const label = key.charAt(0).toUpperCase() + key.slice(1)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Ticket card — mirrors ThreadCard from MessageBoxPage exactly
// ---------------------------------------------------------------------------
function TicketCard({ ticket, isSelected, onClick }) {
  const customerName = ticket.customer?.name || 'Customer'
  const isClosed = isClosedTicket(ticket)
  const priorityCfg = priorityStyles[ticket.priority?.toLowerCase()] ?? priorityStyles.medium

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
        isSelected
          ? 'border-[#591902] bg-[#F7EEE8] shadow-[0_4px_16px_rgba(89,25,2,0.10)]'
          : 'border-[#E4DED8] bg-white hover:border-[#C6A15B] hover:bg-[#FDFAF7]'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={customerName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm font-semibold ${isSelected ? 'text-[#591902]' : 'text-[#1C1C1C]'}`}
            >
              {customerName}
            </p>
            {/* Status badge mirrors unread/closed badge from MessageBox */}
            {isClosed ? (
              <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[10px] text-[#4B5563]">
                Closed
              </span>
            ) : (
              <StatusBadge status={ticket.status} />
            )}
          </div>
          {/* Subject line */}
          <p className="mt-0.5 truncate text-xs text-[#6B7280]">{ticket.subject}</p>
          {/* Priority dot + timestamp row */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityCfg.dot}`} />
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8F8F8F]">
              {ticket.priority || 'medium'}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Message bubble — mirrors MessageBubble from MessageBoxPage
// ---------------------------------------------------------------------------
function MessageBubble({ entry }) {
  const isNote = entry.isInternalNote
  const senderName = entry.sender?.name || 'Unknown'
  const typeLabel = isNote ? 'internal note' : 'reply'

  return (
    <div className={`flex gap-2 ${isNote ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar name={senderName} size="sm" />
      <div className={`flex max-w-[75%] flex-col gap-1 ${isNote ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#8F8F8F]">
            {senderName}
          </span>
          <span className="text-[10px] text-[#8F8F8F]">·</span>
          <span className="text-[10px] text-[#8F8F8F]">{typeLabel}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isNote
              ? 'rounded-tr-sm bg-[#591902] text-[#FAFAFA]'
              : 'rounded-tl-sm bg-white text-[#1C1C1C] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
          }`}
        >
          <p className="text-sm leading-6 whitespace-pre-wrap">{entry.message}</p>
        </div>
        <p className="text-[10px] text-[#8F8F8F]">{formatDateTime(entry.createdAt)}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ticket detail slide-over panel — mirrors MessageThreadPanel exactly
// ---------------------------------------------------------------------------
function TicketDetailPanel({
  ticket,
  fullTicket,
  ticketLoading,
  statusInput,
  priorityInput,
  message,
  isInternalNote,
  updateMutation,
  addMessageMutation,
  onClose,
  onStatusChange,
  onPriorityChange,
  onMessageChange,
  onNoteToggle,
  onSend,
  onSaveStatus,
}) {
  const backdropRef = useRef(null)
  const asideRef = useRef(null)
  const scrollRef = useRef(null)
  const tlRef = useRef(null)
  const exitedRef = useRef(false)

  const [mounted, setMounted] = useState(false)
  const [renderedTicket, setRenderedTicket] = useState(ticket)
  const [renderedFull, setRenderedFull] = useState(fullTicket)

  // ── Open ────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (ticket && !exitedRef.current) {
      setRenderedTicket(ticket)
      setRenderedFull(fullTicket)
      setMounted(true)
    }
  }, [ticket]) // eslint-disable-line

  useEffect(() => {
    if (!mounted || !ticket || !backdropRef.current || !asideRef.current) return
    tlRef.current?.kill()
    gsap.set(asideRef.current, { x: '100%' })
    gsap.set(backdropRef.current, { opacity: 0, pointerEvents: 'auto' })
    tlRef.current = gsap.timeline()
    tlRef.current
      .to(backdropRef.current, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      .to(asideRef.current, { x: '0%', duration: 0.45, ease: 'expo.out' }, '<0.05')
  }, [mounted, ticket])

  // ── Sync full ticket data while panel is open ───────────────────────────
  useEffect(() => {
    if (mounted && ticket) {
      const frameId = requestAnimationFrame(() => setRenderedFull(fullTicket))
      return () => cancelAnimationFrame(frameId)
    }
    return undefined
  }, [fullTicket, mounted, ticket])

  // ── Scroll to bottom when messages load ────────────────────────────────
  useEffect(() => {
    if (!scrollRef.current || !renderedFull?.messages?.length) return
    const raf = requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    })
    return () => cancelAnimationFrame(raf)
  }, [renderedFull?.messages?.length, mounted])

  // ── Close ───────────────────────────────────────────────────────────────
  function handleClose() {
    if (!backdropRef.current || !asideRef.current || exitedRef.current) return
    exitedRef.current = true
    tlRef.current?.kill()
    tlRef.current = gsap.timeline({
      onComplete: () => {
        setMounted(false)
        setRenderedTicket(null)
        setRenderedFull(null)
        exitedRef.current = false
        onClose()
      },
    })
    tlRef.current
      .to(asideRef.current, { x: '100%', duration: 0.35, ease: 'expo.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '<0.1')
  }

  if (!mounted || !renderedTicket) return null

  const isClosed = isClosedTicket(renderedTicket)
  const displayTicket = renderedFull ?? renderedTicket

  return (
    <div
      ref={backdropRef}
      style={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/25 pointer-events-none"
      onClick={handleClose}
    >
      <aside
        ref={asideRef}
        style={{ transform: 'translateX(100%)' }}
        className="flex h-full min-h-0 w-full max-w-[760px] flex-col overflow-hidden bg-[#FAFAFA] shadow-[-16px_0_40px_rgba(17,24,39,0.18)]"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header — mirrors MessageThreadPanel header ── */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E4DED8] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={renderedTicket.customer?.name} size="md" />
            <div>
              <p className="text-sm font-semibold text-[#1C1C1C]">
                {renderedTicket.customer?.name || 'Customer'}
              </p>
              <p className="text-xs text-[#6B7280]">
                {renderedTicket.customer?.email || 'No email on file'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={isClosed ? 'closed' : renderedTicket.status} />
            <PriorityBadge priority={renderedTicket.priority} />
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                handleClose()
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full p-2 text-[#957960] transition hover:bg-[#F3EEE8]"
              aria-label="Close ticket"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
        </div>

        {/* ── Subject meta strip — mirrors booking meta strip ── */}
        <div className="border-b border-[#E4DED8] bg-[#F7F5F2] px-5 py-3">
          <p className="text-xs text-[#6B7280]">
            <span className="font-medium text-[#2D2D2D]">{renderedTicket.subject}</span>
          </p>
        </div>

        {/* ── Update controls strip ── */}
        <div className="border-b border-[#E4DED8] bg-white px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[120px]">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-[#8F8F8F]">Status</p>
              <SelectField value={statusInput} onChange={onStatusChange} menuClassName="z-[9999]">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </SelectField>
            </div>
            <div className="flex-1 min-w-[120px]">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-[#8F8F8F]">Priority</p>
              <SelectField
                value={priorityInput}
                onChange={onPriorityChange}
                menuClassName="z-[9999]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </SelectField>
            </div>
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={onSaveStatus}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#591902] px-5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(89,25,2,0.20)] transition hover:bg-[#7A2B08] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── Messages scroll area ── */}
        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto hide-scrollbar px-5 py-5"
          data-lenis-prevent
        >
          {ticketLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <SectionLoadingState label="Loading conversation…" minHeightClass="min-h-[120px]" />
            </div>
          ) : displayTicket?.messages?.length ? (
            displayTicket.messages.map(entry => <MessageBubble key={entry.id} entry={entry} />)
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                title="No messages yet"
                body="Replies and internal notes will appear here."
              />
            </div>
          )}
        </div>

        {/* ── Compose footer — mirrors MessageThreadPanel footer exactly ── */}
        <div className="shrink-0 border-t border-[#E4DED8] bg-[#FAFAFA] px-5 py-4">
          {/* Reply / Internal Note toggle — same pill style as tabs */}
          <div className="mb-3 flex gap-1 rounded-full bg-[#F0EDEA] p-1 w-fit">
            {[
              { label: 'Reply', value: false },
              { label: 'Internal Note', value: true },
            ].map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onNoteToggle(opt.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isInternalNote === opt.value
                    ? 'bg-[#591902] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#2D2D2D]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {isInternalNote && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-dashed border-[#FDE68A] bg-[#FFFBEB] px-4 py-2.5 text-xs text-[#B45309]">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              This note is only visible to the admin team.
            </div>
          )}

          <div className="flex items-end gap-3">
            <textarea
              value={message}
              onChange={e => onMessageChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              placeholder={
                isInternalNote
                  ? 'Add internal context, follow-ups, or team notes…'
                  : 'Type your reply to the customer…'
              }
              rows={3}
              className="flex-1 resize-none rounded-2xl border border-[#E4DED8] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none transition focus:border-[#C6A15B] placeholder:text-[#9CA3AF]"
            />
            <button
              type="button"
              disabled={addMessageMutation.isPending || !message.trim()}
              onClick={onSend}
              className="flex h-12 shrink-0 items-center justify-center gap-2 self-end rounded-full bg-[#591902] px-4 text-white shadow-[0_4px_12px_rgba(89,25,2,0.25)] transition hover:bg-[#7A2B08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="hidden text-sm font-medium sm:inline">
                {addMessageMutation.isPending ? 'Sending' : 'Send'}
              </span>
              <span>
                {addMessageMutation.isPending ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12L20 3L14 21L11 13L3 12Z"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const PAGE_SIZE = 10

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [ticketTab, setTicketTab] = useState('open') // 'open' | 'closed'
  const [selectedId, setSelectedId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Panel state
  const [statusInput, setStatusInput] = useState('open')
  const [priorityInput, setPriorityInput] = useState('medium')
  const [message, setMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  const ticketsQuery = useAdminSupportTickets({
    search: debouncedSearch,
    status: statusFilter,
    priority: priorityFilter,
    limit: 24,
  })
  const ticketList = useMemo(() => ticketsQuery.data?.tickets ?? [], [ticketsQuery.data?.tickets])

  const openTickets = useMemo(
    () => ticketList.filter(ticket => !isClosedTicket(ticket)),
    [ticketList]
  )
  const closedTickets = useMemo(
    () => ticketList.filter(ticket => isClosedTicket(ticket)),
    [ticketList]
  )
  const effectiveTab = useMemo(() => {
    if (ticketTab === 'open' && openTickets.length === 0 && closedTickets.length > 0) {
      return 'closed'
    }
    if (ticketTab === 'closed' && closedTickets.length === 0 && openTickets.length > 0) {
      return 'open'
    }
    return ticketTab
  }, [ticketTab, openTickets.length, closedTickets.length])
  const filteredTickets = useMemo(
    () => (effectiveTab === 'closed' ? closedTickets : openTickets),
    [closedTickets, effectiveTab, openTickets]
  )
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE))
  const visiblePage = Math.min(currentPage, totalPages)
  const visibleTickets = useMemo(
    () => filteredTickets.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE),
    [filteredTickets, visiblePage]
  )

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setCurrentPage(1))
    return () => cancelAnimationFrame(frameId)
  }, [search, effectiveTab, statusFilter, priorityFilter])
  useEffect(() => {
    if (currentPage > totalPages) {
      const frameId = requestAnimationFrame(() => setCurrentPage(totalPages))
      return () => cancelAnimationFrame(frameId)
    }
    return undefined
  }, [currentPage, totalPages])

  // Deselect if no longer in filtered list
  useEffect(() => {
    if (selectedId && !filteredTickets.some(t => t.id === selectedId)) {
      const frameId = requestAnimationFrame(() => setSelectedId(''))
      return () => cancelAnimationFrame(frameId)
    }
    return undefined
  }, [filteredTickets, selectedId])

  const selectedTicket = useMemo(
    () => filteredTickets.find(t => t.id === selectedId) ?? null,
    [filteredTickets, selectedId]
  )

  const ticketQuery = useAdminSupportTicket(selectedTicket?.id)
  const updateMutation = useAdminUpdateSupportTicket()
  const addMessageMutation = useAdminAddSupportMessage()

  const fullTicket = ticketQuery.data?.id === selectedId ? ticketQuery.data : null
  const isListLoading = ticketsQuery.isFetching && !ticketsQuery.isLoading

  // Sync selects when ticket changes
  useEffect(() => {
    if (selectedTicket) {
      const frameId = requestAnimationFrame(() => {
        setStatusInput(selectedTicket.status ?? 'open')
        setPriorityInput(selectedTicket.priority ?? 'medium')
      })
      return () => cancelAnimationFrame(frameId)
    }
    return undefined
  }, [selectedTicket])

  if (ticketsQuery.isLoading) return <LoadingState label="Loading support tickets…" />
  if (ticketsQuery.error) return <ErrorState label="Support tickets are unavailable right now." />

  async function handleSend() {
    if (!message.trim() || !selectedTicket?.id) return
    await addMessageMutation.mutateAsync({
      ticketId: selectedTicket.id,
      body: { message, isInternalNote },
    })
    setMessage('')
    setIsInternalNote(false)
  }

  return (
    <div className="flex min-h-0 h-fit flex-col gap-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Help &amp; Support</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage customer tickets, update their status, and reply with messages or internal notes.
        </p>
      </div>

      <div className="min-h-0 flex-1">
        {/* ── Search + filters + tabs card — identical structure to MessageBox ── */}
        <div className="mb-4 rounded-2xl bg-white py-5 px-3">
          {/* Search */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8F8F8F]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer or subject…"
              className="w-full rounded-full border border-[#E4DED8] bg-[#F7F5F2] py-2.5 pl-9 pr-4 text-sm text-[#2D2D2D] outline-none transition focus:border-[#C6A15B] focus:bg-white"
            />
          </div>

          {/* Priority + Status filters */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <SelectField value={statusFilter} onChange={setStatusFilter}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </SelectField>
            <SelectField value={priorityFilter} onChange={setPriorityFilter}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </SelectField>
          </div>

          {/* Open / Closed tab pills — identical to Active/Archived in MessageBox */}
          <div className="flex gap-1 rounded-full bg-[#F3F3F3] p-1">
            {[
              { key: 'open', label: 'Open', count: openTickets.length },
              { key: 'closed', label: 'Closed', count: closedTickets.length },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTicketTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium transition-all duration-200 ${
                  effectiveTab === tab.key
                    ? 'bg-[#591902] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#2D2D2D]'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    effectiveTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E8E2DA] text-[#6B7280]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Ticket cards list ── */}
        <div
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 hide-scrollbar"
          data-lenis-prevent
        >
          {isListLoading ? (
            <SectionLoadingState label="Loading tickets…" minHeightClass="min-h-[320px]" />
          ) : filteredTickets.length ? (
            visibleTickets.map(t => (
              <TicketCard
                key={t.id}
                ticket={t}
                isSelected={selectedTicket?.id === t.id}
                onClick={() => setSelectedId(t.id)}
              />
            ))
          ) : (
            <EmptyState title="No tickets found" body="Try adjusting your search or filters." />
          )}
        </div>
      </div>

      {/* ── Slide-over panel ── */}
      <TicketDetailPanel
        ticket={selectedTicket}
        fullTicket={fullTicket}
        ticketLoading={ticketQuery.isLoading}
        statusInput={statusInput}
        priorityInput={priorityInput}
        message={message}
        isInternalNote={isInternalNote}
        updateMutation={updateMutation}
        addMessageMutation={addMessageMutation}
        onClose={() => setSelectedId('')}
        onStatusChange={setStatusInput}
        onPriorityChange={setPriorityInput}
        onMessageChange={setMessage}
        onNoteToggle={setIsInternalNote}
        onSend={handleSend}
        onSaveStatus={() =>
          updateMutation.mutate({
            ticketId: selectedTicket.id,
            body: { status: statusInput, priority: priorityInput },
          })
        }
      />

      {/* ── Pagination ── */}
      {filteredTickets.length ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={visiblePage === 1}
            className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowIcon direction="left" />
          </button>
          <div className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1C]">
            {visiblePage} / {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={visiblePage === totalPages}
            className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
