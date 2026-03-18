import React from 'react'

// Add these files to: src/assets/images/
// - tangled-lights.png
// - logo-placeholder.png
import tangledIllustration from '../assets/images/tangled-lights.png'
import bulb1 from '../assets/lightbulb_images/bulb1.png'
import bulb2 from '../assets/lightbulb_images/bulb2.png'

// Resolve image assets from `src/assets/images/*` at build time.
// If an image file isn't present yet, we won't render its <img>, so nothing shows broken.
const aboutImageModules = import.meta.glob('../assets/images/*', {
  eager: true,
  import: 'default',
})

const aboutAssetSrc = (fileName) => aboutImageModules[`../assets/images/${fileName}`]

const Img = ({ src, alt = '', className = '', style, ...rest }) => (
  <img
    src={src}
    alt={alt}
    className={className}
    style={style}
    {...rest}
    onError={(e) => {
      // If the image isn't available yet, hide it so the page doesn't look broken.
      e.currentTarget.style.display = 'none'
    }}
  />
)

const LanternLong = ({ left }) => (
  <div className="absolute" style={{ left: `${left}px`, top: '7px', width: '76px', height: '180px' }}>
    <div className="absolute left-[22px] top-0 w-[32px] h-[105px] bg-[#FCD768]/80 rounded-b-full" />
    <div className="absolute top-[102px] w-[76px] h-[78px] bg-gradient-to-b from-[#FCD768] to-[#A5A687] opacity-40 blur-[4px]" />
  </div>
)

const LanternShort = ({ left }) => (
  <div className="absolute" style={{ left: `${left}px`, top: '0px', width: '76px', height: '149px' }}>
    <div className="absolute left-[20px] top-0 w-[37px] h-[92px] bg-[#FCE6A4]/80 rounded-b-full" />
    <div className="absolute top-[90px] w-[76px] h-[59px] bg-gradient-to-b from-[#FCE6A4] to-[#A5A687] opacity-40 blur-[4px]" />
  </div>
)

const AboutStorySection = () => {
  const story1Src = aboutAssetSrc('story-1.jpg')
  const story2Src = aboutAssetSrc('story-2.jpg')
  const mokshaSrc = aboutAssetSrc('moksha.jpg')
  const gauriSrc = aboutAssetSrc('gauri.jpg')
  const iconSrc = aboutAssetSrc('image.png')
  const scallopCount = [...Array(15)]

  return (
    <section className="relative w-full bg-[#A5A687] flex justify-center overflow-hidden font-sans">
      <div className="relative w-[1440px] h-[4628px] shrink-0">
        {/* --- SUB-TASK 1: SCALLOPED HEADER & LANTERNS --- */}
        <div
          className="absolute hidden md:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
          style={{ left: '-10%', top: '5%', transform: 'rotate(-37.82deg)' }}
        />
        <div
          className="absolute hidden md:block w-[533px] h-[1436px] bg-[#CDB17E] opacity-[0.07] pointer-events-none z-0"
          style={{ right: '5%', top: '30%', transform: 'rotate(-37.82deg)' }}
        />

        <div className="absolute top-0 left-0 w-full flex pointer-events-none z-10">
          {scallopCount.map((_, i) => (
            <div key={i} className="relative shrink-0 w-[72px] md:w-[144px] h-[45px] md:h-[90px]">
              <div
                className="absolute top-0 left-0 w-full h-[36px] md:h-[72px] bg-[#CDB17E]"
                style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
              />
              <div
                className="absolute top-0 left-0 w-full h-[30px] md:h-[60px] bg-[#F8F4ED]"
                style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
              />

              {i !== scallopCount.length - 1 && (
                <div className="absolute top-0 right-0 translate-x-1/2 flex flex-col items-center z-20">
                  <div
                    className={`w-[1px] ${i % 2 === 0 ? 'h-[-10px] md:h-[-14px]' : 'h-[-4px] md:h-[-5px]'} bg-[#591902]/40`}
                  />
                  <div className="relative flex flex-col items-center">
                    <img
                      src={i % 2 === 0 ? bulb1 : bulb2}
                      alt="Light"
                      className="w-[20px] md:w-[32px] h-auto relative z-10"
                    />

                    <div
                      className={`absolute left-1/2 top-full -translate-x-1/2 -translate-y-1 md:-translate-y-2 w-[44px] h-[44px] opacity-40 pointer-events-none ${
                        i % 2 === 0
                          ? 'md:w-[76px] md:h-[78px] blur-[4px] md:blur-[4px]'
                          : 'md:w-[76px] md:h-[59px] blur-[4px] md:blur-[4px]'
                      }`}
                      style={{
                        background:
                          i % 2 === 0
                            ? 'linear-gradient(180deg, #FCD768 0%, #A5A687 100%)'
                            : 'linear-gradient(180deg, #FCE6A4 -1.95%, #A5A687 100%)',
                        clipPath: 'polygon(35% 0, 65% 0, 100% 100%, 0 100%)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* --- SUB-TASK 2: SIMPLE QUESTION BLOCK --- */}
        {story1Src && (
          <Img
            src={story1Src}
            alt="Atmosphere"
            className="absolute left-0 top-[260px] w-[470px] h-[470px] object-cover rounded-r-[120px]"
          />
        )}
        <div className="absolute left-[510px] top-[370px] w-[486px] flex flex-col gap-[28px]">
          <h2 className="text-white text-[61px] leading-[1] font-serif" style={{ fontFamily: "'Malgin', serif" }}>
            We Asked a Simple Question
          </h2>
          <p className="text-white text-[21px] leading-[1.2]">
            Almost everything else in our lives has moved online. We book cabs and holidays in minutes, so why does event planning still feel complicated?
          </p>
        </div>

        {/* --- SUB-TASK 3: THOUGHTFUL GATHERINGS BLOCK --- */}
        <div className="absolute left-[386px] top-[1040px] w-[544px] flex flex-col gap-[28px]">
          <h2 className="text-white text-[61px] leading-[1] font-serif" style={{ fontFamily: "'Malgin', serif" }}>
            Thoughtful Gatherings Over Loud Distractions?
          </h2>
          <p className="text-white text-[21px] leading-[1.2]">
            Almost everything else in our lives has moved online. We book cabs and holidays in minutes, so why does event planning still feel complicated?
          </p>
        </div>
        {story2Src && (
          <Img
            src={story2Src}
            alt="Details"
            className="absolute right-0 top-[930px] w-[470px] h-[470px] object-cover rounded-l-[120px]"
          />
        )}

        {/* --- SUB-TASK 4: MEET THE FOUNDERS --- */}
        <h2 className="absolute left-[640px] top-[1600px] text-white text-[61px] leading-[1] font-serif" style={{ fontFamily: "'Malgin', serif" }}>
          Meet the Founders
        </h2>

        {/* Moksha */}
        <div className="absolute left-0 top-[1600px] w-[600px] h-[700px] bg-[#222815] overflow-hidden">
          {mokshaSrc && <Img src={mokshaSrc} alt="Moksha" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute right-[317px] top-[1789px] w-[483px] flex flex-col gap-[28px]">
          <h4 className="text-white text-[36px] font-serif" style={{ fontFamily: "'Malgin', serif" }}>Hi! I’m Moksha</h4>
          <div className="flex flex-col gap-[20px] text-white text-[12px] leading-[1.5] opacity-90">
            <p>I still don’t fully know how a formerly shy kid has turned into an adult who now builds experiences around people, conversations, and connection, but here we are.</p>
            <p>I’ve lived a large part of my life at boarding school, The Lawrence School, Sanawar, which has shaped me into an independent person obsessed with structure. An obsession that turned out to be a superpower in the events world.</p>
            <p>After doing a Msc. In International Events from the UK, and spending years in the industry, I knew I didn’t want to build just another event management company.</p>
            <p>So, I took a leap of faith and Elewen was born.</p>
          </div>
        </div>

        {/* Gauri */}
        <div className="absolute right-0 top-[2397px] w-[600px] h-[700px] bg-[#080808] overflow-hidden">
          {gauriSrc && <Img src={gauriSrc} alt="Gauri" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute left-[317px] top-[2614px] w-[483px] flex flex-col gap-[28px]">
          <h4 className="text-white text-[36px] font-serif" style={{ fontFamily: "'Malgin', serif" }}>Hey! I’m Gauri</h4>
          <div className="flex flex-col gap-[20px] text-white text-[12px] leading-[1.5] opacity-90">
            <p>I’m a dancer, reader, dreamer, and a believer that every little step eventually leads to the right place.</p>
            <p>I graduated from Ashoka university with an honours in economics and finance. Post-graduation, I was set to be buried in financial spreadsheets, but life had different plans.</p>
            <p>Elewen began as an idea my co-founder and I developed while exploring the opportunity to build a thoughtful, design-driven brand.</p>
          </div>
        </div>

        {/* --- SUB-TASK 5: WHY CHOOSE ELEWEN --- */}
        <h2 className="absolute left-[100px] top-[3297px] text-white text-[61px] leading-[1] font-serif" style={{ fontFamily: "'Malgin', serif" }}>
          Why Choose Elewen
        </h2>
        <p className="absolute left-[100px] top-[3386px] w-[520px] text-white text-[16px] leading-[1.5]">
          Everything you need for a beautiful celebration, thoughtfully brought together.
        </p>

        {/* Iconic Circles Grid */}
        <div className="absolute left-0 top-[3514px] w-full px-[100px] flex gap-[40px]">
          {[
            { img: 'e47', text: 'Little details that lift your party' },
            { img: 'e49', text: 'A few clicks and you’re done planning' },
            { img: 'e48', text: 'One complete look. Zero running around.' },
            { img: 'e50', text: 'Behind the scenes? That’s on us.' },
          ].map((item) => (
            <div key={item.img} className="flex flex-col items-center gap-[20px] w-[177px]">
              <div className="w-[177px] h-[177px] bg-[#F8F4ED] rounded-full flex items-center justify-center p-6">
                {aboutAssetSrc(`${item.img}.png`) && (
                  <Img
                    src={aboutAssetSrc(`${item.img}.png`)}
                    alt=""
                    className="w-[140px] object-contain"
                  />
                )}
              </div>
              <p className="text-white text-[21px] leading-[1.2] text-center font-normal">{item.text}</p>
            </div>
          ))}
        </div>

        {/* --- SUB-TASK 6: VENDOR QUALITY & CARDS --- */}
        <h2 className="absolute right-[100px] top-[3995px] w-[487px] text-white text-[61px] leading-[1] text-right font-serif" style={{ fontFamily: "'Malgin', serif" }}>
          Our approach to vendor quality
        </h2>
        <p className="absolute right-[100px] top-[4145px] w-[517px] text-white text-[16px] leading-[1.5] text-right opacity-80">
          We stand by the people behind every celebration, creating steady work, clear processes, and timely payments for vendors.
        </p>

        <div className="absolute bottom-[100px] left-0 w-full px-[100px] flex justify-between gap-6">
          {[
            { title: 'Quality you can trust', desc: 'Every partner in the Elewen Network is quality-checked for skill, reliability, and consistency.' },
            { title: 'Built for everyone involved', desc: 'By removing middlemen, we give customers better value and help our partners work in a more organised system.' },
            { title: 'Clear tiers. Simple Choices', desc: 'Our partners are grouped into three levels. You choose your package, and we take care of the rest.' },
          ].map((card) => (
            <div key={card.title} className="w-[316px] h-[275px] bg-white rounded-[20px] flex flex-col items-center p-10 text-center gap-5">
              <div className="w-[80px] h-[80px] bg-[#591902] rounded-md flex items-center justify-center overflow-hidden">
                {iconSrc && <Img src={iconSrc} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex flex-col gap-4">
                <h5 className="text-[#2D2D2D] text-[21px] leading-[1.2]">{card.title}</h5>
                <p className="text-[#767676] text-[12px] leading-[1.5]">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const About = () => {
  return (
    <>
    <section className="w-full bg-[#F8F4ED] flex justify-center font-sans overflow-x-hidden">
      
    <div className="relative w-[1440px] h-[1100px] shrink-0">
      
      {/* --- 1. THE BROWN BACKGROUND WITH THE CURVE --- */}
      <div 
        className="absolute left-0 top-0 w-full h-[880px] bg-[#591902] overflow-hidden z-0"
        style={{ borderRadius: '0px 0px 1000px 1000px' }}
      >
        {/* --- MAIN TEXT CONTENT --- */}
        
        {/* Left Heading */}
        <h2 
          className="absolute left-[100px] top-[223px] w-[564px] text-[#FFFFFF] text-[61px] leading-[1] font-serif m-0"
          
        >
          When we saw Excitement Turning Into Overthinking
        </h2>

        {/* Right Descriptive Paragraphs */}
        <div className="absolute left-[936px] top-[253px] w-[404px] flex flex-col gap-[20px]">
          <p className="text-[#FFFFFF] text-[16px] leading-[1.5] font-normal m-0">
            Elewen was born from noticing a simple truth: many people love the idea of hosting, but hesitate because planning an event often feels like too much to manage.
          </p>
          <p className="text-[#FFFFFF] text-[16px] leading-[1.5] font-normal m-0">
            Finding reliable vendors, understanding fair pricing, and coordinating everything usually means relying on social media, referrals, and endless back-and-forth.
          </p>
        </div>
      </div>


      {/* --- 2. THE PILL (CLIPPED BY THE CURVE) --- */}
      {/* This helper div has the exact same borderRadius as the brown background 
          to ensure the pill gets chopped off along that same curved line.
      */}
      <div 
        className="absolute left-0 top-0 w-full h-[880px] overflow-hidden pointer-events-none z-10"
        style={{ borderRadius: '0px 0px 1000px 1000px' }}
      >
        {/* The Actual Pill background */}
        <div className="absolute left-[528px] top-[440px] w-[400px] h-[600px] bg-[#BFAC9B] rounded-[500px] border-[4px] border-[#591902] shadow-lg">
        </div>
      </div>


      {/* --- 3. THE GIRL (NOT CLIPPED BY THE CURVE) --- */}
      {/* Placed in a container with NO overflow-hidden, so her hands can break out 
          into the beige section below the brown curve.
      */}
      <div className="absolute left-[528px] top-[440px] w-[400px] h-[600px] z-20 pointer-events-none">
        <img 
          src={tangledIllustration} 
          alt="Person tangled in lights" 
          className="absolute left-1/2 -translate-x-1/2 top-[9px] w-[384px] h-[529px] object-cover"
        />
      </div>

    </div>

    
  </section>
  {/* --- 4. Celebrations Don’t Have to Be Big to Matter --- */}
  <section className="relative w-full bg-[#F8F4ED] flex justify-center overflow-hidden font-sans py-24">
  {/* 1440px Wrapper for Pixel-Perfect Figma Alignment */}
  <div className="relative w-full max-w-[1440px] h-[350px] shrink-0 mx-auto px-6">
    {/* --- LEFT HEADING --- */}
    <h2
      className="absolute left-[20px] md:left-[100px] top-[20px] md:top-[0px] w-full max-w-[546px] text-[#591902] text-[40px] md:text-[61px] leading-[1] font-normal font-serif"
      style={{ fontFamily: "'Malgin', serif" }}
    >
      Celebrations Don’t Have to Be Big to Matter
    </h2>

    {/* --- RIGHT CONTENT BLOCK (Frame 243) --- */}
    <div className="absolute left-[20px] md:left-auto md:right-[100px] top-[180px] md:top-[30px] flex flex-col gap-[20px] w-full max-w-[463px]">
      <p className="text-[#591902] opacity-50 text-[16px] leading-[1.5] font-normal">
        Hosting a party, celebrating with close friends and family, and taking a pause from everyday life truly matters.
      </p>

      <p className="text-[#591902] opacity-50 text-[16px] leading-[1.5] font-normal">
        Elewen exists to protect that feeling. We focus on the little details and personal touches that turn simple gatherings into meaningful moments.
      </p>
    </div>
  </div>
</section>

      <AboutStorySection />
    </>
  
  )
}

export default About

