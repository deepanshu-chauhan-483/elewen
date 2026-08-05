import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SectionLoadingState,
} from '../components/ui/AdminUI'
import {
  useAdminBooking,
  useAdminMessageThread,
  useAdminMessageThreads,
  useAdminSendMessage,
} from '../hooks/useAdminData'
import { formatDate } from '../lib/formatters'

const PAGE_SIZE = 10

function isPreviousThread(thread) {
  return ['completed', 'cancelled', 'canceled'].includes(
    String(thread?.bookingSummary?.status ?? '')
      .trim()
      .toLowerCase()
  )
}

function formatUpdateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const time = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)

  if (isToday) return `Today · ${time}`

  return `${new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
  }).format(date)} · ${time}`
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('')
}

function getBookingTitle(booking) {
  const title =
    booking?.package?.title ||
    booking?.event?.name ||
    booking?.displaySubtitle ||
    booking?.detailSubtitle ||
    booking?.selectedItemsSummary ||
    ''
  const trimmed = String(title).trim()
  // Never show raw booking UUIDs in the chat list
  if (!trimmed || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(trimmed)) return 'Booking'
  return trimmed
}

function getBookingSubtitle(booking) {
  const parts = [
    booking?.event?.name,
    booking?.package?.serviceCategories?.[0]?.name || booking?.package?.serviceCategory,
  ].filter(Boolean)
  if (parts.length) return parts.slice(0, 2).join(' · ')

  const title = getBookingTitle(booking)
  const detail = String(booking?.detailSubtitle || booking?.displaySubtitle || '').trim()
  if (detail && detail !== title) return detail

  return booking?.statusLabel || 'Booking'
}

function getCustomerDisplay(booking) {
  const customer = booking?.customer ?? {}
  const name = String(customer.name ?? '').trim()
  const email = String(customer.email ?? '').trim()
  const phone = String(customer.phone ?? '').trim()
  const displayName = name || email || 'Customer'

  return {
    displayName,
    email,
    phone,
    detailLine: [email && email !== displayName ? email : null, phone || null]
      .filter(Boolean)
      .join(' · '),
  }
}

const statusMap = {
  active: 'bg-[#EAF8F1] text-[#238E64]',
  confirmed: 'bg-[#EEF4FF] text-[#3061C6]',
  pending: 'bg-[#FFF4E5] text-[#C07318]',
  delivered: 'bg-[#EEF4FF] text-[#3061C6]',
  completed: 'bg-[#F3F4F6] text-[#6B7280]',
  cancelled: 'bg-[#FFF1F0] text-[#591902]',
  resolved: 'bg-[#EAF8F1] text-[#238E64]',
  in_progress: 'bg-[#FFF4E5] text-[#C07318]',
  upcoming: 'bg-[#EEF4FF] text-[#3061C6]',
}

function MessageStatusBadge({ status, label }) {
  const key = String(status ?? '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  const cls = statusMap[key] ?? 'bg-[#FFF4E5] text-[#C07318]'
  const text =
    label ??
    (key ? key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' ') : '-')
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-normal whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  )
}

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

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.333 2v2.667M10.667 2v2.667M2.667 6.667h10.666M3.333 4.667h9.334c.736 0 1.333.597 1.333 1.333v6.667c0 .736-.597 1.333-1.333 1.333H3.333A1.333 1.333 0 0 1 2 12.667V6c0-.736.597-1.333 1.333-1.333Z"
        stroke="#8F8F8F"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PaperclipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17.5 9.167 10.175 16.49a4.167 4.167 0 1 1-5.892-5.892l7.325-7.325a2.5 2.5 0 0 1 3.535 3.536L7.818 13.233a.833.833 0 1 1-1.178-1.178l6.667-6.667"
        stroke="#8F8F8F"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.333 10 17.5 2.5 12.5 17.5 10 11.667 3.333 10Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Avatar({ name = '', size = 'md', tone = 'brand' }) {
  const initials = getInitials(name) || '?'
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-xs'
  const toneClass = tone === 'olive' ? 'bg-[#3E4E22] text-white' : 'bg-[#591902] text-[#FAFAFA]'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${toneClass}`}
    >
      {initials}
    </div>
  )
}

function ThreadCard({ threadItem, isSelected, onClick }) {
  const booking = threadItem.bookingSummary
  const customer = getCustomerDisplay(booking)
  const packageTitle = getBookingTitle(booking)
  const subtitle = getBookingSubtitle(booking)
  const unread = threadItem.unreadCount || 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3.5 text-left transition-colors ${
        isSelected ? 'bg-[#F5EDE3]' : 'bg-transparent hover:bg-[#F8F4ED]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#1C1C1C]">{customer.displayName}</p>
          {customer.detailLine ? (
            <p className="mt-0.5 truncate text-[12px] text-[#6B6B6B]">{customer.detailLine}</p>
          ) : null}
          <p className="mt-1 truncate text-[12px] text-[#8A8A8A]">
            {[packageTitle, subtitle].filter(Boolean).join(' · ')}
          </p>
        </div>
        {unread > 0 ? (
          <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#C45C4A] px-1.5 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </div>
    </button>
  )
}

function MessageBubble({ message, isAdmin, customerLabel = 'Customer' }) {
  const senderName = message.sender?.name || (isAdmin ? 'Admin' : customerLabel)
  const senderDetail = !isAdmin
    ? [message.sender?.email, message.sender?.phone].filter(Boolean).join(' · ')
    : ''

  return (
    <div className={`flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar name={senderName} size="sm" tone={isAdmin ? 'olive' : 'brand'} />
      <div
        className={`max-w-[78%] rounded-[18px] px-4 py-3 text-[13px] leading-[1.55] ${
          isAdmin
            ? 'rounded-br-md bg-[#3E4E22] text-white'
            : 'rounded-bl-md bg-[#F3EDE4] text-[#2C2C2C]'
        }`}
      >
        {!isAdmin ? (
          <p className="mb-1 text-[11px] font-medium text-[#591902]">
            {senderName}
            {senderDetail ? <span className="font-normal text-[#7A5A4A]"> · {senderDetail}</span> : null}
          </p>
        ) : null}
        {message.messageText ? (
          <p className="whitespace-pre-wrap">{message.messageText}</p>
        ) : null}
        {message.attachments?.length ? (
          <div className={`${message.messageText ? 'mt-2' : ''} space-y-1`}>
            {message.attachments.map(attachment => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target="_blank"
                rel="noreferrer"
                className={`block text-xs underline ${isAdmin ? 'text-white/90' : 'text-[#591902]'}`}
              >
                {attachment.fileType || 'Attachment'}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function BookingUpdatesPanel({ bookingId, customerLabel = '' }) {
  const { data: booking, isLoading } = useAdminBooking(bookingId)

  const updates = useMemo(() => {
    const timeline = Array.isArray(booking?.timeline) ? booking.timeline : []
    if (timeline.length) {
      return timeline.map((item, index) => ({
        id: item?.id ?? `timeline-${index}`,
        title: item?.title || item?.label || 'Update',
        description: item?.description || item?.note || '',
        status: item?.status || 'upcoming',
        at: item?.timelineDate || item?.date || item?.createdAt || '',
      }))
    }

    const logs = Array.isArray(booking?.statusLogs) ? booking.statusLogs : []
    if (logs.length) {
      return [...logs]
        .reverse()
        .slice(0, 12)
        .map((log, index) => ({
          id: log?.id ?? `log-${index}`,
          title: log?.statusLabel || log?.status || 'Status update',
          description: log?.note || log?.message || '',
          status: log?.status || 'upcoming',
          at: log?.createdAt || '',
        }))
    }

    return []
  }, [booking])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#EDE7DF] bg-white">
      <div className="shrink-0 border-b border-[#F0EBE4] px-5 py-4">
        <h3 className="text-[15px] font-normal text-[#1C1C1C]">Booking Updates</h3>
        {customerLabel ? (
          <p className="mt-1 truncate text-[12px] text-[#8A8A8A]">Customer: {customerLabel}</p>
        ) : null}
      </div>

      <div
        className="hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2"
        data-lenis-prevent
      >
        {!bookingId ? (
          <div className="py-10 text-center text-[13px] text-[#8A8A8A]">
            Select a chat to view booking updates.
          </div>
        ) : isLoading ? (
          <div className="py-10">
            <SectionLoadingState label="Loading updates…" minHeightClass="min-h-[120px]" />
          </div>
        ) : updates.length ? (
          updates.map((update, index) => (
            <div
              key={update.id}
              className={`py-4 ${index > 0 ? 'border-t border-[#F0EBE4]' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-normal text-[#1C1C1C]">{update.title}</p>
                <MessageStatusBadge
                  status={update.status}
                  label={update.status === 'upcoming' ? 'Upcoming' : undefined}
                />
              </div>
              {update.at ? (
                <p className="mt-1.5 text-[11px] text-[#9A9A9A]">{formatUpdateTime(update.at)}</p>
              ) : null}
              {update.description ? (
                <p className="mt-2 text-[12px] leading-[1.55] text-[#6B6B6B]">{update.description}</p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-[13px] text-[#8A8A8A]">
            No booking updates yet for this conversation.
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationPanel({
  thread,
  threadLoading,
  isReadOnly,
  draft,
  sendMessageMutation,
  onDraftChange,
  onSend,
}) {
  const messagesScrollRef = useRef(null)
  const booking = thread?.bookingSummary
  const customer = getCustomerDisplay(booking)
  const packageTitle = getBookingTitle(booking)
  const subtitle = getBookingSubtitle(booking)

  useEffect(() => {
    if (!messagesScrollRef.current || !thread?.messages?.length) return
    const raf = requestAnimationFrame(() => {
      if (messagesScrollRef.current) {
        messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [thread?.messages?.length, thread?.bookingId])

  if (!thread && !threadLoading) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[20px] border border-[#EDE7DF] bg-white px-6 text-center">
        <p className="text-[15px] font-medium text-[#1C1C1C]">Select a booking chat</p>
        <p className="mt-2 max-w-sm text-[13px] text-[#8A8A8A]">
          Choose an active or previous booking from the left to view and reply to the conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#EDE7DF] bg-white">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[#F0EBE4] px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-medium text-[#1C1C1C]">{customer.displayName}</p>
          {customer.detailLine ? (
            <p className="mt-0.5 truncate text-[12px] text-[#6B6B6B]">{customer.detailLine}</p>
          ) : null}
          <p className="mt-1 truncate text-[13px] text-[#1C1C1C]">{packageTitle}</p>
          <p className="mt-0.5 text-[12px] text-[#8A8A8A]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MessageStatusBadge
            status={isReadOnly ? 'resolved' : booking?.status}
            label={isReadOnly ? 'Read only' : booking?.statusLabel || 'In Progress'}
          />
          {booking?.eventDate ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F5] px-3 py-1 text-[11px] text-[#6B6B6B]">
              <CalendarIcon />
              {formatDate(booking.eventDate)}
            </span>
          ) : null}
        </div>
      </div>

      <div
        ref={messagesScrollRef}
        className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-5"
        data-lenis-prevent
      >
        {threadLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <SectionLoadingState label="Loading conversation…" minHeightClass="min-h-[160px]" />
          </div>
        ) : thread?.messages?.length ? (
          thread.messages.map(message => {
            const isAdmin = String(message.senderId) !== String(booking?.customer?.id)
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isAdmin={isAdmin}
                customerLabel={customer.displayName}
              />
            )
          })
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
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

      <div className="shrink-0 border-t border-[#F0EBE4] px-4 py-4">
        {isReadOnly ? (
          <div className="mb-3 rounded-xl border border-dashed border-[#D6CDC3] bg-[#FAFAFA] px-4 py-3 text-xs text-[#6B7280]">
            This booking is closed. The thread is read-only.
          </div>
        ) : null}

        <div className="flex items-center gap-2 rounded-full border border-[#E8E2DA] bg-[#FAFAFA] px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center text-[#8F8F8F]" aria-hidden="true">
            <PaperclipIcon />
          </span>
          <input
            type="text"
            value={draft}
            onChange={e => onDraftChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            disabled={isReadOnly || sendMessageMutation.isPending || !thread?.id}
            placeholder={isReadOnly ? 'Read-only thread.' : 'Type message'}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#2D2D2D] outline-none placeholder:text-[#9A9A9A] disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            disabled={
              isReadOnly || !draft.trim() || sendMessageMutation.isPending || !thread?.id
            }
            onClick={onSend}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#591902] text-white transition hover:bg-[#7A2B08] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
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
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MessageBoxPage() {
  const [searchParams] = useSearchParams()
  const [threadTab, setThreadTab] = useState('active')
  const [selectedBookingId, setSelectedBookingId] = useState(
    String(searchParams.get('bookingId') ?? '').trim()
  )
  const [draft, setDraft] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const appliedDeepLinkRef = useRef('')

  const threadsQuery = useAdminMessageThreads()
  const allThreads = useMemo(() => threadsQuery.data?.threads ?? [], [threadsQuery.data?.threads])

  const activeThreads = useMemo(
    () => allThreads.filter(thread => !isPreviousThread(thread)),
    [allThreads]
  )
  const previousThreads = useMemo(
    () => allThreads.filter(thread => isPreviousThread(thread)),
    [allThreads]
  )

  // Same tab behavior as customer Messages & Updates
  const effectiveTab = useMemo(() => {
    if (threadTab === 'active' && activeThreads.length === 0 && previousThreads.length > 0) {
      return 'previous'
    }
    if (threadTab === 'previous' && previousThreads.length === 0 && activeThreads.length > 0) {
      return 'active'
    }
    return threadTab
  }, [threadTab, activeThreads.length, previousThreads.length])

  const filteredThreads = effectiveTab === 'previous' ? previousThreads : activeThreads
  const totalPages = Math.max(1, Math.ceil(filteredThreads.length / PAGE_SIZE))
  const visiblePage = Math.min(currentPage, totalPages)
  const visibleThreads = useMemo(
    () => filteredThreads.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE),
    [filteredThreads, visiblePage]
  )

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setCurrentPage(1))
    return () => cancelAnimationFrame(frameId)
  }, [effectiveTab])

  useEffect(() => {
    if (currentPage > totalPages) {
      const frameId = requestAnimationFrame(() => setCurrentPage(totalPages))
      return () => cancelAnimationFrame(frameId)
    }
    return undefined
  }, [currentPage, totalPages])

  // Deep-link once per bookingId (don't fight manual Active/Previous clicks)
  useEffect(() => {
    const bookingIdParam = String(searchParams.get('bookingId') ?? '').trim()
    if (!bookingIdParam || !allThreads.length) return undefined
    if (appliedDeepLinkRef.current === bookingIdParam) return undefined

    const matched = allThreads.find(thread => thread.bookingId === bookingIdParam)
    if (!matched) return undefined

    const frameId = requestAnimationFrame(() => {
      appliedDeepLinkRef.current = bookingIdParam
      setSelectedBookingId(bookingIdParam)
      setThreadTab(isPreviousThread(matched) ? 'previous' : 'active')
    })
    return () => cancelAnimationFrame(frameId)
  }, [searchParams, allThreads])

  useEffect(() => {
    if (selectedBookingId && !filteredThreads.some(thread => thread.bookingId === selectedBookingId)) {
      const frameId = requestAnimationFrame(() => setSelectedBookingId(''))
      return () => cancelAnimationFrame(frameId)
    }
    return undefined
  }, [filteredThreads, selectedBookingId])

  useEffect(() => {
    if (!selectedBookingId && visibleThreads[0]?.bookingId) {
      const frameId = requestAnimationFrame(() =>
        setSelectedBookingId(visibleThreads[0].bookingId)
      )
      return () => cancelAnimationFrame(frameId)
    }
    return undefined
  }, [selectedBookingId, visibleThreads])

  const selectedThreadListItem = useMemo(
    () => filteredThreads.find(thread => thread.bookingId === selectedBookingId) ?? null,
    [filteredThreads, selectedBookingId]
  )

  const isReadOnly = isPreviousThread(selectedThreadListItem)
  const threadQuery = useAdminMessageThread(selectedThreadListItem?.bookingId)
  const sendMessageMutation = useAdminSendMessage()
  const isListLoading = threadsQuery.isFetching && !threadsQuery.isLoading

  const thread =
    threadQuery.data?.bookingId === selectedBookingId ? threadQuery.data : null
  const selectedCustomer = getCustomerDisplay(
    thread?.bookingSummary ?? selectedThreadListItem?.bookingSummary
  )

  if (threadsQuery.isLoading) return <LoadingState label="Loading message threads..." />
  if (threadsQuery.error)
    return <ErrorState label="Admin message threads are unavailable right now." />

  async function handleSend() {
    if (!draft.trim() || !thread?.id || isReadOnly) return

    await sendMessageMutation.mutateAsync({
      threadId: thread.id,
      bookingId: thread.bookingId,
      messageType: 'text',
      messageText: draft.trim(),
      attachments: [],
    })
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-5 lg:h-[calc(100dvh-140px)] lg:min-h-[560px] lg:overflow-hidden">
      <div className="shrink-0">
        <h1
          className="text-[28px] leading-none text-[#1C1C1C] md:text-[32px]"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Messages &amp; Updates
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-[1.5] text-[#8A8A8A]">
          Each chat is tied to a booking customer. Use the customer name and email in the list to
          see who you are messaging.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden max-lg:auto-rows-auto lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,300px)]">
        {/* Column 1 — Chat list */}
        <div className="flex h-[min(420px,55vh)] min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#EDE7DF] bg-white lg:h-full">
          <div className="shrink-0 border-b border-[#F0EBE4] px-5 py-4">
            <h2 className="text-[15px] font-normal text-[#1C1C1C]">Chat</h2>
            <div className="mt-3 flex gap-2">
              {[
                { key: 'active', label: 'Active booking' },
                { key: 'previous', label: 'Previous booking' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setThreadTab(tab.key)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-normal transition ${
                    effectiveTab === tab.key
                      ? 'bg-[#591902] text-white'
                      : 'bg-[#F3F3F3] text-[#5A5A5A] hover:bg-[#EBEBEB]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="hide-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2"
            data-lenis-prevent
          >
            {isListLoading ? (
              <SectionLoadingState
                label="Loading message threads..."
                minHeightClass="min-h-[200px]"
              />
            ) : filteredThreads.length ? (
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

          {filteredThreads.length > PAGE_SIZE ? (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#F0EBE4] px-3 py-3">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={visiblePage === 1}
                className="rounded-full border border-[#E4DED8] bg-white px-2.5 py-2 text-xs disabled:opacity-50"
              >
                <ArrowIcon direction="left" />
              </button>
              <span className="text-xs font-normal text-[#1C1C1C]">
                {visiblePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={visiblePage === totalPages}
                className="rounded-full border border-[#E4DED8] bg-white px-2.5 py-2 text-xs disabled:opacity-50"
              >
                <ArrowIcon direction="right" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Column 2 — Conversation */}
        <div className="h-[min(520px,65vh)] min-h-0 overflow-hidden lg:h-full">
          <ConversationPanel
            thread={thread}
            threadLoading={Boolean(selectedBookingId) && threadQuery.isLoading}
            isReadOnly={isReadOnly}
            draft={draft}
            sendMessageMutation={sendMessageMutation}
            onDraftChange={setDraft}
            onSend={handleSend}
          />
        </div>

        {/* Column 3 — Booking updates */}
        <div className="h-[min(360px,50vh)] min-h-0 overflow-hidden lg:h-full">
          <BookingUpdatesPanel
            bookingId={selectedBookingId}
            customerLabel={
              [selectedCustomer.displayName, selectedCustomer.email]
                .filter((value, index, list) => value && list.indexOf(value) === index)
                .join(' · ') || ''
            }
          />
        </div>
      </div>
    </div>
  )
}
