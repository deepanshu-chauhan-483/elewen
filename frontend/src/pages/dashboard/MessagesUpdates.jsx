import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useDashboardSearch } from '../../components/dashboard/useDashboardSearch'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
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
import EmptyBooking from '../../components/dashboard/EmptyBooking'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPreviousBooking(booking) {
  const normalizedStatus = String(booking?.status ?? '')
    .trim()
    .toLowerCase()

  return ['completed', 'cancelled', 'canceled'].includes(normalizedStatus)
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
// Status badge
// ---------------------------------------------------------------------------
const statusMap = {
  active: 'bg-[#EAF8F1] text-[#238E64]',
  confirmed: 'bg-[#EEF4FF] text-[#3061C6]',
  pending: 'bg-[#FFF4E5] text-[#C07318]',
  delivered: 'bg-[#EEF4FF] text-[#3061C6]',
  completed: 'bg-[#F3F4F6] text-[#6B7280]',
  cancelled: 'bg-[#FFF1F0] text-[#591902]',
  resolved: 'bg-[#EAF8F1] text-[#238E64]',
  in_progress: 'bg-[#FFF4E5] text-[#C07318]',
}

function StatusBadge({ status, label }) {
  const key = status?.toLowerCase()?.replace(/[\s-]+/g, '_') ?? ''
  const cls = statusMap[key] ?? 'bg-[#FFF4E5] text-[#C07318]'
  const text = label ?? key.charAt(0).toUpperCase() + key.slice(1) ?? '-'
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
// Thread card — with unread badge like admin side
// ---------------------------------------------------------------------------
function ThreadCard({ booking, isSelected, onClick, unreadCount, latestMessageTime }) {
  const packageTitle = booking?.package?.title || booking?.event?.name || 'Booking'
  const isArchived = isPreviousBooking(booking)
  const eventDate = formatBookingDate(booking?.eventDate)
  const unread = unreadCount || 0

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
              className={`truncate text-sm font-semibold ${isSelected ? 'text-[#591902]' : 'text-[#1C1C1C]'}`}
            >
              {packageTitle}
            </p>
            {/* Unread count badge — mirrors admin side exactly */}
            {unread > 0 ? (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#591902] px-1.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            ) : isArchived ? (
              <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-[10px] text-[#4B5563]">
                Closed
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#6B7280]">
            {booking?.statusLabel || 'Booking'}
            {eventDate ? ` · ${eventDate}` : ''}
          </p>
          {latestMessageTime && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#8F8F8F]">
              {formatTimestamp(latestMessageTime)}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Message bubble
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
// Thread slide-over panel — GSAP animations + instant scroll-to-bottom
// ---------------------------------------------------------------------------
function MessageThreadPanel({
  booking,
  thread,
  threadLoading,
  draft,
  sendMessageMutation,
  session,
  onClose,
  onDraftChange,
  onSend,
}) {
  const backdropRef = useRef(null)
  const asideRef = useRef(null)
  const messagesScrollRef = useRef(null)

  // Track mounted state so we can keep DOM alive during close animation
  const [mounted, setMounted] = useState(false)
  const [renderedBooking, setRenderedBooking] = useState(booking)
  const [renderedThread, setRenderedThread] = useState(thread)
  const isAnimatingOut = useRef(false)
  const tlRef = useRef(null)

  // ── Open / Close animations ──────────────────────────────────────────────
  useLayoutEffect(() => {
    if (booking && !isAnimatingOut.current) {
      // Immediately update content so it renders before animating in
      const raf = requestAnimationFrame(() => {
        setRenderedBooking(booking)
        setRenderedThread(thread)
        setMounted(true)
      })
      return () => cancelAnimationFrame(raf)
    }
    return undefined
  }, [booking]) // eslint-disable-line

  // Run open animation after DOM is painted
  useEffect(() => {
    if (!mounted || !booking || !backdropRef.current || !asideRef.current) return

    // Kill any running tl
    tlRef.current?.kill()

    gsap.set(asideRef.current, { x: '100%' })
    gsap.set(backdropRef.current, { opacity: 0, pointerEvents: 'auto' })

    tlRef.current = gsap.timeline()
    tlRef.current
      .to(backdropRef.current, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      .to(asideRef.current, { x: '0%', duration: 0.45, ease: 'expo.out' }, '<0.05')
  }, [mounted, booking])

  // Update renderedThread when thread data refreshes while panel is open
  useEffect(() => {
    if (mounted && booking) {
      const raf = requestAnimationFrame(() => setRenderedThread(thread))
      return () => cancelAnimationFrame(raf)
    }
    return undefined
  }, [thread, mounted, booking])

  // ── Scroll to bottom instantly whenever messages change or panel opens ───
  useEffect(() => {
    if (!messagesScrollRef.current || !renderedThread?.messages?.length) return
    // Use requestAnimationFrame to ensure DOM has painted new messages
    const raf = requestAnimationFrame(() => {
      if (messagesScrollRef.current) {
        messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [renderedThread?.messages?.length, mounted])

  // ── Close handler — animate out, then unmount ────────────────────────────
  function handleClose() {
    if (!backdropRef.current || !asideRef.current || isAnimatingOut.current) return
    isAnimatingOut.current = true
    tlRef.current?.kill()
    tlRef.current = gsap.timeline({
      onComplete: () => {
        setMounted(false)
        setRenderedBooking(null)
        setRenderedThread(null)
        isAnimatingOut.current = false
        onClose()
      },
    })
    tlRef.current
      .to(asideRef.current, { x: '100%', duration: 0.35, ease: 'expo.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '<0.1')
  }

  if (!mounted || !renderedBooking) return null

  const isReadOnly = isPreviousBooking(renderedBooking)
  const packageTitle = renderedBooking?.package?.title || renderedBooking?.event?.name || 'Booking'

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
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E4DED8] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name="Elewen team" size="md" />
            <div>
              <p className="text-sm font-semibold text-[#1C1C1C]">Elewen team</p>
              <p className="text-xs text-[#6B7280]">Your planner &amp; support</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge
              status={isReadOnly ? 'resolved' : renderedBooking?.status}
              label={isReadOnly ? 'Read only' : renderedBooking?.statusLabel}
            />
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                handleClose()
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full p-2 text-[#957960] transition hover:bg-[#F3EEE8]"
              aria-label="Close message thread"
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

        {/* ── Booking meta strip ── */}
        <div className="border-b border-[#E4DED8] bg-[#F7F5F2] px-5 py-3">
          <p className="text-xs text-[#6B7280]">
            <span className="font-medium text-[#2D2D2D]">{packageTitle}</span>
            {renderedBooking?.eventDate ? (
              <span className="ml-2 text-[#8F8F8F]">
                · {formatBookingDate(renderedBooking.eventDate)}
              </span>
            ) : null}
          </p>
        </div>

        {/* ── Messages — scrollable container, starts at bottom ── */}
        <div
          ref={messagesScrollRef}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto hide-scrollbar px-5 py-5"
          data-lenis-prevent
        >
          {threadLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <DashboardLoadingState title="Loading conversation…" compact />
            </div>
          ) : renderedThread?.messages?.length ? (
            renderedThread.messages.map(message => {
              const isOwnMessage = String(message.senderId) === String(session?.user?.id)
              return (
                <MessageBubble key={message.id} message={message} isOwnMessage={isOwnMessage} />
              )
            })
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <DashboardEmptyState
                title={isReadOnly ? 'No previous messages' : 'No messages yet'}
                body={
                  isReadOnly
                    ? 'This previous booking has no stored conversation history.'
                    : 'Start the conversation here. Your message will appear in this booking thread.'
                }
              />
            </div>
          )}
        </div>

        {/* ── Compose ── */}
        <div className="shrink-0 border-t border-[#E4DED8] bg-[#FAFAFA] px-5 py-4">
          {isReadOnly ? (
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
              This booking is closed. The thread is read-only.
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <textarea
              value={draft}
              onChange={e => onDraftChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
              disabled={isReadOnly || sendMessageMutation.isPending}
              placeholder={
                isReadOnly ? 'Read-only thread.' : 'Type your message to the Elewen team…'
              }
              rows={3}
              className="flex-1 resize-none rounded-2xl border border-[#E4DED8] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none transition focus:border-[#C6A15B] disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              disabled={
                isReadOnly || !draft.trim() || sendMessageMutation.isPending || !renderedThread?.id
              }
              onClick={onSend}
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
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const PAGE_SIZE = 10

export default function MessagesUpdates() {
  const { data: session } = useDashboardSession()
  const {
    data: bookings = [],
    error: bookingsError,
    isLoading: bookingsLoading,
  } = useDashboardBookings('all')

  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const { searchTerm } = useDashboardSearch()

  const debouncedLocalSearch = useDebouncedValue(search)
  const debouncedSearchTerm = useDebouncedValue(searchTerm)

  const sendMessageMutation = useDashboardSendMessage()

  const activeBookings = useMemo(() => bookings.filter(b => !isPreviousBooking(b)), [bookings])
  const previousBookings = useMemo(() => bookings.filter(b => isPreviousBooking(b)), [bookings])

  // Tab logic
  const [threadTab, setThreadTab] = useState('active')
  const effectiveTab = useMemo(() => {
    if (threadTab === 'active' && activeBookings.length === 0 && previousBookings.length > 0)
      return 'previous'
    if (threadTab === 'previous' && previousBookings.length === 0 && activeBookings.length > 0)
      return 'active'
    return threadTab
  }, [threadTab, activeBookings.length, previousBookings.length])

  const baseBookings = effectiveTab === 'previous' ? previousBookings : activeBookings

  const filteredBookings = useMemo(() => {
    return baseBookings.filter(
      b =>
        matchesDashboardSearch(debouncedLocalSearch, [
          b?.package?.title,
          b?.event?.name,
          b?.statusLabel,
        ]) &&
        matchesDashboardSearch(debouncedSearchTerm, [
          b?.package?.title,
          b?.event?.name,
          b?.statusLabel,
          b?.locationSummary,
        ])
    )
  }, [baseBookings, debouncedLocalSearch, debouncedSearchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE))
  const visiblePage = Math.min(currentPage, totalPages)
  const visibleBookings = useMemo(
    () => filteredBookings.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE),
    [filteredBookings, visiblePage]
  )

  useEffect(() => {
    const raf = requestAnimationFrame(() => setCurrentPage(1))
    return () => cancelAnimationFrame(raf)
  }, [search, effectiveTab])
  useEffect(() => {
    if (currentPage > totalPages) {
      const raf = requestAnimationFrame(() => setCurrentPage(totalPages))
      return () => cancelAnimationFrame(raf)
    }
    return undefined
  }, [currentPage, totalPages])

  // Deselect if filtered away
  useEffect(() => {
    if (selectedBookingId && !filteredBookings.some(b => b.id === selectedBookingId)) {
      const raf = requestAnimationFrame(() => setSelectedBookingId(''))
      return () => cancelAnimationFrame(raf)
    }
    return undefined
  }, [filteredBookings, selectedBookingId])

  const selectedBooking = useMemo(
    () => filteredBookings.find(b => b.id === selectedBookingId) ?? null,
    [filteredBookings, selectedBookingId]
  )
  const isReadOnlyThread = isPreviousBooking(selectedBooking)

  const {
    data: thread,
    isLoading: threadLoading,
    error: threadError,
  } = useDashboardThread(selectedBooking?.id, {
    createIfMissing: !isReadOnlyThread,
  })

  if (bookingsLoading) {
    return <DashboardLoadingState title="Loading booking messages..." />
  }

  if (bookingsError || threadError)
    return <DashboardErrorState title="We could not load your messages and updates." />
  if (bookings.length === 0) {
    return (
      <EmptyBooking
        title="No booking conversations yet"
        body="Once you have a booking, your planner updates and direct messages will appear here."
        actionLabel="Explore Packages"
        actionTo="/package-listing"
      />
    )
  }

  async function handleSend() {
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
    <div className="flex h-full min-h-0 flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl text-[#1C1C1C]">Messages &amp; Updates</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Track booking-specific conversations with the Elewen team. Previous bookings stay visible
          as read-only history.
        </p>
      </div>

      {/* Thread list */}
      <div className="min-h-0 flex-1">
        {/* Search + tabs card */}
        <div className="mb-4 py-5 px-3 bg-[#FFFFFF] rounded-2xl">
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

          <div className="flex gap-1 rounded-full bg-[#F3F3F3] p-1 mt-4">
            {[
              { key: 'active', label: 'Active', count: activeBookings.length },
              { key: 'previous', label: 'Previous', count: previousBookings.length },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setThreadTab(tab.key)}
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

        {/* Thread cards */}
        <div
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 hide-scrollbar"
          data-lenis-prevent
        >
          {filteredBookings.length ? (
            visibleBookings.map(booking => (
              <ThreadCard
                key={booking.id}
                booking={booking}
                isSelected={selectedBooking?.id === booking.id}
                onClick={() => setSelectedBookingId(booking.id)}
                // unreadCount comes from the thread list item — threads query
                // exposes `unreadCount` on each item (same field as admin side)
                unreadCount={booking.unreadCount}
                latestMessageTime={booking.latestMessage?.createdAt}
              />
            ))
          ) : (
            <DashboardEmptyState
              title={
                effectiveTab === 'active' ? 'No active booking threads' : 'No previous threads'
              }
              body={
                effectiveTab === 'active'
                  ? 'When a booking becomes active, its conversation thread will show up here.'
                  : 'Completed or cancelled booking conversations will appear here as read-only history.'
              }
            />
          )}
        </div>
      </div>

      {/* Slide-over panel with GSAP */}
      <MessageThreadPanel
        booking={selectedBooking}
        thread={thread}
        threadLoading={threadLoading}
        draft={draft}
        sendMessageMutation={sendMessageMutation}
        session={session}
        onClose={() => setSelectedBookingId('')}
        onDraftChange={setDraft}
        onSend={handleSend}
      />

      {/* Pagination */}
      {filteredBookings.length > PAGE_SIZE ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={visiblePage === 1}
            className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowIcon direction="left" />
          </button>
          <div className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1C]">
            {visiblePage} / {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={visiblePage === totalPages}
            className="rounded-full border border-[#E4DED8] bg-white px-3 py-3 text-xs font-semibold text-[#1C1C1C] transition hover:border-[#D4BA8E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
