const CTASection = () => {
  return (
    <section className="w-full flex justify-center bg-[#591902] font-sans">
      {/* Container constrained to 1440px wide and exactly 360px tall 
        py-[80px] perfectly matches the 80px top and bottom gaps from your Figma.
      */}
      <div className="w-full max-w-[1440px] h-[360px] flex flex-col items-center py-[80px] px-6">
        
        {/* Title */}
        <h2 
          className="text-[#FFFFFF] text-[36px] font-normal leading-none text-center font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Still confused, excited, or somewhere in between?
        </h2>

        {/* Description (Gap: 148px - 116px = 32px mt) */}
        <p className="text-[#FFFFFF] opacity-50 text-[16px] font-normal leading-[1.5] text-center max-w-[723px] mt-[32px]">
          Drop your details and we'll get in touch. You're just one call away from turning the confusion into a clear, sorted plan.
        </p>

        {/* Button (Gap: 236px - 196px = 40px mt) */}
        <button className="group mt-[40px] flex items-center justify-between bg-[#CDB17E] rounded-[56px] w-[243px] h-[44px] pl-[24px] pr-[4px] py-[4px] hover:bg-[#bfa06b] transition-colors">
          
          {/* Button Text */}
          <span className="text-[#FAFAFA] text-[16px] font-medium leading-[1.5] tracking-wide">
            Book a Consultation
          </span>

          {/* Icon Circle Wrapper */}
          <div className="w-[36px] h-[36px] bg-[#FAFAFA] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            {/* Arrow Up-Right Icon */}
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
    </section>
  );
};

export default CTASection;
