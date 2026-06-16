import navLogo from '../../assets/images/navbar.png'

/**
 * Full-page loader for Strapi-backed pages — matches Elewen brand (warm ivory + copper).
 */
export default function CmsPageLoader({ label = 'Loading', fullScreen = true }) {
  return (
    <div
      className={
        fullScreen
          ? 'fixed inset-0 z-[70] flex h-[100dvh] w-full flex-col items-center justify-center bg-[#FAFAF8]'
          : 'flex min-h-[50vh] w-full flex-col items-center justify-center bg-[#FAFAF8]'
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="relative flex h-[clamp(4.75rem,20vw,6.5rem)] w-[clamp(4.75rem,20vw,6.5rem)] items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-[#C6A15B]/25 border-t-[#591902] animate-spin"
          style={{ animationDuration: '1.1s' }}
        />
        <div className="absolute inset-[0.65rem] rounded-full bg-[#591902]/[0.06] animate-pulse" />
        <img
          src={navLogo}
          alt=""
          aria-hidden="true"
          className="relative h-12 w-auto object-contain opacity-90 md:h-9"
          style={{
            filter:
              'brightness(0) saturate(100%) invert(12%) sepia(42%) saturate(3200%) hue-rotate(352deg) brightness(95%)',
          }}
        />
      </div>
      {/* {label ? (
        <p
          className="mt-6 text-[11px] font-medium uppercase tracking-[0.32em] text-[#591902]/65"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {label}
        </p>
      ) : null} */}
    </div>
  )
}
