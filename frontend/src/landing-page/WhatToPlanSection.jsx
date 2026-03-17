const WhatToPlanSection = () => {
  const cards = [
    {
      title: 'Event Styling',
      desc: "Backdrops, themes, balloon installations, and curated visual details that define your celebration's look.",
    },
    {
      title: 'Lighting & Ambience',
      desc: 'Soft lighting setups that shape the mood — from fairy lights to warm spotlight accents.',
    },
    {
      title: 'Sound & Setup',
      desc: 'Clear audio arrangements for music, announcements, and seamless coordination.',
    },
  ]

  return (
    <section className="w-full min-h-screen bg-[#F4F4F2] flex flex-col overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto pt-16 md:pt-24 pb-8 md:pb-12 px-6 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="max-w-[340px] order-last md:order-first mb-6 md:mb-0">
          <p className="text-[#3D4035]/70 text-[15px] leading-relaxed mb-6 font-medium">
            Choose a service category to explore curated packages designed for your event.
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

        <h2 className="font-display text-[40px] md:text-[61px] leading-[1.1] md:leading-[1] text-[#3D4035] font-normal tracking-normal order-first md:order-last" style={{ fontFamily: "'Malgin', serif" }}>
          What Would You <br /> Like To Plan?
        </h2>
      </div>

      <hr className="relative left-1/2 -translate-x-1/2 w-screen border-t border-[#3D4035]/15" />

      <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row flex-1">
        <div className="flex-1 order-last lg:order-none py-12 md:py-16 px-6 md:px-12 lg:px-8 lg:border-r border-[#3D4035]/15">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {cards.map((card) => (
              <div
                key={card.title}
                className="bg-white p-2 md:p-2.5 rounded-[20px] md:rounded-[24px] shadow-sm flex flex-col h-[340px] md:h-[460px] group cursor-pointer"
              >
                <div className="flex-1 rounded-t-[12px] md:rounded-t-[16px] bg-white relative overflow-hidden min-h-[140px] md:min-h-0" />

                <div className="bg-[#787A5E] rounded-[12px] md:rounded-[16px] p-3 md:p-7 h-[130px] md:h-[170px] flex flex-col justify-center transition-colors group-hover:bg-[#6A6C52]">
                  <h3 className="text-white font-semibold text-[15px] md:text-[17px] mb-1.5 md:mb-2.5 tracking-wide">{card.title}</h3>
                  <p className="text-white/80 text-[12px] md:text-[13px] leading-relaxed font-light pr-2">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-10 md:gap-14 mt-12 md:mt-16">
            <button className="w-12 h-12 rounded-full bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-1.5 bg-[#D4BA8E] rounded-full" />
              <div className="w-1.5 h-1.5 bg-[#D4D4D4] rounded-full" />
              <div className="w-1.5 h-1.5 bg-[#D4D4D4] rounded-full" />
              <div className="w-1.5 h-1.5 bg-[#D4D4D4] rounded-full" />
              <div className="w-1.5 h-1.5 bg-[#D4D4D4] rounded-full" />
            </div>

            <button className="w-12 h-12 rounded-full bg-[#EAE6DD] flex items-center justify-center text-[#BEB09B] hover:bg-[#D4BA8E] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <aside className="w-full lg:w-[320px] order-first lg:order-none py-12 md:py-20 px-6 md:px-16 flex flex-col items-start shrink-0 border-b lg:border-b-0 border-[#3D4035]/15">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="border-b-[1.5px] border-[#3D4035] pb-1.5 w-fit cursor-pointer">
              <span className="text-[#3D4035] font-bold text-[16px] tracking-wide">Decore</span>
            </div>

            <div className="cursor-pointer group">
              <span className="text-[#A3A3A3] font-medium text-[16px] tracking-wide group-hover:text-[#3D4035] transition-colors">
                Food &amp; Beverage
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default WhatToPlanSection
