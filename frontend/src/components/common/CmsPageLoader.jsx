import navLogo from '../../assets/images/navbar.png'

/**
 * Full-page loader for Strapi-backed pages — soft transparent blue overlay.
 */
export default function CmsPageLoader({
  label = 'Loading',
  fullScreen = true,
  compact = false,
  blend = false,
  centered = false,
  className = '',
}) {
  const embeddedSizeClass = compact
    ? 'min-h-[220px] py-10'
    : blend
      ? 'min-h-[40vh] py-12'
      : 'min-h-[50vh]'
  const loaderBgClass = 'bg-white'
  const embeddedBgClass = blend ? 'bg-transparent' : loaderBgClass
  const viewportCenterClass =
    'fixed inset-x-0 bottom-0 top-[63px] z-20 flex items-center justify-center bg-transparent md:left-[260px]'

  return (
    <div
      className={
        fullScreen
          ? `fixed inset-0 z-[70] flex h-[100dvh] w-full flex-col items-center justify-center ${loaderBgClass} ${className}`
          : centered
            ? `${viewportCenterClass} ${className}`
            : `flex w-full flex-col items-center justify-center ${embeddedBgClass} ${embeddedSizeClass} ${className}`
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="relative flex h-[clamp(4.75rem,20vw,6.5rem)] w-[clamp(4.75rem,20vw,6.5rem)] md:h-[4.5rem] md:w-[4.5rem] items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-[#C6A15B]/25 border-t-[#591902] animate-spin"
          style={{ animationDuration: '1.1s' }}
        />
        <div className="absolute inset-[0.65rem] rounded-full bg-[#591902]/[0.06] animate-pulse md:inset-3" />
        <img
          src={navLogo}
          alt=""
          aria-hidden="true"
          className="relative h-12 w-auto object-contain opacity-90 md:h-11"
          style={{
            filter:
              'brightness(0) saturate(100%) invert(12%) sepia(42%) saturate(3200%) hue-rotate(352deg) brightness(95%)',
          }}
        />
      </div>
    </div>
  )
}
