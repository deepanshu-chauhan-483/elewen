function ImageDots({ count = 1 }) {
  const visibleCount = Math.max(1, Math.min(count, 4))

  return (
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
      {Array.from({ length: visibleCount }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 rounded-full ${index === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/70'}`}
        />
      ))}
    </div>
  )
}

export default function PackageCard({ pkg }) {
  const primaryImage = pkg.images?.[0] ?? ''

  return (
    <article className="flex min-h-[380px] flex-col rounded-[8px] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <div className="relative overflow-hidden rounded-[6px] bg-[#E8E2DA]">
        {primaryImage ? (
          <img src={primaryImage} alt={pkg.title} className="h-[180px] w-full object-cover" />
        ) : (
          <div className="h-[180px] w-full bg-[linear-gradient(135deg,#f0e8df_0%,#e4d7c8_100%)]" />
        )}

        <div className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-medium text-[#4B4B4B] shadow-sm">
          Starting from {pkg.price}
        </div>

        <ImageDots count={pkg.images?.length ?? 1} />
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-medium leading-[1.3] text-[#2D2D2D]">{pkg.title}</h3>
          <span className="shrink-0 rounded-full bg-black/5 px-2 py-1 text-[10px] text-[#4B4B4B]">
            {pkg.category || 'Package'}
          </span>
        </div>

        <p className="mt-2 text-[11px] leading-[1.45] text-[#7A7A7A]">{pkg.description}</p>

        <div className="mt-3">
          <p className="text-[10px] font-medium text-[#5A5A5A]">Includes :</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(pkg.tags ?? []).slice(0, 5).map(tag => (
              <span
                key={tag}
                className="rounded-[4px] bg-black/5 px-2 py-1 text-[10px] leading-none text-[#4B4B4B]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
