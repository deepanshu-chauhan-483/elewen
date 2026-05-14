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
import {
  useAdminAddSupportMessage,
  useAdminSupportTicket,
  useAdminSupportTickets,
  useAdminUpdateSupportTicket,
} from '../hooks/useAdminData'
import { formatDateTime } from '../lib/formatters'

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [statusInput, setStatusInput] = useState('open')
  const [priorityInput, setPriorityInput] = useState('medium')
  const [message, setMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)

  const ticketsQuery = useAdminSupportTickets({ search, status, priority, limit: 24 })
  const ticketList = ticketsQuery.data?.tickets ?? []
  const selectedListTicket = useMemo(
    () => ticketList.find(ticket => ticket.id === selectedId) ?? ticketList[0] ?? null,
    [selectedId, ticketList]
  )
  const ticketQuery = useAdminSupportTicket(selectedListTicket?.id)
  const updateTicketMutation = useAdminUpdateSupportTicket()
  const addMessageMutation = useAdminAddSupportMessage()

  const ticket = ticketQuery.data ?? selectedListTicket

  useEffect(() => {
    if (selectedListTicket && selectedListTicket.id !== selectedId) {
      setSelectedId(selectedListTicket.id)
    }
  }, [selectedId, selectedListTicket])

  useEffect(() => {
    setStatusInput(ticket?.status ?? 'open')
    setPriorityInput(ticket?.priority ?? 'medium')
  }, [ticket?.id])

  if (ticketsQuery.isLoading) {
    return <LoadingState label="Loading support tickets..." />
  }

  if (ticketsQuery.error) {
    return <ErrorState label="Support tickets are unavailable right now." />
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="Help & Support"
        subtitle="Prioritize customer issues, update ticket states, and reply with public or internal notes."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel
          title="Ticket Queue"
          subtitle="Filter by ticket subject, status, or priority."
          action={
            <div className="grid gap-3 md:grid-cols-3">
              <SearchField value={search} onChange={setSearch} placeholder="Search tickets" />
              <SelectField value={status} onChange={setStatus}>
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </SelectField>
              <SelectField value={priority} onChange={setPriority}>
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </SelectField>
            </div>
          }
        >
          {ticketList.length ? (
            <div className="space-y-3">
              {ticketList.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`block w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    ticket?.id === item.id
                      ? 'border-[#5D2E17] bg-[#F7EEE8]'
                      : 'border-[#E7DDD6] bg-[#FBF7F4]'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-medium text-[#2B211B]">{item.subject}</p>
                      <p className="mt-1 text-sm text-[#6F6257]">{item.customer?.name || 'Customer'} / {item.customer?.email || 'Email pending'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={item.status} />
                      <StatusBadge status={item.priority} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No tickets found" body="Support tickets matching the current filters will appear here." />
          )}
        </Panel>

        <Panel title="Ticket Detail" subtitle="Update the queue state and respond back to the customer or leave internal notes.">
          {ticket ? (
            <div className="space-y-6">
              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[#2B211B]">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-[#6F6257]">{ticket.customer?.name || 'Customer'} / {ticket.customer?.email || 'Email pending'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={ticket.status} />
                    <StatusBadge status={ticket.priority} />
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <h3 className="text-lg font-semibold text-[#2B211B]">Ticket Controls</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <SelectField value={statusInput} onChange={setStatusInput}>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </SelectField>
                  <SelectField value={priorityInput} onChange={setPriorityInput}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </SelectField>
                </div>
                <ActionButton
                  className="mt-4"
                  disabled={updateTicketMutation.isPending}
                  onClick={() =>
                    updateTicketMutation.mutate({
                      ticketId: ticket.id,
                      body: {
                        status: statusInput,
                        priority: priorityInput,
                      },
                    })
                  }
                >
                  {updateTicketMutation.isPending ? 'Updating...' : 'Update Ticket'}
                </ActionButton>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-[26px] bg-[#FBF7F4] p-5">
                {ticket.messages?.length ? (
                  ticket.messages.map(entry => (
                    <div key={entry.id} className={`rounded-[24px] px-4 py-4 ${entry.isInternalNote ? 'bg-[#F3E4C8]' : 'bg-white'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#8C7D70]">
                          {entry.sender?.name || 'Unknown'} {entry.isInternalNote ? '/ Internal note' : ''}
                        </p>
                        <p className="text-xs text-[#8C7D70]">{formatDateTime(entry.createdAt)}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#2B211B]">{entry.message}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No messages yet" body="Replies and internal notes for this ticket will appear here." />
                )}
              </div>

              <div className="rounded-[26px] bg-[#FBF7F4] p-5">
                <h3 className="text-lg font-semibold text-[#2B211B]">Reply or Internal Note</h3>
                <TextAreaField
                  className="mt-4 w-full"
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder="Type the reply or internal context."
                />
                <label className="mt-4 flex items-center gap-3 text-sm text-[#6F6257]">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={event => setIsInternalNote(event.target.checked)}
                  />
                  Save as internal note
                </label>
                <ActionButton
                  className="mt-4"
                  disabled={addMessageMutation.isPending || !message.trim()}
                  onClick={async () => {
                    await addMessageMutation.mutateAsync({
                      ticketId: ticket.id,
                      body: {
                        message,
                        isInternalNote,
                      },
                    })
                    setMessage('')
                    setIsInternalNote(false)
                  }}
                >
                  {addMessageMutation.isPending ? 'Sending...' : 'Post Message'}
                </ActionButton>
              </div>
            </div>
          ) : (
            <EmptyState title="No ticket selected" body="Choose a support ticket to view the full conversation and actions." />
          )}
        </Panel>
      </div>
    </div>
  )
}
