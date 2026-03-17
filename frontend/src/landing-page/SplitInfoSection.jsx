import inspirationImg from './images/inspiration.png'

const SplitInfoSection = () => {
  return (
    <section className="w-full flex justify-center bg-[#FFFFFF] font-sans overflow-visible">
      
      <div className="relative w-full max-w-[1440px] min-h-[511px] flex">
        
        {/* --- LEFT SIDE: White Section - flex so image fits --- */}
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-start gap-8 md:gap-6 px-8 md:px-10 lg:px-16 py-12 md:py-20 bg-[#FFFFFF] md:w-[55%] md:max-w-[720px]">
          
          {/* Text content - compact to give image room */}
          <div className="flex flex-col gap-6 shrink-0 md:max-w-[300px] lg:max-w-[340px]">
            <h2 
              className="text-[#2D2D2D] text-[24px] md:text-[27px] leading-[1] font-serif"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              Inspiration, Behind the Scenes, <br /> and Real Celebrations.
            </h2>

            <p className="text-[#2D2D2D] opacity-50 text-[14px] md:text-[16px] leading-[1.5] max-w-[339px]">
              See how celebrations come together, discover new ideas, and follow along as we bring events to life.
            </p>

            <button className="flex items-center justify-center gap-4 w-fit border border-[#591902] rounded-[56px] pl-4 pr-2 py-2 hover:bg-[#591902]/5 transition-colors group">
              <span className="text-[#591902] text-[12px] font-medium leading-[1.5]">
                Join Our Instagram
              </span>
              <div className="w-5 h-5 flex items-center justify-center text-[#591902]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
            </button>
          </div>

          {/* Image - takes remaining space, full visibility */}
          <div className="flex-1 min-w-0 flex items-center justify-center md:justify-end">
            <img 
              src={inspirationImg} 
              alt="Behind the scenes setup" 
              className="w-full max-w-[340px] min-w-[200px] h-auto max-h-[380px] rounded-[8px] object-contain shadow-sm bg-gray-50"
            />
          </div>

        </div>

        {/* --- RIGHT SIDE: Brown Section --- */}
        <div className="w-full md:w-[39%] md:min-w-[560px] min-h-[511px] bg-[#591902] flex flex-col px-8 md:px-10 lg:px-[40px] py-10 md:py-[40px]">
          
          {/* White Video/Image Placeholder Box */}
          <div className="w-full max-w-[420px] h-[210px] bg-[#FFFFFF] rounded-[8px] shadow-sm overflow-hidden flex items-center justify-center text-gray-400 shrink-0">
            {/* Add your vendor video/image here */}
          </div>

          {/* Content Wrapper */}
          <div className="flex flex-col items-start gap-5 mt-6 max-w-[420px]">
            
            <h2 
              className="text-[#FFFFFF] text-[24px] md:text-[27px] leading-[1] font-serif"
              style={{ fontFamily: "'Malgin', serif" }}
            >
              Partner With Elewen
            </h2>

            <p className="text-[#FFFFFF] opacity-50 text-[14px] md:text-[16px] leading-[1.5]">
              We collaborate with experienced decorators, caterers, and event professionals who care about quality, reliability, and beautiful execution.
            </p>

            <button className="flex items-center justify-between w-full max-w-[228px] h-[44px] bg-[#CDB17E] rounded-[56px] pl-6 pr-1 py-1 hover:bg-[#bfa06b] transition-colors group">
              <span className="text-[#FAFAFA] text-[16px] font-medium leading-[1.5]">
                Apply as a Vendor
              </span>
              <div className="w-9 h-9 bg-[#FAFAFA] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border-[1.5px] border-[#CDB17E]">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#CDB17E" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </div>
            </button>

          </div>

        </div>

      </div>
    </section>
  );
};

export default SplitInfoSection;
