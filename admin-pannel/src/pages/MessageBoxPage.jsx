import { useEffect, useMemo, useState } from 'react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  LoadingState,
  PageIntro,
  Panel,
  SearchField,
  SelectField,
  StatusBadge,
  TextAreaField,
} from '../components/ui/AdminUI'
import { useAdminMessageThread, useAdminMessageThreads, useAdminSendMessage } from '../hooks/useAdminData'
import { formatDateTime } from '../lib/formatters'

export default function MessageBoxPage() {
  const [search, setSearch] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [messageText, setMessageText] = useState('')
  const [messageType, setMessageType] = useState('text')

  const threadsQuery = useAdminMessageThreads({ search })
  const threadList = threadsQuery.data?.threads ?? []
  const selectedThreadListItem = useMemo(
    () => threadList.find(thread => thread.bookingId === selectedBookingId) ?? threadList[0] ?? null,
    [selectedBookingId, threadList]
  )
  const threadQuery = useAdminMessageThread(selectedThreadListItem?.bookingId)
  const sendMessageMutation = useAdminSendMessage()

  useEffect(() => {
    if (selectedThreadListItem && selectedThreadListItem.bookingId !== selectedBookingId) {
      setSelectedBookingId(selectedThreadListItem.bookingId)
    }
  }, [selectedBookingId, selectedThreadListItem])

  if (threadsQuery.isLoading) {
    return <LoadingState label="Loading message threads..." />
  }

  if (threadsQuery.error) {
    return <ErrorState label="Admin message threads are unavailable right now." />
  }

  const thread = threadQuery.data

  return (
    <div className="space-y-6">
      <PageIntro
        title="Message Box"
        subtitle="Review customer conversations by booking and send operational updates from the admin console."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel
          title="Threads"
          subtitle="Search by booking, customer, or package."
          action={<SearchField value={search} onChange={setSearch} placeholder="Search messages" />}
        >
          {threadList.length ? (
            <div className="space-y-3">
              {threadList.map(threadItem => (
                <button
                  key={threadItem.id}
                  type="button"
                  onClick={() => setSelectedBookingId(threadItem.bookingId)}
                  className={`block w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    selectedThreadListItem?.id === threadItem.id
                      ? 'border-[#5D2E17] bg-[#F7EEE8]'
                      : 'border-[#E7DDD6] bg-[#FBF7F4]'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-medium text-[#2B211B]">{threadItem.bookingSummary?.customer?.name || 'Customer'}</p>
                      <p className="mt-1 text-sm text-[#6F6257]">{threadItem.bookingSummary?.package?.title || threadItem.bookingId}</p>
                      <p className="mt-1 text-sm text-[#8C7D70]">{threadItem.latestMessage?.messageText || 'No message preview'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {threadItem.unreadCount ? (
                        <StatusBadge status="high" label={`${threadItem.unreadCount} unread`} />
                      ) : (
                        <StatusBadge status="resolved" label="Cleared" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No threads found" body="Messages between bookings and customers will appear here." />
          )}
        </Panel>

        <Panel title="Conversation" subtitle="Send text, system, or status-update messages into the live customer thread.">
          {thread ? (
            <div className="space-y-6">
              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#2B211B]">{thread.bookingSummary?.package?.title || thread.bookingId}</p>
                    <p className="mt-1 text-sm text-[#6F6257]">{thread.bookingSummary?.customer?.name || 'Customer'} / {thread.bookingSummary?.customer?.email || 'Email pending'}</p>
                  </div>
                  <StatusBadge status={thread.bookingSummary?.status} label={thread.bookingSummary?.statusLabel} />
                </div>
              </div>

              <div className="max-h-[560px] space-y-3 overflow-y-auto rounded-[26px] bg-[#FBF7F4] p-5">
                {thread.messages?.length ? (
                  thread.messages.map(message => {
                    const isAdminMessage = message.sender?.email === thread.bookingSummary?.customer?.email ? false : true
                    return (
                      <div
                        key={message.id}
                        className={`max-w-[88%] rounded-[24px] px-4 py-4 ${
                          isAdminMessage ? 'ml-auto bg-[#5D2E17] text-white' : 'bg-white text-[#2B211B]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.18em] opacity-75">
                            {message.sender?.name || 'Unknown'} / {message.messageType}
                          </p>
                          <p className="text-xs opacity-75">{formatDateTime(message.createdAt)}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6">{message.messageText}</p>
                      </div>
                    )
                  })
                ) : (
                  <EmptyState title="No messages yet" body="Once the customer or admin sends a message, the thread will populate here." />
                )}
              </div>

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                  <SelectField value={messageType} onChange={setMessageType}>
                    <option value="text">Text reply</option>
                    <option value="status_update">Status update</option>
                    <option value="system">System note</option>
                  </SelectField>
                  <TextAreaField
                    value={messageText}
                    onChange={event => setMessageText(event.target.value)}
                    placeholder="Share the next operational update with the customer."
                  />
                </div>
                <ActionButton
                  className="mt-4"
                  disabled={sendMessageMutation.isPending || !messageText.trim()}
                  onClick={async () => {
                    await sendMessageMutation.mutateAsync({
                      threadId: thread.id,
                      bookingId: thread.bookingId,
                      messageType,
                      messageText,
                    })
                    setMessageText('')
                  }}
                >
                  {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                </ActionButton>
              </div>
            </div>
          ) : (
            <EmptyState title="No thread selected" body="Choose a thread to read the conversation and respond." />
          )}
        </Panel>
      </div>
    </div>
  )
}
