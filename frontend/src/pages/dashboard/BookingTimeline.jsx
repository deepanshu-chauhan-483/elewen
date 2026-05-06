import { useState } from 'react'

const BOOKINGS = [
  {
    id: 'b1',
    title: 'Kapoor Anniversary Dinner',
    event: 'Anniversary · Mumbai',
    eventDate: '22 June 2028',
    status: 'in_progress',
    statusLabel: 'In Progress',
  },
  {
    id: 'b2',
    title: 'Sharma Wedding Reception',
    event: 'Wedding Reception · Jaipur',
    eventDate: '14 June 2025',
    status: 'confirmed',
    statusLabel: 'Confirmed',
  },
  {
    id: 'b3',
    title: 'Mehta Corporate Event',
    event: 'Corporate · Ahmedabad',
    eventDate: '22 June 2028',
    status: 'upcoming',
    statusLabel: 'Upcoming',
  },
]

const TIMELINE_MAP = {
  b1: [
    {
      id: 1,
      title: 'Inquiry Placed',
      description: 'Customer inquiry received and logged into the system.',
      date: '12 Jan 2028',
      status: 'completed',
    },
    {
      id: 2,
      title: 'Internal Review',
      description: 'Team reviewed requirements and availability confirmed.',
      date: '14 Jan 2028',
      status: 'completed',
    },
    {
      id: 3,
      title: 'Information Collection',
      description: 'Gathering detailed event specifications from client.',
      date: '20 Jan 2028',
      status: 'completed',
    },
    {
      id: 4,
      title: 'Planning & Preparation',
      description: 'Vendor coordination and logistics being arranged.',
      date: '15 Feb 2028',
      status: 'in_progress',
    },
    {
      id: 5,
      title: 'Pre-event Final Checks',
      description: 'Last confirmations before the event day.',
      date: '20 Jun 2028',
      status: 'pending',
    },
    {
      id: 6,
      title: 'Event Day / Execution',
      description: 'Live coordination and on-ground management.',
      date: '22 Jun 2028',
      status: 'pending',
    },
    {
      id: 7,
      title: 'Event Complete',
      description: 'Event concludes and wrap-up begins.',
      date: '22 Jun 2028',
      status: 'pending',
    },
    {
      id: 8,
      title: 'Post Event Follow Up',
      description: 'Feedback collection and final documentation.',
      date: '30 Jun 2028',
      status: 'pending',
    },
  ],
  b2: [
    {
      id: 1,
      title: 'Inquiry Placed',
      description: 'Customer inquiry received and logged.',
      date: '01 Nov 2024',
      status: 'completed',
    },
    {
      id: 2,
      title: 'Internal Review',
      description: 'Requirements reviewed, availability confirmed.',
      date: '03 Nov 2024',
      status: 'completed',
    },
    {
      id: 3,
      title: 'Information Collection',
      description: 'All event details collected from the couple.',
      date: '10 Nov 2024',
      status: 'completed',
    },
    {
      id: 4,
      title: 'Planning & Preparation',
      description: 'Full vendor and logistics coordination completed.',
      date: '20 Dec 2024',
      status: 'completed',
    },
    {
      id: 5,
      title: 'Pre-event Final Checks',
      description: 'Final confirmations and briefings done.',
      date: '12 Jun 2025',
      status: 'completed',
    },
    {
      id: 6,
      title: 'Event Day / Execution',
      description: 'Seamless execution on the wedding day.',
      date: '14 Jun 2025',
      status: 'completed',
    },
    {
      id: 7,
      title: 'Event Complete',
      description: 'Event wrapped up successfully.',
      date: '14 Jun 2025',
      status: 'completed',
    },
    {
      id: 8,
      title: 'Post Event Follow Up',
      description: 'Feedback collected, album delivery pending.',
      date: '21 Jun 2025',
      status: 'in_progress',
    },
  ],
  b3: [
    {
      id: 1,
      title: 'Inquiry Placed',
      description: 'Corporate event inquiry received.',
      date: '01 Mar 2028',
      status: 'completed',
    },
    {
      id: 2,
      title: 'Internal Review',
      description: 'Corporate package reviewed by events team.',
      date: '04 Mar 2028',
      status: 'pending',
    },
    {
      id: 3,
      title: 'Information Collection',
      description: 'Awaiting company brief and guest list.',
      date: '—',
      status: 'pending',
    },
    {
      id: 4,
      title: 'Planning & Preparation',
      description: 'Will begin once brief is received.',
      date: '—',
      status: 'pending',
    },
    {
      id: 5,
      title: 'Pre-event Final Checks',
      description: 'Scheduled close to event date.',
      date: '—',
      status: 'pending',
    },
    {
      id: 6,
      title: 'Event Day / Execution',
      description: 'Live coordination on event day.',
      date: '—',
      status: 'pending',
    },
    {
      id: 7,
      title: 'Event Complete',
      description: 'Post-event wrap and documentation.',
      date: '—',
      status: 'pending',
    },
    {
      id: 8,
      title: 'Post Event Follow Up',
      description: 'Client review and final invoicing.',
      date: '—',
      status: 'pending',
    },
  ],
}

// Tailwind class maps — keeps JSX clean and avoids dynamic class string pitfalls
const STATUS_PILL = {
  completed: 'bg-[#E1F5EE] text-[#0F6E56] border border-[#5DCAA5]',
  in_progress: 'bg-[#FEF1DE] text-[#C07318] border border-[#EF9F27]',
  pending: 'bg-[#F1EFE8] text-[#5F5E5A] border border-[#D3D1C7]',
  confirmed: 'bg-[#E1F5EE] text-[#0F6E56] border border-[#5DCAA5]',
  upcoming: 'bg-[#E6F1FB] text-[#185FA5] border border-[#85B7EB]',
}

const STATUS_PILL_LABEL = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
  confirmed: 'Confirmed',
  upcoming: 'Upcoming',
}

const CARD_BG = {
  completed: 'bg-[#FDFAF7] border-[#EDE5DA]',
  in_progress: 'bg-[#FEF9F3] border-[#F0D5A0]',
  pending: 'bg-[#FAFAFA] border-[#EFEFEF]',
}

function StatusPill({ status, label }) {
  const cls = STATUS_PILL[status] || STATUS_PILL.pending
  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap ${cls}`}
    >
      {label || STATUS_PILL_LABEL[status]}
    </span>
  )
}

function TimelineDot({ status, isLast }) {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      {/* Dot */}
      <div
        className={`
          w-9 h-9 rounded-full flex items-center justify-center z-10 border-2
          ${
            status === 'completed'
              ? 'bg-[#C6A15B] border-[#C6A15B]'
              : status === 'in_progress'
                ? 'bg-[#FEF1DE] border-[#C07318]'
                : 'bg-[#F1EFE8] border-[#D3D1C7]'
          }
        `}
      >
        {status === 'completed' ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8L6.5 11.5L13 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : status === 'in_progress' ? (
          <span className="w-2 h-2 rounded-full bg-[#C07318]" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-[#D3D1C7]" />
        )}
      </div>

      {/* Connector line */}
      {!isLast && (
        <div
          className={`w-0.5 flex-1 min-h-[32px] mt-0.5 ${status === 'completed' ? 'bg-[#C6A15B]/20' : 'bg-[#E5DED6]'}`}
        />
      )}
    </div>
  )
}

export default function BookingTimeline() {
  const [selectedId, setSelectedId] = useState('b1')
  const booking = BOOKINGS.find(b => b.id === selectedId)
  const timeline = TIMELINE_MAP[selectedId] || []
  const done = timeline.filter(t => t.status === 'completed').length
  const pct = timeline.length > 0 ? Math.round((done / timeline.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F7F4F0] p-6">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <h1 className="text-2xl text-[#2E2E2E]">Booking Timeline</h1>
        </div>
        <p className="text-sm text-[#8C7B6B]">
          Follow the milestones and key updates for each booking — {BOOKINGS.length} bookings
        </p>
      </div>

      {/* ── Booking Selector ── */}
      <div className="flex flex-wrap gap-3 mb-8">
        {BOOKINGS.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedId(b.id)}
            className={`
              text-left rounded-xl px-4 py-2.5 min-w-[180px] transition-all duration-150 
              border-[1.5px] cursor-pointer
              ${
                selectedId === b.id
                  ? 'bg-[#591902] border-[#591902] text-[#F5E6CC]'
                  : 'bg-white border-[#E5DED6] text-[#3D2B1A] hover:border-[#C6A15B] hover:shadow-sm'
              }
            `}
          >
            <p className="text-sm font-semibold mb-0.5">{b.title}</p>
            <p
              className={`text-xs ${selectedId === b.id ? 'text-[#F5E6CC]/75' : 'text-[#8C7B6B]'}`}
            >
              {b.statusLabel} · {b.eventDate}
            </p>
          </button>
        ))}
      </div>

      {/* ── Main Card ── */}
      <div className="bg-white rounded-2xl border border-[#E8E0D8] overflow-hidden shadow-[0_2px_16px_rgba(89,25,2,0.06)]">
        {/* Card header */}
        <div className="bg-gradient-to-br from-[#591902] to-[#7A2408] px-7 py-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className="text-lg font-semibold text-[#F5E6CC] tracking-tight mb-1"
              style={{ fontFamily: 'poppins' }}
            >
              {booking.title}
            </h2>
            <p className="text-sm text-[#D4A96A]">
              {booking.event} · {booking.eventDate}
            </p>
          </div>
          <StatusPill status={booking.status} label={booking.statusLabel} />
        </div>

        {/* Progress bar strip */}
        <div className="px-7 py-4 bg-[#FDFAF7] border-b border-[#F0EBE4]">
          <div className="flex justify-between items-center mb-2 font-sans">
            <span className="text-xs text-[#8C7B6B]">Overall progress</span>
            <span className="text-xs font-semibold text-[#591902]">
              {done}/{timeline.length} milestones
            </span>
          </div>
          <div className="h-1.5 bg-[#F0EBE4] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C6A15B] to-[#E8C47A] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Timeline list */}
        <div className="px-7 py-7">
          {timeline.map((item, idx) => (
            <div key={item.id} className="flex gap-4">
              <TimelineDot status={item.status} isLast={idx === timeline.length - 1} />

              <div className={`flex-1 pt-1 ${idx < timeline.length - 1 ? 'pb-6' : 'pb-0'}`}>
                <div
                  className={`
                    rounded-2xl border px-4 py-3.5 flex flex-wrap items-start justify-between gap-2.5
                    ${CARD_BG[item.status] || CARD_BG.pending}
                  `}
                >
                  {/* Left: step label + title + description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#C6A15B]">
                        Step {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3
                        className="text-sm font-semibold text-[#2E2E2E]"
                        style={{ fontFamily: 'poppins' }}
                      >
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[#8C7B6B] leading-relaxed">{item.description}</p>
                  </div>

                  {/* Right: status pill + date */}
                  <div className="flex-shrink-0 text-right">
                    <StatusPill status={item.status} />
                    <p className="text-xs text-[#A89080] mt-1">{item.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
