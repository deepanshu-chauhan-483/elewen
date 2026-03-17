import bgImg from './images/bg_img.png'
import navLogo from './images/navbar.png'
const HeroSection = () => {
  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center bg-no-repeat overflow-hidden text-[#FAFAFA]"
      // REPLACE this URL with your actual imported background image
      style={{
        backgroundColor: '#0b0b0f',
        backgroundImage: `url(${bgImg})`,
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      {/* Top Navigation */}
      <header className="absolute top-0 left-0 right-0 w-full flex items-center justify-between px-4 md:px-8 py-2 md:py-8 z-20 h-[66px] md:h-[100px]">
        
        {/* Left - Mobile Hamburger & Desktop Search */}
        <div className="flex items-center w-[56px] md:w-[260px] shrink-0">
          {/* Mobile Hamburger */}
          <button className="flex flex-col space-y-[5px] group cursor-pointer p-1.5 md:hidden">
            <div className="w-6 h-[2px] bg-[#FAFAFA]"></div>
            <div className="w-4 h-[2px] bg-[#FAFAFA]"></div>
          </button>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center bg-white/50 backdrop-blur-[16px] rounded-full p-1.5 w-[260px] cursor-text transition-all hover:bg-white/60">
            <div className="w-[38px] h-[38px] bg-[#591902] rounded-full flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <span className="text-[#2B2D30] text-[15px] ml-4 font-medium tracking-wide">
              Search
            </span>
          </div>
        </div>

        {/* Center - Logo */}
        <div className="flex justify-center items-center flex-1 min-w-0 h-full">
          <div className="w-[400px] h-[142px] md:w-[480px] md:h-[254px] flex items-center justify-center">
            <img
              src={navLogo}
              alt="Logo"
              className="w-full h-full object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>

        {/* Right - Mobile Search Icon & Desktop Hamburger */}
        <div className="flex justify-end items-center w-[56px] md:w-[260px] shrink-0">
          {/* Mobile Search Icon */}
          <button className="md:hidden p-1.5">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          {/* Desktop Hamburger */}
          <button className="hidden md:flex flex-col space-y-2 group cursor-pointer p-2">
            <div className="w-10 h-0.5 bg-[#FAFAFA] transition-transform origin-right group-hover:scale-x-90"></div>
            <div className="w-10 h-0.5 bg-[#FAFAFA] transition-transform origin-right group-hover:scale-x-75"></div>
          </button>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="absolute inset-0 flex flex-col justify-center items-start md:items-center z-10 pt-14 md:pt-24 px-4 md:px-0">
        <div className="w-full max-w-[997px] text-left md:text-right flex flex-col pr-0 md:pr-8 lg:pr-0">
          <span className="text-[38px] md:text-[48px] leading-none" style={{ fontFamily: "'Malgin', serif" }}>
            IT'S TIME TO
          </span>
          <span className="text-[52px] md:text-[96px] leading-[1.05] md:leading-none mt-2" style={{ fontFamily: "'Malgin', serif" }}>
            PLAN DIFFERENTLY
          </span>
        </div>

        <div className="w-full max-w-[997px] flex flex-col md:flex-row justify-start md:justify-end items-start md:items-center mt-8 md:mt-12 pr-0 md:pr-12 gap-8 md:gap-0">
          <div className="flex items-center">
            <button className="w-16 h-16 md:w-14 md:h-14 rounded-full border border-[#FAFAFA]/50 flex items-center justify-center mr-4 md:mr-6 hover:bg-white/20 transition-colors backdrop-blur-sm shrink-0">
              <svg className="w-6 h-6 text-[#FAFAFA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <p className="max-w-[250px] text-[13px] md:text-sm font-light leading-relaxed opacity-90 text-left">
              Explore the collection. Your seamless event is just a few clicks away!
            </p>
          </div>
          
          {/* 'W' Text Block - Mobile Only (Desktop version is in footer) */}
          <div className="flex md:hidden items-center mt-2">
            <span className="text-[72px] leading-[0.7] font-serif mr-2" style={{ fontFamily: "'Malgin', serif" }}>
              W
            </span>
            <div className="flex flex-col justify-center text-[12px] font-medium tracking-wide space-y-[2px] mt-2">
              <p>ork made easy</p>
              <p>orth the spend</p>
              <p>ell-vetted vendors</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Section */}
      <footer className="absolute bottom-0 w-full flex flex-col md:flex-row items-end justify-between z-20">

        {/* Left Side: 'W' Text Block (Desktop Only) */}
        <div className="hidden md:flex items-center px-10 pb-12">
          <span className="text-[90px] leading-[0.7] font-serif mr-1" style={{ fontFamily: "'Malgin', serif" }}>
            W
          </span>
          <div className="flex flex-col justify-center text-sm font-medium tracking-wide space-y-1 mt-3">
            <p>ork made easy</p>
            <p>orth the spend</p>
            <p>ell-vetted vendors</p>
          </div>
        </div>

        {/* Right Side: Pixel-Perfect Glassmorphism Cards */}
        <div className="grid grid-cols-3 md:flex w-full md:w-auto border-t md:border-t-0 border-white/20 bg-black/20 md:bg-transparent backdrop-blur-md md:backdrop-blur-none">

          {/* Card 1: Birthday */}
          <div className="col-span-1 md:w-[220px] h-[90px] md:h-[124px] md:bg-[#591902]/20 md:backdrop-blur-md md:rounded-tl-[20px] relative border-r border-white/20 md:border-white/10 md:border-t hover:bg-[#591902]/30 transition-colors cursor-pointer">
            <div className="absolute top-[16px] md:top-[20px] left-[12px] md:left-[20px] right-[8px] md:right-auto md:w-[180px] flex flex-col gap-[6px] md:gap-[12px]">
              <h3 className="text-[10px] sm:text-[11px] md:text-sm font-bold tracking-widest uppercase truncate" style={{ fontFamily: "'Malgin', serif" }}>
                Birthday
              </h3>
              <p className="text-[9px] md:text-xs font-light opacity-90 leading-[1.3] line-clamp-3">
                Curated décor & catering packages
              </p>
            </div>
          </div>

          {/* Card 2: Anniversaries */}
          <div className="col-span-1 md:w-[220px] h-[90px] md:h-[124px] md:bg-[#591902]/20 md:backdrop-blur-md relative border-r border-white/20 md:border-white/10 md:border-t hover:bg-[#591902]/30 transition-colors cursor-pointer">
            <div className="absolute top-[16px] md:top-[20px] left-[12px] md:left-[20px] right-[8px] md:right-auto md:w-[180px] flex flex-col gap-[6px] md:gap-[12px]">
              <h3 className="text-[10px] sm:text-[11px] md:text-sm font-bold tracking-widest uppercase truncate" style={{ fontFamily: "'Malgin', serif" }}>
                Anniversaries
              </h3>
              <p className="text-[9px] md:text-xs font-light opacity-90 leading-[1.3] line-clamp-3">
                Intimate, elegant setups handled
              </p>
            </div>
          </div>

          {/* Card 3: House Parties */}
          <div className="col-span-1 md:w-[220px] h-[90px] md:h-[124px] md:bg-[#591902]/20 md:backdrop-blur-md relative border-t border-white/20 md:border-white/10 md:border-t-0 hover:bg-[#591902]/30 transition-colors cursor-pointer">
            <div className="absolute top-[16px] md:top-[20px] left-[12px] md:left-[20px] right-[8px] md:right-auto md:w-[180px] flex flex-col gap-[6px] md:gap-[12px]">
              <h3 className="text-[10px] sm:text-[11px] md:text-sm font-bold tracking-widest uppercase truncate" style={{ fontFamily: "'Malgin', serif" }}>
                House Parties
              </h3>
              <p className="text-[9px] md:text-xs font-light opacity-90 leading-[1.3] line-clamp-3">
                Simple planning. Beautiful execution.
              </p>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default HeroSection;
