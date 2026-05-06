import { useNavigate } from 'react-router-dom'
import fallbackBooking from '../../assets/images/fallbackBooking.png'

export default function EmptyBooking({
  title = 'No active bookings yet',
  body = 'Start planning your event to see it here',
  actionLabel = 'Explore Packages',
  actionTo = '/',
}) {
  const navigate = useNavigate()

  return (
    <div className="-m-6 -mb-28 flex min-h-[calc(100vh-63px)] w-auto items-center justify-center bg-white px-6 py-12 md:-mb-6">
      <div className="flex max-w-[420px] flex-col items-center text-center">
        <div className="mb-6">
          <img src={fallbackBooking} alt="No bookings" className="w-[220px] md:w-[260px]" />
        </div>

        <h2
          className="text-[28px] leading-tight text-[#2E2E2E] md:text-[32px]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h2>

        <p className="mt-2 text-[14px] text-[#7A7A7A]">{body}</p>

        <button
          type="button"
          onClick={() => navigate(actionTo)}
          className="mt-6 flex items-center gap-2 rounded-full bg-[#CDB17E] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          {actionLabel}
          <span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.33325 8.00065H12.6666M12.6666 8.00065L7.99992 3.33398M12.6666 8.00065L7.99992 12.6673"
                stroke="#FAFAFA"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}
