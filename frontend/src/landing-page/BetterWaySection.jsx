import bulb1 from './lightbulb_images/bulb1.png';
import bulb2 from './lightbulb_images/bulb2.png';
import centerLogo from './images/navbar.png';

const BetterWaySection = () => {
  const scallopCount = [...Array(15)];

  return (
    <section className="w-full flex justify-center bg-[#F7F7F5] overflow-hidden font-sans">
      
      {/* Fixed 1440px Wrapper for perfect 1:1 Figma positioning */}
      <div className="relative w-[1440px] max-w-full min-w-0 mx-auto h-[1171px] shrink-0">
        
        {/* --- 1. Top Scalloped Edge & Lights --- */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-max flex pointer-events-none z-10">
          {scallopCount.map((_, i) => (
            <div key={i} className="relative shrink-0 w-[144px] h-[90px]">
              {/* Gold Background Ellipse */}
              <div 
                className="absolute top-0 left-0 w-[144px] h-[90px] bg-[#CDB17E]"
                style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
              ></div>
              {/* Red Foreground Ellipse */}
              <div 
                className="absolute top-0 left-0 w-[144px] h-[72px] bg-[#591902]"
                style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
              ></div>

              {/* Hanging Lights */}
              {i !== scallopCount.length - 1 && (
                <div className="absolute top-0 right-0 translate-x-1/2 flex flex-col items-center z-20">
                  <div className={`w-[1px] ${i % 2 === 0 ? 'h-[-15px]' : 'h-[-5px]'} bg-[#591902]/40`}></div>
                  <div className="relative flex flex-col items-center">
                    <img src={i % 2 === 0 ? bulb1 : bulb2} alt="Light" className="w-[32px] h-auto relative z-10" />
                    <div
                      className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-2 w-[76px] h-[78px] opacity-40 blur-[8px] pointer-events-none"
                      style={{ 
                        background: 'linear-gradient(180deg, #FCD768 0%, #F2F2F2 100%)', 
                        clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* --- 2. Main Text --- */}
        <h2 
          className="absolute w-[679px] max-w-[calc(100%-2rem)] left-1/2 -translate-x-1/2 top-[253px] text-[#2D2D2D] text-[61px] leading-[1] text-center font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          A Better Way Between <br /> Event and DIY
        </h2>

        <p className="absolute w-[809px] max-w-[calc(100%-2rem)] left-1/2 -translate-x-1/2 top-[403px] text-[#2D2D2D] opacity-50 text-[16px] leading-[1.5] text-center">
          Event planners can feel expensive and overwhelming. Doing everything yourself can quickly become stressful. Elewen brings the best of both, thoughtful styling without the chaos.
        </p>

        {/* --- 3. Venn Diagram & Texts --- */}
        
        {/* The Exact Venn Diagram using SVG */}
        <div className="absolute w-[723px] max-w-[calc(100%-2rem)] h-[422px] left-1/2 -translate-x-1/2 top-[531px]">
          <svg width="723" height="422" viewBox="0 0 723 422" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              {/* Clip path representing the Left Circle */}
              <clipPath id="intersectClip">
                <circle cx="211" cy="211" r="211" />
              </clipPath>
            </defs>
            
            {/* Left Circle (Gold) */}
            <circle cx="211" cy="211" r="211" fill="#CDB17E" />
            
            {/* Right Circle (Red) */}
            <circle cx="512" cy="211" r="211" fill="#591902" />
            
            {/* Center Overlap (White Intersection) */}
            <circle cx="512" cy="211" r="211" fill="#FFFFFF" clipPath="url(#intersectClip)" />
          </svg>
        </div>

        {/* Venn Text: Event Planner - centered in gold circle (center x=569) */}
        <h5 
          className="absolute left-[calc(50%-150.5px)] top-[742px] w-[185px] -translate-x-1/2 -translate-y-1/2 text-center text-[#591902] text-[27px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Event Planner
        </h5>

        {/* Venn Text: DIY - centered in brown circle (center x=870.5) */}
        <h5 
          className="absolute left-[calc(50%+150.5px)] top-[742px] w-[80px] -translate-x-1/2 -translate-y-1/2 text-center text-[#CDB17E] text-[27px] leading-[1] font-serif"
          style={{ fontFamily: "'Malgin', serif" }}
        >
          DIY
        </h5>

        {/* Center Logo - centered in Venn overlap */}
        <div className="absolute left-1/2 top-[742px] w-[320px] h-[320px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <img src={centerLogo} alt="11 Logo" className="w-full h-full object-contain" />
        </div>

        {/* Side Text: Left - positioned clear of the gold circle */}
        <p className="absolute w-[200px] left-[30px] top-[688px] text-[#957960] text-[12px] leading-[1.5]">
          Full-service planning often comes with high costs and long coordination cycles. You rely on large teams, multiple approvals, and a process that can feel heavier than the event itself.
        </p>

        {/* Side Text: Right - positioned clear of the brown circle */}
        <p className="absolute w-[200px] right-[30px] top-[688px] text-[#591902] text-[12px] leading-[1.5] text-right">
          Planning everything yourself means juggling vendors, comparing prices, managing logistics, and making countless decisions. It quickly turns a celebration into a checklist.
        </p>

        {/* Bottom Text */}
        <p className="absolute w-[285px] left-1/2 -translate-x-1/2 top-[993px] text-[#2D2D2D] text-[12px] leading-[1.5] text-center">
          The balance between structure and simplicity. You get curated décor, trusted vendors, and guided planning, without the pressure or the price of full-scale event management.
        </p>

      </div>
    </section>
  );
};

export default BetterWaySection;
