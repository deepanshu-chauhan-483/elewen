import { useEffect } from 'react'
import bgImage from '../../assets/images/outdoor-party-setup-with-balloons-and-decorations-2026-03-18-09-29-30-utc.jpg'

export default function AuthLayout({
  activeTab = 'login',
  title,
  subtitle,
  headerPrefix,
  children,
  footer,
}) {
  const rightPaddingClass = activeTab === 'login' ? 'p-6' : 'p-8'

  // Lenis smooth-scroll wraps the app and otherwise scrolls the window on wheel/touch,
  // which moves the whole auth view. data-lenis-prevent lets native overflow handle the
  // right column; locking html/body overflow stops document scroll (Lenis sets html height:auto).
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  return (
    <div
      className="flex h-screen w-full min-w-0 overflow-hidden bg-white font-sans"
      data-lenis-prevent
    >
      {/* Left: fixed to viewport height — does not scroll with the form */}
      <div
        className="hidden min-h-0 min-w-0 basis-0 overflow-hidden lg:flex lg:flex-1 p-5"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div
          className="relative flex h-full w-full min-h-0 flex-col justify-end overflow-hidden rounded-[20px] p-12"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(89, 25, 2, 0.2) 0%, rgba(191, 54, 4, 0.2) 100%), url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex flex-col items-start gap-2 max-w-[546px]">
            <h2
              className="text-[#FAFAFA] text-[61px] leading-[100%] max-w-[334px]"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              Get
              <br />
              Everything
              <br />
              You Want
            </h2>
            <p className="text-[#FAFAFA] text-[16px] leading-[150%] font-normal mt-2">
              Save favourite packages, keep every booking in one place, and let Elewen handle the
              details while you enjoy the celebration
            </p>
          </div>
        </div>
      </div>

      {/* Right: only this column scrolls; min-h-0 is required for flex + overflow.
          justify-start (not center): flex centering clips the top when content is taller than the viewport. */}
      <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#a3a78f_#f5f5f0] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#f5f5f0] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#a3a78f]/80">
        <div className={`flex min-h-full w-full flex-col justify-start ${rightPaddingClass}`}>
          <div className="mx-auto my-auto flex w-full min-w-0 max-w-[655px] flex-col items-stretch justify-between">
            <div className="flex w-full min-w-0 flex-col justify-start">
              <div className="mx-auto flex w-full min-w-0 max-w-[527px] flex-col gap-[24px]">
                <div className="flex min-w-0 w-full flex-col items-center gap-[8px]">
                  {headerPrefix ? (
                    <div className="flex w-full shrink-0 justify-center [&>svg]:block [&>svg]:max-h-[56px] [&>svg]:max-w-[56px]">
                      {headerPrefix}
                    </div>
                  ) : null}
                  <h2
                    className="w-full min-w-0 text-center text-[61px] leading-[100%] text-[#364022]"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    {title}
                  </h2>
                  <p
                    className="w-full min-w-0 max-w-[421px] text-center text-[16px] leading-[150%] text-[#727355]"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {subtitle}
                  </p>
                </div>

                {children}
              </div>
            </div>

            {footer ? (
              <div className="mt-auto flex w-full shrink-0 justify-center pb-2 pt-8">{footer}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
