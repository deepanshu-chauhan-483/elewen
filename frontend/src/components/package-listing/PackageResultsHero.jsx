function FilterPill({ label, widthClass = '' }) {
  return (
    <div className={`relative w-full sm:w-auto ${widthClass}`}>
      <select
        value={label}
        disabled
        className="h-[34px] w-full appearance-none rounded-full bg-[#F7F0E6] pl-4 pr-9 text-[14px] leading-none text-[#7A2B08] outline-none disabled:cursor-default disabled:opacity-100"
      >
        <option>{label}</option>
      </select>

      <svg
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#7A2B08]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="m2.5 4.5 3.5 3 3.5-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function PackageResultsHero({
  title = 'Showing results for:',
  filters = [],
  className = '',
}) {
  return (
    <section
      className={`relative w-full max-h-[244px] overflow-hidden bg-[#591902] py-8 sm:py-10 mt-0 ${className}`}
    >
      {/* ✅ LEFT ALIGNED FIX */}
      <div className="flex w-full max-w-[1220px] flex-col justify-center pl-[clamp(16px,4vw,80px)] pr-[clamp(16px,2vw,40px)]">

        <div className="flex w-full flex-col gap-3 text-white lg:flex-row lg:items-center lg:gap-8">
          <span className="shrink-0 text-[14px] leading-none text-white/90">
            {title}
          </span>

          <div className="flex w-full max-w-[553px] flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {filters.map(filter => (
              <FilterPill
                key={`${filter.label}-${filter.widthClass ?? ''}`}
                label={filter.label}
                widthClass={filter.widthClass}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}