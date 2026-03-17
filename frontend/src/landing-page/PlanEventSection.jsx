import bulb1 from './lightbulb_images/bulb1.png';
import bulb2 from './lightbulb_images/bulb2.png';

const PlanEventSection = () => {
  const categories = ["Social", "Corporate", "Religious"];
  const cards = [
    { title: "BIRTHDAY CELEBRATIONS", desc: "Curated décor and catering packages designed for effortless hosting." },
    { title: "HOUSE PARTIES", desc: "Structured planning for relaxed, beautiful gatherings." },
    { title: "BABY SHOWERS", desc: "Thoughtfully styled celebrations, simplified." }
  ];

  // We repeat the scallop unit 15 times to ensure it covers very wide screens
  const scallopCount = [...Array(15)];

  return (
    <section className="relative w-full min-h-screen bg-[#F7F7F5] pt-32 md:pt-52 flex flex-col overflow-hidden font-sans">
      
      {/* 1. Top Decorative Scalloped Header & Lights - smaller on mobile */}
      <div className="absolute top-0 left-0 w-full flex pointer-events-none z-0">
        {scallopCount.map((_, i) => (
          <div key={i} className="relative shrink-0 w-[72px] md:w-[144px] h-[45px] md:h-[90px]">
            
            {/* Ellipse 58 (Background / Taller) */}
            <div 
              className="absolute top-0 left-0 w-full h-full bg-[#727355]"
              style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
            ></div>
            
            {/* Ellipse 57 (Foreground / Shorter) */}
            <div 
              className="absolute top-0 left-0 w-full h-[36px] md:h-[72px] bg-[#BFAC9B]"
              style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
            ></div>

            {/* Hanging Light - smaller on mobile */}
            {i !== scallopCount.length - 1 && (
              <div className="absolute top-0 right-0 translate-x-1/2 flex flex-col items-center z-20">
                <div className={`w-[1px] ${i % 2 === 0 ? 'h-[-10px] md:h-[-15px]' : 'h-[-4px] md:h-[-5px]'} bg-[#3D4035]/60`}></div>
                
                <div className="relative flex flex-col items-center">
                  <img 
                    src={i % 2 === 0 ? bulb1 : bulb2} 
                    alt="Pendant Light" 
                    className="w-[20px] md:w-[32px] h-auto relative z-10" 
                  />
                  
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] md:w-[76px] md:h-[78px] opacity-40 blur-[6px] md:blur-[8px] pointer-events-none"
                    style={{
                      background: 'linear-gradient(180deg, #FCD768 0%, #F2F2F2 100%)',
                      clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 2. Top Header Section */}
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 pb-8 md:pb-12 flex flex-col md:flex-row justify-between items-start md:items-end relative z-10">
        
        {/* Left Side: Serif Heading */}
        <h1 
          className="text-[48px] md:text-[61px] leading-[1.1] md:leading-[1] text-[#3D4035] font-normal tracking-normal" 
          style={{ fontFamily: "'Malgin', serif" }}
        >
          Plan Your Event, <br /> Differently.
        </h1>
        
        {/* Right Side: Description & Button */}
        <div className="max-w-[340px] mt-6 md:mt-0">
          <p className="text-[#3D4035]/70 text-[15px] leading-relaxed mb-6 font-medium">
            Choose your event type and explore curated décor and catering packages designed to simplify planning.
          </p>
          
          <button className="flex items-center pl-6 pr-1.5 py-1.5 bg-[#D4BA8E] rounded-full hover:bg-[#C6AB7F] transition-colors group w-fit">
            <span className="text-white font-medium text-[15px] mr-5">View All</span>
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg 
                className="w-[18px] h-[18px] text-[#D4BA8E] group-hover:text-[#C6AB7F] transition-colors" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Full-width Horizontal Divider Line */}
      <hr className="relative left-1/2 -translate-x-1/2 w-screen border-t border-[#3D4035]/15 z-10" />

      {/* 3. Bottom Content Section (Sidebar Left, Cards Right) */}
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1 relative z-10">
        
        {/* Left Side: Sidebar Menu */}
        <aside className="w-full md:w-[320px] py-12 md:py-20 px-6 md:px-16 flex flex-col items-start shrink-0 md:border-r border-[#3D4035]/15">
          <div className="flex flex-col gap-6 md:gap-8">
            {/* Active Item */}
            <div className="border-b-[1.5px] border-[#3D4035] pb-1.5 w-fit cursor-pointer">
              <span className="text-[#3D4035] font-bold text-[16px] tracking-wide">
                {categories[0]}
              </span>
            </div>
            
            {/* Inactive Items */}
            {categories.slice(1).map((cat) => (
              <div key={cat} className="cursor-pointer group">
                <span className="text-[#A3A3A3] font-medium text-[16px] tracking-wide group-hover:text-[#3D4035] transition-colors">
                  {cat}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Side: Cards Area */}
        {/* Updated padding to exactly match WhatToPlanSection */}
        <div className="flex-1 py-12 md:py-16 px-6 md:px-12 lg:px-8">
          
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {cards.map((card) => (
              <div 
                key={card.title} 
                className="bg-white p-2 md:p-2.5 rounded-[20px] md:rounded-[24px] shadow-sm flex flex-col h-[340px] md:h-[460px] group cursor-pointer"
              >
                <div className="flex-1 rounded-t-[12px] md:rounded-t-[16px] bg-white relative overflow-hidden min-h-[140px] md:min-h-0">
                   {/* Optional: Add your card images here later */}
                </div>
                
                <div className="bg-[#787A5E] rounded-[12px] md:rounded-[16px] p-3 md:p-7 h-[130px] md:h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                  <h3 className="text-white font-semibold text-[15px] md:text-[17px] mb-1.5 md:mb-2.5 tracking-wide">
                    {card.title}
                  </h3>
                  <p className="text-white/80 text-[12px] md:text-[13px] leading-relaxed font-light pr-2">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="w-[611px] max-w-[90vw] h-[48px] mt-16 mx-auto flex justify-between items-center gap-[25px]">
            <button className="w-12 h-12 rounded-[96px] bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors shrink-0">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-[4px] w-[100px] h-[8px] justify-center">
              <div className="w-[52px] h-[8px] bg-[#D4BA8E] rounded-[8px]" />
              <div className="w-[8px] h-[8px] bg-[#D4D4D4] rounded-[8px]" />
              <div className="w-[8px] h-[8px] bg-[#D4D4D4] rounded-[8px]" />
              <div className="w-[8px] h-[8px] bg-[#D4D4D4] rounded-[8px]" />
              <div className="w-[8px] h-[8px] bg-[#D4D4D4] rounded-[8px]" />
            </div>

            <button className="w-12 h-12 rounded-[96px] bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors shrink-0">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PlanEventSection;
