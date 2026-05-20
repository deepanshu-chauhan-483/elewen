import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionLoadingState,
  StatusBadge,
} from '../components/ui/AdminUI'
import {
  useAdminMessageThread,
  useAdminMessageThreads,
  useAdminSendMessage,
} from '../hooks/useAdminData'
import { formatDate, formatDateTime } from '../lib/formatters'

function isArchivedThread(thread) {
  return ['completed', 'cancelled'].includes(
    String(thread?.bookingSummary?.status ?? '').toLowerCase()
  )
}

function getLatestThreadTime(thread) {
  return thread?.latestMessage?.createdAt || thread?.createdAt || null
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

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

function ThreadCard({ threadItem, isSelected, onClick }) {
  const customerName = threadItem.bookingSummary?.customer?.name || 'Customer'
  const packageTitle = threadItem.bookingSummary?.package?.title || threadItem.bookingId
  const unread = threadItem.unreadCount || 0
  const isArchived = isArchivedThread(threadItem)
  const time = getLatestThreadTime(threadItem)

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

          <p className="mt-0.5 truncate text-xs text-[#6B7280]">{packageTitle}</p>
          {time && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#8F8F8F]">
              {formatDateTime(time)}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

function MessageBubble({ message, isAdmin }) {
  const senderName = message.sender?.name || (isAdmin ? 'Admin' : 'Customer')
  const typeLabel = String(message.messageType ?? 'text').replaceAll('_', ' ')

  return (
    <div className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar name={senderName} size="sm" />
      <div className={`flex max-w-[75%] flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#8F8F8F]">
            {senderName}
          </span>
          <span className="text-[10px] text-[#8F8F8F]">·</span>
          <span className="text-[10px] text-[#8F8F8F]">{typeLabel}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isAdmin
              ? 'rounded-tr-sm bg-[#591902] text-[#FAFAFA]'
              : 'rounded-tl-sm bg-white text-[#1C1C1C] shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
          }`}
        >
          <p className="text-sm leading-6">{message.messageText}</p>
        </div>
        <p className="text-[10px] text-[#8F8F8F]">{formatDateTime(message.createdAt)}</p>
      </div>
    </div>
  )
}

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

export default function MessageBoxPage() {
  const [search, setSearch] = useState('')
  const [threadTab, setThreadTab] = useState('active')
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [messageText, setMessageText] = useState('')
  const [messageType, setMessageType] = useState('text')
  const messagesEndRef = useRef(null)

  const threadsQuery = useAdminMessageThreads({ search })
  const allThreads = useMemo(() => threadsQuery.data?.threads ?? [], [threadsQuery.data?.threads])
  const activeThreads = useMemo(() => allThreads.filter(t => !isArchivedThread(t)), [allThreads])
  const archivedThreads = useMemo(() => allThreads.filter(t => isArchivedThread(t)), [allThreads])
  const effectiveThreadTab = useMemo(() => {
    if (threadTab === 'active' && activeThreads.length === 0 && archivedThreads.length > 0) {
      return 'archived'
    }
    if (threadTab === 'archived' && archivedThreads.length === 0 && activeThreads.length > 0) {
      return 'active'
    }
    return threadTab
  }, [activeThreads.length, archivedThreads.length, threadTab])
  const visibleThreads = effectiveThreadTab === 'archived' ? archivedThreads : activeThreads
  const effectiveSelectedBookingId = useMemo(() => {
    if (visibleThreads.some(thread => thread.bookingId === selectedBookingId)) {
      return selectedBookingId
    }
    return visibleThreads[0]?.bookingId ?? ''
  }, [selectedBookingId, visibleThreads])

  const selectedThreadListItem = useMemo(
    () =>
      visibleThreads.find(t => t.bookingId === effectiveSelectedBookingId) ??
      visibleThreads[0] ??
      null,
    [effectiveSelectedBookingId, visibleThreads]
  )

  const threadQuery = useAdminMessageThread(selectedThreadListItem?.bookingId)
  const sendMessageMutation = useAdminSendMessage()
  const isListLoading = threadsQuery.isFetching && !threadsQuery.isLoading

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadQuery.data?.messages?.length])

  if (threadsQuery.isLoading) return <LoadingState label="Loading message threads..." />
  if (threadsQuery.error)
    return <ErrorState label="Admin message threads are unavailable right now." />

  const thread = threadQuery.data
  const isReadOnly = isArchivedThread(thread ?? selectedThreadListItem)
  const booking = thread?.bookingSummary

  return (
    <div className="flex min-h-0 flex-col h-fit gap-6 overflow-hidden xl:h-[calc(100dvh-144px)]">
      <div>
        <h1 className="text-2xl  text-[#1C1C1C]">Message Box</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Review booking conversations, post planner updates, and manage completed booking history.
        </p>
      </div>

      {/* Three-column layout */}
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        {/* ── Column 1: Thread List ── */}
        <div
          className="flex min-h-0 flex-col gap-4 rounded-[20px] border border-[#E4DED8] bg-white p-4 xl:h-full xl:overflow-hidden"
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
              placeholder="Search customer or booking…"
              className="w-full rounded-full border border-[#E4DED8] bg-[#F7F5F2] py-2.5 pl-9 pr-4 text-sm text-[#2D2D2D] outline-none transition focus:border-[#C6A15B] focus:bg-white"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-full bg-[#F3F3F3] p-1">
            {[
              { key: 'active', label: 'Active', count: activeThreads.length },
              { key: 'archived', label: 'Closed', count: archivedThreads.length },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setThreadTab(tab.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium transition-all duration-200 ${
                  effectiveThreadTab === tab.key
                    ? 'bg-[#591902] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#2D2D2D]'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    effectiveThreadTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E8E2DA] text-[#6B7280]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Thread cards */}
          <div
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 hide-scrollbar"
            data-lenis-prevent
          >
            {isListLoading ? (
              <SectionLoadingState
                label="Loading message threads..."
                minHeightClass="min-h-[320px]"
              />
            ) : visibleThreads.length ? (
              visibleThreads.map(threadItem => (
                <ThreadCard
                  key={threadItem.id}
                  threadItem={threadItem}
                  isSelected={selectedThreadListItem?.id === threadItem.id}
                  onClick={() => setSelectedBookingId(threadItem.bookingId)}
                />
              ))
            ) : (
              <EmptyState
                title="No threads"
                body="Booking conversations will appear here once customers start messaging."
              />
            )}
          </div>
        </div>

        {/* ── Column 2: Conversation ── */}
        <div className="flex min-h-0 flex-col gap-0 overflow-hidden rounded-[20px] border border-[#E4DED8] bg-white xl:sticky xl:top-0 xl:h-full">
          {thread ? (
            <>
              {/* Conversation header */}
              <div className="flex items-center justify-between gap-4 border-b border-[#E4DED8] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={booking?.customer?.name} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-[#1C1C1C]">
                      {booking?.customer?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {booking?.customer?.email || 'No email on file'}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={isReadOnly ? 'resolved' : booking?.status}
                  label={isReadOnly ? 'Read only' : booking?.statusLabel}
                />
              </div>

              {/* Package banner */}
              <div className="border-b border-[#E4DED8] bg-[#F7F5F2] px-5 py-3">
                <p className="text-xs text-[#6B7280]">
                  <span className="font-medium text-[#2D2D2D]">
                    {booking?.package?.title || thread.bookingId}
                  </span>
                  {booking?.eventDate ? (
                    <span className="ml-2 text-[#8F8F8F]">· {formatDate(booking.eventDate)}</span>
                  ) : null}
                </p>
              </div>

              {/* Messages scroll area */}
              <div
                className="flex min-h-[360px] flex-1 flex-col gap-5 overflow-y-auto hide-scrollbar px-5 py-5 xl:min-h-0"
                data-lenis-prevent
              >
                {thread.messages?.length ? (
                  thread.messages.map(message => {
                    const isAdmin = String(message.senderId) !== String(booking?.customer?.id)
                    return <MessageBubble key={message.id} message={message} isAdmin={isAdmin} />
                  })
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <EmptyState
                      title="No messages yet"
                      body="Once a message is sent, the conversation will appear here."
                    />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose area */}
              <div className="border-t border-[#E4DED8] bg-[#FAFAFA] px-5 py-4">
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

                <div className="flex flex-col gap-3">
                  {/* Type selector row */}
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-[#8F8F8F]">
                      Type
                    </label>
                    <select
                      value={messageType}
                      onChange={e => setMessageType(e.target.value)}
                      disabled={isReadOnly}
                      className="rounded-full border border-[#E4DED8] bg-white px-3 py-1.5 text-xs text-[#2D2D2D] outline-none transition focus:border-[#C6A15B] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="text">Text reply</option>
                      <option value="status_update">Status update</option>
                      <option value="system">System note</option>
                    </select>
                  </div>

                  {/* Textarea + send */}
                  <div className="flex items-end gap-3">
                    <textarea
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      disabled={isReadOnly}
                      placeholder={
                        isReadOnly ? 'Read-only thread.' : 'Write your message to the customer…'
                      }
                      rows={3}
                      className="flex-1 resize-none rounded-2xl border border-[#E4DED8] bg-white px-4 py-3 text-sm text-[#2D2D2D] outline-none transition focus:border-[#C6A15B] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={sendMessageMutation.isPending || !messageText.trim() || isReadOnly}
                      onClick={async () => {
                        await sendMessageMutation.mutateAsync({
                          threadId: thread.id,
                          bookingId: thread.bookingId,
                          messageType,
                          messageText,
                        })
                        setMessageText('')
                      }}
                      className="flex h-12 shrink-0 items-center justify-center gap-2 self-end rounded-full bg-[#591902] px-4 text-white shadow-[0_4px_12px_rgba(89,25,2,0.25)] transition hover:bg-[#7A2B08] disabled:cursor-not-allowed disabled:opacity-50"
                    >
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
                          className="h-5 w-5 translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )}
                      <span className="hidden text-sm font-medium sm:inline">
                        {sendMessageMutation.isPending ? 'Sending' : 'Send'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-20">
              <EmptyState
                title="No conversation selected"
                body="Pick a thread from the list to read the conversation and reply."
              />
            </div>
          )}
        </div>

        {/* ── Column 3: Booking Context ── */}
        <div
          className="flex min-h-0 flex-col gap-3 rounded-[20px] border border-[#E4DED8] bg-white p-4 xl:h-full xl:overflow-y-auto hide-scrollbar"
          data-lenis-prevent
        >
          <div className="border-b border-[#E4DED8] pb-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8F8F8F]">
              Booking Context
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">Metadata for the selected conversation</p>
          </div>

          {booking ? (
            <div className="flex flex-col gap-3">
              <ContextRow label="Booking ID" value={thread.bookingId} />
              <ContextRow label="Customer">
                <div className="flex items-center gap-2">
                  <Avatar name={booking.customer?.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-[#2D2D2D]">
                      {booking.customer?.name || '—'}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">{booking.customer?.email || '—'}</p>
                  </div>
                </div>
              </ContextRow>
              <ContextRow label="Package">
                <p className="text-sm text-[#2D2D2D]">{booking.package?.title || '—'}</p>
              </ContextRow>
              <ContextRow label="Event Type">
                <p className="text-sm text-[#2D2D2D]">
                  {booking.event?.name || booking.displaySubtitle || '—'}
                </p>
              </ContextRow>
              <ContextRow label="Event Date">
                <p className="text-sm text-[#2D2D2D]">{formatDate(booking.eventDate) || '—'}</p>
              </ContextRow>
              <ContextRow label="Booking Stage">
                <StatusBadge status={booking.status} label={booking.statusLabel} />
              </ContextRow>
              <ContextRow label="Vendor Assignments">
                <p className="text-sm text-[#2D2D2D]">
                  {booking.vendorAssignments?.length
                    ? `${booking.vendorAssignments.length} vendor${booking.vendorAssignments.length > 1 ? 's' : ''} linked`
                    : 'None assigned'}
                </p>
              </ContextRow>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center py-10">
              <EmptyState
                title="No context"
                body="Select a conversation to load booking metadata."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
