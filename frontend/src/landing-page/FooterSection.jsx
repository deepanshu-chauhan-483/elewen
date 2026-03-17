const footerNav = [
  {
    label: 'LEGAL',
    labelWidth: 'w-[46px]',
    links: ['Terms & Conditions', 'Cancellation Policy'],
  },
  {
    label: 'COMMUNITY',
    labelWidth: 'w-[97px]',
    links: ['Vendor Registration', 'Instagram'],
  },
  {
    label: 'HELP',
    labelWidth: 'w-[36px]',
    links: ["Contact Us", "FAQ's", 'Order Updates'],
  },
  {
    label: 'SHOP BY',
    labelWidth: 'w-[66px]',
    links: ['Events', 'Services'],
  },
]

const FooterSection = () => {
  return (
    <footer className="w-full flex justify-center bg-[#F2F2F2] overflow-hidden font-sans">
      {/* Desktop matches Figma 1440x645. Mobile stacks cleanly. */}
      <div className="relative w-full max-w-[1440px] md:h-[645px] shrink-0 px-6 md:px-0 py-12 md:py-0">
        {/* --- 1. Giant Logo Text --- */}
        <h1
          className="text-center text-[#2D2D2D] leading-[1] md:absolute md:left-1/2 md:-translate-x-1/2 md:top-[80px] md:w-[1434px]"
          style={{
            fontFamily: "'Malgin', serif",
            fontSize: 'clamp(72px, 18vw, 341px)',
          }}
        >
          ELEWEN
        </h1>

        {/* --- 2 + 3. Nav + Description (mobile stacked, desktop absolute) --- */}
        <div className="mt-10 md:mt-0 md:absolute md:left-[100px] md:top-[401px] md:right-[100px] md:flex md:items-start md:justify-between md:gap-10">
          {/* Left Side Navigation Links */}
          <div className="flex flex-col gap-4">
            {footerNav.map((row) => (
              <div key={row.label} className="flex items-start md:items-center gap-6 md:gap-[60px]">
                <span className={`${row.labelWidth} text-[#2D2D2D] text-[16px] leading-[1.5] shrink-0`}>
                  {row.label}
                </span>
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2 opacity-50">
                  {row.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="text-[#2D2D2D] text-[16px] leading-[1.5] hover:text-[#591902] transition-colors"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Side Description */}
          <p className="mt-10 md:mt-0 md:w-[611px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5]">
            Elewen simplifies event planning with curated décor, catering, and personal coordination. From
            intimate gatherings to meaningful celebrations, we bring everything together so you can focus
            on the moment.
          </p>
        </div>

        {/* --- 4. Right Side Divider Line --- */}
        <div className="mt-10 md:mt-0 md:absolute md:right-[0px] md:top-[493px] md:w-[720px] border-t border-[#000000] opacity-20" />

        {/* --- 5. Copyright --- */}
        <p className="mt-5 md:mt-0 md:absolute md:right-[100px] md:top-[513px] text-[#2D2D2D] opacity-50 text-[12px] leading-[1.5]">
          © 2025 Elewen. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default FooterSection
