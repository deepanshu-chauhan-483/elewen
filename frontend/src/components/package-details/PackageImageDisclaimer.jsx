const DISCLAIMER_TEXT = 'Images are for reference only'

export default function PackageImageDisclaimer({ className = '' }) {
  return (
    <p
      className={`text-[10px] leading-snug text-[#767676]/60 md:text-[11px] ${className}`.trim()}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {DISCLAIMER_TEXT}
    </p>
  )
}
