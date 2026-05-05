import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
  DashboardPageIntro,
  DashboardSelectorList,
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
import { formatDashboardDate } from '../../components/dashboard/dashboardUtils'

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
  const selectedTicketId = searchParams.get('ticketId') || ''
  const [newTicket, setNewTicket] = useState({ bookingId: '', subject: '', message: '' })
  const [reply, setReply] = useState('')

  useEffect(() => {
    if (!tickets.length) return
    if (selectedTicketId && tickets.some(ticket => ticket.id === selectedTicketId)) return

    const next = new URLSearchParams(searchParams)
    next.set('ticketId', tickets[0].id)
    setSearchParams(next, { replace: true })
  }, [tickets, searchParams, selectedTicketId, setSearchParams])

  const {
    data: ticket,
    isLoading: ticketLoading,
    error: ticketError,
  } = useDashboardSupportTicket(selectedTicketId)
  const createTicketMutation = useDashboardCreateTicket()
  const replyMutation = useDashboardReplyToTicket()

  const selectedTicket = useMemo(
    () => tickets.find(item => item.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  )

  if (helpLoading || ticketsLoading) {
    return <DashboardLoadingState title="Loading support and help..." />
  }

  if (helpError || ticketsError || ticketError) {
    return <DashboardErrorState title="We could not load support details right now." />
  }

  const handleCreateTicket = async event => {
    event.preventDefault()
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return

    await createTicketMutation.mutateAsync({
      bookingId: newTicket.bookingId || undefined,
      subject: newTicket.subject.trim(),
      message: newTicket.message.trim(),
      priority: 'medium',
    })

    setNewTicket({ bookingId: '', subject: '', message: '' })
  }

  const handleReply = async event => {
    event.preventDefault()
    if (!reply.trim() || !selectedTicketId) return

    await replyMutation.mutateAsync({
      ticketId: selectedTicketId,
      body: { message: reply.trim() },
    })

    setReply('')
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Support & Help"
        subtitle="Reach the Elewen team, raise a ticket, and continue open conversations from one place."
        meta={`${tickets.length} tickets`}
      />

      <SectionCard
        title="Direct Support"
        subtitle="Live contact details from your dashboard settings."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Phone</p>
            <p className="mt-2 text-sm text-[#2E2E2E]">{help?.primaryPhone || 'Not shared yet'}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Email</p>
            <p className="mt-2 text-sm text-[#2E2E2E]">{help?.supportEmail || 'Not shared yet'}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">WhatsApp</p>
            <p className="mt-2 text-sm text-[#2E2E2E]">
              {help?.whatsappNumber || 'Not shared yet'}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">Availability</p>
            <p className="mt-2 text-sm text-[#2E2E2E]">
              {help?.supportAvailabilityText || 'Availability text not set yet'}
            </p>
          </div>
        </div>
        {help?.responseExpectationText ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-[#6B7280]">
            {help.responseExpectationText}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          {help?.whatsappNumber ? (
            <a
              href={`https://wa.me/${String(help.whatsappNumber).replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90"
            >
              Call / WhatsApp
            </a>
          ) : null}
          {help?.supportEmail ? (
            <a
              href={`mailto:${help.supportEmail}`}
              className="rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902]"
            >
              Email
            </a>
          ) : null}
          <a
            href="/user-dashboard/messages"
            className="rounded-full border border-[#D2C9BF] px-5 py-3 text-sm text-[#591902] transition hover:border-[#591902]"
          >
            Message Admin
          </a>
        </div>
      </SectionCard>

      <SectionCard
        title="Create a Ticket"
        subtitle="Open a new support request for a booking or a general question."
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
              placeholder="Share the issue, update, or request in a little detail"
            />
          </label>

          <div className="lg:col-span-2 flex justify-end">
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

      {tickets.length === 0 ? (
        <DashboardEmptyState
          title="No support tickets yet"
          body="Your open and resolved support tickets will appear here once you create one."
        />
      ) : (
        <>
          <DashboardSelectorList
            items={tickets}
            selectedId={selectedTicketId}
            onSelect={ticketId => {
              const next = new URLSearchParams(searchParams)
              next.set('ticketId', ticketId)
              setSearchParams(next, { replace: true })
            }}
            getLabel={item => item.subject}
            getSubLabel={item =>
              `${item.status.replace(/_/g, ' ')} · ${formatDashboardDate(item.createdAt)}`
            }
          />

          {ticketLoading ? (
            <DashboardLoadingState title="Loading selected support ticket..." />
          ) : selectedTicket && ticket ? (
            <SectionCard
              title={selectedTicket.subject}
              subtitle={
                selectedTicket.bookingId
                  ? `Linked booking: ${selectedTicket.bookingId}`
                  : 'General support request'
              }
              action={
                <StatusPill
                  label={selectedTicket.status.replace(/_/g, ' ')}
                  status={selectedTicket.status}
                />
              }
            >
              <div className="space-y-4 rounded-3xl bg-[#EEE8E1] p-4">
                {ticket.messages?.map(message => (
                  <div key={message.id} className="space-y-2">
                    <MessageBubble
                      message={message}
                      isOwnMessage={String(message.senderId) === String(session?.user?.id)}
                    />
                    <p
                      className={`text-xs text-[#6B7280] ${
                        String(message.senderId) === String(session?.user?.id)
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {formatDashboardDate(message.createdAt)}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="mt-5 space-y-3">
                <textarea
                  rows={4}
                  value={reply}
                  onChange={event => setReply(event.target.value)}
                  className="w-full rounded-3xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm outline-none"
                  placeholder="Reply to this support ticket..."
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!reply.trim() || replyMutation.isPending}
                    className="rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </SectionCard>
          ) : null}
        </>
      )}
    </div>
  )
}
