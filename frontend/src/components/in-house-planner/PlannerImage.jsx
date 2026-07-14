/**
 * In-house planner images — upright framing (EXIF + no CSS tilt on the img).
 */
export default function PlannerImage({
  src,
  alt = '',
  className = '',
  style,
  onError,
  loading = 'lazy',
  ...rest
}) {
  if (!src) return null

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        imageOrientation: 'from-image',
        ...style,
      }}
      decoding="async"
      loading={loading}
      draggable={false}
      onError={onError}
      {...rest}
    />
  )
}
