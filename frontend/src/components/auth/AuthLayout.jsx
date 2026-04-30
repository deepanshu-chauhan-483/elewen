import { useEffect } from 'react'
import bgImage from '../../assets/images/outdoor-party-setup-with-balloons-and-decorations-2026-03-18-09-29-30-utc.jpg'
import navLogo from '../../assets/images/navbar.png'

function SearchBadge() {
  return (
    <div className="flex h-[40px] w-full max-w-[220px] items-center gap-3 rounded-full bg-white/40 px-4 backdrop-blur-md shadow-md">
      <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#6B270A]">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path
            d="M17.5 17.5L13.8833 13.8833M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
            stroke="#FAFAFA"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-[12px] text-[#1C1C1C]">Search</span>
    </div>
  )
}

/* 🔥 Improved soft watermark like your design */
function WatermarkLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute right-[-120px] top-[-80px] h-[520px] w-[520px] rounded-full bg-[#F4EFE5] opacity-60 blur-2xl" />
      <div className="absolute right-[60px] top-[120px] h-[420px] w-[420px] rounded-full border border-[#E8E1D6] opacity-40" />
      <div className="absolute left-[30%] top-[-10%] h-[160%] w-[18%] rounded-full bg-[#F4EFE5] opacity-40 rotate-[-34deg]" />
    </div>
  )
}

export default function AuthLayout({
  activeTab = 'login',
  title,
  subtitle,
  headerPrefix,
  children,
  footer,
}) {
  const rightPaddingClass =
    activeTab === 'login' ? 'px-4 py-6 min-[540px]:p-6' : 'px-4 py-6 min-[540px]:p-8'

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans ">
      {/* LEFT IMAGE SECTION */}
      <div className="hidden p-5 lg:flex lg:flex-[1.08]">
        <div
          className="relative w-full h-full rounded-[28px] overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(61,36,18,0.12), rgba(61,36,18,0.28)), url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* 🔥 TOP BAR FIXED */}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />

          {/* TEXT */}
          <div className="relative z-10 flex h-full flex-col justify-end p-10">
            <h2
              className="text-[72px] leading-[0.92] text-white max-w-[360px]"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              Get <br /> Everything <br /> You Want
            </h2>

            <p className="mt-4 text-white/90 text-[16px] max-w-[500px]">
              Save favourite packages, keep every booking in one place, and let Elewen handle the
              details while you enjoy the celebration
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM SECTION */}
      <div className="relative flex flex-1 overflow-y-auto hide-scrollbar " data-lenis-prevent>
        <WatermarkLayer />

        <div className={`relative z-10 flex w-full flex-col ${rightPaddingClass}`}>
          <div className="mx-auto flex min-h-full w-full max-w-[700px] flex-col">
            {/* TOP CONTENT */}
            <div className="flex flex-col items-center">
              <div className="text-center mb-6">
                <h2
                  className="text-[42px] lg:text-[64px] text-[#364022]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  {title}
                </h2>

                <p className="text-[#727355] mt-2 text-sm lg:text-base">{subtitle}</p>
              </div>

              {children}
            </div>

            {/* 🔥 FOOTER STICKS TO BOTTOM */}
            {footer && <div className="mt-auto pt-10 text-center">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
