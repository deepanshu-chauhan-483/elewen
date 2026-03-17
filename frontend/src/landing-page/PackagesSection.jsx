import { useState } from 'react';

import packageImg1 from './images/scrolling.png';
import packageImg2 from './images/calls.png';
import packageImg3 from './images/vendors.png';

const packagesData = [
  {
    id: 0,
    title: "House Party Essentials",
    category: "Birthday",
    desc: "A balanced decor package designed for relaxed gatherings and celebrations.",
    image: packageImg1,
    price: "Starting from ₹21,000",
    tags: ["Balloon Styling", "Fairy Lighting", "Welcome Decor", "Sound Setup", "More"]
  },
  {
    id: 1,
    title: "Themed Birthday Bash",
    category: "Birthday",
    desc: "Complete venue transformation with custom backdrops and tailored aesthetics.",
    image: packageImg2,
    price: "Starting from ₹35,000",
    tags: ["Custom Backdrop", "Themed Props", "Balloon Arches", "Lighting", "More"]
  },
  {
    id: 2,
    title: "Intimate Anniversary",
    category: "Anniversary",
    desc: "Soft lighting, elegant florals, and curated dining setups for memorable nights.",
    image: packageImg3,
    price: "Starting from ₹18,000",
    tags: ["Floral Decor", "Candle Setup", "Premium Cutlery", "Music", "More"]
  },
  {
    id: 3,
    title: "Corporate Mixer",
    category: "Corporate",
    desc: "Professional yet engaging setups perfect for team celebrations and milestones.",
    image: packageImg1,
    price: "Starting from ₹45,000",
    tags: ["Branded Decor", "AV Setup", "Seating", "Welcome Desk", "More"]
  },
  {
    id: 4,
    title: "Baby Shower Bloom",
    category: "Baby Shower",
    desc: "Pastel hues, gentle aesthetics, and photo-ready moments for the special day.",
    image: packageImg2,
    price: "Starting from ₹25,000",
    tags: ["Pastel Balloons", "Photo Booth", "Welcome Sign", "Favors", "More"]
  }
];

const PackagesSection = () => {
  const [activeIndex, setActiveIndex] = useState(1);

  const handleNext = () => {
    setActiveIndex((prev) => Math.min(prev + 1, packagesData.length - 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section 
      className="relative w-full min-h-screen bg-[#F4F4F2] pt-8 pb-28 -mt-4"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      
      {/* --- 1. Top Headings --- */}
      <div className="flex flex-col items-center text-center px-6 z-20 relative pt-16">
        <h2 
          className="text-[#2D2D2D] text-[48px] md:text-[61px] leading-[1] max-w-[1050px] mb-6 font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Somewhere Between Moodboards <br className="hidden md:block"/> and Reality, the Feeling Got Lost.
        </h2>
        <p className="text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5] max-w-[809px] mb-20">
          Celebrations became louder and bigger, but less personal. Eleven exists to bring that feeling back, not through more, but through meaning.
        </p>

        <h3 
          className="text-[#2D2D2D] text-[32px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Our Most Loved Packages
        </h3>
      </div>

      {/* --- 2. Carousel - 3D cylinder (scene/a3d pattern) --- */}
      <div className="relative w-full overflow-x-hidden -mt-10">
        {/* Top curved edge */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[1440px] max-w-[100vw] h-[100px] z-10 pointer-events-none"
          style={{ 
            background: '#F4F4F2',
            borderRadius: '0 0 50% 50% / 0 0 100% 100%',
          }}
        />

        {/* Scene: only 3 cards visible, subtler 3D */}
        <div 
          className="relative min-h-[700px] w-full grid place-content-center overflow-hidden px-0"
          style={{
            perspective: '80em',
            maskImage: 'linear-gradient(90deg, transparent 0%, black 28%, black 72%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 28%, black 72%, transparent 100%)',
          }}
        >
          {/* a3d: 3D rotating container - reduced angle for less elevation on side cards */}
          <div
            className="grid place-self-center w-full max-w-[100vw]"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${-activeIndex * 36}deg)`,
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {packagesData.map((pkg, index) => {
              const baseAngle = 36;
              const halfAngleDeg = baseAngle / 2;
              const halfAngleRad = (halfAngleDeg * Math.PI) / 180;
              const cardWidth = 640;
              const gap = 8;
              const radius = (cardWidth / 2 + gap / 2) / Math.tan(halfAngleRad);
              const isActive = index === activeIndex;

              return (
                <div
                  key={pkg.id}
                  onClick={() => !isActive && setActiveIndex(index)}
                  className="w-[640px] relative flex flex-col cursor-pointer bg-white overflow-hidden gap-6"
                  style={{
                    gridArea: '1/1',
                    height: '700px',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    transform: `rotateY(${index * 36}deg) translateZ(${-radius}px)`,
                    transformStyle: 'preserve-3d',
                    boxShadow: isActive ? '0 12px 32px rgba(0,0,0,0.15)' : '0 6px 20px rgba(0,0,0,0.1)',
                    opacity: isActive ? 1 : 0.9,
                  }}
                >
                  {/* Image area - padded outer container */}
                  <div className="px-5 pt-5 shrink-0">
                    <div className="relative w-full h-[330px] bg-[#EAEAEA] overflow-hidden rounded-lg">
                    <img 
                      src={pkg.image} 
                      alt={pkg.title} 
                      className="w-full h-full object-cover object-center"
                    />

                    {isActive && (
                      <>
                        {/* Price tag */}
                        <div 
                          className="absolute right-4 top-4 flex items-center justify-center px-3 py-1 gap-1 bg-white rounded-[36px]"
                          style={{ padding: '4px 12px' }}
                        >
                          <span className="text-[#364022] text-[18px] font-medium leading-[1.5]">
                            {pkg.price}
                          </span>
                        </div>

                        {/* Nav arrows */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-3">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-white/30"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(34px)',
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition hover:bg-white/30"
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(34px)',
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Pagination dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
                          {packagesData.map((_, idx) => (
                            <div
                              key={idx}
                              className={`rounded-[12px] transition-all ${activeIndex === idx ? 'w-7 h-2 bg-[#CDB17E]' : 'w-2 h-2 bg-white'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    </div>
                  </div>

                  {/* Content area - translateZ(0) forces crisp text rendering in 3D context */}
                  <div 
                    className="flex flex-col items-start flex-1 min-h-0 px-8 pb-6"
                    style={{ 
                      gap: '20px',
                      transform: 'translateZ(0)',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                    }}
                  >
                    {/* Frame 118: gap 24px */}
                    <div className="flex flex-col items-start w-full" style={{ gap: '24px' }}>
                      {/* Frame 117: title + description, gap 12px */}
                      <div className="flex flex-col items-start w-full" style={{ gap: '12px' }}>
                        {/* Frame 139: title + category row */}
                        <div className="flex flex-row justify-between items-center w-full gap-1">
                          <h4 
                            className="text-[#2D2D2D] truncate"
                            style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '28px', lineHeight: '150%' }}
                          >
                            {pkg.title}
                          </h4>
                          <div 
                            className="flex justify-center items-center rounded-[48px] shrink-0"
                            style={{ background: 'rgba(0, 0, 0, 0.05)', padding: '2px 12px' }}
                          >
                            <span 
                              className="text-[#2D2D2D]"
                              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '18px', lineHeight: '150%' }}
                            >
                              {pkg.category}
                            </span>
                          </div>
                        </div>

                        {/* Description - Body/regular/b3 */}
                        <p 
                          className="text-[#767676] line-clamp-2 w-full"
                          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: '18px', lineHeight: '150%' }}
                        >
                          {pkg.desc}
                        </p>
                      </div>

                      {/* Frame 134: Includes section, gap 8px */}
                      <div className="flex flex-col items-start w-full" style={{ gap: '8px' }}>
                        <p 
                          className="text-[#2D2D2D] w-full"
                          style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '18px', lineHeight: '150%' }}
                        >
                          Includes :
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.tags.map((tag, i) => (
                            <div 
                              key={i} 
                              className="flex justify-center items-center rounded-[48px]"
                              style={{ background: 'rgba(0, 0, 0, 0.05)', padding: '2px 12px' }}
                            >
                              <span 
                                className="text-[#2D2D2D]"
                                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '18px', lineHeight: '150%' }}
                              >
                                {tag}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            );
          })}
          </div>
        </div>

        {/* Bottom curved edge */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[1440px] max-w-[100vw] h-[100px] z-10 pointer-events-none"
          style={{ 
            background: '#F4F4F2',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          }}
        />
      </div>

      {/* --- 3. Bottom Carousel Controls --- */}
      <div className="w-[611px] max-w-[90vw] h-[48px] mx-auto flex justify-between items-center gap-[25px] z-20 relative -mt-20">
        <button 
          type="button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className={`w-12 h-12 rounded-[96px] flex items-center justify-center transition-all shrink-0 ${activeIndex === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#2D2D2D] hover:bg-black cursor-pointer'}`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-[4px] w-[100px] h-[8px] justify-center">
          {packagesData.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-[8px] rounded-[8px] transition-all duration-500 ${activeIndex === idx ? 'w-[52px] bg-[#591902]' : 'w-[8px] bg-[#ADADAD]'}`}
            />
          ))}
        </div>

        <button 
          type="button"
          onClick={handleNext}
          disabled={activeIndex === packagesData.length - 1}
          className={`w-12 h-12 rounded-[96px] flex items-center justify-center transition-all shrink-0 ${activeIndex === packagesData.length - 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#2D2D2D] hover:bg-black cursor-pointer'}`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

    </section>
  );
};

export default PackagesSection;
