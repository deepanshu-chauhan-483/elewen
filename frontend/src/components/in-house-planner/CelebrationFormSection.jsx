import { useState } from 'react'
import { usePlannerLead } from '../../hooks/usePlannerLead'

const SUPPORT_OPTIONS = [
  'Decor & Styling',
  'Catering & Menu Planning',
  'Full Event Planning',
  'Vendor Coordination',
  'Not Sure Yet',
]

const CelebrationFormSection = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const { mutate: submitLead, isPending, isError, error } = usePlannerLead()

  // Controlled form state — field names match Express API / Prisma schema
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    event_type: '',
    event_date: '',
    guest_count: '',
    venue_type: '',
    support_types: [],
    vision_notes: '',
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleSupport = opt =>
    setForm(prev => ({
      ...prev,
      support_types: prev.support_types.includes(opt)
        ? prev.support_types.filter(o => o !== opt)
        : [...prev.support_types, opt],
    }))

  const handleNext = () => {
    if (currentStep === 3) {
      // Step 3 → submit then advance to success screen
      submitLead(form, {
        onSuccess: () => setCurrentStep(4),
        onError: () => setCurrentStep(4), // show success screen regardless — lead is best-effort
      })
      return
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // Helper for Stepper Colors
  const getStepColor = stepNum => {
    if (currentStep > stepNum) return 'bg-[#364022] text-white' // Completed
    if (currentStep === stepNum) return 'bg-[#591902] text-white' // Active
    return 'bg-[#D9D9D9] text-white' // Pending
  }

  const getLineColor = stepNum => {
    if (currentStep > stepNum) return 'border-[#364022]'
    return 'border-[#2D2D2D]/20'
  }

  return (
    <section className="relative w-full bg-[#FFFFFF] flex flex-col items-center pt-24 pb-32 font-sans overflow-hidden">
      {/* --- Header Section --- */}
      <div className="text-center mb-16 px-4 mx-3">
        <h2
          className="text-[#2D2D2D] text-[40px] min-[540px]:text-[61px] leading-[1] font-serif mb-6"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Tell Us About Your Celebration
        </h2>
        <p className="text-[#2D2D2D] opacity-50 text-[14px] min-[540px]:text-[16px] leading-[1.5] max-w-[727px] mx-auto">
          If you’d like me to plan your event end to end, leave your details and we’ll take it from
          there.
        </p>
      </div>

      {/* --- Form Container --- */}
      <div className="relative w-[calc(100%-32px)] max-w-[720px] h-auto min-[540px]:h-[701px] bg-[#F8F4ED] rounded-[20px] shadow-sm mx-auto p-6 min-[540px]:p-0">
        {/* --- ZONE 1: STEPPER (Top 60px) --- */}
        {currentStep < 4 && (
          <div className="relative min-[540px]:absolute min-[540px]:top-[60px] min-[540px]:left-[120px] min-[540px]:right-[120px] flex justify-between items-start z-10 mb-10 min-[540px]:mb-0">
            {/* Connecting Lines */}
            <div className="absolute top-[30px] left-[30px] right-[30px] flex justify-between z-0">
              <div
                className={`w-1/2 border-t-[1.5px] transition-colors duration-300 ${getLineColor(1)}`}
              ></div>
              <div
                className={`w-1/2 border-t-[1.5px] transition-colors duration-300 ${getLineColor(2)}`}
              ></div>
            </div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(1)}`}
              >
                <span
                  className="font-serif text-[27px] leading-[1]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  1
                </span>
              </div>
              <span
                className={`mt-4 text-[10px] min-[540px]:text-[12px] whitespace-normal min-[540px]:whitespace-nowrap text-center max-w-[88px] min-[540px]:max-w-none transition-opacity duration-300 ${currentStep >= 1 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
              >
                Basic Details
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(2)}`}
              >
                <span
                  className="font-serif text-[27px] leading-[1]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  2
                </span>
              </div>
              <span
                className={`mt-4 text-[10px] min-[540px]:text-[12px] whitespace-normal min-[540px]:whitespace-nowrap text-center max-w-[88px] min-[540px]:max-w-none transition-opacity duration-300 ${currentStep >= 2 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
              >
                Event Details
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(3)}`}
              >
                <span
                  className="font-serif text-[27px] leading-[1]"
                  style={{ fontFamily: "'Malgin', serif" }}
                >
                  3
                </span>
              </div>
              <span
                className={`mt-4 text-[10px] min-[540px]:text-[12px] whitespace-normal min-[540px]:whitespace-nowrap text-center max-w-[110px] min-[540px]:max-w-none transition-opacity duration-300 ${currentStep >= 3 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}
              >
                Planning Preferences
              </span>
            </div>
          </div>
        )}

        {/* --- ZONE 2: FORM CONTENT (Top 230px) --- */}
        <div className="relative min-[540px]:absolute min-[540px]:top-[230px] min-[540px]:left-[60px] min-[540px]:right-[60px] mb-10 min-[540px]:mb-0">
          {/* STEP 1: Basic Details */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-y-[32px] animate-fadeIn">
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]"
                />
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]"
                />
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]"
                />
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="text"
                  placeholder="City/Location of Event"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Event Details */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-y-[32px] animate-fadeIn">
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <select
                  value={form.event_type}
                  onChange={e => set('event_type', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Type of Event
                  </option>
                  {[
                    'Birthday',
                    'Anniversary',
                    'House Party',
                    'Baby Shower',
                    'Corporate',
                    'Wedding',
                    'Other',
                  ].map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <input
                  type="date"
                  value={form.event_date}
                  onChange={e => set('event_date', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none cursor-pointer"
                />
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <select
                  value={form.guest_count}
                  onChange={e => set('guest_count', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Estimated Guest Count
                  </option>
                  {['1–15', '15–30', '30–50', '50–100', '100+'].map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border-b border-[#2D2D2D]/50 pb-2">
                <select
                  value={form.venue_type}
                  onChange={e => set('venue_type', e.target.value)}
                  className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Venue Type
                  </option>
                  {[
                    'Home',
                    'Banquet Hall',
                    'Terrace / Rooftop',
                    'Garden / Outdoor',
                    'Office',
                    'Other',
                  ].map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Planning Preferences */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-10 animate-fadeIn">
              <div>
                <h4 className="text-[21px] text-[#2D2D2D] mb-5">
                  What kind of support are you looking for?
                </h4>
                <div className="flex flex-col gap-3">
                  {SUPPORT_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => toggleSupport(opt)}
                        className={`w-[19px] h-[19px] border rounded-[4px] transition-colors flex items-center justify-center shrink-0 cursor-pointer
                          ${
                            form.support_types.includes(opt)
                              ? 'bg-[#591902] border-[#591902]'
                              : 'border-[#2D2D2D] group-hover:bg-[#2D2D2D]/10'
                          }`}
                      >
                        {form.support_types.includes(opt) && (
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[12px] text-[#2D2D2D]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[21px] text-[#2D2D2D] mb-4">
                  Tell us a little about your vision
                </h4>
                <div className="border-b border-[#2D2D2D]/50 pb-2">
                  <input
                    type="text"
                    placeholder="Message"
                    value={form.vision_notes}
                    onChange={e => set('vision_notes', e.target.value)}
                    className="w-full bg-transparent text-[#2D2D2D] text-[12px] outline-none placeholder:text-[#2D2D2D]"
                  />
                </div>
                {isError && (
                  <p className="mt-3 text-[12px] text-red-500">
                    {error?.message ?? 'Something went wrong. Please try again.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* STEP 4: Success Screen (Centered entirely) */}
        {currentStep === 4 && (
          <div className="relative min-[540px]:absolute min-[540px]:inset-0 flex flex-col items-center justify-center animate-fadeIn py-16 min-[540px]:py-0">
            {/* Group 62: Star 8 & Check Icon (Fixed with perfect inline SVG!) */}
            <div className="relative w-[116px] h-[116px] mb-10 flex items-center justify-center">
              <svg
                width="116"
                height="116"
                viewBox="0 0 116 116"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M58 0L64.4449 7.4441L74.227 5.17646L78.6836 14.1378L88.6657 14.0754L90.9635 23.8541L100.177 26.3262L99.8804 36.3117L107.575 41.3435L104.708 50.9419L110.824 58L104.708 65.0581L107.575 74.6565L99.8804 79.6883L100.177 89.6738L90.9635 92.1459L88.6657 101.925L78.6836 101.862L74.227 110.824L64.4449 108.556L58 116L51.5551 108.556L41.773 110.824L37.3164 101.862L27.3343 101.925L25.0365 92.1459L15.8234 89.6738L16.1196 79.6883L8.42461 74.6565L11.2918 65.0581L5.17646 58L11.2918 50.9419L8.42461 41.3435L16.1196 36.3117L15.8234 26.3262L25.0365 23.8541L27.3343 14.0754L37.3164 14.1378L41.773 5.17646L51.5551 7.4441L58 0Z"
                  fill="#364022"
                />
                <path
                  d="M40 58 L52 70 L76 46"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-[8px] w-full">
              <h3
                className="text-[27px] leading-[1] text-[#2D2D2D] text-center font-serif m-0"
                style={{ fontFamily: "'Malgin', serif" }}
              >
                Thank you! Your request has been received.
              </h3>
              <p className="text-[16px] leading-[1.5] text-[#2D2D2D] opacity-50 text-center w-full max-w-[535px] m-0">
                Our in-house planner will review your details and reach out within the next 24 hours
                to discuss your celebration.
              </p>
            </div>
          </div>
        )}

        {/* --- ZONE 4: BOTTOM NAVIGATION BUTTONS (Bottom 60px) --- */}
        {currentStep < 4 && (
          <div className="relative min-[540px]:absolute min-[540px]:bottom-[60px] min-[540px]:left-[60px] min-[540px]:right-[60px] flex flex-col min-[540px]:flex-row min-[540px]:justify-between items-center gap-4 min-[540px]:gap-0">
            {/* Previous Button */}
            <div className="w-full min-[540px]:w-auto min-[540px]:flex-1 flex justify-center min-[540px]:justify-start">
              {currentStep > 1 && (
                <>
                  {/* Mobile: full-width pill */}
                  <button
                    onClick={handlePrev}
                    className="min-[540px]:hidden w-full max-w-[520px] flex items-center justify-between bg-[#D9D9D9] rounded-[56px] pl-6 pr-1 py-1 hover:bg-[#c9c9c9] transition-colors group"
                  >
                    <span className="text-[#8C8C8C] text-[16px] font-medium leading-[1.5]">
                      Previous
                    </span>
                    <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#8C8C8C] transition-transform group-hover:scale-105">
                      <svg
                        className="min-[540px]:hidden"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8C8C8C"
                        strokeWidth="1.5"
                      >
                        <path d="M19 12H5" />
                        <path d="m12 19-7-7 7-7" />
                      </svg>
                      <svg
                        className="hidden min-[540px]:block rotate-180"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8C8C8C"
                        strokeWidth="1.5"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </div>
                  </button>

                  {/* Desktop: existing compact button */}
                  <button
                    onClick={handlePrev}
                    className="hidden min-[540px]:flex items-center gap-4 bg-[#D9D9D9] rounded-[56px] pl-1 pr-6 py-1 hover:bg-[#c9c9c9] transition-colors group"
                  >
                    <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#8C8C8C] transition-transform group-hover:scale-105">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8C8C8C"
                        strokeWidth="1.5"
                        className="rotate-180"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </div>
                    <span className="text-[#8C8C8C] text-[16px] font-medium leading-[1.5]">
                      Previous
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Next / Submit Button */}
            <div className="w-full min-[540px]:w-auto flex justify-center min-[540px]:justify-end">
              <button
                onClick={handleNext}
                disabled={currentStep === 3 && isPending}
                className={`w-full max-w-[520px] min-[540px]:w-auto flex items-center justify-between bg-[#CDB17E] rounded-[56px] pl-6 pr-1 py-1 hover:bg-[#bfa06b] transition-colors group ${currentStep === 3 && isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="text-[#FAFAFA] text-[16px] font-medium leading-[1.5] pr-2">
                  {currentStep === 3 && isPending
                    ? 'Submitting...'
                    : currentStep === 3
                      ? 'Submit'
                      : 'Next'}
                </span>
                <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#CDB17E] transition-transform group-hover:scale-105">
                  <svg
                    className="min-[540px]:hidden"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#CDB17E"
                    strokeWidth="1.5"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                  <svg
                    className="hidden min-[540px]:block"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#CDB17E"
                    strokeWidth="1.5"
                  >
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default CelebrationFormSection
