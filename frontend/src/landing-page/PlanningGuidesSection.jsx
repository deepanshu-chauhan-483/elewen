const PlanningGuidesSection = () => {
  const categories = [
    "Planning Tips",
    "Decor Inspiration",
    "Hosting Guide",
    "Food & Catering"
  ];

  const guides = [
    {
      title: "How to Plan a Birthday Celebration at Home Without the Stress",
      desc: "A practical guide to organizing decor, food, and setup without managing multiple vendors.",
    },
    {
      title: "5 Simple Decor Ideas That Instantly Elevate a House Party",
      desc: "Easy styling ideas using backdrops, lighting, and small details to transform your space.",
    },
    {
      title: "Choosing the Right Catering Menu for Your Event",
      desc: "Understand how guest count, menu style, and service format affect your event experience.",
    }
  ];

  return (
    <section className="w-full min-h-screen bg-[#F4F4F2] flex flex-col overflow-hidden">
      
      {/* --- Top Header Section --- */}
      <div className="w-full max-w-[1440px] mx-auto pt-24 pb-12 px-12 lg:px-20 flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2 className="font-display text-[40px] md:text-[61px] leading-[1.1] md:leading-[1] text-[#3D4035] font-normal tracking-normal text-left mb-10 md:mb-0" style={{ fontFamily: "'Malgin', serif" }}>
          Planning Guides &amp; <br /> Celebration Ideas
        </h2>

        <div className="max-w-[340px]">
          <p className="text-[#3D4035]/70 text-[15px] leading-relaxed mb-6 font-medium">
            Helpful tips, inspiration, and practical guides to make planning your next celebration simpler.
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

      <hr className="relative left-1/2 -translate-x-1/2 w-screen border-t border-[#3D4035]/15" />

      {/* --- Bottom Content Section (Sidebar Left, Cards Right) --- */}
      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1">
        
        {/* Left Sidebar */}
        <aside className="w-full lg:w-[320px] py-16 lg:py-20 px-12 lg:px-16 flex flex-col items-start shrink-0 border-b lg:border-b-0 lg:border-r border-[#3D4035]/15">
          <div className="flex flex-col gap-8">
            {categories.map((cat, i) => (
              <div
                key={cat}
                className={i === 0 ? 'border-b-[1.5px] border-[#3D4035] pb-1.5 w-fit cursor-pointer' : 'cursor-pointer group'}
              >
                <span className={`text-[16px] tracking-wide ${i === 0 ? 'text-[#3D4035] font-bold' : 'text-[#A3A3A3] font-medium group-hover:text-[#3D4035] transition-colors'}`}>
                  {cat}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Cards Area - Right side */}
        <div className="flex-1 py-16 px-12 lg:px-8 flex flex-col">
          
          {/* Cards Grid - same card config as WhatToPlanSection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <div
                key={guide.title}
                className="bg-white p-2.5 rounded-[24px] shadow-sm flex flex-col h-[460px] group cursor-pointer"
              >
                <div className="flex-1 rounded-t-[16px] bg-white relative overflow-hidden" />

                <div className="bg-[#787A5E] rounded-[16px] p-7 h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                  <h3 className="text-white font-semibold text-[17px] mb-2.5 tracking-wide">{guide.title}</h3>
                  <p className="text-white/80 text-[13px] leading-relaxed font-light pr-2">{guide.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls - matching WhatToPlanSection */}
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

export default PlanningGuidesSection;
