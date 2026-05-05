import { useNavigate } from 'react-router-dom'

const EmptyBookings = () => {
  const navigate = useNavigate()

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center text-center">
        {/* Illustration */}
        <div className="mb-6">
          <img
            src="../assets//images/fallbackBooking.png"
            alt="No bookings"
            className="w-[220px] md:w-[260px]"
          />
        </div>

        {/* Heading */}
        <h2
          className="text-[28px] md:text-[32px] leading-tight text-[#2E2E2E]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          No active bookings yet
        </h2>

        {/* Sub text */}
        <p className="mt-2 text-[14px] text-[#7A7A7A]">Start planning your event to see it here</p>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/')}
          className="mt-6 flex items-center gap-2 rounded-full bg-[#C6A15B] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Explore Packages →
        </button>
      </div>
    </div>
  )
}

export default EmptyBookings
