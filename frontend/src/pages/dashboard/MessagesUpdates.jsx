import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDashboardSearch } from '../../components/dashboard/useDashboardSearch'
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from '../../components/dashboard/DashboardUI'
import { matchesDashboardSearch } from '../../components/dashboard/dashboardUtils'
import {
  useDashboardBookings,
  useDashboardSendMessage,
  useDashboardSession,
  useDashboardThread,
} from '../../hooks/useDashboardData'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatBookingDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatMessageType(type) {
  return String(type ?? 'text').replaceAll('_', ' ')
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ---------------------------------------------------------------------------
// Status badge (mirrors admin StatusBadge)
// ---------------------------------------------------------------------------
const statusMap = {
  active: 'bg-[#DDF7E5] text-[#16A34A]',
  confirmed: 'bg-[#DBEAFE] text-[#0383E4]',
  pending: 'bg-[#FCE7CF] text-[#C57A1E]',
  delivered: 'bg-[#EDE9FE] text-[#6D28D9]',
  completed: 'bg-[#E5E7EB] text-[#4B5563]',
  cancelled: 'bg-[#FEE2E2] text-[#B91C1C]',
  resolved: 'bg-[#E5E7EB] text-[#4B5563]',
}

function StatusBadge({ status, label }) {
  const key = String(status ?? '').toLowerCase()
  const cls = statusMap[key] ?? 'bg-[#E5E7EB] text-[#4B5563]'
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
function Avatar({ name = '', size = 'md', tone = 'brand' }) {
  const initials = getInitials(name) || '?'
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  const toneClass = tone === 'gold' ? 'bg-[#C6A15B] text-white' : 'bg-[#591902] text-[#FAFAFA]'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${toneClass}`}
    >
      {initials}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Thread card
// ---------------------------------------------------------------------------
function ThreadCard({ booking, isSelected, onClick, latestMessage }) {
  const packageTitle = booking?.package?.title || booking?.event?.name || 'Booking'
  const isArchived = isPreviousBooking(booking)
  const eventDate = formatBookingDate(booking?.eventDate)

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
        <Avatar name={packageTitle} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm font-semibold ${
                isSelected ? 'text-[#591902]' : 'text-[#1C1C1C]'
              }`}
            >
              {packageTitle}
            </p>
            {isArchived ? (
              <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[10px] text-[#4B5563]">
                Closed
              </span>
            ) : (
              <span className="rounded-full bg-[#DDF7E5] px-2 py-0.5 text-[10px] text-[#16A34A]">
                Live
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
            {booking?.statusLabel || 'Booking'}
            {eventDate ? ` · ${eventDate}` : ''}
          </p>
          {latestMessage?.createdAt && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#8F8F8F]">
              {formatTimestamp(latestMessage.createdAt)}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Message bubble (customer perspective)
// ---------------------------------------------------------------------------
function MessageBubble({ message, isOwnMessage }) {
  const senderName = isOwnMessage ? 'You' : 'Elewen team'
  const typeLabel = formatMessageType(message.messageType)

  return (
    <div className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar name={senderName} size="sm" tone={isOwnMessage ? 'gold' : 'brand'} />
      <div
        className={`flex max-w-[75%] flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#8F8F8F]">
            {senderName}
          </span>
          <span className="text-[10px] text-[#8F8F8F]">·</span>
          <span className="text-[10px] text-[#8F8F8F]">{typeLabel}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwnMessage
              ? 'rounded-tr-sm bg-[#591902] text-[#FAFAFA]'
              : 'rounded-tl-sm bg-white text-[#1C1C1C] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
          }`}
        >
          <p className="text-sm leading-6 whitespace-pre-wrap">{message.messageText}</p>
        </div>
        <p className="text-[10px] text-[#8F8F8F]">{formatTimestamp(message.createdAt)}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Context row
// ---------------------------------------------------------------------------
function ContextRow({ label, value, children }) {
  return (
    <div className="rounded-xl border border-[#E4DED8] bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#8F8F8F]">{label}</p>
      <div className="mt-2">
        {children ?? <p className="text-sm text-[#2D2D2D]">{value || '—'}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
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
  const [search, setSearch] = useState('')
  const { searchTerm } = useDashboardSearch()
  const messagesEndRef = useRef(null)

  const sendMessageMutation = useDashboardSendMessage()

  const activeBookings = useMemo(() => bookings.filter(b => !isPreviousBooking(b)), [bookings])
  const previousBookings = useMemo(() => bookings.filter(b => isPreviousBooking(b)), [bookings])

  const requestedTab = searchParams.get('tab') === 'previous' ? 'previous' : 'active'
  const activeTab =
    requestedTab === 'previous'
      ? previousBookings.length > 0 || activeBookings.length === 0
        ? 'previous'
        : 'active'
      : activeBookings.length > 0 || previousBookings.length === 0
        ? 'active'
        : 'previous'

  const baseBookings = activeTab === 'previous' ? previousBookings : activeBookings

  const visibleBookings = useMemo(() => {
    return baseBookings.filter(
      b =>
        matchesDashboardSearch(search, [b?.package?.title, b?.event?.name, b?.statusLabel]) &&
        matchesDashboardSearch(searchTerm, [
          b?.package?.title,
          b?.event?.name,
          b?.statusLabel,
          b?.locationSummary,
        ])
    )
  }, [baseBookings, search, searchTerm])

  const requestedBookingId = searchParams.get('bookingId') || ''
  const selectedBookingId = visibleBookings.some(b => b.id === requestedBookingId)
    ? requestedBookingId
    : visibleBookings[0]?.id || ''

  const selectedBooking =
    visibleBookings.find(b => b.id === selectedBookingId) ?? visibleBookings[0] ?? null
  const isReadOnlyThread = isPreviousBooking(selectedBooking)

  const {
    data: thread,
    isLoading: threadLoading,
    error: threadError,
  } = useDashboardThread(selectedBooking?.id, {
    createIfMissing: !isReadOnlyThread,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages?.length])

  if (bookingsLoading) {
    return <DashboardLoadingState title="Loading booking messages..." />
  }
  if (bookingsError || threadError) {
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

  function switchTab(tab) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    next.delete('bookingId')
    setSearchParams(next, { replace: true })
  }

  function selectBooking(id) {
    const next = new URLSearchParams(searchParams)
    next.set('bookingId', id)
    next.set('tab', activeTab)
    setSearchParams(next, { replace: true })
  }

  async function handleSubmit() {
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
    <div className="flex min-h-0 flex-col gap-6 overflow-hidden xl:h-[calc(100dvh-140px)] ">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Messages & Updates</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Track booking-specific conversations with the Elewen team. Previous bookings stay visible
          as read-only history.
        </p>
      </div>

      {/* ── Three-column layout ── */}
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        {/* ── Column 1: Thread list ── */}
        <div
          className="flex min-h-0 flex-col gap-4 rounded-[20px] border border-[#E4DED8] bg-white p-4 xl:overflow-hidden "
          data-lenis-prevent
        >
          {/* Search */}
          <div className="relative">
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
              placeholder="Search by package or event…"
              className="w-full rounded-full border border-[#E4DED8] bg-[#F7F5F2] py-2.5 pl-9 pr-4 text-sm text-[#2D2D2D] outline-none transition focus:border-[#C6A15B] focus:bg-white"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-full bg-[#F3F3F3] p-1 ">
            {[
              { key: 'active', label: 'Active', count: activeBookings.length },
              { key: 'previous', label: 'Previous', count: previousBookings.length },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-[#C7AA76] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#2D2D2D]'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#E8E2DA] text-[#6B7280]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Thread cards */}
          <div
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 xl:max-h-[720px] hide-scrollbar"
            data-lenis-prevent
          >
            {visibleBookings.length ? (
              visibleBookings.map(booking => (
                <ThreadCard
                  key={booking.id}
                  booking={booking}
                  isSelected={selectedBooking?.id === booking.id}
                  onClick={() => selectBooking(booking.id)}
                  latestMessage={
                    selectedBooking?.id === booking.id ? thread?.messages?.at(-1) : null
                  }
                />
              ))
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
        </div>

        {/* ── Column 2: Conversation ── */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#E4DED8] bg-white xl:h-full">
          {selectedBooking ? (
            <>
              {/* Conversation header */}
              <div className="flex items-center justify-between gap-4 border-b border-[#E4DED8] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name="Elewen team" size="md" />
                  <div>
                    <p className="text-sm font-semibold text-[#1C1C1C]">Elewen team</p>
                    <p className="text-xs text-[#6B7280]">Your planner & support</p>
                  </div>
                </div>
                <StatusBadge
                  status={isReadOnlyThread ? 'resolved' : selectedBooking?.status}
                  label={isReadOnlyThread ? 'Read only' : selectedBooking?.statusLabel}
                />
              </div>

              {/* Package banner */}
              <div className="border-b border-[#E4DED8] bg-[#F7F5F2] px-5 py-3">
                <p className="text-xs text-[#6B7280]">
                  <span className="font-medium text-[#2D2D2D]">
                    {selectedBooking?.package?.title || selectedBooking?.event?.name || 'Booking'}
                  </span>
                  {selectedBooking?.eventDate ? (
                    <span className="ml-2 text-[#8F8F8F]">
                      · {formatBookingDate(selectedBooking.eventDate)}
                    </span>
                  ) : null}
                </p>
              </div>

              {/* Messages */}
              <div
                className="flex min-h-[360px] flex-1 flex-col gap-5 overflow-y-auto hide-scrollbar px-5 py-5 xl:min-h-0"
                data-lenis-prevent
              >
                {threadLoading ? (
                  <DashboardLoadingState title="Loading selected conversation..." />
                ) : thread?.messages?.length ? (
                  <>
                    {thread.messages.map(message => {
                      const isOwnMessage = String(message.senderId) === String(session?.user?.id)
                      return (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwnMessage={isOwnMessage}
                        />
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <DashboardEmptyState
                      title={isReadOnlyThread ? 'No previous messages' : 'No messages yet'}
                      body={
                        isReadOnlyThread
                          ? 'This previous booking has no stored conversation history.'
                          : 'Start the conversation here. Your message will appear in this booking thread.'
                      }
                    />
                  </div>
                )}
              </div>

              {/* Compose */}
              <div className="border-t border-[#E4DED8] bg-[#FAFAFA] px-5 py-4">
                {isReadOnlyThread ? (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-dashed border-[#D6CDC3] bg-white px-4 py-3 text-xs text-[#6B7280]">
                    <svg
                      className="h-4 w-4 shrink-0 text-[#8F8F8F]"
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
                    This booking is in your previous tab — the conversation is read-only.
                  </div>
                ) : null}

                <div className="flex items-end gap-3">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    disabled={isReadOnlyThread || sendMessageMutation.isPending}
                    placeholder={
                      isReadOnlyThread
                        ? 'Read-only thread.'
                        : 'Type your message to the Elewen team…'
                    }
                    rows={3}
                    className="flex-1 resize-none rounded-2xl border border-[#E4DED8] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none transition focus:border-[#C6A15B] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={
                      isReadOnlyThread ||
                      !draft.trim() ||
                      sendMessageMutation.isPending ||
                      !thread?.id
                    }
                    onClick={handleSubmit}
                    className="flex h-12 shrink-0 items-center justify-center gap-2 self-end rounded-full bg-[#591902] px-4 text-white shadow-[0_4px_12px_rgba(89,25,2,0.25)] transition hover:bg-[#7A2B08] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="hidden text-sm font-medium sm:inline">
                      {sendMessageMutation.isPending ? 'Sending' : 'Send'}
                    </span>
                    <span>
                      {sendMessageMutation.isPending ? (
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
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-20">
              <DashboardEmptyState
                title="No conversation selected"
                body="Pick a thread from the list to read the conversation and reply."
              />
            </div>
          )}
        </div>

        {/* ── Column 3: Booking Details ── */}
        <div
          className="flex min-h-0 flex-col gap-3 rounded-[20px] border border-[#E4DED8] bg-white p-4 xl:overflow-y-auto hide-scrollbar"
          data-lenis-prevent
        >
          <div className="border-b border-[#E4DED8] pb-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
              Booking Details
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">Quick reference for this conversation</p>
          </div>

          {selectedBooking ? (
            <div className="flex flex-col gap-3">
              <ContextRow label="Booking ID">
                <p className="truncate text-sm text-[#2D2D2D]">{selectedBooking.id || '—'}</p>
              </ContextRow>
              <ContextRow label="Package">
                <p className="text-sm text-[#2D2D2D]">{selectedBooking.package?.title || '—'}</p>
              </ContextRow>
              <ContextRow label="Event Type">
                <p className="text-sm text-[#2D2D2D]">
                  {selectedBooking.event?.name || selectedBooking.displaySubtitle || '—'}
                </p>
              </ContextRow>
              <ContextRow label="Event Date">
                <p className="text-sm text-[#2D2D2D]">
                  {formatBookingDate(selectedBooking.eventDate) || '—'}
                </p>
              </ContextRow>
              <ContextRow label="Location">
                <p className="text-sm text-[#2D2D2D]">{selectedBooking.locationSummary || '—'}</p>
              </ContextRow>
              <ContextRow label="Booking Stage">
                <StatusBadge status={selectedBooking.status} label={selectedBooking.statusLabel} />
              </ContextRow>
              <ContextRow label="Vendor Assignments">
                <p className="text-sm text-[#2D2D2D]">
                  {selectedBooking.vendorAssignments?.length
                    ? `${selectedBooking.vendorAssignments.length} vendor${
                        selectedBooking.vendorAssignments.length > 1 ? 's' : ''
                      } linked`
                    : 'None assigned yet'}
                </p>
              </ContextRow>

              <button
                type="button"
                onClick={() => navigate(`/user-dashboard/details?bookingId=${selectedBooking.id}`)}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-[#CDB17E] px-5 text-sm font-semibold text-[#FAFAFA] transition hover:bg-[#C6A15B]"
              >
                View Full Booking
              </button>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center py-10">
              <DashboardEmptyState
                title="No context"
                body="Select a conversation to load booking details."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
