/**
 * In-house planner images — respect camera EXIF so photos render upright.
 */
export default function PlannerImage({ src, alt = '', className = '', style, onError, ...rest }) {
  if (!src) return null

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ imageOrientation: 'from-image', ...style }}
      decoding="async"
      draggable={false}
      onError={onError}
      {...rest}
    />
  )
}
