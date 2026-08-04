import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDashboardSearch } from '../../components/dashboard/useDashboardSearch'
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  MessageBubble,
  CustomSelect,
} from '../../components/dashboard/DashboardUI'
import {
  useDashboardBookings,
  useDashboardCreateTicket,
  useDashboardHelp,
  useDashboardReplyToTicket,
  useDashboardSession,
  useDashboardSupportTicket,
  useDashboardSupportTickets,
} from '../../hooks/useDashboardData'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  formatDashboardDate,
  matchesDashboardSearch,
} from '../../components/dashboard/dashboardUtils'

// ---------------------------------------------------------------------------
// Direct support defaults (used when CMS settings are missing/outdated)
// ---------------------------------------------------------------------------

const SUPPORT_CONTACT = {
  email: 'info@elewen.co.in',
  phone: '9810937700',
  whatsapp: '9810937700',
}

function getWhatsAppUrl(number) {
  const digits = String(number ?? '').replace(/[^\d]/g, '')
  const normalized = digits.startsWith('91') ? digits : `91${digits}`
  return `https://wa.me/${normalized}`
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const ticketStatusBadge = {
  open: 'bg-[#EEF4FF] text-[#3061C6]',
  in_progress: 'bg-[#FFF4E5] text-[#C07318]',
  resolved: 'bg-[#EAF8F1] text-[#238E64]',
  closed: 'bg-[#F3F4F6] text-[#6B7280]',
}

function TicketBadge({ status }) {
  const key = status?.toLowerCase() ?? ''
  const cls = ticketStatusBadge[key] ?? 'bg-[#E5E7EB] text-[#4B5563]'
  const text = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

// Contact info card
function ContactCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#EDE8E1] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F8F8F]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[#2E2E2E]">{value || 'Not shared yet'}</p>
    </div>
  )
}

// Form input
function FormInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[#2E2E2E]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-full border border-[#D7CEC4] bg-white px-4 py-3 text-sm text-[#2E2E2E] placeholder:text-[#B0AAA4] outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition"
      />
    </div>
  )
}

// Form textarea
function FormTextarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-[#2E2E2E]">{label}</span>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm text-[#2E2E2E] placeholder:text-[#B0AAA4] outline-none focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] transition resize-none"
      />
    </div>
  )
}

// Gold primary button
function GoldBtn({ children, type = 'button', onClick, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-full bg-[#C6A15B] px-6 py-2.5 text-sm text-white transition hover:bg-[#B8914D] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

// Ghost button
function OutlineBtn({ children, href, onClick }) {
  const cls =
    'inline-flex items-center justify-center rounded-full border border-[#D2C9BF] px-6 py-2.5 text-sm font-semibold text-[#591902] transition hover:border-[#C6A15B] hover:bg-[#FBF7F3] hover:-translate-y-px'
  if (href)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    )
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Ticket list item
// ---------------------------------------------------------------------------
function TicketItem({ ticket, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-2xl border px-4 py-4 text-left transition hover:-translate-y-px',
        isActive
          ? 'border-[#C6A15B] bg-[#FBF7F3] shadow-[0_2px_12px_rgba(198,161,91,0.12)]'
          : 'border-[#EDE8E1] bg-white hover:border-[#C6A15B] hover:bg-[#FBF7F3]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-[#1C1C1C]">{ticket.subject}</p>
          <p className="mt-0.5 text-xs text-[#8F8F8F]">{formatDashboardDate(ticket.createdAt)}</p>
        </div>
        <TicketBadge status={ticket.status} />
      </div>
    </button>
  )
}

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke="#fff" strokeWidth="1.5" />
  </svg>
)

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SupportHelp() {
  const navigate = useNavigate()
  const { data: session } = useDashboardSession()
  const { data: bookings = [] } = useDashboardBookings('all')
  const { data: help, error: helpError } = useDashboardHelp()
  const { searchTerm } = useDashboardSearch()
  const debouncedSearchTerm = useDebouncedValue(searchTerm)
  const { data: tickets = [], error: ticketsError } = useDashboardSupportTickets({
    search: debouncedSearchTerm,
  })

  const [searchParams, setSearchParams] = useSearchParams()
  // const selectedTicketId = searchParams.get('ticketId') || ''

  const [newTicket, setNewTicket] = useState({ bookingId: '', subject: '', message: '' })
  const [reply, setReply] = useState('')
  const setField = (field, val) => setNewTicket(f => ({ ...f, [field]: val }))
  const requestedTicketId = searchParams.get('ticketId') || ''
  const filteredTickets = useMemo(
    () =>
      tickets.filter(ticket =>
        matchesDashboardSearch(debouncedSearchTerm, [
          ticket?.subject,
          ticket?.status,
          ticket?.bookingId,
          ...(ticket?.messages?.map(message => message?.messageText) ?? []),
        ])
      ),
    [debouncedSearchTerm, tickets]
  )
  const selectedTicketId = filteredTickets.some(ticket => ticket.id === requestedTicketId)
    ? requestedTicketId
    : filteredTickets[0]?.id || ''
  useEffect(() => {
    if (!filteredTickets.length) return
    if (selectedTicketId && filteredTickets.some(t => t.id === selectedTicketId)) return
    const next = new URLSearchParams(searchParams)
    next.set('ticketId', filteredTickets[0].id)
    setSearchParams(next, { replace: true })
  }, [filteredTickets, searchParams, selectedTicketId, setSearchParams])

  // const selectedTicket =
  //   visibleTickets.find(item => item.id === selectedTicketId) ?? visibleTickets[0] ?? null
  const {
    data: ticket,
    isLoading: ticketLoading,
    error: ticketError,
  } = useDashboardSupportTicket(selectedTicketId)
  const createTicketMutation = useDashboardCreateTicket()
  const replyMutation = useDashboardReplyToTicket()

  const selectedTicket = useMemo(
    () => filteredTickets.find(t => t.id === selectedTicketId) ?? null,
    [filteredTickets, selectedTicketId]
  )

  // if (helpLoading || ticketsLoading) return <DashboardLoadingState title="Loading support…" />
  if (helpError || ticketsError || ticketError)
    return <DashboardErrorState title="Support details could not be loaded right now." />

  const handleCreateTicket = async e => {
    e.preventDefault()
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return
    const response = await createTicketMutation.mutateAsync({
      bookingId: newTicket.bookingId || undefined,
      subject: newTicket.subject.trim(),
      message: newTicket.message.trim(),
      priority: 'medium',
    })
    const createdTicketId = response?.ticket?.id || ''
    setNewTicket({ bookingId: '', subject: '', message: '' })

    if (createdTicketId) {
      const next = new URLSearchParams(searchParams)
      next.set('ticketId', createdTicketId)
      next.set('tab', 'active')
      setSearchParams(next, { replace: true })
    }
  }

  const handleReply = async e => {
    e.preventDefault()
    if (!reply.trim() || !selectedTicketId) return
    await replyMutation.mutateAsync({ ticketId: selectedTicketId, body: { message: reply.trim() } })
    setReply('')
  }

  const supportPhone = SUPPORT_CONTACT.phone
  const supportEmail = SUPPORT_CONTACT.email
  const supportWhatsApp = SUPPORT_CONTACT.whatsapp

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Support & Help</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Reach the Elewen team, raise a ticket, and continue open conversations.
        </p>
      </div>

      {/* ── Help message from admin ── */}
      {help?.helpMessage && (
        <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5">
          <h2 className="mb-2 text-base font-semibold text-[#1C1C1C]">Help &amp; Guidance</h2>
          <p className="text-sm leading-6 text-[#6B7280]">{help.helpMessage}</p>
        </div>
      )}

      {/* ── Direct support contact ── */}
      <div className="rounded-2xl border border-[#EDE8E1] bg-[#FBF7F3] p-5">
        <h2 className="mb-1 text-xl text-[#1C1C1C]">Direct Support</h2>
        <p className="mb-4 text-sm text-[#8F8F8F]">Reach the Elewen team using the contact details below.</p>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ContactCard label="Phone" value={supportPhone} />
          <ContactCard label="Email" value={supportEmail} />
          <ContactCard label="WhatsApp" value={supportWhatsApp} />
        </div>

        {/* Note: booking-specific messaging is handled via Messages module */}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-[#D6CDC3] bg-white px-4 py-3 text-xs text-[#6B7280]">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-[#8F8F8F]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            For booking-specific queries and real-time updates, use the{' '}
            <Link
              to="/user-dashboard/messages"
              className="font-medium text-[#591902] underline underline-offset-2 hover:text-[#7A2408]"
            >
              Messages module
            </Link>
            . Platform messaging is handled there, not here.
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <OutlineBtn href={getWhatsAppUrl(supportWhatsApp)}>Call / WhatsApp</OutlineBtn>
          <OutlineBtn href={`mailto:${supportEmail}`}>Email Us</OutlineBtn>
          <button
            type="button"
            onClick={() => navigate('/user-dashboard/messages')}
            className="flex items-center gap-2 rounded-full bg-[#CDB17E] hover:bg-[#C6AB7F] px-5 py-2 text-white transition"
          >
            Message Admin <ArrowIcon />
          </button>
        </div>
      </div>

      {/* ── Create a ticket ── */}
      <div className="rounded-2xl border border-[#EDE8E1] bg-[#FBF7F3] p-5">
        <h2 className="mb-1 text-xl text-[#1C1C1C]">Create a Ticket</h2>
        <p className="mb-5 text-sm text-[#8F8F8F]">
          Open a new support request for a booking or a general question.
        </p>

        <form onSubmit={handleCreateTicket} className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#2E2E2E]">Related booking</span>
            <CustomSelect
              value={newTicket.bookingId}
              onChange={value => setField('bookingId', value)}
              placeholder="Related booking"
            >
              <option value="">General support</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.package?.title || b.event?.name || b.id}
                </option>
              ))}
            </CustomSelect>
          </div>

          <FormInput
            label="Subject"
            value={newTicket.subject}
            onChange={e => setField('subject', e.target.value)}
            placeholder="Tell us what you need help with"
          />

          <div className="lg:col-span-2">
            <FormTextarea
              label="Message"
              value={newTicket.message}
              onChange={e => setField('message', e.target.value)}
              placeholder="Share the issue or request in a little detail…"
            />
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <GoldBtn
              type="submit"
              disabled={
                !newTicket.subject.trim() ||
                !newTicket.message.trim() ||
                createTicketMutation.isPending
              }
            >
              {createTicketMutation.isPending ? 'Creating…' : 'Create Ticket'}
            </GoldBtn>
          </div>
        </form>
      </div>

      {/* ── My tickets ── */}
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        {/* Ticket list */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-[#1C1C1C]">My Tickets</h2>
            <span className="text-sm text-[#8F8F8F]">{filteredTickets.length} total</span>
          </div>
          {filteredTickets.length ? (
            filteredTickets.map(t => (
              <TicketItem
                key={t.id}
                ticket={t}
                isActive={t.id === selectedTicketId}
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('ticketId', t.id)
                  setSearchParams(next, { replace: true })
                }}
              />
            ))
          ) : (
            <DashboardEmptyState
              title="No support tickets match your search"
              body="Try searching by ticket subject, booking reference, or message text."
            />
          )}
        </div>

        {/* Ticket conversation */}
        <div>
          {ticketLoading ? (
            <DashboardLoadingState title="Loading ticket…" compact />
          ) : selectedTicket && ticket ? (
            <div className="flex flex-col gap-4">
              {/* Ticket header */}
              <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#1C1C1C]">
                      {selectedTicket.subject}
                    </h2>
                    <p className="mt-1 text-xs text-[#8F8F8F]">
                      {selectedTicket.bookingId
                        ? `Linked to booking #${selectedTicket.bookingId}`
                        : 'General support request'}
                      {' · '}Opened {formatDashboardDate(selectedTicket.createdAt)}
                    </p>
                  </div>
                  <TicketBadge status={selectedTicket.status} />
                </div>
              </div>

              {/* Message thread */}
              <div className="rounded-2xl border border-[#EDE8E1] bg-[#EEE8E1] p-4">
                {ticket.messages?.length ? (
                  <div className="space-y-4">
                    {ticket.messages.map(msg => (
                      <div key={msg.id} className="space-y-1">
                        <MessageBubble
                          message={msg}
                          isOwnMessage={String(msg.senderId) === String(session?.user?.id)}
                        />
                        <p
                          className={`text-xs text-[#8F8F8F] ${String(msg.senderId) === String(session?.user?.id) ? 'text-right' : 'text-left'}`}
                        >
                          {formatDashboardDate(msg.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-[#8F8F8F]">
                    No messages yet on this ticket.
                  </p>
                )}
              </div>

              {/* Reply box */}
              <div className="rounded-2xl border border-[#EDE8E1] bg-[#FBF7F3] p-5">
                <form onSubmit={handleReply} className="flex flex-col gap-3">
                  <FormTextarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Reply to this support ticket…"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <GoldBtn type="submit" disabled={!reply.trim() || replyMutation.isPending}>
                      {replyMutation.isPending ? 'Sending…' : 'Send Reply'}
                    </GoldBtn>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
