import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DashboardEmptyState, DashboardErrorState, DashboardLoadingState, DashboardPageIntro, DashboardSelectorList, MessageBubble, SectionCard } from '../../components/dashboard/DashboardUI'
import { useDashboardBookings, useDashboardSendMessage, useDashboardSession, useDashboardThread } from '../../hooks/useDashboardData'
import { formatDashboardDate } from '../../components/dashboard/dashboardUtils'

export default function MessagesUpdates() {
  const { data: session } = useDashboardSession()
  const { data: bookings = [], isLoading: bookingsLoading, error: bookingsError } = useDashboardBookings('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedBookingId = searchParams.get('bookingId') || ''
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!bookings.length) return
    if (selectedBookingId && bookings.some(booking => booking.id === selectedBookingId)) return

    const next = new URLSearchParams(searchParams)
    next.set('bookingId', bookings[0].id)
    setSearchParams(next, { replace: true })
  }, [bookings, searchParams, selectedBookingId, setSearchParams])

  const { data: thread, isLoading: threadLoading, error: threadError } = useDashboardThread(selectedBookingId)
  const sendMessageMutation = useDashboardSendMessage()

  const selectedBooking = useMemo(
    () => bookings.find(booking => booking.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId]
  )

  if (bookingsLoading) {
    return <DashboardLoadingState title="Loading booking messages..." />
  }

  if (bookingsError || threadError) {
    return <DashboardErrorState title="We could not load your message threads." />
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!draft.trim() || !thread?.id || !selectedBookingId) return

    await sendMessageMutation.mutateAsync({
      threadId: thread.id,
      bookingId: selectedBookingId,
      messageText: draft.trim(),
    })

    setDraft('')
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Messages & Updates"
        subtitle="Stay in touch with your event team and keep every booking conversation in one place."
        meta={`${bookings.length} conversations`}
      />

      {bookings.length === 0 ? (
        <DashboardEmptyState
          title="No booking conversations yet"
          body="Once you have a booking, your planner updates and direct messages will appear here."
          actionLabel="Explore Packages"
          actionTo="/package-listing"
        />
      ) : (
        <>
          <DashboardSelectorList
            items={bookings}
            selectedId={selectedBookingId}
            onSelect={bookingId => {
              const next = new URLSearchParams(searchParams)
              next.set('bookingId', bookingId)
              setSearchParams(next, { replace: true })
            }}
            getLabel={item => item.package?.title || item.event?.name || 'Booking'}
            getSubLabel={item => `${item.statusLabel} · ${formatDashboardDate(item.eventDate)}`}
          />

          {threadLoading ? (
            <DashboardLoadingState title="Loading messages for this booking..." />
          ) : (
            <SectionCard
              title={selectedBooking?.package?.title || selectedBooking?.event?.name || 'Booking Messages'}
              subtitle={selectedBooking ? `Latest status: ${selectedBooking.statusLabel}` : 'Conversation thread'}
            >
              <div className="space-y-4 rounded-3xl bg-[#EEE8E1] p-4">
                {thread?.messages?.length ? (
                  thread.messages.map(message => (
                    <div key={message.id} className="space-y-2">
                      <MessageBubble
                        message={message}
                        isOwnMessage={String(message.senderId) === String(session?.user?.id)}
                      />
                      <p
                        className={`text-xs text-[#6B7280] ${
                          String(message.senderId) === String(session?.user?.id) ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatDashboardDate(message.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <DashboardEmptyState
                    title="No messages yet"
                    body="The thread is ready. Send the first message whenever you need to share an update or ask a question."
                  />
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <textarea
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  placeholder="Write a message for your planner or support team..."
                  rows={4}
                  className="w-full rounded-3xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#591902]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!draft.trim() || sendMessageMutation.isPending || !thread?.id}
                    className="rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}
