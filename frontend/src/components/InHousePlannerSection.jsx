import React, { useRef, useState } from 'react';

// Placeholders for your masonry collage images
import img1 from '../assets/images/IMG_9814.jpg' // Left tall
import img2 from '../assets/images/IMG_3148.jpg' // Top mid-left
import img3 from '../assets/images/IMG_8625.png' // Mid left square
import img4 from '../assets/images/6f6af066.jpg' // Top mid-right
import img5 from '../assets/images/IMG_0658.jpg' // Top right
import img6 from '../assets/images/IMG_7025.jpg' // Bottom mid-right
import img7 from '../assets/images/IMG_0749.jpg' // Bottom mid-left
import img8 from '../assets/images/IMG_3903.jpg' // Bottom right
import plannerImg from '../assets/images/moksha_portrait.jpg'

import celebrationImg1 from '../assets/images/citroen.png'
import celebrationImg2 from '../assets/images/danube.jpg'
import celebrationImg3 from '../assets/images/guns.jpg'
import celebrationImg4 from '../assets/images/usha.jpg'

import everyDayImg1 from '../assets/images/IMG_3010.jpg' // Top Right
import everyDayImg2 from '../assets/images/IMG_2017.jpg' // Bottom Right
import everyDayImg3 from '../assets/images/IMG_7768.jpg' // Bottom Left
import everyDayImg4 from '../assets/images/IMG_3001.jpg' // Top Center

const celebrationData = [
  {
    id: '01',
    title: 'CITROEN',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg1,
    tall: true,
  },
  {
    id: '02',
    title: 'DANUBE',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg2,
    tall: false,
  },
  {
    id: '03',
    title: 'GUNS & GULAABS',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg3,
    tall: true,
  },
  {
    id: '04',
    title: 'USHA',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    image: celebrationImg4,
    tall: false,
  },
]

const GrandCelebrationsSection = () => {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    // Scroll 95% of the screen on mobile, or exactly one card + gap (322px) on desktop
    const scrollAmount = window.innerWidth < 768 ? window.innerWidth * 0.95 : 322
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section className="relative w-full bg-[#FFFFFF] flex justify-center overflow-hidden font-sans">
      <div className="relative w-full max-w-[1440px] h-[845px] mx-auto">
        
        <div
          ref={scrollRef}
          className="absolute top-[80px] w-full flex gap-[16px] md:gap-[24px] overflow-x-auto snap-x snap-mandatory pb-10"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`::-webkit-scrollbar { display: none; }`}</style>

          {/* FRONT SPACER */}
          <div className="shrink-0 w-[54px] md:w-[76px]"></div>

          {celebrationData.map((item) => (
            <div
              key={item.id}
              // FIXED: Changed from 80vw to 95vw for mobile sizing
              className="relative w-[95vw] sm:w-[298px] shrink-0 snap-start flex flex-col"
            >
              {/* Image Container */}
              <div className={`w-full bg-[#F5F5F5] overflow-hidden ${item.tall ? 'h-[320px] md:h-[400px]' : 'h-[220px] md:h-[300px]'}`}>
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </div>

              {/* Text Content */}
              <div className="mt-6 w-full flex flex-col gap-[12px] pr-4">
                <div className="flex gap-[12px] items-start">
                  <span
                    className="text-[#000000] text-[27px] leading-[1] font-serif shrink-0"
                    style={{ fontFamily: "'Malgin', serif" }}
                  >
                    {item.id}
                  </span>
                  <div className="flex flex-col gap-[12px] mt-[5px]">
                    <h4
                      className="text-[#000000] text-[20px] leading-[1] font-serif uppercase tracking-wide"
                      style={{ fontFamily: "'Malgin', serif" }}
                    >
                      {item.title}
                    </h4>
                    <p className="text-[#2D2D2D] opacity-50 text-[12px] leading-[1.5]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* BACK SPACER */}
          <div className="shrink-0 w-[54px] md:w-[76px]"></div>
          
        </div>

        {/* --- BOTTOM TEXT --- */}
        <div className="absolute w-full bottom-[40px] lg:bottom-[80px] px-[5%] lg:px-[100px] flex flex-col-reverse md:flex-row justify-between items-start md:items-end gap-8 pointer-events-none z-0">
          <p className="text-[#2D2D2D] opacity-50 text-[14px] md:text-[16px] leading-[1.5] text-left md:pb-2 max-w-[631px]">
            Executed during my tenure at Wizcraft and/ or as a freelance project manager.
          </p>

          <h3
            className="text-[#2D2D2D] text-[32px] md:text-[47px] leading-[1] text-left md:text-right font-serif shrink-0"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            Experience Across <br className="hidden md:block" /> Grand Celebrations
          </h3>
        </div>

        {/* --- NAVIGATION ARROWS --- */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 top-[228px] w-[40px] md:w-[52px] h-[80px] md:h-[104px] bg-[#F2F2F2] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors z-20 shadow-md"
          style={{ borderRadius: '0 104px 104px 0' }}
          aria-label="Previous celebrations"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2D2D2D"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="md:ml-[-10px]"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 top-[228px] w-[40px] md:w-[52px] h-[80px] md:h-[104px] bg-[#F2F2F2] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors z-20 shadow-md"
          style={{ borderRadius: '104px 0 0 104px' }}
          aria-label="Next celebrations"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2D2D2D"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="md:mr-[-10px]"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>

      </div>
    </section>
  )
}

const CelebrationsEveryDaySection = () => {
  const categories = [
    { name: 'Anniversaries', active: true },
    { name: 'Birthday Parties', active: false },
    { name: 'Engagement', active: false },
    { name: 'Haldi', active: false },
    { name: 'Mehendi', active: false },
    { name: 'Weddings', active: false },
  ]

  return (
    <section className="relative w-full bg-[#F8F4ED] flex justify-center overflow-hidden font-sans pb-20">
      <div className="relative w-[1440px] h-[1097px] shrink-0">
        <h2
          className="absolute left-1/2 -translate-x-1/2 top-[80px] w-[967px] text-[#2D2D2D] text-[61px] leading-[1] text-center font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Celebrations We Plan Every Day
        </h2>

        <p className="absolute left-1/2 -translate-x-1/2 top-[169px] w-[809px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5] text-center">
          From intimate birthdays to joyful wedding functions, our in-house planner helps bring thoughtful structure and creative detail to social
          celebrations that matter most.
        </p>

        <div className="absolute left-[0px] top-[297px] w-[1440px] h-[800px]">
          <div className="absolute left-[0px] top-[0px] w-[1440px] h-[800px] bg-[#EBEBEB] z-0" />
          <div className="absolute left-[0px] top-[400px] w-[640px] h-[200px] bg-[#CDB17E] z-10" />

          <div className="absolute left-[0px] top-[0px] w-[440px] h-[400px] bg-[#F8F4ED] z-10">
            <div className="absolute left-[100px] top-[0px] flex flex-col pt-12">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className={`py-2 pr-4 cursor-pointer w-fit ${
                    cat.active ? 'border-b border-[#2D2D2D]' : 'opacity-50 hover:opacity-100 transition-opacity'
                  }`}
                >
                  <span className="text-[#2D2D2D] text-[16px] font-medium leading-[1.5]">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <img
            src={everyDayImg4}
            alt="Anniversary Decor"
            className="absolute left-[440px] top-[0px] w-[500px] h-[400px] object-cover z-10"
          />

          <img
            src={everyDayImg1}
            alt="Event Setup"
            className="absolute left-[940px] top-[0px] w-[500px] h-[400px] object-cover z-10"
          />

          <img
            src={everyDayImg3}
            alt="Welcome Board"
            className="absolute left-[0px] top-[600px] w-[640px] h-[200px] object-cover z-10"
          />

          <img
            src={everyDayImg2}
            alt="Night Setup"
            className="absolute left-[640px] top-[400px] w-[800px] h-[400px] object-cover z-10"
          />

          <h3
            className="absolute left-[787px] top-[362px] w-[441px] text-[#FFFFFF] text-[60px] leading-[1] text-center font-normal z-20 drop-shadow-md tracking-wider uppercase"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            ANNIVERSARIES
          </h3>

          <p className="absolute left-[100px] top-[455px] w-[340px] text-[#FFFFFF] text-[12px] font-medium leading-[1.5] z-20">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
            minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
      </div>
    </section>
  )
}


const CelebrationFormSection = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Helper for Stepper Colors
  const getStepColor = (stepNum) => {
    if (currentStep > stepNum) return 'bg-[#364022] text-white'; // Completed
    if (currentStep === stepNum) return 'bg-[#591902] text-white'; // Active
    return 'bg-[#D9D9D9] text-white'; // Pending
  };

  const getLineColor = (stepNum) => {
    if (currentStep > stepNum) return 'border-[#364022]'; 
    return 'border-[#2D2D2D]/20';
  };

  return (
    <section className="relative w-full bg-[#FFFFFF] flex flex-col items-center pt-24 pb-32 font-sans overflow-hidden">
      
      {/* --- Header Section --- */}
      <div className="text-center mb-16 px-4">
        <h2 
          className="text-[#2D2D2D] text-[40px] md:text-[61px] leading-[1] font-serif mb-6"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Tell Us About Your Celebration
        </h2>
        <p className="text-[#2D2D2D] opacity-50 text-[14px] md:text-[16px] leading-[1.5] max-w-[727px] mx-auto">
          If you’d like me to plan your event end to end, leave your details and we’ll take it from there.
        </p>
      </div>

      {/* --- Form Container --- */}
      <div className="relative w-full max-w-[720px] h-[701px] bg-[#F8F4ED] rounded-[20px] shadow-sm mx-4">
        
        {/* --- ZONE 1: STEPPER (Top 60px) --- */}
        {currentStep < 4 && (
          <div className="absolute top-[60px] left-[20px] right-[20px] md:left-[120px] md:right-[120px] flex justify-between items-start z-10">
            
            {/* Connecting Lines */}
            <div className="absolute top-[30px] left-[30px] right-[30px] md:left-[90px] md:right-[90px] flex justify-between z-0">
              <div className={`w-1/2 border-t-[1.5px] transition-colors duration-300 ${getLineColor(1)}`}></div>
              <div className={`w-1/2 border-t-[1.5px] transition-colors duration-300 ${getLineColor(2)}`}></div>
            </div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(1)}`}>
                <span className="font-serif text-[27px] leading-[1]" style={{ fontFamily: "'Malgin', serif" }}>1</span>
              </div>
              <span className={`mt-4 text-[12px] whitespace-nowrap transition-opacity duration-300 ${currentStep >= 1 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}>
                Basic Details
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(2)}`}>
                <span className="font-serif text-[27px] leading-[1]" style={{ fontFamily: "'Malgin', serif" }}>2</span>
              </div>
              <span className={`mt-4 text-[12px] whitespace-nowrap transition-opacity duration-300 ${currentStep >= 2 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}>
                Event Details
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors duration-300 ${getStepColor(3)}`}>
                <span className="font-serif text-[27px] leading-[1]" style={{ fontFamily: "'Malgin', serif" }}>3</span>
              </div>
              <span className={`mt-4 text-[12px] whitespace-nowrap transition-opacity duration-300 ${currentStep >= 3 ? 'text-[#2D2D2D] opacity-100' : 'text-[#2D2D2D] opacity-50'}`}>
                Planning Preferences
              </span>
            </div>
          </div>
        )}

        {/* --- ZONE 2: FORM CONTENT (Top 230px) --- */}
        <div className="absolute top-[230px] left-[30px] right-[30px] md:left-[60px] md:right-[60px]">
          
          {/* STEP 1: Basic Details */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[40px] animate-fadeIn">
              <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2">
                <input type="text" placeholder="Full Name" className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]" />
              </div>
              <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2">
                <input type="email" placeholder="Email Address" className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]" />
              </div>
              <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2">
                <input type="tel" placeholder="Phone Number" className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]" />
              </div>
              <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2">
                <input type="text" placeholder="City/Location of Event" className="w-full bg-transparent text-[#2D2D2D] text-[16px] outline-none placeholder:text-[#2D2D2D]" />
              </div>
            </div>
          )}

          {/* STEP 2: Event Details */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[40px] animate-fadeIn">
              <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2 flex justify-between items-center cursor-pointer">
                <span className="text-[#2D2D2D] text-[16px]">Type of Event</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2 flex items-center gap-2 cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span className="text-[#2D2D2D] text-[16px]">Select Date</span>
              </div>
              <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2 flex justify-between items-center cursor-pointer">
                <span className="text-[#2D2D2D] text-[16px]">Estimated Guest Count</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2 flex justify-between items-center cursor-pointer">
                <span className="text-[#2D2D2D] text-[16px]">Venue Type</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>
          )}

          {/* STEP 3: Planning Preferences */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-10 animate-fadeIn">
              <div>
                <h4 className="text-[21px] text-[#2D2D2D] mb-5">What kind of support are you looking for?</h4>
                <div className="flex flex-col gap-3">
                  {['Decor & Styling', 'Catering & Menu Planning', 'Full Event Planning', 'Vendor Coordination', 'Not Sure Yet'].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <div className="w-[19px] h-[19px] border border-[#2D2D2D] rounded-[4px] group-hover:bg-[#2D2D2D]/10 transition-colors"></div>
                      <span className="text-[12px] text-[#2D2D2D]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[21px] text-[#2D2D2D] mb-4">Tell us a little about your vision</h4>
                <div className="border-b-[1px] border-[#2D2D2D]/50 pb-2">
                  <input type="text" placeholder="Message" className="w-full bg-transparent text-[#2D2D2D] text-[12px] outline-none placeholder:text-[#2D2D2D]" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* STEP 4: Success Screen (Centered entirely) */}
        {currentStep === 4 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn">
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
                Our in-house planner will review your details and reach out within the next 24 hours to discuss your celebration.
              </p>
            </div>
          </div>
        )}

        {/* --- ZONE 4: BOTTOM NAVIGATION BUTTONS (Bottom 60px) --- */}
        {currentStep < 4 && (
          <div className="absolute bottom-[60px] left-[30px] right-[30px] md:left-[60px] md:right-[60px] flex justify-between items-center">
            
            {/* Previous Button */}
            <div className="flex-1">
              {currentStep > 1 && (
                <button onClick={handlePrev} className="flex items-center gap-[16px] bg-[#D9D9D9] rounded-[56px] pl-[4px] pr-[24px] py-[4px] hover:bg-[#c9c9c9] transition-colors group">
                  <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#8C8C8C] transition-transform group-hover:scale-105">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C8C8C" strokeWidth="1.5" className="rotate-180"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                  </div>
                  <span className="text-[#8C8C8C] text-[16px] font-medium leading-[1.5]">Previous</span>
                </button>
              )}
            </div>

            {/* Next / Submit Button */}
            <div className="flex justify-end">
              <button onClick={handleNext} className="flex items-center gap-[16px] bg-[#CDB17E] rounded-[56px] pl-[24px] pr-[4px] py-[4px] hover:bg-[#bfa06b] transition-colors group">
                <span className="text-[#FAFAFA] text-[16px] font-medium leading-[1.5]">
                  {currentStep === 3 ? 'Submit' : 'Next'}
                </span>
                <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center border-[1.5px] border-[#CDB17E] transition-transform group-hover:scale-105">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CDB17E" strokeWidth="1.5"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                </div>
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};


const InHousePlannerSection = () => {
  return (
    <>
      <section className="w-full bg-[#FFFFFF] flex justify-center overflow-hidden font-sans">
        {/* 1438px Fixed Wrapper for Pixel-Perfect Figma Alignment */}
        <div className="relative w-[1438px] h-[802px] shrink-0">
          {/* --- IMAGE COLLAGE --- */}

          {/* Rectangle 41 (Left Tall) */}
          <img
            src={img1}
            alt="Event Setup"
            className="absolute left-[124px] top-[125px] w-[264px] h-[360px] object-cover shadow-md z-0 bg-gray-200"
          />

          {/* Rectangle 43 (Top Mid-Left) */}
          <img
            src={img2}
            alt="Event Decor"
            className="absolute left-[404px] top-[67px] w-[252px] h-[168px] object-cover shadow-md z-0 bg-gray-200"
          />

          {/* Rectangle 42 (Mid Left Square) */}
          <img
            src={img3}
            alt="Stage Setup"
            className="absolute left-[404px] top-[251px] w-[252px] h-[234px] object-cover shadow-md z-0 bg-gray-200"
          />

          {/* Rectangle 46 (Top Mid-Right) */}
          <img
            src={img4}
            alt="Event Lighting"
            className="absolute left-[672px] top-[125px] w-[235px] h-[235px] object-cover shadow-md z-0 bg-gray-200"
          />

          {/* Rectangle 47 (Top Right) */}
          <img
            src={img5}
            alt="Group Photo"
            className="absolute left-[923px] top-[125px] w-[287px] h-[235px] object-cover shadow-md z-0 bg-gray-200"
          />

          {/* Rectangle 45 (Bottom Mid-Right) */}
          <img
            src={img6}
            alt="Panel Discussion"
            className="absolute left-[672px] top-[374px] w-[373px] h-[311px] object-cover shadow-md z-0 bg-gray-200"
          />

          {/* Rectangle 44 (Bottom Mid-Left) */}
          <img
            src={img7}
            alt="DJ Setup"
            className="absolute left-[256px] top-[501px] w-[400px] h-[234px] object-cover shadow-md z-0 bg-gray-200"
          />

          {/* Rectangle 48 (Bottom Right) */}
          <img
            src={img8}
            alt="Car Launch Event"
            className="absolute left-[1061px] top-[374px] w-[253px] h-[226px] object-cover shadow-md z-0 bg-gray-200"
          />
        </div>
      </section>

      <section className="w-full bg-[#957960] flex justify-center overflow-hidden font-sans">
        <div className="relative w-[1440px] h-[660px] shrink-0">
          <div className="absolute left-[0px] top-[0px] w-[720px] h-[660px] bg-[#FFFFFF]">
            <img
              src={plannerImg}
              alt="Moksha - In-House Event Planner"
              className="w-full h-full object-cover object-[center_15%]"
            />
          </div>

          <h2
            className="absolute right-[114px] top-[40px] w-[566px] text-[#FFFFFF] text-[61px] leading-[1] font-serif"
            style={{ fontFamily: "'Malgin', serif" }}
          >
            From Our In-House <br /> Event Planner
          </h2>

          <div className="absolute left-[760px] top-[202px] w-[461px] flex flex-col gap-[20px]">
            <h3 className="w-full text-[#FFFFFF] text-[21px] font-medium leading-[1.2]">
              Hi, I&apos;m Moksha.
            </h3>

            <div className="w-full flex flex-col gap-[20px]">
              <p className="w-full text-[#FFFFFF] opacity-80 text-[16px] leading-[1.5] font-normal">
                Co-founder at Elewen and a professional event planner with 6+ years of industry experience. Trained in International Events in the
                UK, I bring structure, creativity, and calm to every celebration.
              </p>

              <p className="w-full text-[#FFFFFF] opacity-80 text-[16px] leading-[1.5] font-normal">
                Some events call for personal attention and thoughtful detailing. They need intention, detail, and a planner who truly cares,
                that&apos;s exactly why the In-House Planner was created.
              </p>
            </div>
          </div>
        </div>
      </section>

      <GrandCelebrationsSection />

      <CelebrationsEveryDaySection />

      <CelebrationFormSection />
    </>
  );
};

export default InHousePlannerSection;