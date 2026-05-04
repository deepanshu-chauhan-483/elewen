import { useState } from 'react'

const BookingCard = ({ status = 'in-progress' }) => {
  const [open, setOpen] = useState(false)

  const isConfirmed = status === 'confirmed'

  return (
    <div
      className={`rounded-2xl p-6 transition-all ${
        status === 'in-progress'
          ? 'border-l-4 border-[#C57A1E]'
          : status === 'upcoming'
            ? 'border-l-4 border-blue-500'
            : 'border-t-4 border-green-600'
      } bg-[#F3F3F3]`}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {isConfirmed ? 'Sharma Wedding Reception' : 'Kapoor Anniversary Dinner'}
          </h3>

          <p className="text-sm text-gray-500 mt-1">Anniversary · Catering</p>

          {/* STATUS */}
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
              status === 'confirmed'
                ? 'bg-green-100 text-green-700'
                : status === 'in-progress'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
            }`}
          >
            {status === 'confirmed'
              ? 'Confirmed'
              : status === 'in-progress'
                ? 'In Progress'
                : 'Upcoming'}
          </span>
        </div>

        {/* RIGHT SIDE */}
        <div className="text-right">
          {isConfirmed && (
            <button
              onClick={() => setOpen(!open)}
              className="bg-[#C6A15B] text-white px-4 py-2 rounded-full text-sm"
            >
              {open ? 'Close' : 'View Details →'}
            </button>
          )}

          {!isConfirmed && (
            <div className="text-sm mt-2">
              <p>AMOUNT PAID</p>
              <p className="font-medium">₹ 1,25,000</p>
              <p className="mt-2">REMAINING</p>
              <p className="font-medium">₹ 75,000</p>
            </div>
          )}
        </div>
      </div>

      {/* DATE */}
      {!isConfirmed && (
        <div className="mt-4 text-sm flex items-center gap-2">
          📅 <span>22 June 2026</span>
        </div>
      )}

      {/* EXPANDED SECTION */}
      {isConfirmed && open && (
        <>
          <div className="border-t mt-4 pt-4 grid grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-400">EVENT TYPE</p>
              <p>Wedding Reception</p>
            </div>

            <div>
              <p className="text-gray-400">DATE</p>
              <p>14 June 2025</p>
            </div>

            <div>
              <p className="text-gray-400">LOCATION</p>
              <p>The Grand Pavilion, Jaipur</p>
            </div>

            <div>
              <p className="text-gray-400">AMOUNT PAID</p>
              <p>₹ 1,25,000</p>
            </div>

            <div>
              <p className="text-gray-400">REMAINING</p>
              <p>₹ 75,000</p>
            </div>
          </div>

          {/* NEXT STEP */}
          <div className="mt-4 bg-[#E9E3DC] rounded-xl p-4 text-sm flex items-center gap-2">
            ⏱ Vendor will contact you within 24 hrs to confirm setup details
          </div>
        </>
      )}
    </div>
  )
}

const ActiveBookings = () => {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-serif text-[#2E2E2E]">Active Bookings</h1>
        <p className="text-sm text-gray-500">Track and manage your ongoing events</p>
      </div>

      {/* Cards */}

      {/* In Progress */}
      <BookingCard status="in-progress" />

      {/* Confirmed (expandable) */}
      <BookingCard status="confirmed" />

      {/* Upcoming */}
      <BookingCard status="upcoming" />
    </div>
  )
}

export default ActiveBookings
