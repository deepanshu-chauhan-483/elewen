import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  useDashboardClearAllNotifications,
  useDashboardMarkAllNotificationsRead,
  useDashboardMarkNotificationRead,
  useDashboardNotifications,
  useDashboardSendMessage,
  useDashboardSession,
  useDashboardThread,
} from '../../hooks/useDashboardData'

function isPreviousBooking(booking) {
  return String(booking?.bookingCategory ?? '').toLowerCase() === 'previous'
}

function formatTimestamp(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatMessageType(type) {
  return String(type ?? 'text')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export default function MessagesUpdates() {
  const navigate = useNavigate()
  const { data: session } = useDashboardSession()
  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useDashboardBookings('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState('')
  const requestedTab = searchParams.get('tab') === 'previous' ? 'previous' : 'active'
  const {
    data: notificationData,
    isLoading: notificationsLoading,
    error: notificationsError,
  } = useDashboardNotifications({
    limit: 100,
  })
  const markReadMutation = useDashboardMarkNotificationRead()
  const markAllReadMutation = useDashboardMarkAllNotificationsRead()
  const clearAllNotificationsMutation = useDashboardClearAllNotifications()
  const sendMessageMutation = useDashboardSendMessage()

  const activeBookings = useMemo(
    () => bookings.filter(booking => !isPreviousBooking(booking)),
    [bookings]
  )
  const previousBookings = useMemo(
    () => bookings.filter(booking => isPreviousBooking(booking)),
    [bookings]
  )
  const activeTab =
    requestedTab === 'previous'
      ? previousBookings.length > 0 || activeBookings.length === 0
        ? 'previous'
        : 'active'
      : activeBookings.length > 0 || previousBookings.length === 0
        ? 'active'
        : 'previous'
  const visibleBookings = activeTab === 'previous' ? previousBookings : activeBookings
  const requestedBookingId = searchParams.get('bookingId') || ''
  const selectedBookingId = visibleBookings.some(booking => booking.id === requestedBookingId)
    ? requestedBookingId
    : visibleBookings[0]?.id || ''

  const selectedBooking =
    visibleBookings.find(booking => booking.id === selectedBookingId) ?? visibleBookings[0] ?? null
  const isReadOnlyThread = isPreviousBooking(selectedBooking)
  const {
    data: thread,
    isLoading: threadLoading,
    error: threadError,
  } = useDashboardThread(selectedBooking?.id, {
    createIfMissing: !isReadOnlyThread,
  })

  const notifications = useMemo(
    () => notificationData?.notifications ?? [],
    [notificationData?.notifications]
  )
  const unreadNotificationCount = Number(notificationData?.unreadCount ?? 0)

  if (bookingsLoading) {
    return <DashboardLoadingState title="Loading booking messages..." />
  }

  if (bookingsError || threadError || notificationsError) {
    return <DashboardErrorState title="We could not load your messages and updates." />
  }

  if (bookings.length === 0) {
    return (
      <DashboardEmptyState
        title="No booking conversations yet"
        body="Once you have a booking, your planner updates and direct messages will appear here."
        actionLabel="Explore Packages"
        actionTo="/package-listing"
      />
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!draft.trim() || !thread?.id || !selectedBooking?.id || isReadOnlyThread) return

    await sendMessageMutation.mutateAsync({
      threadId: thread.id,
      bookingId: selectedBooking.id,
      messageText: draft.trim(),
      messageType: 'text',
    })

    setDraft('')
  }

  return (
    <div className="space-y-6">
      <DashboardPageIntro
        title="Messages & Updates"
        subtitle="Track booking-specific chat history, planner updates, and read-only past conversations in one place."
        meta={`${activeBookings.length} active / ${previousBookings.length} previous`}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr_0.9fr]">
        <SectionCard
          title="Booking Threads"
          subtitle="Active bookings stay writable. Previous bookings become read-only history."
        >
          <div className="space-y-4">
            <div className="inline-flex rounded-full bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('tab', 'active')
                  setSearchParams(next, { replace: true })
                }}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeTab === 'active' ? 'bg-[#591902] text-white' : 'text-[#6B7280]'
                }`}
              >
                Active Bookings
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('tab', 'previous')
                  setSearchParams(next, { replace: true })
                }}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activeTab === 'previous' ? 'bg-[#591902] text-white' : 'text-[#6B7280]'
                }`}
              >
                Previous Bookings
              </button>
            </div>

            {visibleBookings.length ? (
              <div className="space-y-3">
                {visibleBookings.map(booking => {
                  const isSelected = booking.id === selectedBooking?.id
                  const latestThreadMessage =
                    selectedBooking?.id === booking.id ? thread?.messages?.at(-1) : null

                  return (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams)
                        next.set('bookingId', booking.id)
                        next.set('tab', activeTab)
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
                          <p className="text-sm font-medium text-[#2E2E2E]">
                            {booking?.package?.title || booking?.event?.name || 'Booking'}
                          </p>
                          <p className="mt-1 text-xs text-[#6B7280]">
                            {booking?.statusLabel || 'Booking'} ·{' '}
                            {formatBookingDate(booking?.eventDate)}
                          </p>
                          <p className="mt-2 text-xs text-[#8F8F8F]">
                            {latestThreadMessage?.messageText ||
                              booking?.displaySubtitle ||
                              'Open this thread to view conversation history.'}
                          </p>
                        </div>
                        <StatusPill
                          label={isPreviousBooking(booking) ? 'Read only' : 'Live'}
                          status={isPreviousBooking(booking) ? 'completed' : booking?.status}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <DashboardEmptyState
                title={activeTab === 'active' ? 'No active booking threads' : 'No previous threads'}
                body={
                  activeTab === 'active'
                    ? 'When a booking becomes active, its conversation thread will show up here.'
                    : 'Completed or cancelled booking conversations will appear here as read-only history.'
                }
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={selectedBooking?.package?.title || 'Conversation'}
          subtitle={
            selectedBooking
              ? `${selectedBooking?.statusLabel || 'Booking'} · ${selectedBooking?.locationSummary || 'Event details in progress'}`
              : 'Choose a booking thread'
          }
          action={
            selectedBooking ? (
              <StatusPill
                label={isReadOnlyThread ? 'Read only history' : 'Message input enabled'}
                status={isReadOnlyThread ? 'completed' : selectedBooking?.status}
              />
            ) : null
          }
        >
          {!selectedBooking ? (
            <DashboardEmptyState
              title="No conversation selected"
              body="Choose a booking from the left to open its message history."
            />
          ) : threadLoading ? (
            <DashboardLoadingState title="Loading selected conversation..." />
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill
                    label={selectedBooking?.statusLabel || 'Status'}
                    status={selectedBooking?.status}
                  />
                  <span className="text-xs uppercase tracking-[0.16em] text-[#8F8F8F]">
                    {selectedBooking?.event?.name ||
                      selectedBooking?.displaySubtitle ||
                      'Booking thread'}
                  </span>
                </div>
              </div>

              <div className="max-h-[520px] space-y-4 overflow-y-auto rounded-3xl bg-white p-4">
                {thread?.messages?.length ? (
                  thread.messages.map(message => {
                    const isOwnMessage = String(message.senderId) === String(session?.user?.id)

                    return (
                      <div key={message.id}>
                        <div className={`${isOwnMessage ? 'text-right' : 'text-left'} mb-1`}>
                          <span className="text-[11px] uppercase tracking-[0.16em] text-[#8F8F8F]">
                            {isOwnMessage ? 'You' : 'Elewen team'} ·{' '}
                            {formatMessageType(message.messageType)}
                          </span>
                        </div>
                        <MessageBubble message={message} isOwnMessage={isOwnMessage} />
                        <p
                          className={`mt-1 text-xs text-[#8F8F8F] ${
                            isOwnMessage ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatTimestamp(message.createdAt)}
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <DashboardEmptyState
                    title={isReadOnlyThread ? 'No previous messages' : 'No messages yet'}
                    body={
                      isReadOnlyThread
                        ? 'This previous booking has no stored conversation history.'
                        : 'Start the conversation here. Your message will appear in this booking thread.'
                    }
                  />
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl bg-white p-4">
                {isReadOnlyThread ? (
                  <div className="rounded-2xl border border-dashed border-[#D6CDC3] bg-[#F7F5F2] p-4 text-sm text-[#6B7280]">
                    This booking is in your previous tab, so the conversation stays visible but
                    read-only.
                  </div>
                ) : null}

                <textarea
                  rows={4}
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  disabled={isReadOnlyThread || sendMessageMutation.isPending}
                  className="w-full rounded-3xl border border-[#D7CEC4] bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-[#F7F5F2]"
                  placeholder={
                    isReadOnlyThread
                      ? 'This conversation is read-only.'
                      : 'Type your message to the Elewen team...'
                  }
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      isReadOnlyThread ||
                      !draft.trim() ||
                      sendMessageMutation.isPending ||
                      !thread?.id
                    }
                    className="rounded-full bg-[#C6A15B] px-5 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Updates"
          subtitle="Planner notifications and operational nudges land here."
        >
          {notificationsLoading ? (
            <DashboardLoadingState title="Loading notifications..." />
          ) : notifications.length ? (
            <div className="space-y-3">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => clearAllNotificationsMutation.mutate()}
                  disabled={!notifications.length || clearAllNotificationsMutation.isPending}
                  className="text-sm font-medium text-[#8F2D1F] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {clearAllNotificationsMutation.isPending ? 'Clearing...' : 'Clear all'}
                </button>
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={!unreadNotificationCount || markAllReadMutation.isPending}
                  className="text-sm font-medium text-[#591902] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {markAllReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                </button>
              </div>

              {notifications.map(notification => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={async () => {
                    if (!notification.isRead) {
                      await markReadMutation.mutateAsync(notification.id)
                    }

                    const nextPath = resolveNotificationLink(notification.linkUrl)
                    if (nextPath) navigate(nextPath)
                  }}
                  className={`block w-full rounded-2xl border px-4 py-4 text-left transition ${
                    notification.isRead
                      ? 'border-[#E8E1DA] bg-white'
                      : 'border-[#E7D2C4] bg-[#FFF8F2]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#2E2E2E]">
                        {notification.title || 'Notification'}
                      </p>
                      {notification.message ? (
                        <p className="mt-1 text-sm text-[#6B7280]">{notification.message}</p>
                      ) : null}
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[#9CA3AF]">
                        {formatTimestamp(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead ? (
                      <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#C68B1E]" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="No updates yet"
              body="New planner notes, booking updates, and support nudges will appear here."
            />
          )}
        </SectionCard>
      </div>
    </div>
  )
}

function formatBookingDate(value) {
  if (!value) return 'Date pending'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date pending'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function resolveNotificationLink(linkUrl) {
  const url = String(linkUrl ?? '').trim()
  if (!url) return ''

  const messageMatch = url.match(/^\/dashboard\/messages\?bookingId=([^&#]+)/i)
  if (messageMatch?.[1]) {
    return `/user-dashboard/messages?bookingId=${messageMatch[1]}`
  }

  const bookingMatch = url.match(/^\/dashboard\/bookings\/([^/?#]+)/i)
  if (bookingMatch?.[1]) {
    return `/user-dashboard/details?bookingId=${bookingMatch[1]}`
  }

  if (url.startsWith('/dashboard')) {
    return url.replace(/^\/dashboard/i, '/user-dashboard')
  }

  return url
}
