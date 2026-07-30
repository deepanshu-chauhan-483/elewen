import AppImage from '../common/AppImage'

export function AddonIllustration({ name = '', size = 42 }) {
  const normalized = String(name).toLowerCase()

  if (normalized.includes('wine')) {
    return (
      <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M15 5h12v6a6 6 0 1 1-12 0V5Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M21 17v11M17 33h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('cocktail') || normalized.includes('mocktail')) {
    return (
      <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M11 10h20l-10 10-10-10Z" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M21 20v10M16 33h10"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path d="m27 8 4-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('whiskey') || normalized.includes('glass')) {
    return (
      <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M12 10h18l-2 18H14l-2-18Z" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    )
  }

  if (normalized.includes('ingredient') || normalized.includes('bill')) {
    return (
      <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M16 8h10l4 6v16H12V8h4Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M26 8v6h6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M17 21h8M17 25h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('bar')) {
    return (
      <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M9 16h24v8H9v-8Z" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M12 24v8M30 24v8M16 12v4M21 10v6M26 12v4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path
        d="M16 6h10l4 8v14a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V14l4-8Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M16 14h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export default function BartendingAddonMedia({
  name = '',
  image = '',
  size = 42,
  className = '',
  imgClassName = 'h-full w-full object-cover',
}) {
  if (image) {
    return (
      <AppImage
        src={image}
        alt={name}
        className={`${imgClassName} ${className}`.trim()}
      />
    )
  }

  return (
    <div className={`flex items-center justify-center text-[#2D2D2D] ${className}`.trim()}>
      <AddonIllustration name={name} size={size} />
    </div>
  )
}
