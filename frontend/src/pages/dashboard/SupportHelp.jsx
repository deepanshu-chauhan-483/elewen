import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
  MessageBubble,
  SectionCard,
  StatusPill,
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

function isClosedTicket(ticket) {
  return ['resolved', 'closed'].includes(String(ticket?.status ?? '').toLowerCase())
}

function formatDateTime(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function SupportHelp() {
  const { data: session } = useDashboardSession()
  const { data: bookings = [] } = useDashboardBookings('all')
  const { data: help, isLoading: helpLoading, error: helpError } = useDashboardHelp()
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError,
  } = useDashboardSupportTickets()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab') === 'closed' ? 'closed' : 'active'
  const bookingFilter = searchParams.get('kind') || 'all'
  const [newTicket, setNewTicket] = useState({ bookingId: '', subject: '', message: '' })
  const [reply, setReply] = useState('')
  const createTicketMutation = useDashboardCreateTicket()
  const replyMutation = useDashboardReplyToTicket()

  const activeTickets = useMemo(() => tickets.filter(ticket => !isClosedTicket(ticket)), [tickets])
  const closedTickets = useMemo(() => tickets.filter(ticket => isClosedTicket(ticket)), [tickets])
  const activeTab =
    requestedTab === 'closed'
      ? closedTickets.length > 0 || activeTickets.length === 0
        ? 'closed'
        : 'active'
      : activeTickets.length > 0 || closedTickets.length === 0
        ? 'active'
        : 'closed'
  const visibleTicketsBase = activeTab === 'closed' ? closedTickets : activeTickets
  const visibleTickets = useMemo(() => {
    if (bookingFilter === 'booking') {
      return visibleTicketsBase.filter(ticket => ticket.bookingId)
    }

    if (bookingFilter === 'general') {
      return visibleTicketsBase.filter(ticket => !ticket.bookingId)
    }

    return visibleTicketsBase
  }, [bookingFilter, visibleTicketsBase])
  const requestedTicketId = searchParams.get('ticketId') || ''
  const selectedTicketId = visibleTickets.some(ticket => ticket.id === requestedTicketId)
    ? requestedTicketId
    : visibleTickets[0]?.id || ''

  const selectedTicket =
    visibleTickets.find(item => item.id === selectedTicketId) ?? visibleTickets[0] ?? null
  const {
    data: ticket,
    isLoading: ticketLoading,
    error: ticketError,
  } = useDashboardSupportTicket(selectedTicket?.id)
  const isReadOnlyTicket = isClosedTicket(ticket ?? selectedTicket)

  if (helpLoading || ticketsLoading) {
    return <DashboardLoadingState title="Loading support and help..." />
  }

  if (helpError || ticketsError || ticketError) {
    return <DashboardErrorState title="We could not load support details right now." />
  }

  async function handleCreateTicket(event) {
    event.preventDefault()
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return

    const response = await createTicketMutation.mutateAsync({
      bookingId: newTicket.bookingId || undefined,
      subject: newTicket.subject.trim(),
      message: newTicket.message.trim(),
      priority: 'medium',
    })

    const createdTicketId = response?.ticket?.id
    setNewTicket({ bookingId: '', subject: '', message: '' })

    if (createdTicketId) {
      const next = new URLSearchParams(searchParams)
      next.set('ticketId', createdTicketId)
      next.set('tab', 'active')
      next.set('kind', bookingFilter)
      setSearchParams(next, { replace: true })
    }
  }

  async function handleReply(event) {
    event.preventDefault()
    if (!reply.trim() || !selectedTicket?.id || isReadOnlyTicket) return

    await replyMutation.mutateAsync({
      ticketId: selectedTicket.id,
      body: { message: reply.trim() },
    })

    setReply('')
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Support & Help"
        subtitle="Use direct support channels, open a ticket, and continue active conversations from one workspace."
        meta={`${activeTickets.length} active / ${closedTickets.length} closed`}
      />

      <SectionCard
        title="Support Channels"
        subtitle="Choose the fastest way to reach the Elewen support team."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
              Call / WhatsApp
            </p>
            <p className="mt-3 text-sm text-[#2E2E2E]">
              {help?.whatsappNumber || help?.primaryPhone || 'Not shared yet'}
            </p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Use this if you want the contact info and prefer to speak outside the portal.
            </p>
            {help?.whatsappNumber || help?.primaryPhone ? (
              <a
                href={`https://wa.me/${String(help?.whatsappNumber || help?.primaryPhone).replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90"
              >
                Call / WhatsApp
              </a>
            ) : null}
          </div>

          <div className="rounded-3xl bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Email</p>
            <p className="mt-3 text-sm text-[#2E2E2E]">{help?.supportEmail || 'Not shared yet'}</p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Send a direct email to the admin team without leaving your dashboard context.
            </p>
            {help?.supportEmail ? (
              <a
                href={`mailto:${help.supportEmail}`}
                className="mt-4 inline-flex rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902]"
              >
                Email Support
              </a>
            ) : null}
          </div>

          <div className="rounded-3xl bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Message Admin</p>
            <p className="mt-3 text-sm text-[#2E2E2E]">Portal chat and support tickets</p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Send a message inside the portal and keep it tied to your booking or support ticket.
            </p>
            <a
              href="/user-dashboard/messages"
              className="mt-4 inline-flex rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902]"
            >
              Open Messages
            </a>
          </div>
        </div>

        {(help?.supportAvailabilityText || help?.responseExpectationText) && (
          <div className="mt-4 rounded-3xl bg-white p-5 text-sm text-[#6B7280]">
            <p>{help?.supportAvailabilityText || 'Availability details not set yet.'}</p>
            {help?.responseExpectationText ? (
              <p className="mt-2">{help.responseExpectationText}</p>
            ) : null}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Create a Ticket"
        subtitle="Open a general help request or link the ticket to a booking."
      >
        <form onSubmit={handleCreateTicket} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-[#2E2E2E]">Related booking</span>
            <select
              value={newTicket.bookingId}
              onChange={event =>
                setNewTicket(current => ({ ...current, bookingId: event.target.value }))
              }
              className="w-full rounded-2xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="">General support</option>
              {bookings.map(booking => (
                <option key={booking.id} value={booking.id}>
                  {booking.package?.title || booking.event?.name || booking.id}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-[#2E2E2E]">Subject</span>
            <input
              value={newTicket.subject}
              onChange={event =>
                setNewTicket(current => ({ ...current, subject: event.target.value }))
              }
              className="w-full rounded-2xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm outline-none"
              placeholder="Tell us what you need help with"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm text-[#2E2E2E]">Message</span>
            <textarea
              rows={4}
              value={newTicket.message}
              onChange={event =>
                setNewTicket(current => ({ ...current, message: event.target.value }))
              }
              className="w-full rounded-3xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm outline-none"
              placeholder="Share the issue, update, or request in a little detail."
            />
          </label>

          <div className="flex justify-end lg:col-span-2">
            <button
              type="submit"
              disabled={
                !newTicket.subject.trim() ||
                !newTicket.message.trim() ||
                createTicketMutation.isPending
              }
              className="rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Ticket Queue"
          subtitle="Switch between active tickets and closed history."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full bg-white p-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.set('tab', 'active')
                    next.set('kind', bookingFilter)
                    setSearchParams(next, { replace: true })
                  }}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeTab === 'active' ? 'bg-[#591902] text-white' : 'text-[#6B7280]'
                  }`}
                >
                  Active Tickets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.set('tab', 'closed')
                    next.set('kind', bookingFilter)
                    setSearchParams(next, { replace: true })
                  }}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeTab === 'closed' ? 'bg-[#591902] text-white' : 'text-[#6B7280]'
                  }`}
                >
                  Closed Tickets
                </button>
              </div>

              <select
                value={bookingFilter}
                onChange={event => {
                  const next = new URLSearchParams(searchParams)
                  next.set('kind', event.target.value)
                  next.set('tab', activeTab)
                  setSearchParams(next, { replace: true })
                }}
                className="rounded-2xl border border-[#D7CEC4] bg-white px-4 py-2 text-sm outline-none"
              >
                <option value="all">All tickets</option>
                <option value="booking">Booking-linked</option>
                <option value="general">General support</option>
              </select>
            </div>

            {visibleTickets.length ? (
              <div className="space-y-3">
                {visibleTickets.map(item => {
                  const isSelected = item.id === selectedTicket?.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams)
                        next.set('ticketId', item.id)
                        next.set('tab', activeTab)
                        next.set('kind', bookingFilter)
                        setSearchParams(next, { replace: true })
                      }}
                      className={`block w-full rounded-3xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? 'border-[#591902] bg-[#F4E7DE]'
                          : 'border-[#E4DED8] bg-white hover:border-[#C6A15B]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#2E2E2E]">{item.subject}</p>
                          <p className="mt-1 text-xs text-[#6B7280]">
                            {item.bookingId ? 'Booking-linked' : 'General support'} ·{' '}
                            {formatDateTime(item.updatedAt || item.createdAt)}
                          </p>
                        </div>
                        <StatusPill
                          label={String(item.status ?? '').replaceAll('_', ' ')}
                          status={item.status}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <DashboardEmptyState
                title={activeTab === 'active' ? 'No active tickets' : 'No closed tickets'}
                body={
                  activeTab === 'active'
                    ? 'Create a ticket above or use the support channels to start a conversation.'
                    : 'Resolved and closed support threads will show up here as read-only history.'
                }
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={ticket?.subject || selectedTicket?.subject || 'Ticket Detail'}
          subtitle={
            ticket?.bookingId ? `Linked booking: ${ticket.bookingId}` : 'General support request'
          }
          action={
            ticket ? (
              <StatusPill
                label={String(ticket.status ?? '').replaceAll('_', ' ')}
                status={ticket.status}
              />
            ) : null
          }
        >
          {!selectedTicket ? (
            <DashboardEmptyState
              title="No ticket selected"
              body="Choose a ticket from the left to review the conversation and its status."
            />
          ) : ticketLoading ? (
            <DashboardLoadingState title="Loading selected ticket..." />
          ) : ticket ? (
            <div className="space-y-5">
              <div className="rounded-3xl bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill
                    label={String(ticket.priority ?? 'medium').replaceAll('_', ' ')}
                    status={ticket.priority}
                  />
                  <span className="text-xs uppercase tracking-[0.16em] text-[#8F8F8F]">
                    {ticket.bookingId ? 'Booking-linked ticket' : 'General support'}
                  </span>
                </div>
              </div>

              <div className="max-h-[460px] space-y-4 overflow-y-auto rounded-3xl bg-white p-4">
                {ticket.messages?.length ? (
                  ticket.messages.map(message => {
                    const isOwnMessage = String(message.senderId) === String(session?.user?.id)

                    return (
                      <div key={message.id}>
                        <div className={`${isOwnMessage ? 'text-right' : 'text-left'} mb-1`}>
                          <span className="text-[11px] uppercase tracking-[0.16em] text-[#8F8F8F]">
                            {isOwnMessage ? 'You' : 'Support team'}
                          </span>
                        </div>
                        <MessageBubble message={message} isOwnMessage={isOwnMessage} />
                        <p
                          className={`mt-1 text-xs text-[#8F8F8F] ${
                            isOwnMessage ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <DashboardEmptyState
                    title="No conversation yet"
                    body="The opening ticket note and future replies will appear here."
                  />
                )}
              </div>

              <form onSubmit={handleReply} className="space-y-3 rounded-3xl bg-white p-4">
                {isReadOnlyTicket ? (
                  <div className="rounded-2xl border border-dashed border-[#D6CDC3] bg-[#F7F5F2] p-4 text-sm text-[#6B7280]">
                    This ticket is closed or resolved, so the conversation stays visible as
                    read-only history.
                  </div>
                ) : null}

                <textarea
                  rows={4}
                  value={reply}
                  onChange={event => setReply(event.target.value)}
                  disabled={isReadOnlyTicket || replyMutation.isPending}
                  className="w-full rounded-3xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-[#F7F5F2]"
                  placeholder={
                    isReadOnlyTicket
                      ? 'This ticket is read-only.'
                      : 'Reply to this support ticket...'
                  }
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!reply.trim() || replyMutation.isPending || isReadOnlyTicket}
                    className="rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </SectionCard>
      </div>
    </div>
  )
}
